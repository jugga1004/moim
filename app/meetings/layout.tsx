import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';

export default async function MeetingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={{ displayName: session.displayName, role: session.role }} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
