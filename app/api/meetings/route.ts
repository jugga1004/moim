import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const meetings = await query(`
    SELECT m.*, u.display_name as creator_name,
      (SELECT COUNT(*) FROM photos WHERE meeting_id = m.id) as photo_count,
      (SELECT COUNT(*) FROM comments WHERE meeting_id = m.id AND is_deleted = 0) as comment_count
    FROM meetings m
    JOIN users u ON m.created_by = u.id
    ORDER BY m.meeting_date DESC, m.created_at DESC
  `);

  const result = meetings.map((m) => ({
    id: m.id,
    title: m.title,
    meetingDate: m.meeting_date,
    location: m.location,
    totalCost: m.total_cost,
    description: m.description,
    aiStory: m.ai_story,
    topics: JSON.parse((m.topics as string) || '[]'),
    createdBy: m.created_by,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
    creatorName: m.creator_name,
    photoCount: m.photo_count,
    commentCount: m.comment_count,
  }));

  return NextResponse.json({ data: result });
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { title, meetingDate, location, description, topics, members } = await request.json();
  if (!title || !meetingDate) return NextResponse.json({ error: '제목과 날짜는 필수입니다.' }, { status: 400 });

  const rows = await query<{ id: number }>(
    `INSERT INTO meetings (title, meeting_date, location, description, topics, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [title, meetingDate, location || null, description || null, JSON.stringify(topics || []), session.userId]
  );
  const meetingId = rows[0].id;

  if (Array.isArray(members) && members.length > 0) {
    for (const userId of members) {
      await execute(
        'INSERT INTO meeting_members (meeting_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [meetingId, userId]
      );
    }
  }

  const meeting = await query('SELECT * FROM meetings WHERE id = $1', [meetingId]);
  return NextResponse.json({ data: meeting[0] }, { status: 201 });
}
