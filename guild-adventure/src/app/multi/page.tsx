'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { usePolling } from '@/hooks/usePolling';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { DungeonDetailModal } from '@/components/DungeonDetailModal';
import { 
  createRoom, 
  joinRoom, 
  getFriends, 
  getInvitations, 
  respondToInvitation, 
  getPublicRooms,
  RoomInvitation,
  MultiRoom,
} from '@/lib/firebase';
import { dungeons, dungeonList } from '@/lib/data/dungeons';
import { DungeonType, DungeonData } from '@/lib/types';
import { getDropRate } from '@/lib/data/items';
import { formatDuration } from '@/lib/utils';

export default function MultiPage() {
  const router = useRouter();
  const { username, lastRoomSettings, saveRoomSettings } = useGameStore();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomCode, setRoomCode] = useState('');
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonType>('grassland');
  const [maxPlayers, setMaxPlayers] = useState<2 | 3>(2);
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailDungeon, setDetailDungeon] = useState<DungeonData | null>(null);
  
  // 公開ルーム一覧
  const [publicRooms, setPublicRooms] = useState<MultiRoom[]>([]);
  
  // 招待関連
  const [invitations, setInvitations] = useState<RoomInvitation[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  
  // 招待を取得（5秒ごとにポーリング）
  const loadInvitations = useCallback(async () => {
    if (!username) return;
    try {
      const invites = await getInvitations(username);
      setInvitations(invites);
    } catch (e) {
      console.error('Failed to load invitations:', e);
    }
  }, [username]);
  usePolling(loadInvitations, 5000, !!username);
  
  // フレンドリスト取得（初回のみ）
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
  
  // 公開ルーム一覧取得（3秒ごとにポーリング）
  const loadPublicRooms = useCallback(async () => {
    try {
      const rooms = await getPublicRooms();
      setPublicRooms(rooms);
    } catch (e) {
      console.error('Failed to load public rooms:', e);
    }
  }, []);
  usePolling(loadPublicRooms, 3000, mode === 'join');
  const handleCreate = async () => {
    if (!username) return;
    setIsLoading(true);
    setError('');
    
    // ルーム設定を保存
    await saveRoomSettings(selectedDungeon, maxPlayers, isPublic);
    
    const code = await createRoom(username, selectedDungeon, maxPlayers, isPublic);
    if (code) {
      router.push(`/multi/${code}`);
    } else {
      setError('ルーム作成に失敗しました');
    }
    setIsLoading(false);
  };
  
  // 前回の設定で即座に部屋作成
  const handleQuickCreate = async () => {
    if (!username || !lastRoomSettings) return;
    setIsLoading(true);
    setError('');
    
    const code = await createRoom(
      username, 
      lastRoomSettings.dungeonId as DungeonType, 
      lastRoomSettings.maxPlayers, 
      lastRoomSettings.isPublic
    );
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
  
  const handleAcceptInvite = async (invite: RoomInvitation) => {
    if (!username) return;
    const success = await joinRoom(invite.roomCode, username);
    if (success) {
      await respondToInvitation(username, invite.id, true);
      router.push(`/multi/${invite.roomCode}`);
    } else {
      setError('ルームに参加できませんでした（満員または存在しない）');
      await respondToInvitation(username, invite.id, false);
    }
  };
  
  const handleRejectInvite = async (invite: RoomInvitation) => {
    if (!username) return;
    await respondToInvitation(username, invite.id, false);
    setInvitations(invitations.filter(i => i.id !== invite.id));
  };
  
  return (
    <PageLayout>
      <PageHeader title="👥 マルチプレイ" />
        
        {/* 招待通知 */}
        {invitations.length > 0 && (
          <div className="mb-6 space-y-2">
            {invitations.map((invite) => (
              <div key={invite.id} className="bg-purple-900/50 rounded-lg p-4 border border-purple-700">
                <p className="mb-2">
                  <span className="font-semibold text-purple-300">{invite.from}</span> から招待が届いています
                </p>
                <p className="text-sm text-slate-400 mb-3">
                  {dungeons[invite.dungeonId as keyof typeof dungeons]?.name || invite.dungeonId} へ冒険
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvite(invite)}
                    className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded font-semibold"
                  >
                    参加
                  </button>
                  <button
                    onClick={() => handleRejectInvite(invite)}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 py-2 rounded"
                  >
                    拒否
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {mode === 'select' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-amber-600 hover:bg-amber-500 rounded-lg py-4 font-semibold text-lg"
            >
              🏠 部屋を作る
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full bg-slate-700 hover:bg-slate-600 rounded-lg py-4 font-semibold text-lg border border-slate-600"
            >
              🚪 部屋に入る
            </button>
            {lastRoomSettings && (
              <button
                onClick={handleQuickCreate}
                disabled={isLoading}
                className="w-full bg-green-700 hover:bg-green-600 rounded-lg py-4 font-semibold text-lg border border-green-600 disabled:opacity-50"
              >
                <div>⚡ 前回の設定で部屋を作る</div>
                <div className="text-sm font-normal text-green-300">
                  {dungeons[lastRoomSettings.dungeonId as keyof typeof dungeons]?.name || lastRoomSettings.dungeonId} / {lastRoomSettings.maxPlayers}人 / {lastRoomSettings.isPublic ? '公開' : '非公開'}
                </div>
              </button>
            )}
            {error && <div className="text-red-400 text-sm text-center">{error}</div>}
          </div>
        )}
        
        {mode === 'create' && (
          <div className="space-y-6">
            <button onClick={() => setMode('select')} className="text-slate-400 hover:text-white">
              ← 戻る
            </button>
            
            {/* ダンジョン選択 */}
            <div>
              <h2 className="text-sm text-slate-400 mb-2">ダンジョン選択</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {dungeonList.map((d) => (
                  <div
                    key={d.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border ${
                      selectedDungeon === d.id
                        ? 'bg-amber-600/30 border-amber-500'
                        : 'bg-slate-700 border-slate-600'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedDungeon(d.id)}
                      className="flex-1 text-left"
                    >
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-xs text-slate-400">
                        {'★'.repeat(d.difficulty)} | {formatDuration(d.durationSeconds)} | {d.recommendedPlayers}人推奨
                      </div>
                    </button>
                    <button
                      onClick={() => setDetailDungeon(d)}
                      className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs"
                    >
                      詳細
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 人数選択 */}
            <div>
              <h2 className="text-sm text-slate-400 mb-2">最大人数</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setMaxPlayers(2)}
                  className={`flex-1 p-3 rounded-lg border ${
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
                  className={`flex-1 p-3 rounded-lg border ${
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
            
            {/* 公開設定 */}
            <div>
              <h2 className="text-sm text-slate-400 mb-2">ルーム公開設定</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 p-3 rounded-lg border ${
                    !isPublic
                      ? 'bg-slate-600 border-slate-500'
                      : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <div className="font-semibold">🔒 非公開</div>
                  <div className="text-xs text-slate-300">コード共有で参加</div>
                </button>
                <button
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 p-3 rounded-lg border ${
                    isPublic
                      ? 'bg-green-600 border-green-500'
                      : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <div className="font-semibold">🌐 公開</div>
                  <div className="text-xs text-slate-300">一覧に表示</div>
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
            
            {/* 公開ルーム一覧 */}
            <div>
              <h2 className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                🌐 公開ルーム一覧
                <span className="text-xs text-slate-500">({publicRooms.length}件)</span>
              </h2>
              {publicRooms.length === 0 ? (
                <div className="text-center py-6 bg-slate-700/50 rounded-lg border border-slate-600 text-slate-400">
                  公開ルームはありません
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {publicRooms.map((room) => {
                    const dungeonData = dungeons[room.dungeonId as keyof typeof dungeons];
                    const playerCount = Object.keys(room.players).length;
                    const isFriendRoom = friends.some(f => room.players[f]);
                    const friendInRoom = friends.filter(f => room.players[f]);
                    
                    return (
                      <button
                        key={room.code}
                        onClick={async () => {
                          setIsLoading(true);
                          const success = await joinRoom(room.code, username!);
                          if (success) {
                            router.push(`/multi/${room.code}`);
                          } else {
                            setError('参加できませんでした');
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isFriendRoom
                            ? 'bg-purple-900/50 border-purple-600 hover:bg-purple-900/70'
                            : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {dungeonData?.name || room.dungeonId}
                              {isFriendRoom && <span className="text-purple-400 text-xs">👥 フレンド</span>}
                            </div>
                            <div className="text-xs text-slate-400">
                              ホスト: {room.hostId}
                              {friendInRoom.length > 0 && (
                                <span className="ml-2 text-purple-300">
                                  ({friendInRoom.join(', ')} がいます)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">{playerCount}/{room.maxPlayers}人</div>
                            <div className="text-xs text-slate-400">
                              {'★'.repeat(dungeonData?.difficulty || 1)}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      
      {/* ダンジョン詳細モーダル */}
      {detailDungeon && (
        <DungeonDetailModal dungeon={detailDungeon} onClose={() => setDetailDungeon(null)} />
      )}
    </PageLayout>
  );
}
