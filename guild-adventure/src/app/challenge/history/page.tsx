'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { useChallengeStore } from '@/store/challengeStore';
import { formatDate } from '@/lib/utils/format';

export default function ChallengeHistoryPage() {
  const { username, autoLogin } = useGameStore();
  const { history, loadData } = useChallengeStore();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!username) {
      autoLogin();
    }
  }, [username, autoLogin]);
  
  useEffect(() => {
    if (username) {
      loadData(username).then(() => setIsLoading(false));
    }
  }, [username, loadData]);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex items-center mb-6">
          <Link href="/challenge" className="text-slate-400 hover:text-white mr-4">← 戻る</Link>
          <h1 className="text-2xl font-bold">📜 挑戦履歴</h1>
        </div>
        
        {isLoading ? (
          <p className="text-center text-slate-400">読み込み中...</p>
        ) : history.length === 0 ? (
          <p className="text-center text-slate-400">まだ挑戦履歴がありません</p>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
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
                <div className="flex gap-4 text-sm text-slate-300">
                  <span>💰 {entry.earnedCoins}</span>
                  <span>📜 {entry.earnedBooks}冊</span>
                  <span>🎒 {entry.earnedEquipments}個</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
