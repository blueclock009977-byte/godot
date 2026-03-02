'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { useChallengeStore } from '@/store/challengeStore';
import { LoadingScreen } from '@/components/LoadingScreen';
import { formatDate } from '@/lib/utils/format';
import BattleLogDisplay from '@/components/BattleLogDisplay';
import { getItemById } from '@/lib/data/items';
import { getEquipmentById } from '@/lib/data/equipments';

export default function ChallengeHistoryPage() {
  const { username, isLoggedIn, isLoading: storeLoading } = useGameStore();
  const { history, loadData } = useChallengeStore();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  useEffect(() => {
    if (username) {
      loadData(username).then(() => setIsDataLoaded(true));
    }
  }, [username, loadData]);
  
  // ローディング中またはログイン前またはデータ未ロード
  if (!isLoggedIn || storeLoading || !isDataLoaded) {
    return <LoadingScreen />;
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex items-center mb-6">
          <Link href="/challenge" className="text-slate-400 hover:text-white mr-4">← 戻る</Link>
          <h1 className="text-2xl font-bold">📜 挑戦履歴</h1>
        </div>
        
        {history.length === 0 ? (
          <p className="text-center text-slate-400">まだ挑戦履歴がありません</p>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => {
              const displayedLogs = entry.logs?.flatMap(log => 
                log.message.split('\n').filter(l => l.trim())
              ) || [];
              
              return (
                <div
                  key={entry.id}
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">
                        {entry.defeatedAtFloor === 0 
                          ? '🎉 完全制覇！' 
                          : `到達 ${entry.reachedFloor}F`}
                      </p>
                      {entry.defeatedAtFloor > 0 && (
                        <p className="text-sm text-slate-400">
                          {entry.defeatedAtFloor}Fで敗北
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-slate-500">
                      {formatDate(entry.attemptedAt)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 mb-2">
                    <div className="flex gap-4 mb-1">
                      <span>💰 {entry.earnedCoins}</span>
                    </div>
                    {/* 書の詳細 */}
                    {entry.earnedBookIds && entry.earnedBookIds.length > 0 ? (
                      <div className="text-amber-400 text-xs">
                        📜 {entry.earnedBookIds.map(id => getItemById(id)?.name || id).join(', ')}
                      </div>
                    ) : entry.earnedBooks > 0 && (
                      <div className="text-slate-400 text-xs">📜 {entry.earnedBooks}冊</div>
                    )}
                    {/* 装備の詳細 */}
                    {entry.earnedEquipmentIds && entry.earnedEquipmentIds.length > 0 ? (
                      <div className="text-green-400 text-xs">
                        🎒 {entry.earnedEquipmentIds.map(id => {
                          const eq = getEquipmentById(id);
                          return eq?.rarity === 'rare' ? `🌟${eq.name}` : eq?.name || id;
                        }).join(', ')}
                      </div>
                    ) : entry.earnedEquipments > 0 && (
                      <div className="text-slate-400 text-xs">🎒 {entry.earnedEquipments}個</div>
                    )}
                  </div>
                  
                  {/* バトルログ */}
                  {displayedLogs.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
                        📜 バトルログを表示
                      </summary>
                      <div className="mt-2 bg-slate-700 rounded-lg p-3 max-h-64 overflow-y-auto">
                        <BattleLogDisplay logs={displayedLogs} />
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
