'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { LoadingScreen } from '@/components/LoadingScreen';
import { DungeonDetailModal } from '@/components/DungeonDetailModal';
import { DifficultyStars } from '@/components/DifficultyStars';
import { DungeonType, DungeonData } from '@/lib/types';
import { dungeons, dungeonList } from '@/lib/data/dungeons';
import { getDropRate } from '@/lib/data/items';
import { getEquipmentDropRate } from '@/lib/data/equipments';
import { formatDuration } from '@/lib/utils';

export default function DungeonPage() {
  const router = useRouter();
  const { party, currentAdventure, startAdventure, lastSoloDungeonId, isLoggedIn, isLoading } = useGameStore();
  
  // ローディング中またはログイン前
  if (!isLoggedIn || isLoading) {
    return <LoadingScreen />;
  }
  
  const partyCount = [...(party.front || []), ...(party.back || [])].filter(Boolean).length;
  const canStart = partyCount > 0 && partyCount <= 6 && !currentAdventure;
  
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailDungeon, setDetailDungeon] = useState<DungeonData | null>(null);
  
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
    <PageLayout>
      <PageHeader title="🗺️ ダンジョン選択" />
        
        {/* パーティ状態 */}
        {!canStart && (
          <div className="mb-6 p-4 bg-red-900/50 rounded-lg border border-red-700">
            {partyCount === 0 ? (
              <p>パーティを編成してください</p>
            ) : partyCount > 6 ? (
              <p>ソロは6人まで！（現在{partyCount}人）</p>
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
        
        {/* 前回挑戦したダンジョン */}
        {lastSoloDungeonId && dungeons[lastSoloDungeonId] && (
          <div className="mb-6">
            <h2 className="text-sm text-slate-400 mb-2">🔄 前回挑戦したダンジョン</h2>
            {(() => {
              const dungeon = dungeons[lastSoloDungeonId];
              return (
                <div className="rounded-lg border-2 bg-slate-700 border-amber-500/50 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold">{dungeon.name}</h2>
                    <DifficultyStars level={dungeon.difficulty} />
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-3">
                    <span className="text-slate-400">
                      ⏱️ {formatDuration(dungeon.durationSeconds)}
                    </span>
                    <span className="text-slate-400">
                      👥 {dungeon.recommendedPlayers}人推奨
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setDetailDungeon(dungeon)}
                      className="flex-1 bg-slate-600 hover:bg-slate-500 transition-colors rounded py-2 font-semibold"
                    >
                      📋 詳細
                    </button>
                    {canStart && (
                      <button 
                        onClick={() => handleStart(dungeon.id)}
                        disabled={isStarting}
                        className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-colors rounded py-2 font-semibold"
                      >
                        ⚔️ 出発
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        
        {/* ダンジョンリスト */}
        <div className="space-y-4">
          {dungeonList.map((dungeon) => (
            <div
              key={dungeon.id}
              className="rounded-lg border bg-slate-700 border-slate-600 p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold">{dungeon.name}</h2>
                <DifficultyStars level={dungeon.difficulty} />
              </div>
              
              <p className="text-sm text-slate-400 mb-3">
                {dungeon.description}
              </p>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-3">
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
                  📜 書: {getDropRate(dungeon.id)}% ×4
                </span>
                <span className="text-green-400">
                  🎒 装備: {getEquipmentDropRate(dungeon.durationSeconds, dungeon.id).toFixed(1)}% ×4
                </span>
                <span className="text-amber-300">
                  🪙 {dungeon.coinReward}コイン
                </span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setDetailDungeon(dungeon)}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 transition-colors rounded py-2 font-semibold"
                >
                  📋 詳細
                </button>
                {canStart && (
                  <button 
                    onClick={() => handleStart(dungeon.id)}
                    disabled={isStarting}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-colors rounded py-2 font-semibold"
                  >
                    ⚔️ 出発
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      
      {/* 詳細モーダル */}
      {detailDungeon && (
        <DungeonDetailModal 
          dungeon={detailDungeon} 
          onClose={() => setDetailDungeon(null)} 
        />
      )}
    </PageLayout>
  );
}
