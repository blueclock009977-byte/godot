'use client';

import { useState } from 'react';
import { DungeonData } from '@/lib/types';
import { dungeonList } from '@/lib/data/dungeons';
import { getDropRate } from '@/lib/data/items';
import { getEquipmentDropRate } from '@/lib/data/equipments';
import { formatDuration } from '@/lib/utils';
import { DifficultyStars } from './DifficultyStars';
import { DungeonDetailModal } from './DungeonDetailModal';

interface DungeonListProps {
  onSelect?: (dungeon: DungeonData) => void;
  showStartButton?: boolean;
  canStart?: boolean;
  isStarting?: boolean;
}

export function DungeonList({ 
  onSelect, 
  showStartButton = false, 
  canStart = false,
  isStarting = false,
}: DungeonListProps) {
  const [detailDungeon, setDetailDungeon] = useState<DungeonData | null>(null);
  
  return (
    <>
      <div className="space-y-3">
        {dungeonList.map((dungeon) => (
          <div
            key={dungeon.id}
            className="rounded-lg border bg-slate-700 border-slate-600 p-3"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold">{dungeon.name}</h3>
              <DifficultyStars level={dungeon.difficulty} />
            </div>
            
            <p className="text-sm text-slate-400 mb-2">
              {dungeon.description}
            </p>
            
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-3">
              <span className="text-slate-400">
                ⏱️ {formatDuration(dungeon.durationSeconds)}
              </span>
              <span className="text-slate-400">
                👥 {dungeon.recommendedPlayers}人推奨
              </span>
              <span className="text-amber-400">
                📜 {getDropRate(dungeon.id)}%
              </span>
              <span className="text-green-400">
                🎒 {getEquipmentDropRate(dungeon.durationSeconds, dungeon.id).toFixed(1)}%
              </span>
              <span className="text-amber-300">
                🪙 {dungeon.coinReward}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setDetailDungeon(dungeon)}
                className="flex-1 bg-slate-600 hover:bg-slate-500 transition-colors rounded py-2 text-sm font-semibold"
              >
                📋 詳細
              </button>
              {showStartButton && canStart && (
                <button 
                  onClick={() => onSelect?.(dungeon)}
                  disabled={isStarting}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-colors rounded py-2 text-sm font-semibold"
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
    </>
  );
}
