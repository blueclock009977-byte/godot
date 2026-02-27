'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getMultipleFriendFullStatus,
  isOnline,
  updateUserStatus,
  FriendRequest,
  FriendFullStatus,
} from '@/lib/firebase';
import { dungeons } from '@/lib/data/dungeons';

export default function FriendsPage() {
  const { username } = useGameStore();
  const [friends, setFriends] = useState<string[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, FriendFullStatus>>({});
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchName, setSearchName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // データ読み込み
  const loadData = async () => {
    if (!username) return;
    setIsLoading(true);
    const [friendList, requestList] = await Promise.all([
      getFriends(username),
      getFriendRequests(username),
    ]);
    setFriends(friendList);
    setRequests(requestList);
    
    // フレンドの詳細ステータスを取得
    if (friendList.length > 0) {
      const statuses = await getMultipleFriendFullStatus(friendList);
      setFriendStatuses(statuses);
    }
    
    // 自分のステータスを更新
    updateUserStatus(username, 'lobby');
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    // 10秒ごとにポーリング
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [username]);
  
  // ダンジョン名を取得するヘルパー
  const getDungeonName = (dungeonId: string): string => {
    return dungeons[dungeonId as keyof typeof dungeons]?.name || dungeonId;
  };
  
  // 残り時間（分）を計算するヘルパー
  const calculateRemainingMinutes = (startTime: number, dungeonId: string): number => {
    const duration = dungeons[dungeonId as keyof typeof dungeons]?.durationSeconds || 0;
    const endTime = startTime + duration * 1000;
    return Math.max(0, Math.ceil((endTime - Date.now()) / 60000));
  };
  
  // ステータス表示用のヘルパー関数
  const getStatusDisplay = (fullStatus: FriendFullStatus | undefined) => {
    if (!fullStatus) {
      return { text: 'オフライン', color: 'text-slate-500', emoji: '⚫', detail: '' };
    }
    
    const { status, currentAdventure, multiAdventure, multiRoom } = fullStatus;
    
    // ソロ冒険中をチェック（Web閉じても表示）
    if (currentAdventure) {
      const dungeonName = getDungeonName(currentAdventure.dungeon);
      const remaining = calculateRemainingMinutes(currentAdventure.startTime, currentAdventure.dungeon);
      
      if (remaining > 0) {
        // まだ冒険中
        return { 
          text: `ソロ冒険中`, 
          color: 'text-amber-400', 
          emoji: '⚔️',
          detail: `${dungeonName} (残り${remaining}分)`
        };
      } else {
        // 帰還待ち
        return { 
          text: '帰還待ち', 
          color: 'text-orange-400', 
          emoji: '🏠',
          detail: `${dungeonName} の結果確認待ち`
        };
      }
    }
    
    // マルチルームの状態をチェック（冒険中かどうか）
    if (multiRoom && status?.activity === 'multi') {
      const dungeonName = getDungeonName(multiRoom.dungeonId);
      
      if (multiRoom.status === 'battle') {
        // マルチ冒険中
        const startTime = multiRoom.startTime || Date.now();
        const remaining = calculateRemainingMinutes(startTime, multiRoom.dungeonId);
        return { 
          text: 'マルチ冒険中', 
          color: 'text-purple-400', 
          emoji: '⚔️👥',
          detail: `${dungeonName} (残り${remaining}分)`
        };
      } else if (multiRoom.status === 'waiting' || multiRoom.status === 'ready') {
        // マルチ待機中
        const playerCount = Object.keys(multiRoom.players || {}).length;
        return { 
          text: 'マルチ待機中', 
          color: 'text-blue-400', 
          emoji: '👥',
          detail: `${dungeonName} (${playerCount}/${multiRoom.maxPlayers}人)`
        };
      }
    }
    
    // マルチ結果待ちをチェック
    if (multiAdventure && !multiAdventure.claimed) {
      const dungeonName = getDungeonName(multiAdventure.dungeonId);
      return { 
        text: 'マルチ結果待ち', 
        color: 'text-purple-400', 
        emoji: '👥',
        detail: `${dungeonName} の結果確認待ち`
      };
    }
    
    // 通常のステータス
    if (!status || !isOnline(status)) {
      return { text: 'オフライン', color: 'text-slate-500', emoji: '⚫', detail: '' };
    }
    
    switch (status.activity) {
      case 'lobby':
        return { text: 'ロビー', color: 'text-green-400', emoji: '🟢', detail: 'オンライン' };
      case 'solo':
        // currentAdventureがない場合（通常はここに来ない）
        return { text: 'ソロ冒険中', color: 'text-amber-400', emoji: '⚔️', detail: '' };
      case 'multi':
        // multiRoomが取得できなかった場合のフォールバック
        return { text: 'マルチプレイ中', color: 'text-purple-400', emoji: '👥', detail: status.roomCode ? `Room: ${status.roomCode}` : '' };
      default:
        return { text: 'オンライン', color: 'text-green-400', emoji: '🟢', detail: '' };
    }
  };

  // フレンド申請送信
  const handleSendRequest = async () => {
    if (!username || !searchName.trim()) return;
    if (searchName.trim() === username) {
      setError('自分自身には申請できません');
      return;
    }
    
    setError('');
    setMessage('');
    const result = await sendFriendRequest(username, searchName.trim());
    if (result.success) {
      setMessage('フレンド申請を送信しました！');
      setSearchName('');
    } else {
      setError(result.error || 'エラーが発生しました');
    }
  };

  // 申請承認
  const handleAccept = async (fromUser: string) => {
    if (!username) return;
    const success = await acceptFriendRequest(username, fromUser);
    if (success) {
      await loadData();
      setMessage(`${fromUser} とフレンドになりました！`);
    }
  };

  // 申請拒否
  const handleReject = async (fromUser: string) => {
    if (!username) return;
    await rejectFriendRequest(username, fromUser);
    await loadData();
  };

  // フレンド削除
  const handleRemove = async (friendName: string) => {
    if (!username) return;
    if (!confirm(`${friendName} をフレンドから削除しますか？`)) return;
    await removeFriend(username, friendName);
    await loadData();
    setMessage(`${friendName} をフレンドから削除しました`);
  };

  return (
    <PageLayout>
      <PageHeader title="👥 フレンド" />

        {/* フレンド検索 */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-6">
          <h2 className="text-sm text-slate-400 mb-2">フレンドを追加</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="ユーザー名を入力"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
            />
            <button
              onClick={handleSendRequest}
              disabled={!searchName.trim()}
              className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              申請
            </button>
          </div>
          {message && <p className="text-green-400 text-sm mt-2">{message}</p>}
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {/* フレンド申請 */}
        {requests.length > 0 && (
          <div className="bg-amber-900/30 rounded-lg p-4 border border-amber-700 mb-6">
            <h2 className="text-sm text-amber-400 mb-3">📨 フレンド申請 ({requests.length}件)</h2>
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req.from} className="flex items-center justify-between bg-slate-700 rounded-lg p-3">
                  <span className="font-semibold">{req.from}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(req.from)}
                      className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleReject(req.from)}
                      className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm"
                    >
                      拒否
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* フレンドリスト */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h2 className="text-sm text-slate-400 mb-3">フレンド一覧 ({friends.length}人)</h2>
          {isLoading ? (
            <p className="text-slate-500 text-sm">読み込み中...</p>
          ) : friends.length === 0 ? (
            <p className="text-slate-500 text-sm">まだフレンドがいません</p>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => {
                const status = getStatusDisplay(friendStatuses[friend]);
                return (
                  <div key={friend} className="flex items-center justify-between bg-slate-700 rounded-lg p-3">
                    <div>
                      <span className="font-semibold">{friend}</span>
                      <div className={`text-xs ${status.color}`}>
                        {status.emoji} {status.text}
                      </div>
                      {status.detail && (
                        <div className="text-xs text-slate-400">{status.detail}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(friend)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      削除
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </PageLayout>
  );
}
