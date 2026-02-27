'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { dungeons } from '@/lib/data/dungeons';
import { getItemById } from '@/lib/data/items';
import { claimAdventureDrop, updateUserStatus } from '@/lib/firebase';
import { BattleResult } from '@/lib/types';

export default function AdventurePage() {
  const router = useRouter();
  const { currentAdventure, username, completeAdventure, cancelAdventure, addItem, syncToServer, addHistory } = useGameStore();
  const [progress, setProgress] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [currentEncounter, setCurrentEncounter] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const isCompleteRef = useRef(false); // 二重実行防止用
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // バトル結果はサーバーから取得済み（currentAdventure.result）
  const battleResult = currentAdventure?.result || null;
  
  // ステータス更新（ソロ冒険中）
  useEffect(() => {
    if (!username || !currentAdventure) return;
    updateUserStatus(username, 'solo', { dungeonId: currentAdventure.dungeon });
    const interval = setInterval(() => {
      updateUserStatus(username, 'solo', { dungeonId: currentAdventure.dungeon });
    }, 30000); // 30秒ごと
    return () => clearInterval(interval);
  }, [username, currentAdventure]);
  
  // 時間経過に応じてログを表示
  useEffect(() => {
    if (!currentAdventure) return;
    
    // battleResultがない場合は完了処理だけ行う
    if (!battleResult) {
      const dungeon = dungeons[currentAdventure.dungeon];
      const totalTime = dungeon.durationSeconds * 1000;
      const elapsed = Date.now() - currentAdventure.startTime;
      
      if (elapsed >= totalTime && !isCompleteRef.current) {
        isCompleteRef.current = true;
        setIsComplete(true);
        setProgress(100);
        // battleResultなしでも履歴と完了処理
        addHistory({
          type: 'solo',
          dungeonId: currentAdventure.dungeon,
          victory: false,
          logs: [],
        });
        completeAdventure({ victory: false, logs: [], encountersCleared: 0, totalEncounters: 0 });
      }
      return;
    }
    
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
      const shouldShowEncounter = Math.min(
        encounterCount,
        Math.floor(elapsed / timePerEncounter)
      );
      
      // 新しいエンカウントがあれば表示
      if (shouldShowEncounter > currentEncounter && battleResult) {
        // 新しいエンカウントのログを追加
        for (let i = currentEncounter; i < shouldShowEncounter; i++) {
          if (battleResult.logs[i]) {
            const newLogs = battleResult.logs[i].message.split('\n').filter(l => l.trim());
            setDisplayedLogs(prev => [...prev, ...newLogs]);
          }
        }
        setCurrentEncounter(shouldShowEncounter);
      }
      
      // 完了判定
      if (newProgress >= 100 && !isCompleteRef.current) {
        isCompleteRef.current = true;
        setIsComplete(true);
        clearInterval(interval);
        
        // 最終結果のログを追加
        if (battleResult) {
          // 残りのログを全部表示
          for (let i = currentEncounter; i < battleResult.logs.length; i++) {
            const newLogs = battleResult.logs[i].message.split('\n').filter(l => l.trim());
            setDisplayedLogs(prev => [...prev, ...newLogs]);
          }
          
          // ドロップ受け取り（サーバーでclaimed=falseの場合のみ）
          const handleDrop = async () => {
            let droppedItemId: string | undefined;
            let alreadyProcessed = false;
            
            try {
              if (username) {
                const claimResult = await claimAdventureDrop(username);
                if (!claimResult.success) {
                  // 既に処理済み（リロードや別端末）
                  alreadyProcessed = true;
                } else if (claimResult.itemId) {
                  droppedItemId = claimResult.itemId;
                  const itemData = getItemById(claimResult.itemId);
                  setDisplayedLogs(prev => [...prev, `💎 【ドロップ】${itemData?.name || claimResult.itemId} を入手！`]);
                  addItem(claimResult.itemId);
                  syncToServer();
                }
              }
            } catch (e) {
              console.error('Failed to claim drop:', e);
            }
            
            // 既に処理済みならスキップ
            if (alreadyProcessed) {
              completeAdventure({ ...battleResult });
              return;
            }
            
            // 履歴を追加（初回のみ）
            addHistory({
              type: 'solo',
              dungeonId: currentAdventure.dungeon,
              victory: battleResult.victory,
              droppedItemId,
              logs: battleResult.logs,
            });
            
            // 完了処理
            completeAdventure({ ...battleResult, droppedItemId });
          };
          
          handleDrop();
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [currentAdventure, battleResult, currentEncounter, completeAdventure, isComplete, username, addItem, syncToServer, addHistory]);
  
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
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">
              {isComplete ? '🎉 探索完了！' : `🔥 ${dungeon.name}を探索中...`}
            </h1>
            <div className="text-sm text-slate-400 mt-1">
              遭遇: {currentEncounter}/{dungeon.encounterCount}
            </div>
          </div>
          <Link 
            href="/friends" 
            className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg text-sm font-semibold"
          >
            👥 フレンド
          </Link>
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
        
        {/* 完了時の結果画面（マルチ風） */}
        {isComplete && currentAdventure.result ? (
          <div className="p-6 rounded-lg bg-slate-800 border border-slate-700 text-center mb-6">
            <h2 className="text-3xl font-bold mb-4">
              {currentAdventure.result.victory ? '🎉 勝利！' : '💀 敗北...'}
            </h2>
            <div className="text-slate-300 mb-4">
              {currentAdventure.result.victory 
                ? `${dungeon.name}を踏破！` 
                : `${dungeon.name}で全滅...`}
            </div>
            {currentAdventure.result.droppedItemId && (
              <div className="text-amber-400 text-lg mb-4">
                💎 【ドロップ】{getItemById(currentAdventure.result.droppedItemId)?.name || currentAdventure.result.droppedItemId}
              </div>
            )}
            {currentAdventure.result.victory && !currentAdventure.result.droppedItemId && (
              <div className="text-slate-400 mb-4">ドロップなし...</div>
            )}
            <button
              onClick={handleReturn}
              className="bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-lg font-semibold"
            >
              ホームに戻る
            </button>
            
            {/* 戦闘ログ（折りたたみ） */}
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
                📜 戦闘ログを表示
              </summary>
              <div className="mt-2 bg-slate-700 rounded-lg p-3 max-h-64 overflow-y-auto text-sm font-mono">
                {displayedLogs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`${
                      log.includes('🔴BOSS:') ? 'text-red-500 font-bold mt-2' :
                      log.includes('【遭遇') ? 'text-yellow-400 font-bold mt-2' :
                      log.includes('勝利') ? 'text-green-400 font-bold' :
                      log.includes('全滅') ? 'text-red-400 font-bold' :
                      log.includes('倒した') ? 'text-green-300' :
                      log.includes('ダメージ') ? 'text-orange-300' :
                      log.includes('回復') ? 'text-blue-300' :
                      'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </details>
          </div>
        ) : (
          <>
            {/* 探索中の戦闘ログ */}
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
            
            {/* 中断ボタン */}
            <button
              onClick={handleCancel}
              className="w-full bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg py-3 font-semibold"
            >
              中断する
            </button>
          </>
        )}
      </div>
    </main>
  );
}
