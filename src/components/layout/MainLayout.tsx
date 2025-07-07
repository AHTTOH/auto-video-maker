'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  
  // Sidebar를 표시할 페이지들
  const showSidebar = pathname !== '/';

  return (
    <div className="min-h-screen bg-neutral-50">
      <Topbar />
      
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <div className="hidden lg:block border-r border-neutral-200 bg-white">
            <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-6">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-h-[calc(100vh-4rem)]",
          showSidebar ? "lg:max-w-[calc(100%-20rem)]" : "w-full"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
} 