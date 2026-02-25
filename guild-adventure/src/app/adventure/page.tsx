'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { dungeons } from '@/lib/data/dungeons';
import { runBattle } from '@/lib/battle/engine';

export default function AdventurePage() {
  const router = useRouter();
  const { currentAdventure, party, completeAdventure, cancelAdventure } = useGameStore();
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (!currentAdventure) {
      router.push('/');
      return;
    }
    
    const dungeon = dungeons[currentAdventure.dungeon];
    const totalTime = dungeon.durationSeconds * 1000;
    const startTime = currentAdventure.startTime;
    
    // 進捗更新
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / totalTime) * 100);
      setProgress(newProgress);
      
      if (newProgress >= 100 && !isComplete) {
        setIsComplete(true);
        clearInterval(interval);
        
        // バトル実行
        const result = runBattle(party, currentAdventure.dungeon);
        setLogs(result.logs.flatMap(l => l.message.split('\n')));
        completeAdventure(result);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [currentAdventure, party, completeAdventure, isComplete, router]);
  
  if (!currentAdventure) {
    return null;
  }
  
  const dungeon = dungeons[currentAdventure.dungeon];
  const remainingMs = Math.max(0, 
    currentAdventure.startTime + (dungeon.durationSeconds * 1000) - Date.now()
  );
  const remainingSec = Math.ceil(remainingMs / 1000);
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}分${sec}秒`;
  };
  
  const handleCancel = () => {
    if (confirm('冒険を中断しますか？')) {
      cancelAdventure();
      router.push('/');
    }
  };
  
  const handleReturn = () => {
    cancelAdventure();
    router.push('/');
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {isComplete ? '🎉 探索完了！' : `🔥 ${dungeon.name}を探索中...`}
          </h1>
        </div>
        
        {/* プログレスバー */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>進行度</span>
            <span>{Math.floor(progress)}%</span>
          </div>
          <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          {!isComplete && (
            <div className="text-center text-sm text-slate-400 mt-2">
              残り時間: {formatTime(remainingSec)}
            </div>
          )}
        </div>
        
        {/* 結果表示 */}
        {isComplete && currentAdventure.result && (
          <div className={`mb-6 p-4 rounded-lg border ${
            currentAdventure.result.victory 
              ? 'bg-green-900/50 border-green-700'
              : 'bg-red-900/50 border-red-700'
          }`}>
            <div className="text-xl font-bold mb-2">
              {currentAdventure.result.victory ? '勝利！' : '敗北...'}
            </div>
            <div className="text-sm text-slate-300">
              クリア: {currentAdventure.result.encountersCleared}/{currentAdventure.result.totalEncounters} 遭遇
            </div>
          </div>
        )}
        
        {/* 戦闘ログ */}
        <div className="mb-6 bg-slate-800 rounded-lg border border-slate-700 p-4 h-64 overflow-y-auto">
          <h2 className="text-sm text-slate-400 mb-2">戦闘ログ</h2>
          {logs.length === 0 ? (
            <div className="text-slate-500 text-sm animate-pulse">
              探索中...
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              {logs.map((log, i) => (
                <div key={i} className="text-slate-300">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* ボタン */}
        {isComplete ? (
          <button
            onClick={handleReturn}
            className="w-full bg-amber-600 hover:bg-amber-500 transition-colors rounded-lg py-3 font-semibold"
          >
            ホームに戻る
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="w-full bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg py-3 font-semibold"
          >
            中断する
          </button>
        )}
      </div>
    </main>
  );
}
