// Cloudinary로 전환 후 이 라우트는 사용하지 않음.
// 파일은 Cloudinary HTTPS URL로 직접 접근합니다.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: '파일은 Cloudinary URL로 직접 접근하세요.' }, { status: 410 });
}
