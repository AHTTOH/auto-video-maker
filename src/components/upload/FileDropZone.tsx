'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  maxSize?: number; // MB
  acceptedTypes?: string[];
  className?: string;
}

export function FileDropZone({
  onFileSelect,
  maxSize = 50,
  acceptedTypes = ['.pdf', '.docx', '.txt'],
  className
}: FileDropZoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    setIsSuccess(false);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors?.[0]?.code === 'file-too-large') {
        setError(`파일 크기가 ${maxSize}MB를 초과합니다.`);
      } else if (rejection.errors?.[0]?.code === 'file-invalid-type') {
        setError('지원하지 않는 파일 형식입니다.');
      } else {
        setError('파일 업로드 중 오류가 발생했습니다.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setIsSuccess(true);
      setTimeout(() => {
        onFileSelect(file);
      }, 500);
    }
  }, [onFileSelect, maxSize]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    }
  });

  const getBorderColor = () => {
    if (isDragReject || error) return 'border-error-500 bg-red-50/50';
    if (isDragAccept || isSuccess) return 'border-primary-500 bg-primary-50/50';
    if (isDragActive) return 'border-accent-500 bg-accent-50/50';
    return 'border-neutral-300 hover:border-primary-400';
  };

  const getIcon = () => {
    if (error) return <AlertCircle className="h-12 w-12 text-error-500" />;
    if (isSuccess) return <CheckCircle className="h-12 w-12 text-primary-500" />;
    return <Upload className="h-12 w-12 text-neutral-400" />;
  };

  const getText = () => {
    if (error) return { title: '업로드 실패', subtitle: error };
    if (isSuccess) return { title: '업로드 성공!', subtitle: '파일이 성공적으로 업로드되었습니다' };
    if (isDragActive) {
      if (isDragAccept) {
        return { title: '파일을 놓아주세요', subtitle: '업로드를 시작합니다' };
      }
      if (isDragReject) {
        return { title: '지원하지 않는 파일', subtitle: 'PDF, DOCX, TXT 파일만 가능합니다' };
      }
    }
    return { 
      title: '파일을 드래그하거나 클릭하여 업로드', 
      subtitle: `PDF, DOCX, TXT 파일 (최대 ${maxSize}MB)` 
    };
  };

  const { title, subtitle } = getText();

  return (
    <div className={cn("relative", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-default",
          "backdrop-blur-sm",
          "hover:shadow-elevation-2 hover:scale-[1.01]",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          getBorderColor()
        )}
      >
        <input {...getInputProps()} />
        
        {/* Background Pattern */}
        <div className="absolute inset-0 rounded-xl opacity-5">
          <div className="h-full w-full bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 space-y-4">
          <div className="mx-auto flex items-center justify-center">
            {getIcon()}
          </div>
          
          <div className="space-y-2">
            <h3 className={cn(
              "text-lg font-semibold transition-colors duration-default",
              error ? "text-error-600" : 
              isSuccess ? "text-primary-600" : 
              "text-neutral-900"
            )}>
              {title}
            </h3>
            <p className={cn(
              "text-sm transition-colors duration-default",
              error ? "text-error-500" : 
              isSuccess ? "text-primary-500" : 
              "text-neutral-500"
            )}>
              {subtitle}
            </p>
          </div>

          {/* File Type Icons */}
          {!error && !isSuccess && (
            <div className="flex items-center justify-center gap-4 pt-2">
              {[
                { type: 'PDF', icon: '📄', color: 'text-red-500' },
                { type: 'DOCX', icon: '📝', color: 'text-blue-500' },
                { type: 'TXT', icon: '📋', color: 'text-neutral-500' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className="text-lg">{item.icon}</span>
                  <span className={cn("text-xs font-medium", item.color)}>
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Upload Animation */}
          {isDragActive && isDragAccept && (
            <div className="absolute inset-0 rounded-xl border-2 border-primary-500 border-dashed animate-pulse bg-primary-50/20" />
          )}
        </div>
      </div>

      {/* Success Animation */}
      {isSuccess && (
        <div className="absolute inset-0 rounded-xl bg-primary-500/10 animate-pulse-subtle pointer-events-none" />
      )}
    </div>
  );
} 