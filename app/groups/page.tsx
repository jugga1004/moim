export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/auth';
import { query, initDb } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import InstallBanner from '@/components/InstallBanner';

interface GroupRow {
  id: number;
  name: string;
  created_by: number;
  member_count: number;
  created_at: string;
  last_activity_at: string | null;
  new_comments: number;
  new_photos: number;
  new_meetings: number;
}

export default async function GroupsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  await initDb();

  const groups = await query<GroupRow>(
    `SELECT g.id, g.name, g.created_by, g.created_at,
       (SELECT COUNT(*) FROM moim_group_members WHERE group_id = g.id)::int as member_count,
       (
         SELECT MAX(act.ts) FROM (
           SELECT c.created_at AS ts
           FROM moim_comments c
           JOIN moim_meetings m ON c.meeting_id = m.id
           WHERE m.group_id = g.id AND c.author_id != $1
           UNION ALL
           SELECT p.uploaded_at AS ts
           FROM moim_photos p
           JOIN moim_meetings m ON p.meeting_id = m.id
           WHERE m.group_id = g.id
         ) act
       ) AS last_activity_at,
       (
         SELECT COUNT(*) FROM moim_comments c
         JOIN moim_meetings m ON c.meeting_id = m.id
         WHERE m.group_id = g.id AND c.author_id != $1
           AND c.created_at > COALESCE(
             (SELECT last_visit FROM moim_group_visits WHERE group_id = g.id AND user_id = $1),
             '2000-01-01'
           )
       )::int AS new_comments,
       (
         SELECT COUNT(*) FROM moim_photos p
         JOIN moim_meetings m ON p.meeting_id = m.id
         WHERE m.group_id = g.id
           AND p.uploaded_at > COALESCE(
             (SELECT last_visit FROM moim_group_visits WHERE group_id = g.id AND user_id = $1),
             '2000-01-01'
           )
       )::int AS new_photos,
       (
         SELECT COUNT(*) FROM moim_meetings m
         WHERE m.group_id = g.id AND m.created_by != $1
           AND m.created_at > COALESCE(
             (SELECT last_visit FROM moim_group_visits WHERE group_id = g.id AND user_id = $1),
             '2000-01-01'
           )
       )::int AS new_meetings
     FROM moim_groups g
     JOIN moim_group_members gm ON gm.group_id = g.id
     WHERE gm.user_id = $1
     ORDER BY last_activity_at DESC NULLS LAST, g.created_at DESC`,
    [session.userId]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={{ displayName: session.displayName, role: session.role }} />
      <InstallBanner />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">내 모임</h1>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link
            href="/groups/new"
            className="flex flex-col items-center justify-center gap-2 bg-indigo-600 text-white rounded-2xl py-5 font-medium hover:bg-indigo-700 transition"
          >
            <span className="text-2xl">➕</span>
            <span>모임 만들기</span>
          </Link>
          <Link
            href="/groups/join"
            className="flex flex-col items-center justify-center gap-2 bg-white text-indigo-600 border-2 border-indigo-200 rounded-2xl py-5 font-medium hover:bg-indigo-50 transition"
          >
            <span className="text-2xl">🚪</span>
            <span>모임 참여하기</span>
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-lg font-medium">참여 중인 모임이 없어요</p>
            <p className="text-sm mt-2">모임을 만들거나 방 코드로 참여해보세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const totalNew = group.new_comments + group.new_photos + group.new_meetings;
              return (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-gray-800 text-lg truncate">{group.name}</h2>
                        {totalNew > 0 && (
                          <span className="flex-shrink-0 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {totalNew > 99 ? '99+' : totalNew}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-400">멤버 {group.member_count}명</p>
                        {group.new_meetings > 0 && (
                          <span className="text-xs text-indigo-500">📋 새 기록 {group.new_meetings}</span>
                        )}
                        {group.new_photos > 0 && (
                          <span className="text-xs text-indigo-500">📷 새 사진 {group.new_photos}</span>
                        )}
                        {group.new_comments > 0 && (
                          <span className="text-xs text-indigo-500">💬 새 댓글 {group.new_comments}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-300 text-xl ml-2">›</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
