import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute, initDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await initDb();
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { name, displayName } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: '모임 이름을 입력해주세요.' }, { status: 400 });
  if (!displayName?.trim()) return NextResponse.json({ error: '모임에서 사용할 이름을 입력해주세요.' }, { status: 400 });

  const group = await queryOne<{ id: number; name: string }>(
    'SELECT id, name FROM moim_groups WHERE name = $1',
    [name.trim()]
  );

  if (!group) return NextResponse.json({ error: '존재하지 않는 모임입니다.' }, { status: 404 });

  const already = await queryOne(
    'SELECT 1 FROM moim_group_members WHERE group_id = $1 AND user_id = $2',
    [group.id, session.userId]
  );

  if (already) {
    // 이미 멤버면 display_name만 업데이트
    await execute(
      'UPDATE moim_group_members SET display_name = $1 WHERE group_id = $2 AND user_id = $3',
      [displayName.trim(), group.id, session.userId]
    );
  } else {
    await execute(
      'INSERT INTO moim_group_members (group_id, user_id, display_name) VALUES ($1, $2, $3)',
      [group.id, session.userId, displayName.trim()]
    );
  }

  return NextResponse.json({ data: group });
}
