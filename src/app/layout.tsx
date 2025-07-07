import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import { MainLayout } from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: '자동 동영상 제작 공장',
  description: '업로드된 텍스트를 요약하여 교육용 동영상을 자동 생성하는 플랫폼',
  keywords: ['동영상 제작', '자동화', '교육', 'AI', '요약', 'TTS'],
  authors: [{ name: 'Auto Video Maker Team' }],
  openGraph: {
    title: '자동 동영상 제작 공장',
    description: '업로드된 텍스트를 요약하여 교육용 동영상을 자동 생성하는 플랫폼',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="ko">
      <body className="antialiased">
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  );
}
