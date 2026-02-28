'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { EmptyState } from '@/components/EmptyState';
import { dungeons } from '@/lib/data/dungeons';
import { getItemById } from '@/lib/data/items';
import { getEquipmentById } from '@/lib/data/equipments';
import { formatDateTime } from '@/lib/utils';
import { AdventureHistory } from '@/lib/firebase';

function HistoryCard({ 
  history, 
  onClick,
  isSelected,
}: { 
  history: AdventureHistory; 
  onClick: () => void;
  isSelected: boolean;
}) {
  const dungeon = dungeons[history.dungeonId as keyof typeof dungeons];
  const dateStr = formatDateTime(history.completedAt);
  
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-amber-600 border-amber-500' 
          : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className={`text-xs px-2 py-0.5 rounded ${history.type === 'solo' ? 'bg-blue-600' : 'bg-purple-600'}`}>
            {history.type === 'solo' ? 'ソロ' : 'マルチ'}
          </span>
          <span className={`ml-2 text-xs ${history.victory ? 'text-green-400' : 'text-red-400'}`}>
            {history.victory ? '勝利' : '敗北'}
          </span>
        </div>
        <span className="text-xs text-slate-400">{dateStr}</span>
      </div>
      <div className="font-semibold mt-1">{dungeon?.name || history.dungeonId}</div>
      {history.droppedItemId && (
        <div className="text-xs text-amber-400 mt-1">
          📜 {getItemById(history.droppedItemId)?.name}
        </div>
      )}
      {history.droppedEquipmentId && (
        <div className="text-xs text-yellow-300 mt-1">
          ⚔️ {getEquipmentById(history.droppedEquipmentId)?.name}
        </div>
      )}
      {history.type === 'multi' && history.players && (
        <div className="text-xs text-slate-400 mt-1">
          👥 {history.players.join(', ')}
        </div>
      )}
      {/* マルチの場合、各プレイヤーのドロップを表示 */}
      {history.type === 'multi' && (history.playerDrops || history.playerEquipmentDrops) && (
        <div className="text-xs mt-2 space-y-0.5">
          {history.players?.map(player => {
            const item = history.playerDrops?.[player];
            const equip = history.playerEquipmentDrops?.[player];
            if (!item && !equip) return null;
            return (
              <div key={player} className="text-slate-300">
                <span className="text-slate-500">{player}:</span>
                {item && <span className="text-amber-400 ml-1">📜{getItemById(item)?.name}</span>}
                {equip && <span className="text-yellow-300 ml-1">⚔️{getEquipmentById(equip)?.name}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { history } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const selectedHistory = history.find(h => h.id === selectedId);
  
  return (
    <PageLayout maxWidth="2xl">
      <PageHeader title="📜 過去の挑戦ログ" />
        
        {history.length === 0 ? (
          <EmptyState
            message="まだ挑戦履歴がありません"
            subMessage="ダンジョンに挑戦しよう！"
            className="py-12"
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {/* 履歴リスト */}
            <div className="space-y-2">
              <h2 className="text-sm text-slate-400 mb-2">履歴（{history.length}件）</h2>
              {history.map((h) => (
                <HistoryCard
                  key={h.id}
                  history={h}
                  onClick={() => setSelectedId(h.id === selectedId ? null : h.id)}
                  isSelected={h.id === selectedId}
                />
              ))}
            </div>
            
            {/* ログ詳細 */}
            <div className="md:sticky md:top-4 h-fit">
              <h2 className="text-sm text-slate-400 mb-2">バトルログ</h2>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 h-96 overflow-y-auto">
                {selectedHistory ? (
                  <div className="space-y-1 text-sm font-mono">
                    {selectedHistory.logs.map((log, i) => (
                      <div key={i}>
                        {log.message?.split('\n').filter((l: string) => l.trim()).map((line: string, j: number) => (
                          <div 
                            key={j} 
                            className={`${
                              line.includes('🔴BOSS:') ? 'text-red-500 font-bold mt-3' :
                              line.includes('【遭遇') ? 'text-yellow-400 font-bold mt-3' :
                              line.includes('勝利') ? 'text-green-400 font-bold' :
                              line.includes('全滅') ? 'text-red-400 font-bold' :
                              line.includes('倒した') ? 'text-green-300' :
                              line.includes('ダメージ') ? 'text-orange-300' :
                              line.includes('回復') ? 'text-blue-300' :
                              'text-slate-300'
                            }`}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-center py-8">
                    履歴を選択してログを表示
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </PageLayout>
  );
}
