import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  /** コンテナの最大幅 (Tailwindクラス: md, lg, xl, 2xl) */
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * 共通ページレイアウトラッパー
 * 全ページで使用される背景グラデーションとコンテナスタイルを提供
 */
export function PageLayout({ children, maxWidth = 'md' }: PageLayoutProps) {
  const maxWidthClass = {
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className={`container mx-auto px-4 py-8 ${maxWidthClass}`}>
        {children}
      </div>
    </main>
  );
}
