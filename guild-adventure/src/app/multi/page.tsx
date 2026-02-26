'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { createRoom, joinRoom } from '@/lib/firebase';
import { dungeons, dungeonList } from '@/lib/data/dungeons';
import { DungeonType } from '@/lib/types';

export default function MultiPage() {
  const router = useRouter();
  const { username } = useGameStore();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomCode, setRoomCode] = useState('');
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonType>('grassland');
  const [maxPlayers, setMaxPlayers] = useState<2 | 3>(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleCreate = async () => {
    if (!username) return;
    setIsLoading(true);
    setError('');
    
    const code = await createRoom(username, selectedDungeon, maxPlayers);
    if (code) {
      router.push(`/multi/${code}`);
    } else {
      setError('ルーム作成に失敗しました');
    }
    setIsLoading(false);
  };
  
  const handleJoin = async () => {
    if (!username || !roomCode) return;
    setIsLoading(true);
    setError('');
    
    const success = await joinRoom(roomCode.toUpperCase(), username);
    if (success) {
      router.push(`/multi/${roomCode.toUpperCase()}`);
    } else {
      setError('ルームが見つからないか、満員です');
    }
    setIsLoading(false);
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-slate-400 hover:text-white">← 戻る</Link>
          <h1 className="text-2xl font-bold">マルチプレイ</h1>
        </div>
        
        {mode === 'select' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-amber-600 hover:bg-amber-500 rounded-lg p-4 text-left"
            >
              <div className="text-xl font-semibold">🎮 ルームを作成</div>
              <div className="text-sm text-amber-200">仲間を招待してダンジョンに挑む</div>
            </button>
            
            <button
              onClick={() => setMode('join')}
              className="w-full bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-left border border-slate-600"
            >
              <div className="text-xl font-semibold">🔗 ルームに参加</div>
              <div className="text-sm text-slate-400">ルームコードを入力して参加</div>
            </button>
          </div>
        )}
        
        {mode === 'create' && (
          <div className="space-y-6">
            <button onClick={() => setMode('select')} className="text-slate-400 hover:text-white">
              ← 戻る
            </button>
            
            {/* ダンジョン選択 */}
            <div>
              <h2 className="text-sm text-slate-400 mb-2">ダンジョン</h2>
              <div className="grid grid-cols-2 gap-2">
                {dungeonList.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDungeon(d.id)}
                    className={`p-3 rounded-lg border text-left ${
                      selectedDungeon === d.id
                        ? 'bg-amber-600 border-amber-500'
                        : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-xs text-slate-300">難易度{d.difficulty}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* 人数選択 */}
            <div>
              <h2 className="text-sm text-slate-400 mb-2">プレイヤー人数</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMaxPlayers(2)}
                  className={`p-3 rounded-lg border ${
                    maxPlayers === 2
                      ? 'bg-amber-600 border-amber-500'
                      : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <div className="font-semibold">2人</div>
                  <div className="text-xs text-slate-300">各3キャラ</div>
                </button>
                <button
                  onClick={() => setMaxPlayers(3)}
                  className={`p-3 rounded-lg border ${
                    maxPlayers === 3
                      ? 'bg-amber-600 border-amber-500'
                      : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <div className="font-semibold">3人</div>
                  <div className="text-xs text-slate-300">各2キャラ</div>
                </button>
              </div>
            </div>
            
            {error && <div className="text-red-400 text-sm">{error}</div>}
            
            <button
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full bg-amber-600 hover:bg-amber-500 rounded-lg py-3 font-semibold disabled:opacity-50"
            >
              {isLoading ? '作成中...' : 'ルームを作成'}
            </button>
          </div>
        )}
        
        {mode === 'join' && (
          <div className="space-y-6">
            <button onClick={() => setMode('select')} className="text-slate-400 hover:text-white">
              ← 戻る
            </button>
            
            <div>
              <h2 className="text-sm text-slate-400 mb-2">ルームコード</h2>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="6桁のコード"
                maxLength={6}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-2xl text-center tracking-widest uppercase"
              />
            </div>
            
            {error && <div className="text-red-400 text-sm">{error}</div>}
            
            <button
              onClick={handleJoin}
              disabled={isLoading || roomCode.length !== 6}
              className="w-full bg-amber-600 hover:bg-amber-500 rounded-lg py-3 font-semibold disabled:opacity-50"
            >
              {isLoading ? '参加中...' : '参加する'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
