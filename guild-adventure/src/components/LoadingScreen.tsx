'use client';

interface LoadingScreenProps {
  text?: string;
}

/**
 * フルスクリーンのローディング表示
 * @param text - ローディングメッセージ（デフォルト: "読み込み中..."）
 */
export function LoadingScreen({ text = '読み込み中...' }: LoadingScreenProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⚔️</div>
        <p className="text-slate-400">{text}</p>
      </div>
    </main>
  );
}
