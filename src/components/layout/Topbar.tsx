'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Upload, Video, HelpCircle, Home, Sparkles, Clock, Settings } from 'lucide-react';
import { useActiveJobs } from '@/hooks/useActiveJobs';
import { cn } from '@/lib/utils';
import { SettingsDialog } from './SettingsDialog';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Topbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = usePathname();
  const { activeJobsCount, totalJobs } = useActiveJobs();

  const navItems: NavItem[] = [
    { name: '홈', href: '/', icon: Home },
    { name: '업로드', href: '/', icon: Upload },
    { name: '내 영상', href: '/jobs', icon: Video, badge: totalJobs },
    { name: '도움말', href: '/help', icon: HelpCircle },
  ];

  const isActivePath = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-default",
      "bg-white/80 border-neutral-200",
      "supports-[backdrop-filter]:bg-white/60"
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 transition-transform duration-default hover:scale-105">
          <div className="relative">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-elevation-1">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            {activeJobsCount > 0 && (
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent-500 flex items-center justify-center animate-pulse-subtle">
                <span className="text-xs font-bold text-white">{activeJobsCount}</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Auto Video Maker</h1>
            <p className="text-xs text-neutral-500 font-medium">AI 자동 영상 제작</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = isActivePath(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "relative h-10 px-4 transition-all duration-default",
                    isActive
                      ? "bg-primary-50 text-primary-700 hover:bg-primary-100"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-2 h-5 px-1.5 text-xs bg-neutral-200 text-neutral-700"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-primary-500 rounded-full" />
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right section with active jobs and settings */}
        <div className="hidden md:flex items-center gap-3">
          {/* Active Jobs Indicator */}
          {activeJobsCount > 0 && (
            <div className="glass-subtle px-3 py-1.5 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent-500 animate-pulse" />
                <span className="text-sm font-medium text-neutral-700">
                  {activeJobsCount}개 제작 중
                </span>
              </div>
            </div>
          )}
          
          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          >
            <Settings className="h-4 w-4 mr-2" />
            설정
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="text-neutral-600 hover:text-neutral-900"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden relative">
              <Menu className="h-5 w-5" />
              {activeJobsCount > 0 && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{activeJobsCount}</span>
                </div>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white/95 backdrop-blur-md border-neutral-200">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="space-y-4 py-4">
                <div className="px-3">
                  <h2 className="text-lg font-semibold text-neutral-900">메뉴</h2>
                  {activeJobsCount > 0 && (
                    <div className="mt-2 glass-subtle p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-accent-500 animate-pulse" />
                        <span className="text-sm font-medium text-neutral-700">
                          {activeJobsCount}개 제작 중
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Navigation Items */}
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = isActivePath(item.href);
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start h-12 px-3 transition-all duration-default",
                            isActive
                              ? "bg-primary-50 text-primary-700 border-r-2 border-primary-500"
                              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                          )}
                        >
                          <item.icon className="h-5 w-5 mr-3" />
                          {item.name}
                          {item.badge !== undefined && item.badge > 0 && (
                            <Badge 
                              variant="secondary" 
                              className="ml-auto h-5 px-2 text-xs bg-neutral-200 text-neutral-700"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Footer */}
              <div className="mt-auto border-t border-neutral-200 pt-4">
                <div className="px-3 space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-neutral-500">AI 기반 자동 영상 제작</p>
                    <p className="text-xs text-neutral-400">Version 1.0.0</p>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Settings Dialog */}
        <SettingsDialog 
          open={isSettingsOpen} 
          onOpenChange={setIsSettingsOpen} 
        />
      </div>
    </header>
  );
} 