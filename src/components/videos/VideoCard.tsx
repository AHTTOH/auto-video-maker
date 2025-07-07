'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Play, 
  MoreVertical, 
  Download, 
  Share2, 
  Trash2, 
  Clock,
  Eye,
  Calendar,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VideoWithSlides } from '@/lib/supabase';

interface VideoCardProps {
  video: VideoWithSlides;
  onDelete?: (id: string) => void;
  className?: string;
}

export function VideoCard({ video, onDelete, className }: VideoCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-50 text-success-700 border-success-200';
      case 'processing':
        return 'bg-accent-50 text-accent-700 border-accent-200';
      case 'failed':
        return 'bg-error-50 text-error-700 border-error-200';
      default:
        return 'bg-neutral-50 text-neutral-700 border-neutral-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'processing':
        return '처리 중';
      case 'failed':
        return '실패';
      default:
        return status;
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsLoading(true);
    try {
      await onDelete(video.id);
    } finally {
      setIsLoading(false);
    }
  };

  const thumbnailUrl = video.thumbnail_path 
    ? video.thumbnail_path 
    : `https://picsum.photos/seed/${video.id}/400/300`;

  return (
    <Card className={cn(
      "card-interactive overflow-hidden group",
      "hover:shadow-elevation-3 transition-all duration-default",
      className
    )}>
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        {/* Thumbnail */}
        <div className="relative w-full h-full">
          <img
            src={thumbnailUrl}
            alt={video.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-slow",
              "group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
          
          {/* Loading placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 animate-pulse" />
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-default">
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <Link href={`/jobs/${video.id}`}>
              <Button
                size="sm"
                className="btn-primary shadow-lg backdrop-blur-sm"
              >
                <Play className="h-4 w-4 mr-2" />
                재생
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-md">
                <DropdownMenuItem className="cursor-pointer">
                  <Download className="h-4 w-4 mr-2" />
                  다운로드
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Share2 className="h-4 w-4 mr-2" />
                  공유
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer text-error-600 focus:text-error-600"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            variant="outline"
            className={cn(
              "text-xs backdrop-blur-sm",
              getStatusColor(video.status)
            )}
          >
            {getStatusText(video.status)}
          </Badge>
        </div>

        {/* Duration Badge */}
        <div className="absolute top-3 right-3">
          <Badge 
            variant="secondary"
            className="text-xs bg-black/60 text-white border-none backdrop-blur-sm"
          >
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(video.duration_sec)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title and Description */}
        <div className="space-y-2">
          <h3 className="font-semibold text-neutral-900 line-clamp-2 leading-tight">
            {video.title}
          </h3>
          {video.description && (
            <p className="text-sm text-neutral-600 line-clamp-2">
              {video.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              >
                {tag}
              </Badge>
            ))}
            {video.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-600">
                +{video.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Calendar className="h-3 w-3" />
            {formatDate(video.created_at)}
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <FileText className="h-3 w-3" />
            {formatFileSize(video.file_size)}
          </div>
          {video.slides && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Eye className="h-3 w-3" />
              {video.slides.length}개 슬라이드
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 