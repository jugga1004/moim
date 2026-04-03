export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/auth';
import { queryOne, initDb } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminSetupClient from './AdminSetupClient';

export default async function AdminSetupPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  await initDb();

  // 이미 어드민이면 어드민 페이지로
  if (session.role === 'admin') redirect('/admin');

  // 어드민이 이미 있으면 접근 불가
  const adminExists = await queryOne("SELECT id FROM moim_users WHERE role = 'admin' LIMIT 1");
  if (adminExists) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">접근 불가</h1>
          <p className="text-gray-500 text-sm">이미 관리자가 존재합니다.</p>
          <a href="/groups" className="block mt-6 text-indigo-600 text-sm hover:underline">← 내 모임으로</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <AdminSetupClient username={session.displayName} />
    </div>
  );
}
