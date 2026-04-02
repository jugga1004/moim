import { NextRequest, NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const { username } = await request.json();
    if (!username?.trim()) {
      return NextResponse.json({ error: '아이디를 입력해주세요.' }, { status: 400 });
    }
    const rows = await query<{ id: number; username: string; display_name: string; role: string }>(
      'SELECT * FROM users WHERE username = $1 AND is_active = 1',
      [username.trim()]
    );
    const user = rows[0];
    if (!user) return NextResponse.json({ error: '등록되지 않은 아이디입니다.' }, { status: 401 });

    await setSessionCookie({
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role as 'admin' | 'member',
    });
    return NextResponse.json({ data: { id: user.id, username: user.username, displayName: user.display_name, role: user.role } });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
