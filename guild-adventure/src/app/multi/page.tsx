'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { createRoom, joinRoom, getFriends, sendInvitation, getInvitations, respondToInvitation, RoomInvitation } from '@/lib/firebase';
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
  
  // 招待関連
  const [invitations, setInvitations] = useState<RoomInvitation[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [inviteSent, setInviteSent] = useState<string[]>([]);
  
  // 招待を取得
  useEffect(() => {
    if (!username) return;
    const loadInvitations = async () => {
      try {
        const invites = await getInvitations(username);
        setInvitations(invites);
      } catch (e) {
        console.error('Failed to load invitations:', e);
      }
    };
    loadInvitations();
    // 5秒ごとにポーリング
    const interval = setInterval(loadInvitations, 5000);
    return () => clearInterval(interval);
  }, [username]);
  
  // フレンドリスト取得
  useEffect(() => {
    if (!username) return;
    const loadFriends = async () => {
      try {
        const f = await getFriends(username);
        setFriends(f);
      } catch (e) {
        console.error('Failed to load friends:', e);
      }
    };
    loadFriends();
  }, [username]);
  
  const handleCreate = async () => {
    if (!username) return;
    setIsLoading(true);
    setError('');
    
    const code = await createRoom(username, selectedDungeon, maxPlayers);
    if (code) {
      setCreatedRoomCode(code);
      if (friends.length > 0) {
        setShowInviteModal(true);
      } else {
        router.push(`/multi/${code}`);
      }
    } else {
      setError('ルーム作成に失敗しました');
    }
    setIsLoading(false);
  };
  
  const handleInviteFriend = async (friendName: string) => {
    if (!username || !createdRoomCode) return;
    await sendInvitation(username, friendName, createdRoomCode, selectedDungeon);
    setInviteSent([...inviteSent, friendName]);
  };
  
  const handleSkipInvite = () => {
    router.push(`/multi/${createdRoomCode}`);
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
  
  // 招待に応答
  const handleAcceptInvite = async (inv: RoomInvitation) => {
    if (!username) return;
    await respondToInvitation(username, inv.id, true);
    const success = await joinRoom(inv.roomCode, username);
    if (success) {
      router.push(`/multi/${inv.roomCode}`);
    } else {
      setError('ルームが見つからないか、満員です');
      setInvitations(invitations.filter(i => i.id !== inv.id));
    }
  };
  
  const handleRejectInvite = async (inv: RoomInvitation) => {
    if (!username) return;
    await respondToInvitation(username, inv.id, false);
    setInvitations(invitations.filter(i => i.id !== inv.id));
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-slate-400 hover:text-white">← 戻る</Link>
          <h1 className="text-2xl font-bold">マルチプレイ</h1>
        </div>
        
        {/* 招待通知 */}
        {invitations.length > 0 && (
          <div className="mb-6 bg-purple-900/50 rounded-lg p-4 border border-purple-600">
            <h2 className="text-sm text-purple-300 mb-3">📨 招待が届いています！</h2>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div key={inv.id} className="bg-slate-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold">{inv.from}</span>
                      <span className="text-slate-400 text-sm"> からの招待</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {dungeons[inv.dungeonId as DungeonType]?.name || inv.dungeonId}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvite(inv)}
                      className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded text-sm font-semibold"
                    >
                      参加する
                    </button>
                    <button
                      onClick={() => handleRejectInvite(inv)}
                      className="flex-1 bg-slate-600 hover:bg-slate-500 py-2 rounded text-sm"
                    >
                      拒否
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
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
        
        {/* 招待モーダル */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full border border-slate-600">
              <h2 className="text-xl font-bold mb-4">🎉 ルーム作成完了！</h2>
              <div className="bg-slate-700 rounded-lg p-3 mb-4 text-center">
                <p className="text-sm text-slate-400">ルームコード</p>
                <p className="text-3xl font-bold tracking-widest">{createdRoomCode}</p>
              </div>
              
              <h3 className="text-sm text-slate-400 mb-2">フレンドを招待</h3>
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {friends.map((friend) => (
                  <div key={friend} className="flex items-center justify-between bg-slate-700 rounded-lg p-3">
                    <span>{friend}</span>
                    {inviteSent.includes(friend) ? (
                      <span className="text-green-400 text-sm">✓ 送信済み</span>
                    ) : (
                      <button
                        onClick={() => handleInviteFriend(friend)}
                        className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm"
                      >
                        招待
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleSkipInvite}
                className="w-full bg-amber-600 hover:bg-amber-500 rounded-lg py-3 font-semibold"
              >
                ルームへ進む →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
