'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { getRatingTier } from '@/lib/egg/egg';
import { formatTimeUntilHatch, getEggTypeName } from '@/lib/egg/egg';

const RANK_LABELS: Record<string, { name: string; color: string }> = {
  beginner: { name: 'ブロンズ', color: 'text-amber-600' },
  intermediate: { name: 'シルバー', color: 'text-gray-300' },
  advanced: { name: 'ゴールド', color: 'text-yellow-400' },
};

/**
 * トップページ
 * - 未ログイン: 自動ログイン
 * - 御三家未選択: /starter へ自動リダイレクト
 * - ログイン済み: レート・卵状態のダッシュボード表示
 */
export default function HomePage() {
  const router = useRouter();
  const {
    isLoading,
    isLoggedIn,
    userData,
    needsStarterSelection,
    login,
    canHatchEgg,
  } = useUser();

  // 自動ログイン
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      login();
    }
  }, [isLoading, isLoggedIn, login]);

  // 御三家未選択→リダイレクト
  useEffect(() => {
    if (!isLoading && isLoggedIn && needsStarterSelection) {
      router.push('/starter');
    }
  }, [isLoading, isLoggedIn, needsStarterSelection, router]);

  // ローディング中
  if (isLoading || (!isLoggedIn && !isLoading)) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🎮</div>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </main>
    );
  }

  // 御三家選択待ち（リダイレクト中）
  if (needsStarterSelection) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🥚</div>
          <p className="text-gray-400">御三家選択へ移動中...</p>
        </div>
      </main>
    );
  }

  const rating = userData?.rating ?? 1000;
  const tier = getRatingTier(rating);
  const rankInfo = RANK_LABELS[tier] ?? RANK_LABELS.beginner;
  const monsterCount = userData?.monsters?.length ?? 0;
  const wins = userData?.record?.wins ?? 0;
  const losses = userData?.record?.losses ?? 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-lg mx-auto pt-8">
        <h1 className="text-3xl font-bold mb-2">育成モンスターバトル</h1>

        {/* ダッシュボード */}
        <div className="bg-gray-800/60 rounded-xl p-4 mb-5 grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <p className="text-gray-400">レート</p>
            <p className={`text-xl font-bold ${rankInfo.color}`}>{rating}</p>
            <p className={`text-xs ${rankInfo.color}`}>{rankInfo.name}</p>
          </div>
          <div>
            <p className="text-gray-400">戦績</p>
            <p className="text-xl font-bold">{wins}<span className="text-gray-500 text-sm">勝</span> {losses}<span className="text-gray-500 text-sm">敗</span></p>
          </div>
          <div>
            <p className="text-gray-400">モンスター</p>
            <p className="text-xl font-bold">{monsterCount}<span className="text-gray-500 text-sm">体</span></p>
          </div>
        </div>

        {/* 卵通知 */}
        {canHatchEgg && (
          <Link
            href="/profile"
            className="block bg-yellow-600/20 border border-yellow-600/40 rounded-xl p-3 mb-4 text-center animate-pulse"
          >
            🥚 卵が孵化できます！タップして孵化しよう
          </Link>
        )}
        {userData?.egg && !canHatchEgg && (
          <div className="bg-gray-800/40 rounded-xl p-3 mb-4 text-center text-sm text-gray-400">
            🥚 {getEggTypeName(userData.egg.type)}を温め中...
          </div>
        )}

        {/* メニュー */}
        <div className="grid gap-3">
          <Link
            href="/ranked"
            className="block w-full rounded-xl bg-red-600 hover:bg-red-500 transition-colors px-5 py-4 text-lg font-bold text-center"
          >
            ⚔️ ランクマッチ
          </Link>

          <Link
            href="/battle"
            className="block w-full rounded-xl bg-green-600 hover:bg-green-500 transition-colors px-5 py-4 text-lg font-bold text-center"
          >
            🎮 テストバトル（CPU対戦）
          </Link>

          <Link
            href="/online"
            className="block w-full rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors px-5 py-4 text-lg font-bold text-center"
          >
            🤝 フレンド対戦
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/profile"
              className="block rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-3 text-center font-bold"
            >
              👤 プロフィール
            </Link>
            <Link
              href="/monsters"
              className="block rounded-xl bg-emerald-700 hover:bg-emerald-600 transition-colors px-4 py-3 text-center font-bold"
            >
              📖 図鑑
            </Link>
            <Link
              href="/settings"
              className="block rounded-xl bg-gray-600 hover:bg-gray-500 transition-colors px-4 py-3 text-center font-bold"
            >
              ⚙️ 設定
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6 text-center">
          バトルに勝って卵ゲット → 孵化して新モンスター → パーティ強化！
        </p>
      </div>
    </main>
  );
}
