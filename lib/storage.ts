import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const HEIC_TYPES = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', ...HEIC_TYPES];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/webm'];
const MAX_PHOTO_SIZE = 20 * 1024 * 1024;
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_SIZE = 100 * 1024 * 1024;

// HEIC 변환 + EXIF 방향 자동 보정 → 항상 JPEG로 출력
async function processImageBuffer(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const isImage = HEIC_TYPES.includes(mimeType) || mimeType === '' ||
    mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/webp';
  if (!isImage) return { buffer, mimeType };

  const processed = await sharp(buffer)
    .rotate()             // EXIF orientation 자동 보정
    .jpeg({ quality: 88 })
    .toBuffer();
  return { buffer: processed, mimeType: 'image/jpeg' };
}

export interface SaveResult {
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export async function savePhoto(file: File, meetingId: number): Promise<SaveResult> {
  const mimeType = file.type || 'image/heic'; // HEIC는 브라우저에서 type이 비어있을 수 있음
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType) && mimeType !== '') throw new Error('지원하지 않는 이미지 형식입니다.');
  if (file.size > MAX_PHOTO_SIZE) throw new Error('사진 크기는 20MB를 초과할 수 없습니다.');

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const { buffer, mimeType: finalMime } = await processImageBuffer(rawBuffer, mimeType);
  return uploadBuffer(buffer, file.name, finalMime, `moim-record/photos/${meetingId}`);
}

export async function saveReceipt(file: File, meetingId: number): Promise<SaveResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('지원하지 않는 영수증 형식입니다.');
  if (file.size > MAX_RECEIPT_SIZE) throw new Error('영수증 이미지 크기는 5MB를 초과할 수 없습니다.');
  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const { buffer, mimeType } = await processImageBuffer(rawBuffer, file.type);
  return uploadBuffer(buffer, file.name, mimeType, `moim-record/receipts/${meetingId}`);
}

export async function saveAudio(file: File, meetingId: number): Promise<SaveResult> {
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) throw new Error('지원하지 않는 음성 파일 형식입니다.');
  if (file.size > MAX_AUDIO_SIZE) throw new Error('음성 파일 크기는 100MB를 초과할 수 없습니다.');
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadBuffer(buffer, file.name, file.type, `moim-record/audio/${meetingId}`, 'video');
}

async function uploadBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<SaveResult> {
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, public_id: randomUUID(), resource_type: resourceType },
      (error, result) => {
        if (error || !result) reject(error || new Error('업로드 실패'));
        else resolve(result as { secure_url: string; public_id: string });
      }
    ).end(buffer);
  });

  return {
    filename: result.public_id,
    originalName,
    filePath: result.secure_url,
    fileSize: buffer.length,
    mimeType,
  };
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const match = filePath.match(/moim-record\/[^/]+\/[^/]+\/([^.]+)/);
    if (match) await cloudinary.uploader.destroy(match[0]);
  } catch { /* 무시 */ }
}
