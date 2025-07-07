'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, HardDrive, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useActiveJobs } from '@/hooks/useActiveJobs';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { 
    extendedActiveJobs,
    completedJobs, 
    failedJobs, 
    storageUsed, 
    storageLimit,
    totalJobs 
  } = useActiveJobs();
  
  const storagePercentage = Math.round((storageUsed / storageLimit) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 text-accent-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
      default:
        return <Clock className="h-4 w-4 text-neutral-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-accent-50 text-accent-700 border-accent-200';
      case 'completed':
        return 'bg-success-50 text-success-700 border-success-200';
      case 'failed':
        return 'bg-error-50 text-error-700 border-error-200';
      default:
        return 'bg-neutral-50 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <aside className={cn("w-80 space-y-6", className)}>
      {/* Active Jobs */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary-500" />
            활성 작업
            {extendedActiveJobs.length > 0 && (
              <Badge variant="secondary" className="bg-accent-50 text-accent-700 border-accent-200">
                {extendedActiveJobs.length}개
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {extendedActiveJobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-500">활성 작업이 없습니다</p>
            </div>
          ) : (
            extendedActiveJobs.map((job) => (
              <div key={job.id} className="glass-subtle p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <span className="font-medium text-neutral-900 text-sm">
                      {job.fileName}
                    </span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getStatusColor(job.status))}
                  >
                    {job.status === 'processing' ? '처리 중' : job.status}
                  </Badge>
                </div>
                
                {job.progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-600">진행률</span>
                      <span className="font-medium text-neutral-900">{job.progress}%</span>
                    </div>
                    <div className="progress-modern h-1.5">
                      <div 
                        className="progress-fill h-full"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {job.estimatedTime && (
                  <p className="text-xs text-neutral-500">
                    예상 완료: {job.estimatedTime}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HardDrive className="h-5 w-5 text-primary-500" />
            저장 공간
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">사용량</span>
              <span className="font-medium text-neutral-900">
                {(storageUsed / 1024).toFixed(1)} GB / {(storageLimit / 1024).toFixed(0)} GB
              </span>
            </div>
            <div className="progress-modern h-2">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-slow",
                  storagePercentage > 90 ? "bg-gradient-to-r from-error-500 to-error-600" :
                  storagePercentage > 75 ? "bg-gradient-to-r from-warning-500 to-accent-500" :
                  "progress-fill"
                )}
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-neutral-500">
              {storagePercentage}% 사용 중
            </p>
          </div>

          {storagePercentage > 90 && (
            <div className="glass-subtle p-3 rounded-lg border border-error-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-error-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-error-700">저장 공간 부족</p>
                  <p className="text-xs text-error-600 mt-1">
                    오래된 영상을 삭제하여 공간을 확보하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-primary-500" />
            제작 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-success-50 border border-success-200">
              <div className="text-2xl font-bold text-success-700">{completedJobs}</div>
              <div className="text-xs text-success-600">완료</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-accent-50 border border-accent-200">
              <div className="text-2xl font-bold text-accent-700">{extendedActiveJobs.length}</div>
              <div className="text-xs text-accent-600">처리 중</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <div className="text-2xl font-bold text-neutral-700">{totalJobs}</div>
              <div className="text-xs text-neutral-600">전체</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-error-50 border border-error-200">
              <div className="text-2xl font-bold text-error-700">{failedJobs}</div>
              <div className="text-xs text-error-600">실패</div>
            </div>
          </div>
          
          {totalJobs > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="text-center">
                <p className="text-sm text-neutral-600">성공률</p>
                <p className="text-xl font-bold text-primary-600">
                  {Math.round((completedJobs / totalJobs) * 100)}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  );
} 