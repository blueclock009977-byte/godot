'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { dungeons } from '@/lib/data/dungeons';
import { getItemById } from '@/lib/data/items';
import { getEquipmentById } from '@/lib/data/equipments';
import { applyCoinBonus } from '@/lib/drop/dropBonus';
import { updateUserStatus, saveSoloAdventure } from '@/lib/firebase';
import { formatDuration } from '@/lib/utils';
import { PageLayout } from '@/components/PageLayout';
import { LoadingScreen } from '@/components/LoadingScreen';
import BattleLogDisplay from '@/components/BattleLogDisplay';

export default function AdventurePage() {
  const router = useRouter();
  const { currentAdventure, username, completeAdventure, cancelAdventure, isLoggedIn, isLoading } = useGameStore();
  
  // 全てのHooksを条件分岐の前に配置
  const [progress, setProgress] = useState(0);
  const [remainingSec, setRemainingSec] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [currentEncounter, setCurrentEncounter] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [earnedCoinReward, setEarnedCoinReward] = useState<number | null>(null);
  const isCompleteRef = useRef(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const startLogShownRef = useRef(false);
  
  // バトル結果はサーバーから取得済み（currentAdventure.result）
  const battleResult = currentAdventure?.result || null;
  
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回マウント時の初期化のみ
    setDisplayedLogs(startLog);
  }, [currentAdventure]);
  
  // ステータス更新（ソロ冒険中のみ、完了後は更新しない）
  useEffect(() => {
    if (!username || !currentAdventure || currentAdventure.status === 'completed') return;
    updateUserStatus(username, 'solo', { dungeonId: currentAdventure.dungeon, startTime: currentAdventure.startTime });
    const interval = setInterval(() => {
      // 完了後は更新しない
      const adventure = useGameStore.getState().currentAdventure;
      if (!adventure || adventure.status === 'completed') return;
      updateUserStatus(username, 'solo', { dungeonId: adventure.dungeon, startTime: adventure.startTime });
    }, 30000); // 30秒ごと
    return () => clearInterval(interval);
  }, [username, currentAdventure]);
  
  // 時間経過に応じてログを表示
  useEffect(() => {
    if (!currentAdventure) return;
    
    // battleResultがない場合は完了処理だけ行う
    if (!battleResult) {
      const dungeon = dungeons[currentAdventure.dungeon];
      const totalTime = currentAdventure.duration || (dungeon.durationSeconds * 1000);
      const elapsed = Date.now() - currentAdventure.startTime;
      
      if (elapsed >= totalTime && !isCompleteRef.current) {
        isCompleteRef.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 完了条件成立時の1回限りの更新
        setIsComplete(true);
        setProgress(100);
        // battleResultなしの完了処理（報酬なし）
        const handleCompleteNoResult = async () => {
          await completeAdventure({ victory: false, logs: [], encountersCleared: 0, totalEncounters: 0 });
          // Firebase側に結果を保存（敗北、報酬なし）
          if (username) {
            const actualDurationSeconds = currentAdventure.duration 
              ? Math.floor(currentAdventure.duration / 1000)
              : dungeon.durationSeconds;
            await saveSoloAdventure(
              username,
              currentAdventure.dungeon,
              false,
              0,
              [],
              currentAdventure.party,
              undefined,
              undefined,
              actualDurationSeconds
            );
          }
        };
        handleCompleteNoResult();
      }
      return;
    }
    
    const dungeon = dungeons[currentAdventure.dungeon];
    const totalTime = currentAdventure.duration || (dungeon.durationSeconds * 1000);
    const startTime = currentAdventure.startTime;
    const encounterCount = dungeon.encounterCount;
    const timePerEncounter = totalTime / encounterCount;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / totalTime) * 100);
      setProgress(newProgress);
      // 残り時間も更新（Date.now()はuseEffect内のみで呼ぶ）
      const remaining = Math.max(0, totalTime - elapsed);
      setRemainingSec(Math.ceil(remaining / 1000));
      
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
          
          // 冒険完了処理（報酬は手動受け取りに変更）
          const handleComplete = async () => {
            // ドロップ情報はbattleResultから取得（即受け取りはしない）
            const droppedItemIds = battleResult.droppedItemIds || (battleResult.droppedItemId ? [battleResult.droppedItemId] : []);
            const droppedEquipmentIds = battleResult.droppedEquipmentIds || (battleResult.droppedEquipmentId ? [battleResult.droppedEquipmentId] : []);
            
            // コイン報酬を計算（付与はしない、保存用）
            let coinReward = 0;
            if (battleResult.victory) {
              const baseCoinReward = dungeons[currentAdventure.dungeon]?.coinReward || 0;
              if (baseCoinReward > 0) {
                const allChars = [...(currentAdventure.party.front || []), ...(currentAdventure.party.back || [])].filter((c): c is NonNullable<typeof c> => c !== null);
                coinReward = applyCoinBonus(baseCoinReward, allChars);
                setEarnedCoinReward(coinReward);
              }
            }

            // まず冒険を完了（clearAdventureOnServer）
            await completeAdventure({ ...battleResult, droppedItemId: droppedItemIds[0], droppedItemIds, droppedEquipmentIds });
            
            // Firebase側に結果を保存（claimed=falseで、報酬画面でclaimするまで保持）
            if (username) {
              const dungeon = dungeons[currentAdventure.dungeon];
              const actualDurationSeconds = currentAdventure.duration 
                ? Math.floor(currentAdventure.duration / 1000)
                : dungeon.durationSeconds;
              
              await saveSoloAdventure(
                username,
                currentAdventure.dungeon,
                battleResult.victory,
                coinReward,
                battleResult.logs,
                currentAdventure.party,
                droppedItemIds.length > 0 ? droppedItemIds : undefined,
                droppedEquipmentIds.length > 0 ? droppedEquipmentIds : undefined,
                actualDurationSeconds
              );
            }

            // 履歴への追加は報酬受け取り時に行う（二重追加防止）
          };
          
          handleComplete();
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [currentAdventure, battleResult, currentEncounter, completeAdventure, isComplete, username]);
  
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
  // remainingSecはuseState + useEffect(setInterval)で管理
  // レンダー中にDate.now()を呼ばないことでReactの純粋性を保つ
  
  // バトルログ表示用のキャラとモンスター情報
  const partyCharacters = [
    ...(currentAdventure.party.front || []),
    ...(currentAdventure.party.back || [])
  ];
  const dungeonMonsters = [
    ...dungeon.monsters.map(m => m.monster),
    ...(dungeon.boss ? [dungeon.boss] : [])
  ];
  
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
  
  // ローディング中またはログイン前
  if (!isLoggedIn || isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <PageLayout>
        {/* ヘッダー */}
        <div className="mb-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">
              {isComplete ? '🎉 探索完了！' : dungeon.name}
            </h1>
            {!isComplete && (
              <div className="text-sm text-slate-400 mt-1">
                ソロプレイ冒険中
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Link 
              href="/" 
              className="bg-slate-600 hover:bg-slate-500 px-3 py-2 rounded-lg text-sm font-semibold"
            >
              🏠 ホーム
            </Link>
            <Link 
              href="/friends" 
              className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg text-sm font-semibold"
            >
              👥 フレンド
            </Link>
          </div>
        </div>
        
        {/* プログレスバー */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>進捗 {Math.floor(progress)}%</span>
            {!isComplete && <span>残り {formatDuration(remainingSec, true)}</span>}
          </div>
          <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
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
                🪙 {earnedCoinReward ?? dungeon.coinReward}コイン獲得！{earnedCoinReward && earnedCoinReward > dungeon.coinReward && "（ボーナス込み）"}
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
                <BattleLogDisplay 
                  logs={displayedLogs} 
                  characters={partyCharacters}
                  monsters={dungeonMonsters}
                />
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
              <BattleLogDisplay 
                logs={displayedLogs}
                characters={partyCharacters}
                monsters={dungeonMonsters}
              />
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
