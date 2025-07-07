'use client';

import { useState, useEffect } from 'react';
import { getActiveJobs, subscribeToJobUpdates, unsubscribeFromUpdates, getDashboardStats } from '@/lib/api';
import type { JobWithFileAndVideo } from '@/lib/supabase';

interface ExtendedJob {
  id: string;
  fileName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  estimatedTime?: string;
  createdAt: string;
}

export function useActiveJobs() {
  const [activeJobs, setActiveJobs] = useState<JobWithFileAndVideo[]>([]);
  const [extendedActiveJobs, setExtendedActiveJobs] = useState<ExtendedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  
  // Dashboard stats
  const [completedJobs, setCompletedJobs] = useState(0);
  const [failedJobs, setFailedJobs] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0); // in MB
  const [storageLimit] = useState(5 * 1024); // 5GB in MB

  // 활성 작업 수 계산
  const activeJobsCount = activeJobs.filter(job => 
    ['queued', 'processing'].includes(job.state)
  ).length;
  
  const totalJobs = activeJobs.length + completedJobs + failedJobs;

  // Job 상태 변환 함수
  const convertJobToExtended = (job: JobWithFileAndVideo): ExtendedJob => ({
    id: job.id,
    fileName: job.uploaded_file?.original_filename || '알 수 없는 파일',
    status: job.state as ExtendedJob['status'],
    progress: job.progress_percent || undefined,
    estimatedTime: job.state === 'processing' ? '약 2-3분' : undefined,
    createdAt: job.created_at
  });

  // 초기 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // 활성 작업 로드
        const { data: jobsData, error: jobsError } = await getActiveJobs();
        if (jobsError) {
          setError(jobsError);
        } else {
          setActiveJobs(jobsData || []);
          setExtendedActiveJobs((jobsData || []).map(convertJobToExtended));
        }

        // 대시보드 통계 로드
        const { data: statsData } = await getDashboardStats();
        if (statsData) {
          setCompletedJobs(statsData.completedJobs || 0);
          setFailedJobs(statsData.failedJobs || 0);
          // totalStorageUsed는 bytes 단위이므로 MB로 변환
          setStorageUsed(Math.round((statsData.totalStorageUsed || 0) / (1024 * 1024)));
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // 실시간 업데이트 구독
  useEffect(() => {
    const subscription = subscribeToJobUpdates((updatedJob) => {
      setActiveJobs(prev => {
        // 업데이트된 Job이 더이상 활성 상태가 아니면 목록에서 제거
        if (!['queued', 'processing'].includes(updatedJob.state)) {
          const updated = prev.filter(job => job.id !== updatedJob.id);
          setExtendedActiveJobs(updated.map(convertJobToExtended));
          
          // 완료/실패 카운트 업데이트
          if (updatedJob.state === 'completed') {
            setCompletedJobs(c => c + 1);
          } else if (updatedJob.state === 'failed') {
            setFailedJobs(f => f + 1);
          }
          
          return updated;
        }
        
        // 기존 Job 업데이트 또는 새로운 Job 추가
        const existingIndex = prev.findIndex(job => job.id === updatedJob.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...updatedJob };
          setExtendedActiveJobs(updated.map(convertJobToExtended));
          return updated;
        } else {
          // 새로운 활성 Job이면 전체 목록을 다시 로드해야 함
          getActiveJobs().then(({ data }) => {
            if (data) {
              setActiveJobs(data);
              setExtendedActiveJobs(data.map(convertJobToExtended));
            }
          });
          return prev;
        }
      });
    });

    return () => {
      unsubscribeFromUpdates(subscription);
    };
  }, []);

  return {
    // 원본 데이터 (기존 호환성)
    activeJobs,
    isLoading,
    error,
    
    // 확장된 데이터 (새로운 디자인용)
    activeJobsCount,
    totalJobs,
    completedJobs,
    failedJobs,
    storageUsed,
    storageLimit,
    extendedActiveJobs,
    
    refresh: async () => {
      const { data, error } = await getActiveJobs();
      if (data) {
        setActiveJobs(data);
        setExtendedActiveJobs(data.map(convertJobToExtended));
      }
      if (error) setError(error);
      
      const { data: statsData } = await getDashboardStats();
      if (statsData) {
        setCompletedJobs(statsData.completedJobs || 0);
        setFailedJobs(statsData.failedJobs || 0);
        setStorageUsed(Math.round((statsData.totalStorageUsed || 0) / (1024 * 1024)));
      }
    }
  };
} 