import { supabase } from './supabase';
import type { 
  Video, 
  UploadedFile, 
  Summary, 
  Job, 
  Slide, 
  Asset,
  VideoWithSlides,
  JobWithFileAndVideo,
  FileWithSummary
} from './supabase';

// 현재는 단일 사용자 모드이므로 하드코딩된 사용자 ID 사용
const CURRENT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

// Supabase 환경 변수 확인 함수
function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// ===== 비디오 관련 API =====

/**
 * 사용자의 모든 비디오 목록 조회
 */
export async function getVideos() {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase가 구성되지 않았습니다. 빈 배열을 반환합니다.');
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', CURRENT_USER_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error);
    return { data: [], error };
  }

  return { data: data as Video[], error: null };
}

/**
 * 특정 비디오 상세 조회 (슬라이드 포함)
 */
export async function getVideoWithSlides(videoId: string) {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      slides (*)
    `)
    .eq('id', videoId)
    .eq('user_id', CURRENT_USER_ID)
    .single();

  if (error) {
    console.error('Error fetching video with slides:', error);
    return { data: null, error };
  }

  return { data: data as VideoWithSlides, error: null };
}

/**
 * ElevenLabs TTS API 호출
 */
export interface TTSSlideData {
  title: string;
  content: string;
  duration: number;
}

export interface TTSResult {
  slideIndex: number;
  title: string;
  audioData: string | null;
  duration?: number;
  error?: string;
}

export async function generateTTS(slides: TTSSlideData[]) {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slides }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '음성 생성 중 오류가 발생했습니다.');
    }

    return {
      success: data.success,
      results: data.results as TTSResult[],
      message: data.message,
      error: null
    };

  } catch (error) {
    console.error('TTS 요청 오류:', error);
    return {
      success: false,
      results: [],
      message: '',
      error: error instanceof Error ? error.message : '음성 생성 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 사용 가능한 음성 목록 조회
 */
export async function getAvailableVoices() {
  try {
    const response = await fetch('/api/tts', {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '음성 목록 조회 중 오류가 발생했습니다.');
    }

    return {
      success: data.success,
      voices: data.voices,
      error: null
    };

  } catch (error) {
    console.error('음성 목록 조회 오류:', error);
    return {
      success: false,
      voices: [],
      error: error instanceof Error ? error.message : '음성 목록 조회 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 새 비디오 생성
 */
export async function createVideo(videoData: {
  title: string;
  description?: string;
  duration_sec: number;
  file_size: number;
  storage_path: string;
  thumbnail_path?: string;
  tags?: string[];
  status?: 'processing' | 'completed' | 'failed';
}) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase가 구성되지 않았습니다. 더미 데이터를 반환합니다.');
    return { 
      data: { 
        id: 'dummy-id', 
        user_id: CURRENT_USER_ID,
        ...videoData,
        tags: videoData.tags || [],
        status: videoData.status || 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Video, 
      error: null 
    };
  }

  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: CURRENT_USER_ID,
      ...videoData,
      tags: videoData.tags || [],
      status: videoData.status || 'completed'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating video:', error);
    return { data: null, error };
  }

  return { data: data as Video, error: null };
}

/**
 * 슬라이드 생성
 */
export async function createSlides(videoId: string, slidesData: Array<{
  order_idx: number;
  title: string;
  content: string;
  image_path: string;
  duration_sec: number;
}>) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase가 구성되지 않았습니다. 더미 슬라이드 데이터를 반환합니다.');
    const dummySlides = slidesData.map((slide, index) => ({
      id: `dummy-slide-${index}`,
      video_id: videoId,
      ...slide,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })) as Slide[];
    return { data: dummySlides, error: null };
  }

  const slides = slidesData.map(slide => ({
    video_id: videoId,
    ...slide
  }));

  const { data, error } = await supabase
    .from('slides')
    .insert(slides)
    .select();

  if (error) {
    console.error('Error creating slides:', error);
    return { data: null, error };
  }

  return { data: data as Slide[], error: null };
}

/**
 * 비디오 삭제
 */
export async function deleteVideo(videoId: string) {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId)
    .eq('user_id', CURRENT_USER_ID);

  if (error) {
    console.error('Error deleting video:', error);
    return { error };
  }

  return { error: null };
}

// ===== 업로드된 파일 관련 API =====

/**
 * 파일과 요약 정보 조회
 */
export async function getFilesWithSummaries() {
  const { data, error } = await supabase
    .from('uploaded_files')
    .select(`
      *,
      summaries (*)
    `)
    .eq('user_id', CURRENT_USER_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching files with summaries:', error);
    return { data: [], error };
  }

  return { data: data as FileWithSummary[], error: null };
}

/**
 * 특정 파일의 요약 조회
 */
export async function getFileSummary(fileId: string) {
  const { data, error } = await supabase
    .from('summaries')
    .select('*')
    .eq('file_id', fileId)
    .single();

  if (error) {
    console.error('Error fetching file summary:', error);
    return { data: null, error };
  }

  return { data: data as Summary, error: null };
}

// ===== Job 관련 API =====

/**
 * 모든 Job 목록 조회 (파일, 비디오 정보 포함)
 */
export async function getJobsWithDetails() {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      uploaded_files (*),
      videos (*)
    `)
    .eq('uploaded_files.user_id', CURRENT_USER_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    return { data: [], error };
  }

  return { data: data as JobWithFileAndVideo[], error: null };
}

/**
 * 특정 Job 상태 조회
 */
export async function getJobStatus(jobId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    console.error('Error fetching job status:', error);
    return { data: null, error };
  }

  return { data: data as Job, error: null };
}

/**
 * 진행 중인 Job 목록 조회
 */
export async function getActiveJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      uploaded_files (*)
    `)
    .in('state', ['queued', 'processing'])
    .eq('uploaded_files.user_id', CURRENT_USER_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active jobs:', error);
    return { data: [], error };
  }

  return { data: data as JobWithFileAndVideo[], error: null };
}

// ===== 통계 API =====

/**
 * 대시보드용 통계 데이터 조회
 */
export async function getDashboardStats() {
  try {
    // 병렬로 통계 데이터 조회
    const [videosResult, jobsResult, filesResult] = await Promise.all([
      supabase
        .from('videos')
        .select('id, status')
        .eq('user_id', CURRENT_USER_ID),
      
      supabase
        .from('jobs')
        .select('id, state')
        .eq('uploaded_files.user_id', CURRENT_USER_ID),
      
      supabase
        .from('uploaded_files')
        .select('id, file_size')
        .eq('user_id', CURRENT_USER_ID)
    ]);

    const videos = videosResult.data || [];
    const jobs = jobsResult.data || [];
    const files = filesResult.data || [];

    // 통계 계산
    const stats = {
      totalVideos: videos.length,
      completedVideos: videos.filter(v => v.status === 'completed').length,
      processingVideos: videos.filter(v => v.status === 'processing').length,
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => ['queued', 'processing'].includes(j.state)).length,
      completedJobs: jobs.filter(j => j.state === 'completed').length,
      failedJobs: jobs.filter(j => j.state === 'failed').length,
      totalFiles: files.length,
      totalStorageUsed: files.reduce((sum, f) => sum + (f.file_size || 0), 0)
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { data: null, error };
  }
}

// ===== 실시간 업데이트 구독 =====

/**
 * Job 상태 변경 실시간 구독
 */
export function subscribeToJobUpdates(callback: (job: Job) => void) {
  const subscription = supabase
    .channel('job-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'jobs'
      },
      (payload) => {
        callback(payload.new as Job);
      }
    )
    .subscribe();

  return subscription;
}

/**
 * 실시간 구독 해제
 */
export function unsubscribeFromUpdates(subscription: any) {
  supabase.removeChannel(subscription);
}

// ===== AI 요약 관련 API =====

/**
 * GPT-3.5 Turbo를 사용하여 텍스트 요약 (5초씩 6개 슬라이드)
 */
export async function summarizeText(text: string) {
  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    // 응답이 JSON인지 확인
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Received non-JSON response:', contentType);
      const textResponse = await response.text();
      console.error('Response body:', textResponse);
      
      if (response.status === 500) {
        throw new Error('서버 내부 오류가 발생했습니다. OpenAI API 키 설정을 확인해주세요.');
      }
      
      throw new Error('서버에서 올바르지 않은 응답을 받았습니다.');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `요약 중 오류가 발생했습니다. (${response.status})`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('텍스트 요약 오류:', error);
    
    // 네트워크 오류 처리
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('네트워크 연결을 확인해주세요.');
    }
    
    throw error;
  }
}

/**
 * 텍스트 파일 읽기
 */
export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('파일을 읽을 수 없습니다.'));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 중 오류가 발생했습니다.'));
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * 원본 읏맨 이미지 로드 (기본 읏맨 PNG 파일 사용)
 */
export async function loadOriginalWootman(): Promise<string> {
  try {
    // 원본 읏맨 이미지 URL
    const imageUrl = '/eutman/읏맨(원본).png';
    
    // 이미지를 base64로 변환
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('읏맨 이미지를 로드할 수 없습니다.');
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('원본 읏맨 이미지 로드 오류:', error);
    throw new Error('읏맨 이미지를 로드할 수 없습니다.');
  }
}

/**
 * 영상 생성 API 호출
 */
export interface VideoGenerationData {
  slides: {
    slideIndex: number;
    slideImage: string;
    title: string;
    content: string;
    audioData: string | null;
    duration: number;
  }[];
  wootmanImage: string | null;
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl: string | null;
  videoData: string | null; // Vercel 환경에서 base64 비디오 데이터
  error?: string;
  message: string;
}

export async function generateVideo(data: VideoGenerationData): Promise<VideoGenerationResult> {
  try {
    const response = await fetch('/api/video-generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '영상 생성 중 오류가 발생했습니다.');
    }

    return {
      success: result.success,
      videoUrl: result.videoUrl || null,
      videoData: result.videoData || null,
      message: result.message || '영상 생성이 완료되었습니다.',
      error: result.error
    };

  } catch (error) {
    console.error('영상 생성 요청 오류:', error);
    return {
      success: false,
      videoUrl: null,
      videoData: null,
      message: '영상 생성에 실패했습니다.',
      error: error instanceof Error ? error.message : '영상 생성 중 오류가 발생했습니다.'
    };
  }
} 