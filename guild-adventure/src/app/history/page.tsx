'use client';

import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { dungeons } from '@/lib/data/dungeons';
import { getItemById } from '@/lib/data/items';
import { getEquipmentById } from '@/lib/data/equipments';
import { formatDateTime } from '@/lib/utils';
import { AdventureHistory } from '@/lib/firebase';
import BattleLogDisplay from '@/components/BattleLogDisplay';

function HistoryCard({ 
  history, 
  myUsername,
}: { 
  history: AdventureHistory; 
  myUsername?: string;
}) {
  const dungeon = dungeons[history.dungeonId as keyof typeof dungeons];
  const dateStr = formatDateTime(history.completedAt);
  const displayedLogs = history.logs?.flatMap(log => 
    log.message?.split('\n').filter((l: string) => l.trim()) || []
  ) || [];
  
  return (
    <div className="p-3 rounded-lg border bg-slate-700 border-slate-600">
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
      {/* アイテムドロップ（複数対応、秘宝は金色） */}
      {(history.droppedItemIds || (history.droppedItemId ? [history.droppedItemId] : [])).map((itemId: string, idx: number) => {
        const item = getItemById(itemId);
        const isTreasure = itemId.startsWith('treasure_');
        return (
          <div 
            key={`item-${idx}`} 
            className={`text-xs mt-1 ${isTreasure ? 'text-yellow-300 font-bold' : 'text-amber-400'}`}
          >
            {isTreasure ? '👑' : '📜'} {item?.name}
          </div>
        );
      })}
      {/* 装備ドロップ（複数対応、レアは紫） */}
      {(history.droppedEquipmentIds || (history.droppedEquipmentId ? [history.droppedEquipmentId] : [])).map((eqId: string, idx: number) => {
        const eq = getEquipmentById(eqId);
        const isRare = eq?.rarity === 'rare';
        return (
          <div 
            key={`eq-${idx}`} 
            className={`text-xs mt-1 ${isRare ? 'text-purple-300 font-bold' : 'text-yellow-300'}`}
          >
            {isRare ? '🌟' : '⚔️'} {eq?.name}
          </div>
        );
      })}
      {history.victory && history.coinReward && history.coinReward > 0 && (
        <div className="text-xs text-amber-400 mt-1">
          🪙 {history.coinReward}コイン
        </div>
      )}
      {history.type === 'multi' && history.players && (
        <div className="text-xs text-slate-400 mt-1">
          👥 {history.players.join(', ')}
        </div>
      )}
      {/* マルチの場合、他プレイヤーのドロップを表示（自分は除外） */}
      {history.type === 'multi' && (history.playerDrops || history.playerEquipmentDrops || history.playerDropsMulti || history.playerEquipmentDropsMulti) && (
        <div className="text-xs mt-2 space-y-0.5">
          {history.players?.filter(player => player !== myUsername).map(player => {
            // 複数対応優先、後方互換で単一も
            const items = history.playerDropsMulti?.[player] || (history.playerDrops?.[player] ? [history.playerDrops[player]] : undefined);
            const equips = history.playerEquipmentDropsMulti?.[player] || (history.playerEquipmentDrops?.[player] ? [history.playerEquipmentDrops[player]] : undefined);
            if ((!items || items.length === 0) && (!equips || equips.length === 0)) return null;
            return (
              <div key={player} className="text-slate-300">
                <span className="text-slate-500">{player}:</span>
                {items?.map((itemId, i) => {
                  const item = getItemById(itemId!);
                  const isTreasure = itemId?.startsWith('treasure_');
                  return (
                    <span key={i} className={`ml-1 ${isTreasure ? 'text-yellow-300 font-bold' : 'text-amber-400'}`}>
                      {isTreasure ? '👑' : '📜'}{item?.name}
                    </span>
                  );
                })}
                {equips?.map((eqId, i) => {
                  const eq = getEquipmentById(eqId!);
                  const isRare = eq?.rarity === 'rare';
                  return (
                    <span key={i} className={`ml-1 ${isRare ? 'text-purple-300 font-bold' : 'text-yellow-300'}`}>
                      {isRare ? '🌟' : '⚔️'}{eq?.name}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
      
      {/* バトルログ（折りたたみ） */}
      {displayedLogs.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
            📜 バトルログを表示
          </summary>
          <div className="mt-2 bg-slate-800 rounded-lg p-3 max-h-64 overflow-y-auto">
            <BattleLogDisplay logs={displayedLogs} />
          </div>
        </details>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { history, isLoggedIn, isLoading, username } = useGameStore();
  
  // ローディング中またはログイン前
  if (!isLoggedIn || isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <PageLayout maxWidth="md">
      <PageHeader title="📜 過去の挑戦ログ" />
        
        {history.length === 0 ? (
          <EmptyState
            message="まだ挑戦履歴がありません"
            subMessage="ダンジョンに挑戦しよう！"
            className="py-12"
          />
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm text-slate-400">履歴（{history.length}件）</h2>
            {history.map((h) => (
              <HistoryCard
                key={h.id}
                history={h}
                myUsername={username || undefined}
              />
            ))}
          </div>
        )}
    </PageLayout>
  );
}
