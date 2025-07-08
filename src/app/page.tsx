'use client';

import React, { useState } from 'react';
import { FileDropZone } from '@/components/upload/FileDropZone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Video, Sparkles, Clock, Zap, CheckCircle, AlertCircle, Image, Volume2, Play, Pause, Bot, Type, ChevronLeft, ChevronRight } from 'lucide-react';
import { readTextFile, summarizeText, generateTTS, generateVideo, type TTSResult, type VideoGenerationData } from '@/lib/api';
import { generateSlidesForDisplay, generateSlidesWithWootman, type SlideData } from '@/lib/slideGenerator';
import { useToast } from '@/hooks/use-toast';
import { WootmanGenerationModal } from '@/components/ui/wootman-generation-modal';

interface SummaryResult {
  summary: string;
  slides: Array<{
    title: string;
    content: string;
    duration: number;
  }>;
}

export default function HomePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedSlides, setGeneratedSlides] = useState<string[]>([]);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [ttsResults, setTtsResults] = useState<TTSResult[]>([]);
  const [inputText, setInputText] = useState<string>('');
  
  // 읏맨 관련 상태 추가
  const [isTTSComplete, setIsTTSComplete] = useState(false); // TTS 단계 활성화
  const [isGeneratingWootman, setIsGeneratingWootman] = useState(false);
  const [wootmanImage, setWootmanImage] = useState<string | null>(null);
  const [isWootmanComplete, setIsWootmanComplete] = useState(false);
  
  // 영상 생성 관련 상태 추가
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isVideoComplete, setIsVideoComplete] = useState(false);
  

  
  const { toast } = useToast();

  // 읏맨 캐릭터 배열
  const wootmanCharacters = [
    { src: '/eutman/모기지기획팀.png', alt: '모기지기획팀 읏맨', name: '모기지기획팀' },
    { src: '/eutman/여신기획팀.png', alt: '여신기획팀 읏맨', name: '여신기획팀' },
    { src: '/eutman/인사팀.png', alt: '인사팀 읏맨', name: '인사팀' },
    { src: '/eutman/정보보안팀.png', alt: '정보보안팀 읏맨', name: '정보보안팀' },
    { src: '/eutman/AI팀.png', alt: 'AI팀 읏맨', name: 'AI팀' }
  ];

  // 읏맨 캐러셀 상태
  const [currentWootmanIndex, setCurrentWootmanIndex] = useState(0);

  // 이전 읏맨으로 이동
  const handlePreviousWootman = () => {
    setCurrentWootmanIndex((prev) => 
      prev === 0 ? wootmanCharacters.length - 1 : prev - 1
    );
  };

  // 다음 읏맨으로 이동
  const handleNextWootman = () => {
    setCurrentWootmanIndex((prev) => 
      prev === wootmanCharacters.length - 1 ? 0 : prev + 1
    );
  };

  // URL 이미지를 base64 데이터 URL로 변환하는 유틸리티 함수
  const convertUrlToBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('이미지 변환 오류:', error);
      throw error;
    }
  };



  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setError(null);
    setSummaryResult(null);
    
    try {
      // 1. 파일 업로드 시뮬레이션
      await simulateUpload();
      
      // 2. 파일 내용 읽기
      setIsAnalyzing(true);
      toast({
        title: "분석 시작",
        description: "AI가 문서 내용을 분석하고 있습니다...",
      });
      
      const fileContent = await readTextFile(file);
      
      // 3. GPT-3.5 Turbo로 요약 생성
      const result = await summarizeText(fileContent);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSummaryResult({
        summary: result.summary!,
        slides: result.slides
      });
      
      toast({
        title: "분석 완료",
        description: "6개의 슬라이드로 요약이 완료되었습니다!",
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '파일 처리 중 오류가 발생했습니다';
      setError(errorMessage);
      toast({
        title: "분석 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulateUpload = (): Promise<void> => {
    return new Promise((resolve) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            resolve();
            return 100;
          }
          return Math.min(prev + Math.random() * 15, 100);
        });
      }, 200);
    });
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsAnalyzing(false);
    setSummaryResult(null);
    setError(null);
    setGeneratedSlides([]);
    setIsGeneratingSlides(false);
    setIsGeneratingTTS(false);
    setTtsResults([]);
    setInputText('');
    // 읏맨 관련 상태 초기화
    setIsTTSComplete(false); // TTS 단계 활성화
    setIsGeneratingWootman(false);
    setWootmanImage(null);
    setIsWootmanComplete(false);
    // 영상 생성 관련 상태 초기화
    setIsGeneratingVideo(false);
    setGeneratedVideoUrl(null);
    setIsVideoComplete(false);
    // 읏맨 캐러셀 상태 초기화
    setCurrentWootmanIndex(0);

  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) {
      toast({
        title: "텍스트를 입력해주세요",
        description: "교육 콘텐츠로 만들 텍스트를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setSummaryResult(null);
    
    try {
      // 텍스트 분석 시작
      setIsAnalyzing(true);
      toast({
        title: "분석 시작",
        description: "AI가 텍스트 내용을 분석하고 있습니다...",
      });
      
      // GPT-3.5 Turbo로 요약 생성
      const result = await summarizeText(inputText);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSummaryResult({
        summary: result.summary!,
        slides: result.slides
      });
      
      toast({
        title: "분석 완료",
        description: "6개의 슬라이드로 요약이 완료되었습니다!",
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '텍스트 처리 중 오류가 발생했습니다';
      setError(errorMessage);
      toast({
        title: "분석 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startSlideProduction = async () => {
    if (!summaryResult) return;

    try {
      setIsGeneratingSlides(true);
      toast({
        title: "칠판 스타일 슬라이드 제작 시작",
        description: "Canvas로 칠판 스타일 슬라이드를 생성하고 있습니다...",
      });

      // SlideData 형식으로 변환
      const slides: SlideData[] = summaryResult.slides.map((slide) => ({
        title: slide.title,
        content: slide.content,
        duration: slide.duration
      }));

      // Canvas로 칠판 스타일 슬라이드 생성
      const slideImages = await generateSlidesForDisplay(slides);
      setGeneratedSlides(slideImages);

      toast({
        title: "칠판 스타일 슬라이드 제작 완료",
        description: `${slideImages.length}개의 칠판 스타일 슬라이드가 완성되었습니다!`,
      });

    } catch (error) {
      console.error('Canvas 슬라이드 생성 오류:', error);
      toast({
        title: "슬라이드 제작 실패",
        description: error instanceof Error ? error.message : "슬라이드 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  const handleTTSGeneration = async () => {
    if (!summaryResult) return;

    try {
      setIsGeneratingTTS(true);
      toast({
        title: "음성 생성 시작",
        description: "슬라이드 설명을 음성으로 변환하고 있습니다...",
      });

      // ElevenLabs API를 통한 TTS 생성
      const ttsData = summaryResult.slides.map(slide => ({
        title: slide.title,
        content: slide.content,
        duration: slide.duration
      }));

      const result = await generateTTS(ttsData);

      if (result.error) {
        throw new Error(result.error);
      }

      setTtsResults(result.results);

      // 성공한 오디오의 개수 계산
      const successCount = result.results.filter(r => r.audioData && !r.error).length;
      const totalCount = result.results.length;

      // TTS 완료 상태 설정
      if (successCount > 0) {
        setIsTTSComplete(true);
      }

      toast({
        title: "음성 생성 완료",
        description: `${successCount}/${totalCount}개 슬라이드 음성이 생성되었습니다!`,
      });

      // 실패한 슬라이드가 있는 경우 경고
      if (successCount < totalCount) {
        const failedSlides = result.results.filter(r => r.error).map(r => r.title);
        toast({
          title: "일부 음성 생성 실패",
          description: `실패한 슬라이드: ${failedSlides.join(', ')}`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('TTS 생성 오류:', error);
      toast({
        title: "음성 생성 실패",
        description: error instanceof Error ? error.message : "음성 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const handleWootmanGeneration = async () => {
    if (!summaryResult) return;

    try {
      setIsGeneratingWootman(true);
      toast({
        title: "읏맨 배치 시작",
        description: "칠판 스타일 슬라이드에 읏맨 캐릭터를 배치하고 있습니다...",
      });

      // SlideData 형식으로 변환
      const slides: SlideData[] = summaryResult.slides.map((slide) => ({
        title: slide.title,
        content: slide.content,
        duration: slide.duration
      }));

      // 원본 읏맨과 칠판 슬라이드 결합
      const combinedSlides = await generateSlidesWithWootman(slides);
      setGeneratedSlides(combinedSlides);

      // 원본 읏맨 이미지 설정 (영상 생성용)
      setWootmanImage('/eutman/읏맨(원본).png');
      setIsWootmanComplete(true);

      toast({
        title: "읏맨 배치 완료",
        description: "읏맨이 포함된 칠판 스타일 슬라이드가 완성되었습니다!",
      });

    } catch (error) {
      console.error('읏맨 슬라이드 생성 오류:', error);
      toast({
        title: "읏맨 배치 실패",
        description: error instanceof Error ? error.message : "읏맨 배치 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWootman(false);
    }
  };

  const handleVideoGeneration = async () => {
    if (!summaryResult || !generatedSlides.length) {
      toast({
        title: "영상 생성 불가",
        description: "슬라이드가 준비되어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    // TTS 완료 상태가 아니면서 TTS 결과가 없으면 오류
    if (!isTTSComplete && ttsResults.length === 0) {
      toast({
        title: "영상 생성 불가",
        description: "음성 생성을 먼저 완료해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingVideo(true);
      toast({
        title: "영상 생성 시작",
        description: "슬라이드와 음성을 합쳐서 영상을 생성하고 있습니다...",
      });

      // 영상 생성 데이터 준비
      const videoData: VideoGenerationData = {
        slides: generatedSlides.map((slideImage, index) => {
          const ttsResult = ttsResults.find(r => r.slideIndex === index);
          const slideInfo = summaryResult.slides[index];
          
          return {
            slideIndex: index,
            slideImage: slideImage,
            title: slideInfo?.title || `슬라이드 ${index + 1}`,
            content: slideInfo?.content || '',
            audioData: ttsResult?.audioData || null,
            duration: ttsResult?.duration || slideInfo?.duration || 5
          };
        }),
        wootmanImage: wootmanImage
      };

      const result = await generateVideo(videoData);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.success && result.videoUrl) {
        setGeneratedVideoUrl(result.videoUrl);
        setIsVideoComplete(true);
        
        toast({
          title: "영상 생성 완료",
          description: "교육 영상이 성공적으로 생성되었습니다!",
        });
      } else {
        throw new Error("영상 생성에 실패했습니다.");
      }

    } catch (error) {
      console.error('영상 생성 오류:', error);
      toast({
        title: "영상 생성 실패",
        description: error instanceof Error ? error.message : "영상 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#F04C23]/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-16 w-96 h-96 bg-[#F04C23]/5 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-[#F04C23]/5 rounded-full blur-3xl animate-float" />
      </div>

      <div className="relative">
        <div className="container mx-auto px-4 py-12">
          {!generatedSlides.length ? (
            <div className="grid lg:grid-cols-2 gap-12 items-start min-h-[80vh]">
              {/* 왼쪽 컬럼 - 제목 & 읏맨 전광판 */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <Badge 
                    variant="secondary" 
                    className="bg-[#F04C23]/10 text-[#F04C23] border-[#F04C23]/20 px-4 py-2"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI 기반 자동 슬라이드 제작
                  </Badge>
                  
                  <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight">
                    <span className="text-[#F04C23]">
                      자동으로
                    </span>
                    <br />교육영상을 만들어보세요
                  </h1>
                  
                  <p className="text-xl text-neutral-600 leading-relaxed">
                    PDF, Word, 텍스트 문서를 업로드하면 AI가 자동으로 
                    <br className="hidden lg:block" />
                    칠판 스타일 슬라이드를 제작해드립니다.
                  </p>
                </div>
                
                {/* 읏맨 캐릭터 캐러셀 */}
                <div className="relative bg-white rounded-2xl py-8 min-h-[400px] flex items-center justify-center">
                  {/* 왼쪽 화살표 버튼 */}
                  <button
                    onClick={handlePreviousWootman}
                    className="absolute left-4 z-10 w-12 h-12 bg-black/80 hover:bg-black text-white flex items-center justify-center rounded-full transition-all duration-200"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  {/* 현재 읏맨 캐릭터 */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="flex items-center justify-center">
                      <img 
                        src={wootmanCharacters[currentWootmanIndex].src}
                        alt={wootmanCharacters[currentWootmanIndex].alt}
                        className="w-64 h-64 object-contain transition-all duration-300"
                        onError={(e) => {
                          // 이미지 로딩 실패 시 대체 텍스트 표시
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.fallback-text')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-text w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg text-3xl font-medium text-gray-600 text-center';
                            fallback.textContent = '읏맨';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                    
                    {/* 페이지 인디케이터 */}
                    <div className="text-center space-y-3">
                      <div className="flex items-center justify-center space-x-2">
                        {wootmanCharacters.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentWootmanIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-200 ${
                              index === currentWootmanIndex 
                                ? 'bg-[#F04C23] scale-125' 
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                      
                      <p className="text-sm text-gray-600 font-medium">
                        {wootmanCharacters[currentWootmanIndex].name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentWootmanIndex + 1} / {wootmanCharacters.length}
                      </p>
                    </div>
                  </div>

                  {/* 오른쪽 화살표 버튼 */}
                  <button
                    onClick={handleNextWootman}
                    className="absolute right-4 z-10 w-12 h-12 bg-black/80 hover:bg-black text-white flex items-center justify-center rounded-full transition-all duration-200"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* 오른쪽 컬럼 - 업로드 인터페이스 */}
              <div className="space-y-6">
              {/* 파일 업로드 블록 - 텍스트로 결과가 생성되었으면 숨김 */}
              {!(summaryResult && !uploadedFile) && (
                <Card className="bg-white shadow-lg border border-gray-200">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                      <Upload className="h-6 w-6 text-[#F04C23]" />
                      파일 업로드
                    </CardTitle>
                    <p className="text-neutral-600">
                      지원 형식: PDF, DOCX, TXT (최대 50MB)
                    </p>
                  </CardHeader>
                <CardContent className="space-y-6">
                  <FileDropZone 
                    onFileSelect={handleFileSelect}
                    maxSize={50}
                    acceptedTypes={['.pdf', '.docx', '.txt']}
                  />

                  {uploadedFile && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="h-5 w-5 text-[#F04C23]" />
                          <div className="flex-1">
                            <p className="font-medium text-neutral-900">{uploadedFile.name}</p>
                            <p className="text-sm text-neutral-600">
                              {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        
                        {isUploading && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-neutral-600">업로드 진행률</span>
                              <span className="font-medium">{Math.round(Math.min(uploadProgress, 100))}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-[#F04C23] h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {isAnalyzing && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-[#F04C23]">
                              <div className="w-4 h-4 border-2 border-[#F04C23] border-t-transparent rounded-full animate-spin" />
                              <span>AI가 문서를 분석하고 있습니다...</span>
                            </div>
                            <div className="text-xs text-neutral-500">
                              GPT-3.5 Turbo로 6개 슬라이드 요약 생성 중
                            </div>
                          </div>
                        )}

                        {error && (
                          <div className="flex items-center gap-2 p-3 bg-error-50 border border-error-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-error-500 flex-shrink-0" />
                            <div className="text-sm text-error-700">{error}</div>
                          </div>
                        )}
                      </div>



                      {!isUploading && !isAnalyzing && !summaryResult && !error && uploadProgress === 100 && (
                        <div className="text-center space-y-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success-50 text-success-700 rounded-lg border border-success-200">
                            <Clock className="h-4 w-4" />
                            파일 업로드가 완료되었습니다
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              )}

              {/* 또는 구분자 - 둘 다 보일 때만 표시 */}
              {!summaryResult && (
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-gray-500 font-medium px-3">또는</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
              )}

              {/* 텍스트 입력 블록 - 파일로 결과가 생성되었으면 숨김 */}
              {!(summaryResult && uploadedFile) && (
                <Card className="bg-white shadow-lg border border-gray-200">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <Type className="h-6 w-6 text-[#F04C23]" />
                    텍스트 입력
                  </CardTitle>
                  <p className="text-neutral-600">
                    교육 콘텐츠로 만들 텍스트를 직접 입력하세요
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Textarea
                    placeholder="교육 콘텐츠로 만들고 싶은 텍스트를 입력하세요...&#10;예: 프로그래밍 개념, 역사적 사건, 과학 원리 등"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                  
                  {isAnalyzing && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-[#F04C23]">
                        <div className="w-4 h-4 border-2 border-[#F04C23] border-t-transparent rounded-full animate-spin" />
                        <span>AI가 텍스트를 분석하고 있습니다...</span>
                      </div>
                      <div className="text-xs text-neutral-500">
                        GPT-3.5 Turbo로 6개 슬라이드 요약 생성 중
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-error-50 border border-error-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-error-500 flex-shrink-0" />
                      <div className="text-sm text-error-700">{error}</div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleTextSubmit}
                      className="flex-1 bg-[#F04C23] hover:bg-[#E03E1A] text-white"
                      disabled={isAnalyzing || !inputText.trim()}
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          분석 중...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          교육영상 제작 시작
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setInputText('')}
                      className="border-[#F04C23] text-[#F04C23] hover:bg-[#F04C23] hover:text-white"
                      disabled={isAnalyzing}
                    >
                      초기화
                    </Button>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Summary Result - 파일 업로드와 텍스트 입력 공통 결과 */}
              {summaryResult && (
                <Card className="bg-white shadow-lg border border-[#F04C23]/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle className="h-5 w-5 text-[#F04C23]" />
                      요약 완료
                    </CardTitle>
                    <p className="text-sm text-neutral-600">{summaryResult.summary}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-neutral-900">6개 슬라이드 구성</h4>
                      <div className="grid gap-3">
                        {summaryResult.slides.map((slide, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-shrink-0 w-6 h-6 bg-[#F04C23] text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1 space-y-1">
                              <h5 className="font-medium text-neutral-900 text-sm">{slide.title}</h5>
                              <p className="text-xs text-neutral-600">{slide.content}</p>
                              <div className="flex items-center gap-4 text-xs text-neutral-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {slide.duration}초
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={startSlideProduction}
                        className="flex-1 bg-[#F04C23] hover:bg-[#E03E1A] text-white"
                        disabled={isGeneratingSlides}
                      >
                        {isGeneratingSlides ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            슬라이드 생성 중...
                          </>
                        ) : (
                          <>
                            <Image className="h-4 w-4 mr-2" />
                            슬라이드 제작 시작
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={resetUpload}
                        className="border-[#F04C23] text-[#F04C23] hover:bg-[#F04C23] hover:text-white"
                      >
                        새로 시작
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          ) : (
            /* 슬라이드 생성 완료 후 표시 영역 */
            <div className="space-y-8">
              {/* 헤더 */}
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-neutral-900">
                  🎨 칠판 스타일 슬라이드가 완성되었습니다!
                </h1>
                <p className="text-lg text-neutral-600">
                  총 {generatedSlides.length}개의 슬라이드가 생성되었습니다.
                </p>
                <Button 
                  onClick={resetUpload}
                  variant="outline"
                  className="border-[#F04C23] text-[#F04C23] hover:bg-[#F04C23] hover:text-white"
                >
                  새 문서 업로드
                </Button>
              </div>

              {/* 슬라이드 그리드 */}
              <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-6">
                {generatedSlides.map((slideImage, index) => {
                  const ttsResult = ttsResults.find(r => r.slideIndex === index);
                  
                  return (
                    <div key={index} className="space-y-3">
                      <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200 relative">
                        <img 
                          src={slideImage} 
                          alt={`슬라이드 ${index + 1}`}
                          className="w-full h-auto rounded-md shadow-sm"
                        />
                        {/* 읏맨 캐릭터 표시 제거 - 슬라이드에 이미 포함되어 있음 */}
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="font-semibold text-neutral-900">
                          슬라이드 {index + 1}
                        </h3>
                        {summaryResult && summaryResult.slides[index] && (
                          <p className="text-sm text-neutral-600">
                            {summaryResult.slides[index].title}
                          </p>
                        )}
                        
                        {/* 오디오 플레이어 */}
                        {ttsResult && ttsResult.audioData && (
                          <div className="mt-3">
                            <audio 
                              controls 
                              className="w-full h-8"
                              preload="metadata"
                            >
                              <source src={ttsResult.audioData} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}
                        
                        {/* TTS 에러 표시 */}
                        {ttsResult && ttsResult.error && (
                          <div className="mt-2 text-xs text-error-600 bg-error-50 px-2 py-1 rounded">
                            음성 생성 실패: {ttsResult.error}
                          </div>
                        )}
                        
                        {/* TTS 아직 생성되지 않음 */}
                        {ttsResults.length > 0 && !ttsResult && (
                          <div className="mt-2 text-xs text-neutral-400">
                            음성이 생성되지 않았습니다
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TTS/읏맨/영상 생성 버튼 */}
              <div className="text-center space-y-4">
                {!isTTSComplete ? (
                  <Button 
                    onClick={handleTTSGeneration}
                    className="bg-[#F04C23] hover:bg-[#E03E1A] text-white px-8 py-3"
                    disabled={isGeneratingTTS}
                  >
                    {isGeneratingTTS ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        음성 생성 중...
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-5 w-5 mr-2" />
                        설명 음성 생성(TTS)
                      </>
                    )}
                  </Button>
                ) : !isWootmanComplete ? (
                  <Button 
                    onClick={handleWootmanGeneration}
                    className="bg-[#F04C23] hover:bg-[#E03E1A] text-white px-8 py-3"
                    disabled={isGeneratingWootman}
                  >
                    {isGeneratingWootman ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        읏맨 배치 중...
                      </>
                    ) : (
                      <>
                        <Bot className="h-5 w-5 mr-2" />
                        읏맨 배치하기
                      </>
                    )}
                  </Button>
                ) : !isVideoComplete ? (
                  <Button 
                    onClick={handleVideoGeneration}
                    className="bg-[#F04C23] hover:bg-[#E03E1A] text-white px-8 py-3"
                    disabled={isGeneratingVideo}
                  >
                    {isGeneratingVideo ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        영상 생성 중...
                      </>
                    ) : (
                      <>
                        <Video className="h-5 w-5 mr-2" />
                        영상 만들기
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="flex items-center justify-center gap-2 text-[#F04C23]">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">교육 영상이 완성되었습니다!</span>
                    </div>
                    
                    {/* 생성된 영상 플레이어 */}
                    {generatedVideoUrl && (
                      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-neutral-900">완성된 교육 영상</h3>
                        <video 
                          controls 
                          className="w-full max-w-4xl mx-auto rounded-lg shadow-md"
                          poster=""
                        >
                          <source src={generatedVideoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        <div className="mt-4 flex justify-center gap-3">
                          <Button 
                            onClick={() => window.open(generatedVideoUrl, '_blank')}
                            variant="outline"
                            className="border-[#F04C23] text-[#F04C23] hover:bg-[#F04C23] hover:text-white"
                          >
                            새 탭에서 열기
                          </Button>
                          <Button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = generatedVideoUrl;
                              link.download = `교육영상_${new Date().toISOString().split('T')[0]}.mp4`;
                              link.click();
                            }}
                            variant="outline"
                            className="border-[#F04C23] text-[#F04C23] hover:bg-[#F04C23] hover:text-white"
                          >
                            다운로드
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
