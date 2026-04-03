'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Stats {
  user_count: number;
  group_count: number;
  meeting_count: number;
  comment_count: number;
  photo_count: number;
}

interface UserRow {
  id: number;
  username: string;
  role: string;
  created_at: string;
  is_active: number;
  memberships: { group_name: string; nickname: string }[];
}

interface GroupRow {
  id: number;
  name: string;
  creator_name: string;
  created_at: string;
  member_count: number;
  meeting_count: number;
}

interface MeetingRow {
  id: number;
  title: string;
  meeting_date: string;
  location: string | null;
  group_name: string;
  creator_name: string;
  created_at: string;
  photo_count: number;
  comment_count: number;
}

interface Props {
  stats: Stats;
  initialUsers: Record<string, unknown>[];
  initialGroups: Record<string, unknown>[];
  initialMeetings: Record<string, unknown>[];
}

function fmt(dateStr: string) {
  try { return format(new Date(dateStr), 'yy.MM.dd', { locale: ko }); } catch { return dateStr; }
}

export default function AdminDashboardClient({ stats, initialUsers, initialGroups, initialMeetings }: Props) {
  const [tab, setTab] = useState<'overview' | 'users' | 'groups' | 'meetings'>('overview');
  const users = initialUsers as unknown as UserRow[];
  const groups = initialGroups as unknown as GroupRow[];
  const meetings = initialMeetings as unknown as MeetingRow[];

  async function toggleActive(user: UserRow) {
    await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: user.is_active === 0 }),
    });
    window.location.reload();
  }

  async function toggleRole(user: UserRow) {
    const newRole = user.role === 'admin' ? 'member' : 'admin';
    if (!confirm(`"${user.username}" 권한을 ${newRole === 'admin' ? '관리자' : '일반'}으로 변경하시겠습니까?`)) return;
    await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    window.location.reload();
  }

  const tabs = [
    { key: 'overview', label: '개요' },
    { key: 'users', label: `회원 (${stats.user_count})` },
    { key: 'groups', label: `모임방 (${stats.group_count})` },
    { key: 'meetings', label: `기록 (${stats.meeting_count})` },
  ] as const;

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              tab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 개요 */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: '전체 회원', value: stats.user_count, icon: '👤' },
              { label: '전체 모임방', value: stats.group_count, icon: '🏠' },
              { label: '전체 기록', value: stats.meeting_count, icon: '📝' },
              { label: '전체 댓글', value: stats.comment_count, icon: '💬' },
              { label: '전체 사진', value: stats.photo_count, icon: '📷' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-2xl font-bold text-gray-800">{item.value.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3">최근 가입 회원</h2>
            <div className="space-y-2">
              {users.slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-700 font-medium">{u.username}</span>
                    <span className="text-xs text-gray-400 ml-2">로그인 ID</span>
                    {u.memberships.length > 0 && (
                      <span className="text-xs text-indigo-500 ml-2">
                        닉네임: {u.memberships.map(m => m.nickname).join(', ')}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">{fmt(u.created_at)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3">최근 생성된 모임방</h2>
            <div className="space-y-2">
              {groups.slice(0, 5).map(g => (
                <div key={g.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{g.name} <span className="text-gray-400">by {g.creator_name}</span></span>
                  <div className="text-xs text-gray-400 flex gap-3">
                    <span>멤버 {g.member_count}</span>
                    <span>{fmt(g.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 회원 */}
      {tab === 'users' && (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                      {u.username}
                    </span>
                    <span className="text-xs text-gray-400">로그인 ID</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.role === 'admin' ? '관리자' : '일반'}
                    </span>
                    <span className="text-xs text-gray-400">{fmt(u.created_at)} 가입</span>
                  </div>
                  {u.memberships.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {u.memberships.map((m, i) => (
                        <div key={i} className="text-xs bg-indigo-50 rounded-lg px-2.5 py-1.5">
                          <span className="text-gray-500">{m.group_name}</span>
                          <span className="text-gray-300 mx-1">·</span>
                          <span className="text-indigo-700 font-medium">{m.nickname}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-300 mt-1.5">참여 중인 모임 없음</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(u)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                      u.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    {u.is_active ? '활성' : '비활성'}
                  </button>
                  <button
                    onClick={() => toggleRole(u)}
                    className="text-xs px-3 py-1 rounded-full font-medium border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition"
                  >
                    {u.role === 'admin' ? '관리자 해제' : '관리자'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 모임방 */}
      {tab === 'groups' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500">모임 이름</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">개설자</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">멤버</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">기록 수</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">생성일</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr key={g.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{g.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{g.creator_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{g.member_count}명</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{g.meeting_count}개</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmt(g.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 기록 */}
      {tab === 'meetings' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500">제목</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">모임방</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">작성자</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">사진</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">댓글</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">날짜</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map(m => (
                <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800 max-w-[180px] truncate">{m.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[120px] truncate">{m.group_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{m.creator_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.photo_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.comment_count}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmt(m.meeting_date || m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
