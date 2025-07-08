-- 사용자 업로드 파일 테이블
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 비디오 테이블
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  title TEXT NOT NULL,
  description TEXT,
  duration_sec REAL NOT NULL DEFAULT 0,
  file_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 작업 테이블
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES uploaded_files(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  state TEXT NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 슬라이드 테이블
CREATE TABLE slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  order_idx INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_path TEXT NOT NULL,
  duration_sec REAL NOT NULL DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, order_idx)
);

-- 자산 테이블 (TTS 오디오, 중간 이미지 등)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('tts_audio', 'intermediate_image', 'background_music', 'other')),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 요약 테이블
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  title TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  key_points TEXT[] DEFAULT '{}',
  slide_count INTEGER DEFAULT 0,
  processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_jobs_state ON jobs(state);
CREATE INDEX idx_jobs_file_id ON jobs(file_id);
CREATE INDEX idx_slides_video_id ON slides(video_id);
CREATE INDEX idx_slides_order ON slides(video_id, order_idx);
CREATE INDEX idx_assets_video_id ON assets(video_id);
CREATE INDEX idx_summaries_file_id ON summaries(file_id);
CREATE INDEX idx_summaries_user_id ON summaries(user_id);

-- Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at 트리거 생성
CREATE TRIGGER update_uploaded_files_updated_at BEFORE UPDATE ON uploaded_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON slides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 