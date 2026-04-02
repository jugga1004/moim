'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface User {
  id: number;
  username: string;
  display_name: string;
  role: string;
  created_at: string;
  is_active: number;
}

interface AdminUsersClientProps {
  initialUsers: Record<string, unknown>[];
}

export default function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers as unknown as User[]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', displayName: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function refreshUsers() {
    const res = await fetch('/api/users');
    const d = await res.json();
    if (d.data) setUsers(d.data);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error); return; }
      setShowForm(false);
      setForm({ username: '', displayName: '', role: 'member' });
      await refreshUsers();
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(user: User) {
    await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: user.is_active === 0 }),
    });
    await refreshUsers();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">회원 관리</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition text-sm"
        >
          + 회원 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">새 회원 추가</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                  placeholder="로그인 아이디"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 (표시명)</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                  placeholder="표시될 이름"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">권한</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                >
                  <option value="member">일반 회원</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? '추가 중...' : '회원 추가'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left bg-gray-50">
              <th className="px-5 py-3.5 text-xs font-medium text-gray-500">이름</th>
              <th className="px-5 py-3.5 text-xs font-medium text-gray-500">아이디</th>
              <th className="px-5 py-3.5 text-xs font-medium text-gray-500">권한</th>
              <th className="px-5 py-3.5 text-xs font-medium text-gray-500">가입일</th>
              <th className="px-5 py-3.5 text-xs font-medium text-gray-500">상태</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                <td className="px-5 py-4 text-sm font-medium text-gray-800">{user.display_name}</td>
                <td className="px-5 py-4 text-sm text-gray-500">{user.username}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role === 'admin' ? '관리자' : '일반'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-400">
                  {(() => {
                    try {
                      return format(new Date(user.created_at), 'yyyy.MM.dd', { locale: ko });
                    } catch {
                      return user.created_at;
                    }
                  })()}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggleActive(user)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                      user.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                        : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    {user.is_active ? '활성' : '비활성'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
