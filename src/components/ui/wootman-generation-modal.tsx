'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface WootmanGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGenerating: boolean;
  progress: number;
  generatedImage?: string;
  onConfirm?: () => void;
  error?: string;
}

export function WootmanGenerationModal({
  isOpen,
  onClose,
  isGenerating,
  progress,
  generatedImage,
  onConfirm,
  error
}: WootmanGenerationModalProps) {
  const getStatusMessage = () => {
    if (error) return '이미지 생성 실패';
    if (generatedImage) return '읏맨 생성 완료!';
    if (isGenerating) return '읏맨을 생성하고 있습니다...';
    return '읏맨 생성 준비 중';
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-6 w-6 text-red-500" />;
    if (generatedImage) return <CheckCircle className="h-6 w-6 text-green-500" />;
    return <Sparkles className="h-6 w-6 text-[#F04C23] animate-pulse" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            읏맨 생성하기
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 상태 메시지 */}
          <div className="text-center">
            <p className="text-lg font-medium text-neutral-900">
              {getStatusMessage()}
            </p>
            {isGenerating && (
              <p className="text-sm text-neutral-600 mt-1">
                DALL-E3이 다양한 읏맨 이미지를 생성하고 있습니다
              </p>
            )}
          </div>

          {/* 진행도 바 */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-center text-neutral-500">
                {Math.round(progress)}% 완료
              </p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 생성된 이미지 미리보기 */}
          {generatedImage && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={generatedImage} 
                    alt="생성된 읏맨"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <p className="text-sm text-center text-neutral-600">
                멋진 읏맨이 생성되었습니다! 각 슬라이드에 배치하시겠습니까?
              </p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2">
            {generatedImage ? (
              <>
                <Button 
                  onClick={onConfirm}
                  className="flex-1 bg-[#F04C23] hover:bg-[#E03E1A] text-white"
                >
                  확인
                </Button>
                <Button 
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  취소
                </Button>
              </>
            ) : (
              <Button 
                variant="outline"
                onClick={onClose}
                className="w-full"
                disabled={isGenerating}
              >
                닫기
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 