'use client';

import { use, useEffect, useState, useCallback } from 'react';
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
  saveRoomBattleResult,
  MultiRoom,
} from '@/lib/firebase';
import { dungeons } from '@/lib/data/dungeons';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';
import { runBattle } from '@/lib/battle/engine';
import { Character, Party } from '@/lib/types';

export default function MultiRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { username, characters, addItem, syncToServer, isLoading, autoLogin } = useGameStore();
  
  const [room, setRoom] = useState<MultiRoom | null>(null);
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  
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
        setRoom(data);
        
        // 自分の選択状態を復元
        if (username && data.players[username]) {
          const myChars = data.players[username].characters || [];
          setSelectedChars(myChars.map((c: any) => c.id));
          setIsReady(data.players[username].ready);
        }
      }
    };
    
    fetchRoom();
    const interval = setInterval(fetchRoom, 1000);
    return () => clearInterval(interval);
  }, [code, username]);
  
  // キャラ選択数の上限
  const maxCharsPerPlayer = room?.maxPlayers === 2 ? 3 : 2;
  
  // キャラ選択トグル
  const toggleChar = useCallback(async (charId: string) => {
    if (!username || !room || isReady) return;
    
    let newSelected: string[];
    if (selectedChars.includes(charId)) {
      newSelected = selectedChars.filter(id => id !== charId);
    } else {
      if (selectedChars.length >= maxCharsPerPlayer) return;
      newSelected = [...selectedChars, charId];
    }
    
    setSelectedChars(newSelected);
    
    // Firebase更新
    const selectedCharData = characters.filter(c => newSelected.includes(c.id));
    await updateRoomCharacters(code, username, selectedCharData);
  }, [username, room, isReady, selectedChars, maxCharsPerPlayer, characters, code]);
  
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
  
  // バトル開始（ホストのみ）
  const startBattle = async () => {
    if (!room || !username || room.hostId !== username) return;
    
    await updateRoomStatus(code, 'battle');
    
    // 全プレイヤーのキャラを集めてパーティを作成
    const allChars: Character[] = [];
    Object.values(room.players).forEach(p => {
      allChars.push(...(p.characters || []));
    });
    
    // 前後に振り分け（前半は前衛、後半は後衛）
    const half = Math.ceil(allChars.length / 2);
    const party: Party = {
      front: allChars.slice(0, half).concat(Array(3 - Math.min(half, 3)).fill(null)),
      back: allChars.slice(half).concat(Array(3 - Math.min(allChars.length - half, 3)).fill(null)),
    };
    
    // バトル実行
    const result = runBattle(party, room.dungeonId as any);
    
    // 結果を保存
    await saveRoomBattleResult(code, result);
  };
  
  // バトル完了時にドロップアイテムを受け取る
  useEffect(() => {
    if (room?.status === 'done' && room.battleResult?.droppedItemId) {
      addItem(room.battleResult.droppedItemId);
      syncToServer();
    }
  }, [room?.status, room?.battleResult?.droppedItemId, addItem, syncToServer]);
  
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
                    {player.characters.map((char: any) => (
                      <span key={char.id} className="text-xs bg-slate-600 px-2 py-1 rounded">
                        {char.name}
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
        
        {/* バトル中/完了 */}
        {room.status === 'battle' && (
          <div className="text-center py-8">
            <div className="animate-pulse text-2xl">⚔️ バトル中...</div>
          </div>
        )}
        
        {room.status === 'done' && room.battleResult && (
          <div className="mb-6 p-4 rounded-lg bg-slate-800 border border-slate-700">
            <h2 className="text-xl font-bold mb-2 text-center">
              {room.battleResult.victory ? '🎉 勝利！' : '💀 敗北...'}
            </h2>
            {room.battleResult.droppedItemId && (
              <div className="text-center text-amber-400">
                💎 アイテムドロップ！
              </div>
            )}
            <Link href="/" className="block mt-4 text-center text-amber-400 hover:underline">
              ホームに戻る
            </Link>
          </div>
        )}
        
        {/* キャラ選択（waiting中のみ） */}
        {room.status === 'waiting' && (
          <>
            <div className="mb-6">
              <h2 className="text-sm text-slate-400 mb-2">
                キャラ選択 ({selectedChars.length}/{maxCharsPerPlayer})
              </h2>
              {characters.length === 0 ? (
                <div className="text-center py-4 text-slate-500">
                  キャラがいません
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {characters.map((char) => {
                    const selected = selectedChars.includes(char.id);
                    const raceData = races[char.race];
                    const jobData = jobs[char.job];
                    
                    return (
                      <button
                        key={char.id}
                        onClick={() => toggleChar(char.id)}
                        disabled={isReady}
                        className={`p-3 rounded-lg border text-left ${
                          selected
                            ? 'bg-amber-600 border-amber-500'
                            : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                        } ${isReady ? 'opacity-50' : ''}`}
                      >
                        <div className="font-semibold">{char.name}</div>
                        <div className="text-xs text-slate-300">
                          {raceData.name} / {jobData.name}
                        </div>
                      </button>
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
                ⚔️ バトル開始！
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
