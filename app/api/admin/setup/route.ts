import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// 어드민이 한 명도 없을 때만 자신을 어드민으로 승격
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const adminExists = await queryOne(
    "SELECT id FROM moim_users WHERE role = 'admin' LIMIT 1"
  );

  if (adminExists) {
    return NextResponse.json({ error: '이미 관리자가 존재합니다. 기존 관리자에게 권한을 요청하세요.' }, { status: 403 });
  }

  await execute("UPDATE moim_users SET role = 'admin' WHERE id = $1", [session.userId]);
  return NextResponse.json({ data: { ok: true, message: '관리자로 설정되었습니다. 다시 로그인해주세요.' } });
}
