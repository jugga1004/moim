import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/webm'];
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_SIZE = 100 * 1024 * 1024;

export interface SaveResult {
  filename: string;
  originalName: string;
  filePath: string;   // Cloudinary URL
  fileSize: number;
  mimeType: string;
}

export async function savePhoto(file: File, meetingId: number): Promise<SaveResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('지원하지 않는 이미지 형식입니다.');
  if (file.size > MAX_PHOTO_SIZE) throw new Error('사진 크기는 10MB를 초과할 수 없습니다.');
  return uploadToCloudinary(file, `moim-record/photos/${meetingId}`);
}

export async function saveReceipt(file: File, meetingId: number): Promise<SaveResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('지원하지 않는 영수증 형식입니다.');
  if (file.size > MAX_RECEIPT_SIZE) throw new Error('영수증 이미지 크기는 5MB를 초과할 수 없습니다.');
  return uploadToCloudinary(file, `moim-record/receipts/${meetingId}`);
}

export async function saveAudio(file: File, meetingId: number): Promise<SaveResult> {
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) throw new Error('지원하지 않는 음성 파일 형식입니다.');
  if (file.size > MAX_AUDIO_SIZE) throw new Error('음성 파일 크기는 100MB를 초과할 수 없습니다.');
  return uploadToCloudinary(file, `moim-record/audio/${meetingId}`, 'video'); // Cloudinary는 audio를 video 리소스로 처리
}

async function uploadToCloudinary(file: File, folder: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<SaveResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const publicId = `${folder}/${randomUUID()}`;

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
    originalName: file.name,
    filePath: result.secure_url,  // Cloudinary HTTPS URL
    fileSize: file.size,
    mimeType: file.type,
  };
}

export async function deleteFile(filePath: string): Promise<void> {
  // filePath가 Cloudinary URL이면 public_id 추출해서 삭제
  try {
    const match = filePath.match(/moim-record\/[^/]+\/[^/]+\/([^.]+)/);
    if (match) await cloudinary.uploader.destroy(match[0]);
  } catch { /* 무시 */ }
}
