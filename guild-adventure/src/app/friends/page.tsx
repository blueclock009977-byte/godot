'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
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
  
  // ステータス表示用のヘルパー関数
  const getStatusDisplay = (fullStatus: FriendFullStatus | undefined) => {
    if (!fullStatus) {
      return { text: 'オフライン', color: 'text-slate-500', emoji: '⚫', detail: '' };
    }
    
    const { status, currentAdventure, multiAdventure } = fullStatus;
    
    // ソロ冒険中をチェック（Web閉じても表示）
    if (currentAdventure) {
      const dungeonName = dungeons[currentAdventure.dungeon as keyof typeof dungeons]?.name || currentAdventure.dungeon;
      const endTime = currentAdventure.startTime + (dungeons[currentAdventure.dungeon as keyof typeof dungeons]?.durationSeconds || 0) * 1000;
      const now = Date.now();
      
      if (now < endTime) {
        // まだ冒険中
        const remaining = Math.ceil((endTime - now) / 60000);
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
    
    // マルチ結果待ちをチェック
    if (multiAdventure && !multiAdventure.claimed) {
      const dungeonName = dungeons[multiAdventure.dungeonId as keyof typeof dungeons]?.name || multiAdventure.dungeonId;
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
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-slate-400 hover:text-white">← 戻る</Link>
          <h1 className="text-2xl font-bold">👥 フレンド</h1>
        </div>

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
      </div>
    </main>
  );
}
