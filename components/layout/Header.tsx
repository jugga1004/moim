'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HeaderProps {
  user: { displayName: string; role: string };
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <Link href="/groups" className="flex items-center gap-2 flex-shrink-0">
        <span className="text-2xl">📖</span>
        <span className="font-bold text-xl text-gray-800 hidden sm:block">모임기록</span>
      </Link>
      <div className="flex items-center gap-3">
        {user.role === 'admin' ? (
          <Link
            href="/admin"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
          >
            <span className="max-w-[80px] sm:max-w-none truncate">{user.displayName}</span>
            <span>님 ⚙️</span>
          </Link>
        ) : (
          <span className="text-sm text-gray-600">
            <span className="font-medium text-gray-800 max-w-[80px] sm:max-w-none truncate inline-block align-bottom">{user.displayName}</span>님
          </span>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 transition flex-shrink-0"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
