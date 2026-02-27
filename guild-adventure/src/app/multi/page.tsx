'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
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

// 系統の日本語名
const speciesNames: Record<string, string> = {
  humanoid: '🧑 人型',
  beast: '🐺 獣',
  undead: '💀 不死',
  demon: '😈 悪魔',
  dragon: '🐉 竜',
};

// 属性の日本語名
const elementNames: Record<string, string> = {
  none: '無',
  fire: '🔥 火',
  water: '💧 水',
  wind: '🌪️ 風',
  earth: '🪨 地',
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分`;
  return `${Math.floor(seconds / 3600)}時間`;
}

// ダンジョン詳細モーダル
function DungeonDetailModal({ 
  dungeon, 
  onClose 
}: { 
  dungeon: DungeonData; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800 rounded-lg border border-slate-600 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{dungeon.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="bg-slate-700 rounded-lg p-3">
            <h3 className="text-sm text-slate-400 mb-2">基本情報</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>難易度: {'★'.repeat(dungeon.difficulty)}</div>
              <div>探索時間: {formatDuration(dungeon.durationSeconds)}</div>
              <div>推奨人数: {dungeon.recommendedPlayers}人</div>
              <div>遭遇回数: {dungeon.encounterCount}回</div>
              <div className="col-span-2 text-amber-400">ドロップ率: {getDropRate(dungeon.id)}%</div>
            </div>
          </div>
          
          {dungeon.boss && (
            <div className="bg-red-900/50 rounded-lg p-3 border border-red-700">
              <h3 className="text-sm text-red-400 mb-2">🔴 ボス: {dungeon.boss.name}</h3>
              <div className="text-sm">
                <span>{speciesNames[dungeon.boss.species]}</span>
                {dungeon.boss.element && dungeon.boss.element !== 'none' && (
                  <span className="ml-2">{elementNames[dungeon.boss.element]}</span>
                )}
                <span className="ml-2">HP{dungeon.boss.stats.hp} ATK{dungeon.boss.stats.atk}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MultiPage() {
  const router = useRouter();
  const { username } = useGameStore();
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
  
  // 公開ルーム一覧取得
  useEffect(() => {
    if (mode !== 'join') return;
    
    const loadPublicRooms = async () => {
      try {
        const rooms = await getPublicRooms();
        setPublicRooms(rooms);
      } catch (e) {
        console.error('Failed to load public rooms:', e);
      }
    };
    loadPublicRooms();
    // 3秒ごとに更新
    const interval = setInterval(loadPublicRooms, 3000);
    return () => clearInterval(interval);
  }, [mode]);
  const handleCreate = async () => {
    if (!username) return;
    setIsLoading(true);
    setError('');
    
    const code = await createRoom(username, selectedDungeon, maxPlayers, isPublic);
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
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
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
              🏠 ルームを作成
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full bg-slate-700 hover:bg-slate-600 rounded-lg py-4 font-semibold text-lg border border-slate-600"
            >
              🚪 ルームに参加
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
      </div>
      
      {/* ダンジョン詳細モーダル */}
      {detailDungeon && (
        <DungeonDetailModal dungeon={detailDungeon} onClose={() => setDetailDungeon(null)} />
      )}
    </main>
  );
}
