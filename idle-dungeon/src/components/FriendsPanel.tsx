'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  removeFriend,
  getFriendsProgress,
  FriendProgress,
  checkUserExists
} from '@/lib/firebase';

type TabType = 'friends' | 'requests' | 'add';

export function FriendsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friendsProgress, setFriendsProgress] = useState<FriendProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const userData = useGameStore(state => state.userData);
  const syncToServer = useGameStore(state => state.syncToServer);
  
  // フレンドの進捗を取得
  const fetchFriendsProgress = async () => {
    if (!userData?.friends?.length) {
      setFriendsProgress([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const progress = await getFriendsProgress(userData.friends);
      setFriendsProgress(progress);
    } catch (e) {
      console.error('Friends progress error:', e);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (isOpen && activeTab === 'friends') {
      fetchFriendsProgress();
    }
  }, [isOpen, activeTab, userData?.friends]);
  
  // フレンドリクエスト送信
  const handleSendRequest = async () => {
    if (!userData || !addUsername.trim()) return;
    
    const target = addUsername.trim();
    
    if (target === userData.username) {
      setMessage({ type: 'error', text: '自分にはリクエストを送れません' });
      return;
    }
    
    if (userData.friends?.includes(target)) {
      setMessage({ type: 'error', text: '既にフレンドです' });
      return;
    }
    
    // ユーザー存在確認
    const exists = await checkUserExists(target);
    if (!exists) {
      setMessage({ type: 'error', text: 'ユーザーが見つかりません' });
      return;
    }
    
    const success = await sendFriendRequest(userData.username, target);
    if (success) {
      setMessage({ type: 'success', text: `${target}にリクエストを送信しました！` });
      setAddUsername('');
    } else {
      setMessage({ type: 'error', text: '送信に失敗しました' });
    }
  };
  
  // リクエスト承認
  const handleAccept = async (fromUsername: string) => {
    if (!userData) return;
    
    const success = await acceptFriendRequest(userData.username, fromUsername);
    if (success) {
      // ローカル状態を更新
      await syncToServer();
      setMessage({ type: 'success', text: `${fromUsername}とフレンドになりました！` });
    }
  };
  
  // リクエスト拒否
  const handleReject = async (fromUsername: string) => {
    if (!userData) return;
    
    await rejectFriendRequest(userData.username, fromUsername);
    await syncToServer();
  };
  
  // フレンド削除
  const handleRemoveFriend = async (friendUsername: string) => {
    if (!userData) return;
    
    if (!confirm(`${friendUsername}をフレンドから削除しますか？`)) return;
    
    await removeFriend(userData.username, friendUsername);
    await syncToServer();
    fetchFriendsProgress();
  };
  
  // メッセージを3秒後にクリア
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  const friendRequests = userData?.friendRequests ?? [];
  const requestCount = friendRequests.length;
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-44 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
      >
        👥 フレンド
        {requestCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            {requestCount}
          </span>
        )}
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-[480px] max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">👥 フレンド</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* メッセージ */}
        {message && (
          <div className={`p-3 text-sm ${
            message.type === 'success' ? 'bg-emerald-600/30 text-emerald-400' : 'bg-red-600/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}
        
        {/* タブ */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'friends'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👤 フレンド ({userData?.friends?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 text-sm font-medium relative ${
              activeTab === 'requests'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📩 リクエスト
            {requestCount > 0 && (
              <span className="absolute -top-1 right-4 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                {requestCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'add'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ➕ 追加
          </button>
        </div>
        
        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'friends' && (
            <FriendsTab
              friends={friendsProgress}
              isLoading={isLoading}
              onRemove={handleRemoveFriend}
              onRefresh={fetchFriendsProgress}
            />
          )}
          {activeTab === 'requests' && (
            <RequestsTab
              requests={friendRequests}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          )}
          {activeTab === 'add' && (
            <AddFriendTab
              username={addUsername}
              onUsernameChange={setAddUsername}
              onSend={handleSendRequest}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// フレンド一覧タブ
function FriendsTab({
  friends,
  isLoading,
  onRemove,
  onRefresh,
}: {
  friends: FriendProgress[];
  isLoading: boolean;
  onRemove: (username: string) => void;
  onRefresh: () => void;
}) {
  if (isLoading) {
    return <div className="text-center text-slate-400 py-8">読み込み中...</div>;
  }
  
  if (friends.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        <p className="mb-4">フレンドがいません</p>
        <p className="text-sm">「追加」タブからフレンドを追加しましょう！</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <button
        onClick={onRefresh}
        className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm mb-4"
      >
        🔄 更新
      </button>
      
      {friends.map(friend => (
        <div
          key={friend.username}
          className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50"
        >
          {/* オンライン状態 */}
          <div className={`w-3 h-3 rounded-full ${
            friend.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
          }`} />
          
          {/* ユーザー情報 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{friend.username}</span>
              {friend.isOnline && (
                <span className="text-xs text-emerald-400">オンライン</span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Lv.{friend.level} | 最高 {friend.highestFloor}F | 現在 {friend.currentFloor}F
            </div>
          </div>
          
          {/* 削除ボタン */}
          <button
            onClick={() => onRemove(friend.username)}
            className="text-slate-500 hover:text-red-400 text-sm"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// リクエストタブ
function RequestsTab({
  requests,
  onAccept,
  onReject,
}: {
  requests: Array<{ from: string; timestamp: number }>;
  onAccept: (from: string) => void;
  onReject: (from: string) => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        フレンドリクエストはありません
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {requests.map(request => (
        <div
          key={request.from}
          className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50"
        >
          <div className="flex-1">
            <span className="font-medium text-white">{request.from}</span>
            <div className="text-xs text-slate-400 mt-0.5">
              {formatTimeAgo(request.timestamp)}
            </div>
          </div>
          
          <button
            onClick={() => onAccept(request.from)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1.5 rounded"
          >
            承認
          </button>
          <button
            onClick={() => onReject(request.from)}
            className="bg-slate-600 hover:bg-slate-500 text-white text-sm px-3 py-1.5 rounded"
          >
            拒否
          </button>
        </div>
      ))}
    </div>
  );
}

// フレンド追加タブ
function AddFriendTab({
  username,
  onUsernameChange,
  onSend,
}: {
  username: string;
  onUsernameChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">
        フレンドのユーザー名を入力してリクエストを送信
      </p>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="ユーザー名"
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          onKeyPress={(e) => e.key === 'Enter' && onSend()}
        />
        <button
          onClick={onSend}
          disabled={!username.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg"
        >
          送信
        </button>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(diff / 86400000);
  return `${days}日前`;
}
