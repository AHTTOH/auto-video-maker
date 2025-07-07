'use client';

import { createClient } from '@supabase/supabase-js';

// Supabase 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database 타입 정의 (ERD 기반)
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
}

export interface Summary {
  id: string;
  file_id: string;
  content: Record<string, any>;
  summary_text: string;
  bullet_points: string[];
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  duration_sec: number;
  file_size: number;
  storage_path: string;
  thumbnail_path?: string;
  tags: string[];
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  file_id: string;
  video_id?: string;
  state: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress_percent: number;
  error_message?: string;
  metadata: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Slide {
  id: string;
  video_id: string;
  order_idx: number;
  title: string;
  content: string;
  image_path: string;
  duration_sec: number;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  video_id: string;
  asset_type: 'tts_audio' | 'intermediate_image' | 'background_music' | 'other';
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// 조인된 데이터 타입들
export interface VideoWithSlides extends Video {
  slides?: Slide[];
}

export interface VideoWithAssets extends Video {
  assets?: Asset[];
}

export interface JobWithFileAndVideo extends Job {
  uploaded_file?: UploadedFile;
  video?: Video;
}

export interface FileWithSummary extends UploadedFile {
  summary?: Summary;
} 