'use client';

/**
 * バトルページ - AIとのテストバトル
 * 6体見せ合い → 3体選出 → バトル
 * 勝利時は卵獲得、レート変動
 */

import dynamic from 'next/dynamic';

// SSRを無効化してクライアント側のみでレンダリング
const BattleContent = dynamic(() => import('./BattleContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
      <div className="text-xl">読み込み中...</div>
    </div>
  ),
});

export default function BattlePage() {
  return <BattleContent />;
}
