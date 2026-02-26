'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { dungeons } from '@/lib/data/dungeons';
import { runBattle, rollDrop } from '@/lib/battle/engine';
import { getItemById } from '@/lib/data/items';
import { BattleResult } from '@/lib/types';

export default function AdventurePage() {
  const router = useRouter();
  const { currentAdventure, party, completeAdventure, cancelAdventure, addItem, syncToServer } = useGameStore();
  const [progress, setProgress] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [currentEncounter, setCurrentEncounter] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const battleResultRef = useRef<BattleResult | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // 開始時にバトルを事前計算
  useEffect(() => {
    if (!currentAdventure || battleResultRef.current) return;
    
    // バトルを先に計算しておく
    const result = runBattle(party, currentAdventure.dungeon);
    battleResultRef.current = result;
  }, [currentAdventure, party]);
  
  // 時間経過に応じてログを表示
  useEffect(() => {
    if (!currentAdventure || !battleResultRef.current) return;
    
    const dungeon = dungeons[currentAdventure.dungeon];
    const totalTime = dungeon.durationSeconds * 1000;
    const startTime = currentAdventure.startTime;
    const encounterCount = dungeon.encounterCount;
    const timePerEncounter = totalTime / encounterCount;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / totalTime) * 100);
      setProgress(newProgress);
      
      // 現在何番目のエンカウントまで表示すべきか
      // 10, 20, 30秒地点で1, 2, 3回目のログ（0秒では表示しない）
      const shouldShowEncounter = Math.min(
        encounterCount,
        Math.floor(elapsed / timePerEncounter)
      );
      
      // 新しいエンカウントがあれば表示
      if (shouldShowEncounter > currentEncounter && battleResultRef.current) {
        const result = battleResultRef.current;
        
        // 新しいエンカウントのログを追加
        for (let i = currentEncounter; i < shouldShowEncounter; i++) {
          if (result.logs[i]) {
            const newLogs = result.logs[i].message.split('\n').filter(l => l.trim());
            setDisplayedLogs(prev => [...prev, ...newLogs]);
          }
        }
        setCurrentEncounter(shouldShowEncounter);
      }
      
      // 完了判定
      if (newProgress >= 100 && !isComplete) {
        setIsComplete(true);
        clearInterval(interval);
        
        // 最終結果のログを追加（クリアメッセージなど）
        if (battleResultRef.current) {
          const result = battleResultRef.current;
          // 残りのログを全部表示
          for (let i = currentEncounter; i < result.logs.length; i++) {
            const newLogs = result.logs[i].message.split('\n').filter(l => l.trim());
            setDisplayedLogs(prev => [...prev, ...newLogs]);
          }
          
          // ドロップ抽選（ソロは1人なのでここで抽選）
          const droppedItemId = result.victory ? rollDrop(currentAdventure.dungeon) : undefined;
          if (droppedItemId) {
            const itemData = getItemById(droppedItemId);
            setDisplayedLogs(prev => [...prev, `💎 【ドロップ】${itemData?.name || droppedItemId} を入手！`]);
            addItem(droppedItemId);
            syncToServer();
          }
          
          completeAdventure({ ...result, droppedItemId });
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [currentAdventure, currentEncounter, completeAdventure, isComplete]);
  
  // ログが追加されたら自動スクロール
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [displayedLogs]);
  
  if (!currentAdventure) {
    router.push('/');
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
          <div className="text-sm text-slate-400 mt-1">
            遭遇: {currentEncounter}/{dungeon.encounterCount}
          </div>
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
              {currentAdventure.result.victory ? '🏆 勝利！' : '💀 敗北...'}
            </div>
            <div className="text-sm text-slate-300">
              クリア: {currentAdventure.result.encountersCleared}/{currentAdventure.result.totalEncounters} 遭遇
            </div>
          </div>
        )}
        
        {/* 戦闘ログ */}
        <div 
          ref={logContainerRef}
          className="mb-6 bg-slate-800 rounded-lg border border-slate-700 p-4 h-96 overflow-y-auto"
        >
          <h2 className="text-sm text-slate-400 mb-2 sticky top-0 bg-slate-800">戦闘ログ</h2>
          {displayedLogs.length === 0 ? (
            <div className="text-slate-500 text-sm animate-pulse">
              探索中...
            </div>
          ) : (
            <div className="space-y-1 text-sm font-mono">
              {displayedLogs.map((log, i) => (
                <div 
                  key={i} 
                  className={`${
                    log.includes('🔴BOSS:') ? 'text-red-500 font-bold mt-3' :
                    log.includes('【遭遇') ? 'text-yellow-400 font-bold mt-3' :
                    log.includes('【味方】') ? 'text-cyan-400 text-xs font-bold mt-1' :
                    log.includes('【敵】') ? 'text-rose-400 text-xs font-bold mt-1' :
                    log.startsWith('  ') && log.includes('HP') ? 'text-slate-300 text-xs ml-2 bg-slate-700/30 px-2 py-0.5 rounded' :
                    log.includes('勝利') ? 'text-green-400 font-bold' :
                    log.includes('全滅') ? 'text-red-400 font-bold' :
                    log.includes('倒した') ? 'text-green-300' :
                    log.includes('ダメージ') ? 'text-orange-300' :
                    log.includes('回復') ? 'text-blue-300' :
                    log.includes('会心') ? 'text-yellow-300' :
                    log.includes('--- ターン') ? 'text-slate-400 text-xs mt-3 border-t border-slate-600 pt-2' :
                    'text-slate-300'
                  }`}
                >
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
