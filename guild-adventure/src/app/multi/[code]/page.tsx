'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { 
  getRoom, 
  updateRoomCharacters, 
  updateRoomReady, 
  updateRoomStatus,
  leaveRoom,
  deleteRoom,
  claimMultiDrop,
  MultiRoom,
  RoomCharacter,
} from '@/lib/firebase';
import { dungeons } from '@/lib/data/dungeons';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';
import { runBattle, rollDrop } from '@/lib/battle/engine';
import { getItemById } from '@/lib/data/items';
import { Character, Party, BattleResult } from '@/lib/types';

export default function MultiRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { username, characters, addItem, syncToServer, isLoading, autoLogin, addHistory } = useGameStore();
  
  const [room, setRoom] = useState<MultiRoom | null>(null);
  const [roomDeleted, setRoomDeleted] = useState(false);
  const [hadRoomOnce, setHadRoomOnce] = useState(false);
  const [selectedChars, setSelectedChars] = useState<RoomCharacter[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [myDrop, setMyDrop] = useState<string | null>(null);
  const [dropClaimed, setDropClaimed] = useState(false);
  
  // 冒険中のログ表示用
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentEncounter, setCurrentEncounter] = useState(0);
  const battleResultRef = useRef<BattleResult | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // 自動ログイン（ストアの初期化）
  useEffect(() => {
    if (!username) {
      autoLogin();
    }
  }, [username, autoLogin]);
  
  // ルーム情報をポーリング
  useEffect(() => {
    const fetchRoom = async () => {
      const data = await getRoom(code);
      if (data) {
        setHadRoomOnce(true);
        setRoom(data);
        
        // 自分の選択状態を復元
        if (username && data.players && data.players[username]) {
          const myChars = data.players[username].characters || [];
          setSelectedChars(myChars);
          setIsReady(data.players[username].ready);
        }
        
        // 自分がキックされた（playersに自分がいない）場合
        if (username && data.players && !data.players[username] && data.status === 'waiting') {
          setRoomDeleted(true);
        }
      } else if (hadRoomOnce) {
        // ルームが存在していたのに消えた場合（ホストが退出）
        setRoomDeleted(true);
      }
    };
    
    fetchRoom();
    const interval = setInterval(fetchRoom, 1000);
    return () => clearInterval(interval);
  }, [code, username, hadRoomOnce]);
  
  // キャラ選択数の上限
  const maxCharsPerPlayer = room?.maxPlayers === 2 ? 3 : 2;
  
  // キャラ選択トグル（前衛/後衛を選んで追加）
  const addChar = useCallback(async (charId: string, position: 'front' | 'back') => {
    if (!username || !room || isReady) return;
    if (selectedChars.length >= maxCharsPerPlayer) return;
    if (selectedChars.some(c => c.character.id === charId)) return;
    
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    
    const newSelected = [...selectedChars, { character: char, position }];
    setSelectedChars(newSelected);
    await updateRoomCharacters(code, username, newSelected);
  }, [username, room, isReady, selectedChars, maxCharsPerPlayer, characters, code]);
  
  // キャラを外す
  const removeChar = useCallback(async (charId: string) => {
    if (!username || !room || isReady) return;
    
    const newSelected = selectedChars.filter(c => c.character.id !== charId);
    setSelectedChars(newSelected);
    await updateRoomCharacters(code, username, newSelected);
  }, [username, room, isReady, selectedChars, code]);
  
  // 準備完了トグル
  const toggleReady = async () => {
    if (!username || selectedChars.length === 0) return;
    
    const newReady = !isReady;
    setIsReady(newReady);
    await updateRoomReady(code, username, newReady);
  };
  
  // 全員準備完了かチェック
  const allReady = room && Object.values(room.players).length === room.maxPlayers &&
    Object.values(room.players).every(p => p.ready && p.characters.length > 0);
  
  // バトル開始（ホストのみ）- バトル結果+ドロップを事前計算してFirebaseに保存
  const startBattle = async () => {
    if (!room || !username || room.hostId !== username) return;
    
    // 全プレイヤーのキャラを集めてパーティを作成
    const frontChars: Character[] = [];
    const backChars: Character[] = [];
    
    Object.values(room.players).forEach(p => {
      (p.characters || []).forEach((rc: RoomCharacter) => {
        if (rc.position === 'front') {
          frontChars.push(rc.character);
        } else {
          backChars.push(rc.character);
        }
      });
    });
    
    const party: Party = {
      front: frontChars,
      back: backChars,
    };
    
    // ホストがバトル結果を計算
    const result = runBattle(party, room.dungeonId as any);
    
    // 勝利時は各プレイヤーのドロップを計算
    let playerDrops: Record<string, string | undefined> | undefined;
    if (result.victory) {
      playerDrops = {};
      Object.entries(room.players).forEach(([playerName, player]) => {
        // 各プレイヤーのキャラクターでドロップボーナス計算
        const chars = (player.characters || []).map(rc => rc.character);
        const drop = rollDrop(room.dungeonId as any, chars);
        playerDrops![playerName] = drop;
      });
    }
    
    const startTime = Date.now();
    // バトル結果+ドロップもFirebaseに保存（全員が同じ結果を見る）
    await updateRoomStatus(code, 'battle', startTime, result, playerDrops);
  };
  
  // バトル結果をFirebaseから読み取る
  useEffect(() => {
    if (!room || room.status !== 'battle' || !room.battleResult) return;
    if (battleResultRef.current) return; // 既に設定済み
    
    // Firebaseからバトル結果を取得（ホストが計算したもの）
    battleResultRef.current = room.battleResult;
  }, [room?.status, room?.battleResult]);
  
  // 時間経過に応じてログを表示
  useEffect(() => {
    if (!room || room.status !== 'battle' || !room.startTime || !battleResultRef.current) return;
    
    const dungeonData = dungeons[room.dungeonId as keyof typeof dungeons];
    if (!dungeonData) return;
    
    const totalTime = dungeonData.durationSeconds * 1000;
    const startTime = room.startTime;
    const encounterCount = dungeonData.encounterCount;
    const timePerEncounter = totalTime / encounterCount;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / totalTime) * 100);
      setProgress(newProgress);
      
      const shouldShowEncounter = Math.min(
        encounterCount,
        Math.floor(elapsed / timePerEncounter)
      );
      
      if (shouldShowEncounter > currentEncounter && battleResultRef.current) {
        const result = battleResultRef.current;
        
        for (let i = currentEncounter; i < shouldShowEncounter; i++) {
          if (result.logs[i]) {
            const newLogs = result.logs[i].message.split('\n').filter(l => l.trim());
            setDisplayedLogs(prev => [...prev, ...newLogs]);
          }
        }
        setCurrentEncounter(shouldShowEncounter);
      }
      
      // 完了判定
      if (newProgress >= 100) {
        clearInterval(interval);
        
        if (battleResultRef.current) {
          const result = battleResultRef.current;
          // 残りのログを全部表示
          for (let i = currentEncounter; i < result.logs.length; i++) {
            const newLogs = result.logs[i].message.split('\n').filter(l => l.trim());
            setDisplayedLogs(prev => [...prev, ...newLogs]);
          }
          
          // ホストがステータスをdoneに更新
          if (username === room.hostId) {
            updateRoomStatus(code, 'done');
          }
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [room?.status, room?.startTime, room?.dungeonId, currentEncounter, username, room?.hostId, code]);
  
  // ログが追加されたら自動スクロール
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [displayedLogs]);
  
  // バトル完了時にドロップ受け取り（サーバーでclaimed管理）
  useEffect(() => {
    if (room?.status === 'done' && room.battleResult?.victory && !dropClaimed && username) {
      const handleClaim = async () => {
        // サーバーからドロップ受け取り
        const result = await claimMultiDrop(code, username);
        if (result.success && result.itemId) {
          setMyDrop(result.itemId);
          addItem(result.itemId);
          syncToServer();
        }
        
        // 履歴を追加
        addHistory({
          type: 'multi',
          dungeonId: room.dungeonId,
          victory: room.battleResult.victory,
          droppedItemId: result.itemId,
          logs: room.battleResult.logs || [],
          roomCode: code,
          players: Object.keys(room.players),
        });
        
        setDropClaimed(true);
      };
      
      handleClaim();
    }
  }, [room?.status, room?.battleResult?.victory, room?.dungeonId, code, dropClaimed, username, addItem, syncToServer, room?.battleResult?.logs, room?.players, addHistory]);
  
  // 退出
  const handleLeave = async () => {
    if (!username) return;
    
    if (room?.hostId === username) {
      await deleteRoom(code);
    } else {
      await leaveRoom(code, username);
    }
    router.push('/multi');
  };
  
  // ルームが削除された場合
  if (roomDeleted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">😢 ルームが解散されました</div>
          <Link href="/multi" className="text-amber-400 hover:underline">マルチプレイに戻る</Link>
        </div>
      </main>
    );
  }
  
  if (!room || isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div>読み込み中...</div>
      </main>
    );
  }
  
  const dungeonData = dungeons[room.dungeonId as keyof typeof dungeons];
  const isHost = username === room.hostId;
  const playerCount = Object.keys(room.players).length;
  
  // 冒険中のUI
  if (room.status === 'battle' && room.startTime) {
    const totalTime = dungeonData?.durationSeconds || 30;
    const remainingMs = Math.max(0, room.startTime + (totalTime * 1000) - Date.now());
    const remainingSec = Math.ceil(remainingMs / 1000);
    
    const formatTime = (seconds: number) => {
      if (seconds < 60) return `${seconds}秒`;
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      if (min < 60) return `${min}分${sec}秒`;
      const hour = Math.floor(min / 60);
      const remainMin = min % 60;
      return `${hour}時間${remainMin}分`;
    };
    
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">{dungeonData?.name}</h1>
            <div className="text-sm text-slate-400">マルチプレイ冒険中</div>
          </div>
          
          {/* 進捗バー */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>進捗 {Math.floor(progress)}%</span>
              <span>残り {formatTime(remainingSec)}</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* ログ */}
          <div 
            ref={logContainerRef}
            className="bg-slate-800 rounded-lg p-4 h-96 overflow-y-auto border border-slate-700"
          >
            {displayedLogs.length === 0 ? (
              <div className="text-slate-500 text-sm animate-pulse">探索中...</div>
            ) : (
              <div className="space-y-1 text-sm font-mono">
                {displayedLogs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`${
                      log.includes('🔴BOSS:') ? 'text-red-500 font-bold mt-3' :
                      log.includes('【遭遇') ? 'text-yellow-400 font-bold mt-3' :
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
            )}
          </div>
        </div>
      </main>
    );
  }
  
  // 結果画面
  if (room.status === 'done' && room.battleResult) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="p-6 rounded-lg bg-slate-800 border border-slate-700 text-center">
            <h2 className="text-3xl font-bold mb-4">
              {room.battleResult.victory ? '🎉 勝利！' : '💀 敗北...'}
            </h2>
            <div className="text-slate-300 mb-4">{dungeonData?.name}を踏破！</div>
            {myDrop && (
              <div className="text-amber-400 text-lg mb-4">
                💎 【あなたのドロップ】{getItemById(myDrop)?.name || myDrop}
              </div>
            )}
            {room.battleResult.victory && !myDrop && dropClaimed && (
              <div className="text-slate-400 mb-4">ドロップなし...</div>
            )}
            <Link href="/" className="inline-block bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-lg font-semibold">
              ホームに戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }
  
  // 待機中のUI
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{dungeonData?.name}</h1>
            <div className="text-sm text-slate-400">
              ルームコード: <span className="text-amber-400 font-mono">{code}</span>
            </div>
            <div className="text-xs text-slate-500">
              推奨人数: {dungeonData?.recommendedPlayers}人 / 探索時間: {dungeonData?.durationSeconds < 60 ? `${dungeonData?.durationSeconds}秒` : `${Math.floor(dungeonData?.durationSeconds / 60)}分`}
            </div>
          </div>
          <button onClick={handleLeave} className="text-red-400 hover:text-red-300 text-sm">
            退出
          </button>
        </div>
        
        {/* プレイヤー一覧 */}
        <div className="mb-6">
          <h2 className="text-sm text-slate-400 mb-2">
            プレイヤー ({playerCount}/{room.maxPlayers})
          </h2>
          <div className="space-y-2">
            {Object.values(room.players).map((player) => (
              <div
                key={player.username}
                className={`p-3 rounded-lg border ${
                  player.ready ? 'bg-green-900/50 border-green-700' : 'bg-slate-700 border-slate-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">{player.username}</span>
                    {player.username === room.hostId && (
                      <span className="ml-2 text-xs text-amber-400">ホスト</span>
                    )}
                  </div>
                  <div className="text-sm">
                    {player.ready ? (
                      <span className="text-green-400">準備完了</span>
                    ) : (
                      <span className="text-slate-400">
                        {player.characters?.length || 0}/{maxCharsPerPlayer}キャラ
                      </span>
                    )}
                  </div>
                </div>
                {player.characters && player.characters.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {player.characters.map((rc: RoomCharacter, idx: number) => (
                      <span key={idx} className={`text-xs px-2 py-1 rounded ${rc.position === 'front' ? 'bg-red-600' : 'bg-blue-600'}`}>
                        {rc.position === 'front' ? '前' : '後'} {rc.character.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* 空きスロット */}
            {Array(room.maxPlayers - playerCount).fill(0).map((_, i) => (
              <div key={`empty-${i}`} className="p-3 rounded-lg border-2 border-dashed border-slate-600 text-slate-500 text-center">
                待機中...
              </div>
            ))}
          </div>
        </div>
        
        {/* キャラ選択（waiting中のみ） */}
        {room.status === 'waiting' && (
          <>
            {/* 選択中のキャラ */}
            {selectedChars.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm text-slate-400 mb-2">選択中 ({selectedChars.length}/{maxCharsPerPlayer})</h2>
                <div className="grid grid-cols-3 gap-2">
                  {selectedChars.map((rc, idx) => (
                    <div key={idx} className={`p-2 rounded-lg border text-center ${rc.position === 'front' ? 'bg-red-900/50 border-red-700' : 'bg-blue-900/50 border-blue-700'}`}>
                      <div className="text-xs">{rc.position === 'front' ? '⚔️ 前衛' : '🛡️ 後衛'}</div>
                      <div className="font-semibold text-sm truncate">{rc.character.name}</div>
                      {!isReady && (
                        <button
                          onClick={() => removeChar(rc.character.id)}
                          className="text-xs text-red-400 hover:text-red-300 mt-1"
                        >
                          外す
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* キャラ選択 */}
            <div className="mb-6">
              <h2 className="text-sm text-slate-400 mb-2">キャラを選択</h2>
              {characters.length === 0 ? (
                <div className="text-center py-4 text-slate-500">キャラがいません</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {characters.filter(c => !selectedChars.some(sc => sc.character.id === c.id)).map((char) => {
                    const raceData = races[char.race];
                    const jobData = jobs[char.job];
                    const canAdd = selectedChars.length < maxCharsPerPlayer && !isReady;
                    
                    return (
                      <div
                        key={char.id}
                        className={`p-3 rounded-lg border bg-slate-700 border-slate-600 ${!canAdd ? 'opacity-50' : ''}`}
                      >
                        <div className="font-semibold">{char.name}</div>
                        <div className="text-xs text-slate-300">{raceData.name} / {jobData.name}</div>
                        {canAdd && (
                          <div className="flex gap-1 mt-2">
                            <button
                              onClick={() => addChar(char.id, 'front')}
                              className="flex-1 text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded"
                            >
                              前衛
                            </button>
                            <button
                              onClick={() => addChar(char.id, 'back')}
                              className="flex-1 text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded"
                            >
                              後衛
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* 準備完了ボタン */}
            <button
              onClick={toggleReady}
              disabled={selectedChars.length === 0}
              className={`w-full py-3 rounded-lg font-semibold mb-4 ${
                isReady
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-slate-600 hover:bg-slate-500'
              } disabled:opacity-50`}
            >
              {isReady ? '✓ 準備完了' : '準備する'}
            </button>
            
            {/* バトル開始ボタン（ホストのみ） */}
            {isHost && allReady && (
              <button
                onClick={startBattle}
                className="w-full bg-amber-600 hover:bg-amber-500 py-3 rounded-lg font-semibold"
              >
                ⚔️ 冒険開始！
              </button>
            )}
            
            {isHost && !allReady && playerCount === room.maxPlayers && (
              <div className="text-center text-slate-400 text-sm">
                全員の準備完了を待っています...
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
