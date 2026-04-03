'use client';

import { useState } from 'react';

export default function AdminSetupClient({ username }: { username: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSetup() {
    if (!confirm(`"${username}" 계정을 관리자로 설정하시겠습니까?`)) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/setup', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) { setError(d.error); return; }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">관리자 설정 완료</h1>
        <p className="text-gray-500 text-sm mb-6">다시 로그인하면 관리자 권한이 적용됩니다.</p>
        <a
          href="/api/auth/logout"
          onClick={async (e) => { e.preventDefault(); await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; }}
          className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition text-sm"
        >
          로그아웃 후 다시 로그인
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center">
      <div className="text-4xl mb-4">🛡️</div>
      <h1 className="text-xl font-bold text-gray-800 mb-2">첫 관리자 설정</h1>
      <p className="text-gray-500 text-sm mb-1">현재 관리자가 없습니다.</p>
      <p className="text-gray-700 text-sm font-medium mb-6">
        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{username}</span> 계정을 관리자로 설정합니다.
      </p>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <button
        onClick={handleSetup}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
      >
        {loading ? '설정 중...' : '관리자로 설정하기'}
      </button>
      <a href="/groups" className="block mt-4 text-gray-400 text-sm hover:text-gray-600">취소</a>
    </div>
  );
}
