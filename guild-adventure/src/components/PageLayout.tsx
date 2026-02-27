import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
}

/**
 * 共通ページレイアウトラッパー
 * 全ページで使用される背景グラデーションとコンテナスタイルを提供
 */
export function PageLayout({ children }: PageLayoutProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {children}
      </div>
    </main>
  );
}
