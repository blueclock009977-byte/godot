'use client';

import { useState, useCallback } from 'react';
import { usePolling } from '@/hooks/usePolling';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { EmptyState } from '@/components/EmptyState';
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getMultipleFriendFullStatus,
  getRoom,
  FriendRequest,
  FriendFullStatus,
  MultiRoom,
} from '@/lib/firebase';
import { getStatusDisplay } from '@/lib/utils/status';

export default function FriendsPage() {
  const { username, currentMultiRoom } = useGameStore();
  const [friends, setFriends] = useState<string[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, FriendFullStatus>>({});
  const [myMultiRoom, setMyMultiRoom] = useState<MultiRoom | null>(null);  // 自分が参加中のルーム
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchName, setSearchName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // データ読み込み
  const loadData = useCallback(async () => {
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
    
    // 自分が参加中のマルチルーム情報を取得
    if (currentMultiRoom) {
      const room = await getRoom(currentMultiRoom);
      setMyMultiRoom(room);
    } else {
      setMyMultiRoom(null);
    }
    
    // lastSeenだけ更新（activityは冒険開始/終了時のみ変更）
    const { updateLastSeen } = await import('@/lib/firebase');
    updateLastSeen(username);
    setIsLoading(false);
  }, [username, currentMultiRoom]);

  // 10秒ごとにポーリング
  usePolling(loadData, 10000, !!username);

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
            <EmptyState message="まだフレンドがいません" className="py-4" />
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => {
                // 同じマルチルームにいるフレンドはルーム情報から直接ステータスを生成
                const isInMyRoom = myMultiRoom && myMultiRoom.players && myMultiRoom.players[friend];
                let status;
                if (isInMyRoom) {
                  // 自分と同じルームにいる → ルーム情報から直接ステータスを生成
                  status = getStatusDisplay({
                    ...friendStatuses[friend],
                    multiRoom: myMultiRoom,
                    status: { activity: 'multi', lastSeen: Date.now(), roomCode: currentMultiRoom || undefined, dungeonId: myMultiRoom.dungeonId, startTime: myMultiRoom.startTime },
                  });
                } else {
                  status = getStatusDisplay(friendStatuses[friend]);
                }
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
