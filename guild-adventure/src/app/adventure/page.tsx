'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { dungeons } from '@/lib/data/dungeons';
import { getItemById } from '@/lib/data/items';
import { claimAdventureDrop, updateUserStatus } from '@/lib/firebase';
import { formatDuration } from '@/lib/utils';
import { BattleResult } from '@/lib/types';
import { PageLayout } from '@/components/PageLayout';
import BattleLogDisplay from '@/components/BattleLogDisplay';

export default function AdventurePage() {
  const router = useRouter();
  const { currentAdventure, username, completeAdventure, cancelAdventure, addItem, addEquipment, addCoins, syncToServer, addHistory } = useGameStore();
  const [progress, setProgress] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [currentEncounter, setCurrentEncounter] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const isCompleteRef = useRef(false); // 二重実行防止用
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // バトル結果はサーバーから取得済み（currentAdventure.result）
  const battleResult = currentAdventure?.result || null;
  const startLogShownRef = useRef(false);
  
  // 冒険開始ログを表示
  useEffect(() => {
    if (!currentAdventure || startLogShownRef.current) return;
    startLogShownRef.current = true;
    
    const dungeon = dungeons[currentAdventure.dungeon];
    const party = currentAdventure.party;
    const frontNames = (party.front || []).filter(c => c).map(c => `${c!.name}(前)`).join(', ');
    const backNames = (party.back || []).filter(c => c).map(c => `${c!.name}(後)`).join(', ');
    const partyList = [frontNames, backNames].filter(s => s).join(', ');
    
    const startLog = [
      `【冒険開始】${dungeon.name}`,
      `⚔️ パーティ: ${partyList}`,
    ];
    setDisplayedLogs(startLog);
  }, [currentAdventure]);
  
  // ステータス更新（ソロ冒険中）
  useEffect(() => {
    if (!username || !currentAdventure) return;
    updateUserStatus(username, 'solo', { dungeonId: currentAdventure.dungeon, startTime: currentAdventure.startTime });
    const interval = setInterval(() => {
      updateUserStatus(username, 'solo', { dungeonId: currentAdventure.dungeon, startTime: currentAdventure.startTime });
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
          
          // ドロップ受け取り（サーバーでclaimed=falseの場合のみ、複数対応）
          const handleDrop = async () => {
            let droppedItemIds: string[] = [];
            let droppedEquipmentIds: string[] = [];
            let alreadyProcessed = false;
            
            try {
              if (username) {
                const claimResult = await claimAdventureDrop(username);
                if (!claimResult.success) {
                  // 既に処理済み（リロードや別端末）
                  alreadyProcessed = true;
                } else {
                  // アイテムドロップ（複数対応）
                  const itemIds = claimResult.itemIds || (claimResult.itemId ? [claimResult.itemId] : []);
                  for (const itemId of itemIds) {
                    droppedItemIds.push(itemId);
                    const itemData = getItemById(itemId);
                    setDisplayedLogs(prev => [...prev, `💎 【ドロップ】${itemData?.name || itemId} を入手！`]);
                    addItem(itemId);
                  }
                  // 装備ドロップ（複数対応）
                  const equipmentIds = claimResult.equipmentIds || (claimResult.equipmentId ? [claimResult.equipmentId] : []);
                  const { getEquipmentById } = require('@/lib/data/equipments');
                  for (const eqId of equipmentIds) {
                    droppedEquipmentIds.push(eqId);
                    const equipmentData = getEquipmentById(eqId);
                    const rarityText = equipmentData?.rarity === 'rare' ? '🌟【レア装備】' : '📦【装備】';
                    setDisplayedLogs(prev => [...prev, `${rarityText}${equipmentData?.name || eqId} を入手！`]);
                    addEquipment(eqId);
                  }
                  if (itemIds.length > 0 || equipmentIds.length > 0) {
                    syncToServer();
                  }
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
            
            // 勝利時はコインを付与
            let earnedCoinReward = 0;
            if (battleResult.victory) {
              const baseCoinReward = dungeons[currentAdventure.dungeon]?.coinReward || 0;
              if (baseCoinReward > 0) {
                const { applyCoinBonus } = require('@/lib/drop/dropBonus');
                const allChars = [...(currentAdventure.party.front || []), ...(currentAdventure.party.back || [])].filter(Boolean);
                earnedCoinReward = applyCoinBonus(baseCoinReward, allChars);
                addCoins(earnedCoinReward);
                if (earnedCoinReward > baseCoinReward) {
                  setDisplayedLogs(prev => [...prev, `🪙 【コイン】${earnedCoinReward}枚獲得！（ボーナス込み）`]);
                } else {
                  setDisplayedLogs(prev => [...prev, `🪙 【コイン】${earnedCoinReward}枚獲得！`]);
                }
                syncToServer();
              }
            }

            // 履歴を追加（初回のみ）
            addHistory({
              type: 'solo',
              dungeonId: currentAdventure.dungeon,
              victory: battleResult.victory,
              droppedItemId: droppedItemIds[0],
              droppedEquipmentId: droppedEquipmentIds[0],
              coinReward: earnedCoinReward,
              logs: battleResult.logs,
            });
            
            // 完了処理
            completeAdventure({ ...battleResult, droppedItemId: droppedItemIds[0], droppedItemIds });
          };
          
          handleDrop();
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [currentAdventure, battleResult, currentEncounter, completeAdventure, isComplete, username, addItem, addEquipment, syncToServer, addHistory]);
  
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
    <PageLayout>
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
              残り時間: {formatDuration(remainingSec, true)}
            </div>
          )}
        </div>
        
        {/* 完了時の結果画面（マルチ風） */}
        {isComplete && currentAdventure.result ? (
          <div className="p-6 rounded-lg bg-slate-800 border border-slate-700 text-center mb-6">
            <h2 className="text-3xl font-bold mb-4">
              {currentAdventure.result.victory ? '🎉 勝利！' : '💀 敗北...'}
            </h2>
            <div className="text-slate-300 mb-2">
              {currentAdventure.result.victory 
                ? `${dungeon.name}を踏破！` 
                : `${dungeon.name}で全滅...`}
            </div>
            {currentAdventure.result.victory && (
              <div className="text-amber-400 text-lg mb-4">
                🪙 {dungeon.coinReward}コイン獲得！
              </div>
            )}
            {/* 複数アイテムドロップ表示 */}
            {(currentAdventure.result.droppedItemIds || (currentAdventure.result.droppedItemId ? [currentAdventure.result.droppedItemId] : [])).map((itemId, idx) => (
              <div key={`item-${idx}`} className="text-amber-400 text-lg mb-2">
                💎 【ドロップ】{getItemById(itemId)?.name || itemId}
              </div>
            ))}
            {/* 複数装備ドロップ表示 */}
            {(currentAdventure.result.droppedEquipmentIds || (currentAdventure.result.droppedEquipmentId ? [currentAdventure.result.droppedEquipmentId] : [])).map((eqId, idx) => {
              const { getEquipmentById } = require('@/lib/data/equipments');
              const eq = getEquipmentById(eqId);
              return (
                <div key={`eq-${idx}`} className={`text-lg mb-2 ${eq?.rarity === 'rare' ? 'text-yellow-300' : 'text-green-400'}`}>
                  {eq?.rarity === 'rare' ? '🌟【レア装備】' : '📦【装備】'}{eq?.name || eqId}
                </div>
              );
            })}
            {currentAdventure.result.victory && 
             !(currentAdventure.result.droppedItemIds?.length || currentAdventure.result.droppedItemId) && 
             !(currentAdventure.result.droppedEquipmentIds?.length || currentAdventure.result.droppedEquipmentId) && (
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
              <div className="mt-2 bg-slate-700 rounded-lg p-3 max-h-64 overflow-y-auto">
                <BattleLogDisplay logs={displayedLogs} />
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
              <BattleLogDisplay logs={displayedLogs} />
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
    </PageLayout>
  );
}
