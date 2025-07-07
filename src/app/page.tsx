'use client';

import React, { useState } from 'react';
import { FileDropZone } from '@/components/upload/FileDropZone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Video, Sparkles, Clock, Zap, CheckCircle, AlertCircle, Image, Volume2, Play, Pause, Bot } from 'lucide-react';
import { readTextFile, summarizeText, generateTTS, generateWootman, type TTSResult, type WootmanResult } from '@/lib/api';
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
  const { toast } = useToast();

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
          return prev + Math.random() * 15;
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
  };

  const startSlideProduction = async () => {
    if (!summaryResult) return;

    try {
      setIsGeneratingSlides(true);
      toast({
        title: "슬라이드 제작 시작",
        description: "칠판 스타일 슬라이드를 생성하고 있습니다...",
      });

      // SlideData 형식으로 변환
      const slides: SlideData[] = summaryResult.slides.map((slide) => ({
        title: slide.title,
        content: slide.content,
        duration: slide.duration
      }));

      // 슬라이드 이미지 생성 (웹페이지 표시용)
      const slideImages = await generateSlidesForDisplay(slides);
      setGeneratedSlides(slideImages);

      toast({
        title: "슬라이드 제작 완료",
        description: `${slides.length}개의 칠판 슬라이드가 생성되었습니다!`,
      });

    } catch (error) {
      console.error('슬라이드 생성 오류:', error);
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
            <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
              {/* Left Side - Info */}
              <div className="space-y-8">
                <div className="text-center lg:text-left space-y-6">
                  <div className="space-y-4">
                                      <Badge 
                    variant="secondary" 
                    className="bg-[#F04C23]/10 text-[#F04C23] border-[#F04C23]/20 px-4 py-2"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI 기반 자동 슬라이드 제작
                  </Badge>
                    
                    <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight">
                      문서를 
                      <span className="text-[#F04C23]">
                        자동으로
                      </span>
                      <br />슬라이드로 만들어보세요
                    </h1>
                    
                    <p className="text-xl text-neutral-600 leading-relaxed">
                      PDF, Word, 텍스트 문서를 업로드하면 AI가 자동으로 
                      <br className="hidden lg:block" />
                      칠판 스타일 슬라이드를 제작해드립니다.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg text-center border border-gray-200 shadow-sm">
                      <Upload className="h-8 w-8 text-[#F04C23] mx-auto mb-2" />
                      <h3 className="font-semibold text-neutral-900 mb-1">1. 업로드</h3>
                      <p className="text-sm text-neutral-600">문서 파일을 드래그하여 업로드</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg text-center border border-gray-200 shadow-sm">
                      <Zap className="h-8 w-8 text-[#F04C23] mx-auto mb-2" />
                      <h3 className="font-semibold text-neutral-900 mb-1">2. 변환</h3>
                      <p className="text-sm text-neutral-600">AI가 자동으로 슬라이드를 제작</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg text-center border border-gray-200 shadow-sm">
                      <Image className="h-8 w-8 text-[#F04C23] mx-auto mb-2" />
                      <h3 className="font-semibold text-neutral-900 mb-1">3. 완성</h3>
                      <p className="text-sm text-neutral-600">고품질 칠판 스타일 슬라이드 생성</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Upload Interface */}
            <div className="space-y-6">
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
                              <span className="font-medium">{Math.round(uploadProgress)}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-[#F04C23] h-full rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
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
                                다시 업로드
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

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

              {/* Features Card */}
              <Card className="bg-white shadow-lg border border-gray-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#F04C23]" />
                    주요 기능
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#F04C23] rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-neutral-900">스마트 콘텐츠 분석</p>
                        <p className="text-sm text-neutral-600">문서 내용을 AI가 분석하여 최적의 슬라이드 구성을 제안</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#F04C23] rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-neutral-900">칠판 스타일 디자인</p>
                        <p className="text-sm text-neutral-600">나무 테두리와 분필 효과로 자연스러운 칠판 느낌 연출</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#F04C23] rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-neutral-900">고품질 출력</p>
                        <p className="text-sm text-neutral-600">Full HD 해상도의 세로형 슬라이드 이미지 제작</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                      <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200">
                        <img 
                          src={slideImage} 
                          alt={`슬라이드 ${index + 1}`}
                          className="w-full h-auto rounded-md shadow-sm"
                        />
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

              {/* TTS 버튼 */}
              <div className="text-center">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
