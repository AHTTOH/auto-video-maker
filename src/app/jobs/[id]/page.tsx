'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Share2, Clock, Calendar, Tag, FileText, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { getVideoWithSlides } from '@/lib/api';
import { VideoWithSlides } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [video, setVideo] = useState<VideoWithSlides | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const videoId = params.id as string;

  // 비디오 데이터 로드
  useEffect(() => {
    async function loadVideo() {
      if (!videoId) return;

      try {
        setIsLoading(true);
        const { data, error } = await getVideoWithSlides(videoId);
        
        if (error) {
          toast({
            title: '로딩 실패',
            description: '영상 정보를 불러오는 중 오류가 발생했습니다.',
            variant: 'destructive',
          });
          router.push('/jobs');
        } else {
          setVideo(data);
        }
      } catch (error) {
        console.error('Failed to load video:', error);
        toast({
          title: '로딩 실패',
          description: '영상 정보를 불러오는 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
        router.push('/jobs');
      } finally {
        setIsLoading(false);
      }
    }

    loadVideo();
  }, [videoId, toast, router]);

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 시간 포맷팅
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 다운로드 핸들러
  const handleDownload = () => {
    toast({
      title: '다운로드 준비',
      description: '영상 다운로드를 준비 중입니다.',
    });
  };

  // 공유 핸들러
  const handleShare = async () => {
    if (navigator.share && video) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description || '',
          url: window.location.href,
        });
      } catch (error) {
        // 공유 취소시 무시
      }
    } else {
      // Web Share API가 지원되지 않는 경우 URL 복사
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: '링크 복사',
        description: '영상 링크가 클립보드에 복사되었습니다.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
          <span className="text-neutral-600 font-pretendard">영상 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-neutral-600 font-pretendard">영상을 찾을 수 없습니다</p>
        <Button asChild className="mt-4">
          <a href="/jobs" className="font-pretendard">목록으로 돌아가기</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/jobs')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-pretendard">목록으로 돌아가기</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            <span className="font-pretendard">공유</span>
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            <span className="font-pretendard">다운로드</span>
          </Button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 비디오 플레이어 및 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 비디오 플레이어 */}
          <VideoPlayer
            src={video.storage_path}
            thumbnail={video.thumbnail_path || undefined}
            title={video.title}
          />

          {/* 비디오 정보 */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold font-pretendard">
                    {video.title}
                  </CardTitle>
                  {video.description && (
                    <p className="text-neutral-600 font-pretendard leading-relaxed">
                      {video.description}
                    </p>
                  )}
                </div>
                <Badge 
                  className={`${
                    video.status === 'completed' 
                      ? 'bg-green-500 text-white' 
                      : video.status === 'processing'
                      ? 'bg-secondary-500 text-white'
                      : 'bg-error-500 text-white'
                  }`}
                >
                  {video.status === 'completed' ? '완료' : 
                   video.status === 'processing' ? '처리중' : '실패'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 메타데이터 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span className="font-pretendard">{formatDuration(video.duration_sec)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-neutral-400" />
                  <span className="font-pretendard">{formatFileSize(video.file_size)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <span className="font-pretendard">
                    {new Date(video.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-neutral-400" />
                  <span className="font-pretendard">MP4</span>
                </div>
              </div>

              {/* 태그 */}
              {video.tags && video.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700 font-pretendard">태그</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="font-pretendard">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 사이드 패널 - 슬라이드 목록 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-pretendard">
                <FileText className="h-5 w-5" />
                슬라이드 목록
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {video.slides && video.slides.length > 0 ? (
                video.slides
                  .sort((a, b) => a.order_idx - b.order_idx)
                  .map((slide, index) => (
                    <div key={slide.id} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {slide.order_idx + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="font-medium text-neutral-900 font-pretendard text-sm">
                            {slide.title}
                          </h4>
                          <p className="text-xs text-neutral-600 font-pretendard line-clamp-2">
                            {slide.content}
                          </p>
                          <div className="flex items-center justify-between text-xs text-neutral-400">
                            <span className="font-pretendard">
                              {slide.duration_sec}초
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 슬라이드 썸네일 (picsum 사용) */}
                      <div className="ml-9">
                        <img
                          src={`https://picsum.photos/seed/${slide.id}/200/112`}
                          alt={slide.title}
                          className="w-full aspect-video object-cover rounded border border-neutral-200"
                        />
                      </div>
                      
                      {index < video.slides!.length - 1 && (
                        <Separator className="ml-9" />
                      )}
                    </div>
                  ))
              ) : (
                <p className="text-sm text-neutral-500 text-center py-4 font-pretendard">
                  슬라이드 정보가 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 