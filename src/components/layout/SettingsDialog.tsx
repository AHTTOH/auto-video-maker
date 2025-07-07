'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Save, Link, AlertCircle } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // 설정 로드
  useEffect(() => {
    if (open) {
      const savedWebhookUrl = localStorage.getItem('webhookUrl') || '';
      setWebhookUrl(savedWebhookUrl);
    }
  }, [open]);

  // 웹훅 URL 유효성 검사
  const isValidUrl = (url: string) => {
    if (!url.trim()) return true; // 빈 값은 허용
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // 설정 저장
  const handleSave = async () => {
    if (!isValidUrl(webhookUrl)) {
      toast({
        title: '잘못된 URL',
        description: '올바른 웹훅 URL을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // localStorage에 저장 (나중에 API로 변경 가능)
      localStorage.setItem('webhookUrl', webhookUrl);
      
      toast({
        title: '설정 저장 완료',
        description: '웹훅 URL이 성공적으로 저장되었습니다.',
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: '저장 실패',
        description: '설정을 저장하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 설정 테스트
  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: '웹훅 URL 필요',
        description: '테스트할 웹훅 URL을 먼저 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidUrl(webhookUrl)) {
      toast({
        title: '잘못된 URL',
        description: '올바른 웹훅 URL을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          message: 'Auto Video Maker 웹훅 테스트',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: '테스트 성공',
          description: '웹훅이 정상적으로 작동합니다.',
        });
      } else {
        toast({
          title: '테스트 실패',
          description: `웹훅 응답 오류: ${response.status}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '테스트 실패',
        description: '웹훅 연결을 확인할 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[500px]">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <Link className="h-4 w-4 text-primary-600" />
            </div>
            설정
          </SheetTitle>
          <SheetDescription>
            영상 제작 완료 시 알림을 받을 웹훅 URL을 설정하세요.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">웹훅 URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://your-webhook-url.com/endpoint"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className={!isValidUrl(webhookUrl) ? 'border-error-500 focus:border-error-500' : ''}
            />
            {!isValidUrl(webhookUrl) && webhookUrl.trim() && (
              <div className="flex items-center gap-2 text-sm text-error-600">
                <AlertCircle className="h-4 w-4" />
                올바른 URL 형식이 아닙니다
              </div>
            )}
            <p className="text-sm text-neutral-500">
              영상 제작이 완료되면 이 URL로 알림을 전송합니다.
            </p>
          </div>

          {/* 웹훅 알림 예시 */}
          <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-neutral-900">전송될 데이터 예시:</h4>
            <pre className="text-xs text-neutral-600 bg-white p-3 rounded border overflow-x-auto">
{`{
  "event": "video_completed",
  "video_id": "uuid",
  "title": "영상 제목",
  "status": "completed",
  "download_url": "https://...",
  "created_at": "2024-01-01T00:00:00Z"
}`}
            </pre>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleTestWebhook}
            disabled={isLoading || !webhookUrl.trim()}
            className="flex-1"
          >
            테스트
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !isValidUrl(webhookUrl)}
            className="bg-primary-500 hover:bg-primary-600 flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            저장
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
} 