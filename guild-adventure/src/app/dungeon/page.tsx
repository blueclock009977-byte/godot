'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { DungeonType } from '@/lib/types';
import { dungeonList } from '@/lib/data/dungeons';
import { getDropRate } from '@/lib/data/items';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分`;
  return `${Math.floor(seconds / 3600)}時間`;
}

function DifficultyStars({ level }: { level: number }) {
  const maxStars = 8;
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(level)}{'☆'.repeat(maxStars - level)}
    </span>
  );
}

export default function DungeonPage() {
  const router = useRouter();
  const { party, currentAdventure, startAdventure } = useGameStore();
  
  const partyCount = [...party.front, ...party.back].filter(Boolean).length;
  const canStart = partyCount > 0 && partyCount <= 4 && !currentAdventure;
  
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleStart = async (dungeonId: DungeonType) => {
    if (!canStart || isStarting) return;
    setIsStarting(true);
    setError(null);
    
    const result = await startAdventure(dungeonId);
    if (result.success) {
      router.push('/adventure');
    } else {
      setError(result.error || '探索を開始できませんでした');
      setIsStarting(false);
    }
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-slate-400 hover:text-white">
            ← 戻る
          </Link>
          <h1 className="text-2xl font-bold">🗺️ ダンジョン選択</h1>
        </div>
        
        {/* パーティ状態 */}
        {!canStart && (
          <div className="mb-6 p-4 bg-red-900/50 rounded-lg border border-red-700">
            {partyCount === 0 ? (
              <p>パーティを編成してください</p>
            ) : partyCount > 4 ? (
              <p>ソロは4人まで！（現在{partyCount}人）</p>
            ) : (
              <p>現在冒険中です</p>
            )}
          </div>
        )}
        
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 rounded-lg border border-red-700">
            <p>⚠️ {error}</p>
          </div>
        )}
        
        {/* ダンジョンリスト */}
        <div className="space-y-4">
          {dungeonList.map((dungeon) => (
            <div
              key={dungeon.id}
              className={`rounded-lg border p-4 transition-colors ${
                canStart && !isStarting
                  ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 cursor-pointer'
                  : 'bg-slate-800 border-slate-700 opacity-50'
              }`}
              onClick={() => canStart && !isStarting && handleStart(dungeon.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold">{dungeon.name}</h2>
                <DifficultyStars level={dungeon.difficulty} />
              </div>
              
              <p className="text-sm text-slate-400 mb-3">
                {dungeon.description}
              </p>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="text-slate-400">
                  ⏱️ {formatDuration(dungeon.durationSeconds)}
                </span>
                <span className="text-slate-400">
                  👥 {dungeon.recommendedPlayers}人推奨
                </span>
                <span className="text-slate-400">
                  👹 {dungeon.encounterCount}回遭遇
                </span>
                <span className="text-amber-400">
                  📦 ドロップ: {getDropRate(dungeon.id)}%
                </span>
              </div>
              
              {canStart && (
                <button className="mt-3 w-full bg-amber-600 hover:bg-amber-500 transition-colors rounded py-2 font-semibold">
                  出発する
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
