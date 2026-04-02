export interface User {
  id: number;
  username: string;
  displayName: string;
  role: 'admin' | 'member';
  createdAt: string;
  isActive: number;
}

export interface Meeting {
  id: number;
  title: string;
  meetingDate: string;
  location?: string;
  locationLat?: number;
  locationLng?: number;
  totalCost: number;
  description?: string;
  aiStory?: string;
  aiSummary?: string;
  topics: string[];
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creatorName?: string;
  photoCount?: number;
  commentCount?: number;
  members?: string[];
}

export interface Photo {
  id: number;
  meetingId: number;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  exifTakenAt?: string;
  exifLat?: number;
  exifLng?: number;
  exifMake?: string;
  exifModel?: string;
  uploadedAt: string;
  sortOrder: number;
}

export interface ExpenseItem {
  id: number;
  meetingId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  source: 'manual' | 'ai_receipt';
  createdAt: string;
}

export interface Receipt {
  id: number;
  meetingId: number;
  filename: string;
  originalName: string;
  filePath: string;
  aiRawText?: string;
  processed: number;
  uploadedAt: string;
}

export interface AudioFile {
  id: number;
  meetingId: number;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize?: number;
  transcript?: string;
  summary?: string;
  topicsExtracted: string[];
  processed: number;
  uploadedAt: string;
}

export interface Comment {
  id: number;
  meetingId: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}
