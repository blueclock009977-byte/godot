'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { useChallengeStore } from '@/store/challengeStore';

export default function ChallengeRankingPage() {
  const { username, autoLogin } = useGameStore();
  const { ranking, loadRanking, progress } = useChallengeStore();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!username) {
      autoLogin();
    }
  }, [username, autoLogin]);
  
  useEffect(() => {
    loadRanking().then(() => setIsLoading(false));
  }, [loadRanking]);
  
  // 自分の順位を計算
  const myRank = ranking.findIndex(r => r.username === username) + 1;
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex items-center mb-6">
          <Link href="/challenge" className="text-slate-400 hover:text-white mr-4">← 戻る</Link>
          <h1 className="text-2xl font-bold">🏆 ランキング</h1>
        </div>
        
        {/* 自分の記録 */}
        {progress && (
          <div className="bg-amber-900/50 rounded-lg p-4 border border-amber-600 mb-4">
            <p className="text-sm text-amber-300">あなたの記録</p>
            <div className="flex justify-between items-center">
              <p className="text-xl font-bold">{progress.highestFloor}F</p>
              {myRank > 0 && (
                <p className="text-amber-400">#{myRank}</p>
              )}
            </div>
          </div>
        )}
        
        {/* ランキング一覧 */}
        {isLoading ? (
          <p className="text-center text-slate-400">読み込み中...</p>
        ) : ranking.length === 0 ? (
          <p className="text-center text-slate-400">まだ記録がありません</p>
        ) : (
          <div className="space-y-2">
            {ranking.map((entry, index) => {
              const rank = index + 1;
              const isMe = entry.username === username;
              
              return (
                <div
                  key={entry.username}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isMe 
                      ? 'bg-amber-900/50 border border-amber-600' 
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold w-8 ${
                      rank === 1 ? 'text-yellow-400' :
                      rank === 2 ? 'text-slate-300' :
                      rank === 3 ? 'text-amber-600' :
                      'text-slate-500'
                    }`}>
                      {rank === 1 ? '👑' : `#${rank}`}
                    </span>
                    <span className={isMe ? 'font-bold' : ''}>
                      {entry.username}
                      {isMe && <span className="text-amber-400 ml-1">←</span>}
                    </span>
                  </div>
                  <span className="font-semibold">{entry.highestFloor}F</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
