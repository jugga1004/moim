import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL = 'gemini-2.5-flash';

// URL에서 파일을 Base64로 가져오기 (Cloudinary URL 지원)
async function urlToBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const data = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = res.headers.get('content-type') || 'application/octet-stream';
  return { data, mimeType };
}

export interface StoryInput {
  title: string;
  date: string;
  location?: string;
  topics: string[];
  participants: string[];
  photoCount: number;
  exifTimeline: Array<{ takenAt?: string; lat?: number; lng?: number }>;
  description?: string;
}

export async function generateMeetingStory(input: StoryInput): Promise<string> {
  const model = genAI.getGenerativeModel({ model: MODEL });

  const prompt = `다음 모임 정보를 바탕으로 그날의 이야기를 따뜻하게 기록해줘. 2~3 문단으로 써줘.

모임 제목: ${input.title}
날짜: ${input.date}
장소: ${input.location || '미기재'}
참석자: ${input.participants.join(', ')}
사진 수: ${input.photoCount}장
주요 주제: ${input.topics.length > 0 ? input.topics.join(', ') : '미기재'}
메모: ${input.description || '없음'}
사진 촬영 시간대: ${input.exifTimeline.slice(0, 5).map(e => e.takenAt || '').filter(Boolean).join(', ')}

당신은 모임의 소중한 추억을 아름답게 기록하는 작가입니다. 참석자들이 읽었을 때 그날의 기억이 생생하게 떠오르도록 따뜻하고 감성적인 글을 써주세요. 한국어로만 작성해주세요.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export interface ExpenseResult {
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number; category?: string }>;
  grandTotal: number;
  rawText: string;
}

export async function extractReceiptExpenses(imageUrl: string): Promise<ExpenseResult> {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const { data, mimeType } = await urlToBase64(imageUrl);

  const prompt = `이 영수증의 모든 항목을 추출해줘. 다음 JSON 형식으로만 응답해줘:
{
  "items": [
    { "name": "항목명", "quantity": 수량, "unitPrice": 단가, "total": 합계, "category": "음식|음료|주류|기타" }
  ],
  "grandTotal": 총합계
}
금액 단위는 원(KRW). 항목이 없으면 빈 배열로. JSON만 반환해줘.`;

  const result = await model.generateContent([
    { inlineData: { data, mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' } },
    prompt,
  ]);

  const rawText = result.response.text();
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON not found');
    const parsed = JSON.parse(jsonMatch[0]);
    return { items: parsed.items || [], grandTotal: parsed.grandTotal || 0, rawText };
  } catch {
    return { items: [], grandTotal: 0, rawText };
  }
}

export interface AudioSummaryResult {
  transcript: string;
  summary: string;
  topics: string[];
}

export async function summarizeAudio(audioUrl: string): Promise<AudioSummaryResult> {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const { data, mimeType } = await urlToBase64(audioUrl);

  const prompt = `이 음성 파일의 내용을 한국어로 전사하고 정리해줘. 다음 JSON 형식으로만 응답해줘:
{
  "transcript": "전체 내용 전사",
  "summary": "3~5문장으로 핵심 요약",
  "topics": ["주제1", "주제2", "주제3"]
}
JSON만 반환해줘.`;

  const result = await model.generateContent([
    { inlineData: { data, mimeType: mimeType as 'audio/mpeg' | 'audio/mp4' | 'audio/wav' | 'audio/ogg' | 'audio/webm' } },
    prompt,
  ]);

  const rawText = result.response.text();
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON not found');
    const parsed = JSON.parse(jsonMatch[0]);
    return { transcript: parsed.transcript || '', summary: parsed.summary || '', topics: Array.isArray(parsed.topics) ? parsed.topics : [] };
  } catch {
    return { transcript: rawText, summary: '', topics: [] };
  }
}
