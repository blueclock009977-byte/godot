'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePolling } from '@/hooks/usePolling';
import { useUserActivity } from '@/hooks/useUserActivity';
import { useGameStore } from '@/store/gameStore';
import { getItemById } from '@/lib/data/items';
import { getEquipmentById } from '@/lib/data/equipments';
import { dungeons } from '@/lib/data/dungeons';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';
import { getInvitations, getFriendRequests, getPublicRooms, getSoloAdventure, claimSoloAdventure, clearSoloAdventure, RoomInvitation, FriendRequest, SoloAdventureResult } from '@/lib/firebase';
import { LoadingScreen } from '@/components/LoadingScreen';
import { HowToPlayModal } from '@/components/HowToPlayModal';
import { CharacterIcon } from '@/components/CharacterIcon';
import { useChallengeStore } from '@/store/challengeStore';

// クールダウン時間をフォーマット
function formatCooldown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function LoginScreen() {
  const { login, autoLogin, isLoading } = useGameStore();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isAutoLogging, setIsAutoLogging] = useState(true);
  
  useEffect(() => {
    const tryAutoLogin = async () => {
      await autoLogin();
      setIsAutoLogging(false);
    };
    tryAutoLogin();
  }, [autoLogin]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    const result = await login(username.trim());
    
    if (result.success) {
      if (result.isNew) {
        setMessage('新規登録しました！');
      } else {
        setMessage('ログインしました！');
      }
    } else {
      setError(result.error || 'エラーが発生しました');
    }
  };
  
  if (isAutoLogging) {
    return <LoadingScreen />;
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md flex flex-col items-center justify-center min-h-screen">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            ギルドアドベンチャー
          </h1>
          <p className="text-slate-400">放置系ビルド探索RPG</p>
        </div>
        
        <div className="w-full bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-center">ログイン / 新規登録</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">ユーザー名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="2〜20文字"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                maxLength={20}
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-300">
                {error}
              </div>
            )}
            
            {message && (
              <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-sm text-green-300">
                {message}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                isLoading || !username.trim()
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isLoading ? '処理中...' : 'ログイン / 新規登録'}
            </button>
          </form>
          
          <p className="mt-4 text-xs text-slate-500 text-center">
            ユーザー名が存在すればログイン、なければ新規登録されます
          </p>
        </div>
        
        <div className="mt-8 text-center text-slate-500 text-xs">
          <p>v0.9.63 Beta</p>
        </div>
      </div>
    </main>
  );
}

function GameScreen() {
  const { characters, party, currentAdventure, currentMultiRoom, username, logout, inventory, equipments, coins, addItem, addEquipment, addCoins, syncToServer } = useGameStore();
  const { progress: challengeProgress, loadData: loadChallengeData, canChallenge, getRemainingCooldown } = useChallengeStore();
  const [invitations, setInvitations] = useState<RoomInvitation[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [publicRoomCount, setPublicRoomCount] = useState(0);
  const [challengeCooldown, setChallengeCooldown] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [unclaimedSolo, setUnclaimedSolo] = useState<SoloAdventureResult | null>(null);
  const [isClaimingSolo, setIsClaimingSolo] = useState(false);
  
  // ユーザーアクティビティ検知
  const { isActive } = useUserActivity();
  
  // 初回データロード（通知 + チャレンジ + 未受け取りソロ報酬）
  useEffect(() => {
    if (!username) return;
    
    const loadInitialData = async () => {
      try {
        const [invites, requests, rooms, soloAdv] = await Promise.all([
          getInvitations(username),
          getFriendRequests(username),
          getPublicRooms(),
          getSoloAdventure(username),
        ]);
        setInvitations(invites);
        setFriendRequests(requests);
        setPublicRoomCount(rooms.length);
        // 未受け取りの報酬があれば表示
        if (soloAdv && !soloAdv.claimed) {
          setUnclaimedSolo(soloAdv);
        } else {
          setUnclaimedSolo(null);
        }
        await loadChallengeData(username);
        setIsDataLoaded(true);
      } catch (e) {
        console.error('Failed to load initial data:', e);
        setIsDataLoaded(true); // エラーでも表示
      }
    };
    loadInitialData();
  }, [username, loadChallengeData]);
  
  // 通知をポーリング + ステータス更新（初回ロード後）
  const loadNotifications = useCallback(async () => {
    if (!isDataLoaded) return;
    try {
      const [invites, requests] = await Promise.all([
        getInvitations(username!),
        getFriendRequests(username!),
      ]);
      setInvitations(invites);
      setFriendRequests(requests);
      // アクティブな場合のみlastSeenを更新
      if (isActive()) {
        const { updateLastSeen } = await import('@/lib/firebase');
        updateLastSeen(username!);
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }, [username, isActive, isDataLoaded]);
  usePolling(loadNotifications, 10000, !!username && isDataLoaded);
  
  // 公開ルーム数を取得（初回ロード後）
  const loadPublicRooms = useCallback(async () => {
    if (!isDataLoaded) return;
    try {
      const rooms = await getPublicRooms();
      setPublicRoomCount(rooms.length);
    } catch (e) {
      console.error('Failed to load public rooms:', e);
    }
  }, [isDataLoaded]);
  usePolling(loadPublicRooms, 10000, isDataLoaded);
  
  // チャレンジクールダウンを更新（1秒ごと）
  useEffect(() => {
    const updateCooldown = () => {
      setChallengeCooldown(getRemainingCooldown());
    };
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [getRemainingCooldown, challengeProgress]);
  
  // ソロ冒険中の情報を計算
  const soloAdventureInfo = currentAdventure ? (() => {
    const dungeonData = dungeons[currentAdventure.dungeon];
    const elapsed = (Date.now() - currentAdventure.startTime) / 1000;
    const remaining = Math.max(0, (currentAdventure.duration / 1000) - elapsed);
    const isDone = remaining <= 0;
    return {
      dungeonName: dungeonData?.name || currentAdventure.dungeon,
      remainingTime: Math.ceil(remaining),
      isDone,
    };
  })() : null;
  
  // マルチ冒険中の情報を取得
  const [multiRoomInfo, setMultiRoomInfo] = useState<{ dungeonName: string; remainingTime: number; status: string } | null>(null);
  
  useEffect(() => {
    if (!currentMultiRoom) {
      setMultiRoomInfo(null);
      return;
    }
    
    // ルーム情報を取得
    const fetchRoomInfo = async () => {
      try {
        const { getRoom } = await import('@/lib/firebase');
        const { dungeons } = await import('@/lib/data/dungeons');
        const room = await getRoom(currentMultiRoom);
        if (room) {
          const dungeonData = dungeons[room.dungeonId as keyof typeof dungeons];
          const duration = room.actualDurationSeconds || dungeonData?.durationSeconds || 1800;
          const elapsed = room.startTime ? (Date.now() - room.startTime) / 1000 : 0;
          const remaining = Math.max(0, duration - elapsed);
          setMultiRoomInfo({
            dungeonName: dungeonData?.name || room.dungeonId,
            remainingTime: Math.ceil(remaining),
            status: room.status,
          });
        }
      } catch (e) {
        console.error('Failed to fetch room info:', e);
      }
    };
    
    fetchRoomInfo();
    const interval = setInterval(fetchRoomInfo, 5000); // 5秒ごとに更新
    return () => clearInterval(interval);
  }, [currentMultiRoom]);
  
  const partyCount = [...(party.front || []), ...(party.back || [])].filter(Boolean).length;
  const itemCount = Object.values(inventory).reduce((sum, count) => sum + count, 0);
  
  // ソロ報酬受け取り処理
  const handleClaimSolo = async () => {
    if (!username || isClaimingSolo || !unclaimedSolo) return;
    setIsClaimingSolo(true);
    try {
      const result = await claimSoloAdventure(username);
      if (result.success) {
        // ローカルストアに反映
        if (result.itemIds && result.itemIds.length > 0) {
          for (const itemId of result.itemIds) {
            addItem(itemId);
          }
        } else if (result.itemId) {
          addItem(result.itemId);
        }
        if (result.equipmentIds && result.equipmentIds.length > 0) {
          for (const eqId of result.equipmentIds) {
            addEquipment(eqId);
          }
        } else if (result.equipmentId) {
          addEquipment(result.equipmentId);
        }
        if (result.coinReward) {
          addCoins(result.coinReward);
        }
        // サーバーに同期
        syncToServer();
        // Firebase上のソロ冒険結果をクリア
        await clearSoloAdventure(username);
        // UI状態をクリア
        setUnclaimedSolo(null);
      } else {
        console.error('Failed to claim solo reward: already claimed');
      }
    } catch (e) {
      console.error('Failed to claim solo reward:', e);
    } finally {
      setIsClaimingSolo(false);
    }
  };
  
  // データロード完了まで待機
  if (!isDataLoaded) {
    return <LoadingScreen />;
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              ギルドアドベンチャー
            </h1>
            <p className="text-sm text-slate-400">ようこそ、{username} さん</p>
            <p className="text-sm text-amber-400">🪙 {coins} コイン</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHowToPlay(true)}
              className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 border border-amber-600 rounded"
            >
              ❓遊び方
            </button>
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 border border-slate-600 rounded"
            >
              ログアウト
            </button>
          </div>
        </div>
        
        {/* マルチ冒険中バナー */}
        {currentMultiRoom && multiRoomInfo && (
          <Link href={`/multi/${currentMultiRoom}`} className="block mb-4">
            <div className="bg-amber-900/50 rounded-lg p-4 border border-amber-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <p className="font-semibold">{multiRoomInfo.dungeonName} 探索中</p>
                    <p className="text-sm text-amber-300">
                      {multiRoomInfo.status === 'done' 
                        ? '✅ 探索完了！タップして結果を確認'
                        : multiRoomInfo.status === 'battle'
                        ? (multiRoomInfo.remainingTime <= 0
                          ? '✅ 探索完了！タップして結果を確認'
                          : `残り ${Math.floor(multiRoomInfo.remainingTime / 60)}分${multiRoomInfo.remainingTime % 60}秒`)
                        : multiRoomInfo.status === 'waiting'
                        ? '👥 待機中... タップしてルームへ'
                        : '待機中...'}
                    </p>
                  </div>
                </div>
                <span className="text-amber-400">→</span>
              </div>
            </div>
          </Link>
        )}
        
        {/* ソロ冒険中バナー */}
        {currentAdventure && soloAdventureInfo && (
          <Link href="/adventure" className="block mb-4">
            <div className="bg-green-900/50 rounded-lg p-4 border border-green-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🗡️</span>
                  <div>
                    <p className="font-semibold">{soloAdventureInfo.dungeonName} 探索中</p>
                    <p className="text-sm text-green-300">
                      {soloAdventureInfo.isDone 
                        ? '✅ 探索完了！タップして結果を確認'
                        : `残り ${Math.floor(soloAdventureInfo.remainingTime / 60)}分${soloAdventureInfo.remainingTime % 60}秒`}
                    </p>
                  </div>
                </div>
                <span className="text-green-400">→</span>
              </div>
            </div>
          </Link>
        )}
        
        {/* ソロ報酬未受け取りバナー */}
        {unclaimedSolo && (
          <div className="mb-4 bg-yellow-900/50 rounded-lg p-4 border border-yellow-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="font-semibold">ソロ冒険の報酬があります！</p>
                <p className="text-sm text-yellow-300">
                  {dungeons[unclaimedSolo.dungeonId as keyof typeof dungeons]?.name || unclaimedSolo.dungeonId}
                  {unclaimedSolo.victory ? ' - 勝利' : ' - 敗北'}
                </p>
              </div>
            </div>
            {/* 報酬内容 */}
            <div className="bg-slate-800/50 rounded p-2 mb-3 text-sm">
              <p className="text-amber-400">🪙 {unclaimedSolo.coinReward} コイン</p>
              {unclaimedSolo.droppedItemIds && unclaimedSolo.droppedItemIds.length > 0 && (
                <p className="text-green-300">
                  💎 {unclaimedSolo.droppedItemIds.map(id => getItemById(id)?.name || id).join(', ')}
                </p>
              )}
              {unclaimedSolo.droppedEquipmentIds && unclaimedSolo.droppedEquipmentIds.length > 0 && (
                <p className="text-blue-300">
                  ⚔️ {unclaimedSolo.droppedEquipmentIds.map(id => getEquipmentById(id)?.name || id).join(', ')}
                </p>
              )}
            </div>
            {/* 受け取りボタン */}
            <button
              onClick={handleClaimSolo}
              disabled={isClaimingSolo}
              className={`w-full py-2 rounded font-semibold transition-colors ${
                isClaimingSolo
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-500 text-white'
              }`}
            >
              {isClaimingSolo ? '受け取り中...' : '報酬を受け取る'}
            </button>
          </div>
        )}
        
        {/* 招待通知 */}
        {invitations.length > 0 && (
          <Link href="/multi" className="block mb-4">
            <div className="bg-purple-900/50 rounded-lg p-4 border border-purple-600 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📨</span>
                <div>
                  <p className="font-semibold">マルチプレイに招待されています！</p>
                  <p className="text-sm text-purple-300">{invitations.length}件の招待 - タップして確認</p>
                </div>
              </div>
            </div>
          </Link>
        )}
        
        <div className="space-y-4">
          {/* マルチプレイ */}
          {currentMultiRoom ? (
            <div className="bg-slate-700 rounded-lg p-4 border border-slate-600 opacity-50 cursor-not-allowed">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">👥 マルチ冒険</h2>
                  <p className="text-slate-400 text-sm">マルチ冒険中です</p>
                </div>
                <span className="text-slate-500">🚫</span>
              </div>
            </div>
          ) : (
            <Link href="/multi" className="block">
              <div className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 border border-purple-500 transition-colors relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">👥 マルチ冒険</h2>
                    <p className="text-slate-400 text-sm">
                      {publicRoomCount > 0 ? (
                        <span className="text-green-300">🌐 公開ルーム {publicRoomCount}件あり！</span>
                      ) : (
                        '（6キャラまで編成可能）'
                      )}
                    </p>
                  </div>
                  <span className="text-purple-400">→</span>
                </div>
                {invitations.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                    {invitations.length}
                  </span>
                )}
              </div>
            </Link>
          )}
          
          {/* ソロ冒険 */}
          {partyCount > 0 && !currentAdventure ? (
            <Link href="/dungeon" className="block">
              <div className="bg-slate-700 hover:bg-slate-600 border-amber-500 rounded-lg p-4 border transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">🗺️ ソロ冒険</h2>
                    <p className="text-slate-400 text-sm">（6キャラまで編成可能）</p>
                  </div>
                  <span className="text-amber-400">→</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="bg-slate-700 border-slate-600 opacity-50 cursor-not-allowed rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">🗺️ ソロ冒険</h2>
                  <p className="text-slate-400 text-sm">
                    {currentAdventure ? 'ソロ冒険中です' : 'パーティを編成してください'}
                  </p>
                </div>
                <span className="text-slate-500">🚫</span>
              </div>
            </div>
          )}
          
          {/* チャレンジダンジョン */}
          <Link href="/challenge" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg p-4 border border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">⚔️ チャレンジダンジョン</h2>
                  <p className="text-slate-400 text-sm">
                    {canChallenge() ? (
                      <span className="text-green-300">🟢 出撃可能！</span>
                    ) : (
                      <span>⏰ あと {formatCooldown(challengeCooldown)}</span>
                    )}
                    {challengeProgress && ` | 最高: ${challengeProgress.highestFloor}F`}
                  </p>
                </div>
                <span className="text-orange-400">→</span>
              </div>
            </div>
          </Link>
          
          {/* キャラ作成 */}
          <Link href="/create" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">👤 キャラ作成</h2>
                  <p className="text-slate-400 text-sm">新しい冒険者を雇う</p>
                </div>
                <span className="text-slate-400">→</span>
              </div>
            </div>
          </Link>
          
          {/* パーティ編成 */}
          <Link href="/party" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">🛡️ パーティ編成</h2>
                  <p className="text-slate-400 text-sm">冒険者を編成する</p>
                </div>
                <span className="text-amber-400">{partyCount}/6</span>
              </div>
            </div>
          </Link>
          
          {/* フレンド */}
          <Link href="/friends" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 border border-slate-600 transition-colors relative">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">🤝 フレンド</h2>
                  <p className="text-slate-400 text-sm">フレンドを追加・招待</p>
                </div>
                <span className="text-slate-400">→</span>
              </div>
              {friendRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                  {friendRequests.length}
                </span>
              )}
            </div>
          </Link>
          
          {/* アイテム */}
          <Link href="/items" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">📦 アイテム</h2>
                  <p className="text-slate-400 text-sm">売却してコインを獲得</p>
                </div>
                <span className="text-amber-400">{itemCount}個</span>
              </div>
            </div>
          </Link>
          
          {/* ショップ */}
          <Link href="/shop" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg p-4 border border-emerald-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">🛒 ショップ</h2>
                  <p className="text-slate-400 text-sm">血統書・指南書を購入</p>
                </div>
                <span className="text-emerald-400">200🪙</span>
              </div>
            </div>
          </Link>
          
          {/* 過去の挑戦ログ */}
          <Link href="/history" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 border border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">📜 過去の挑戦ログ</h2>
                  <p className="text-slate-400 text-sm">過去20回分の冒険履歴</p>
                </div>
                <span className="text-slate-400">→</span>
              </div>
            </div>
          </Link>
          
          {/* ダンジョン一覧 */}
          <Link href="/dungeons" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 border border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">🗺️ ダンジョン一覧</h2>
                  <p className="text-slate-400 text-sm">モンスター情報・攻略ヒント</p>
                </div>
                <span className="text-slate-400">→</span>
              </div>
            </div>
          </Link>
          
          {/* シミュレーションモード */}
          <Link href="/simulation" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 border border-cyan-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">🎮 シミュレーション</h2>
                  <p className="text-slate-400 text-sm">ボス戦を模擬体験（報酬なし）</p>
                </div>
                <span className="text-cyan-400">→</span>
              </div>
            </div>
          </Link>
        </div>
        
        
        <div className="mt-8 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">👤 所属冒険者 ({characters.length}人)</h3>
          {characters.length === 0 ? (
            <p className="text-xs text-slate-500">まだ冒険者がいません</p>
          ) : (
            <div className="space-y-2">
              {characters.map(char => {
                const eq = char.equipmentId ? getEquipmentById(char.equipmentId) : null;
                // 強化可能判定
                const raceTicketId = `ticket_${char.race}`;
                const jobBookId = `book_${char.job}`;
                const raceTreasureId = `treasure_${char.race}`;
                const jobTreasureId = `treasure_${char.job}`;
                const raceTicketCount = inventory[raceTicketId] || 0;
                const jobBookCount = inventory[jobBookId] || 0;
                const hasRaceTreasure = (inventory[raceTreasureId] || 0) > 0;
                const hasJobTreasure = (inventory[jobTreasureId] || 0) > 0;
                // マスタリー可能判定
                const canUnlockRaceMastery = !char.raceMastery && raceTicketCount >= 5;
                const canUnlockRaceMastery2 = char.raceMastery && !char.raceMastery2 && raceTicketCount >= 10;
                const canUnlockJobMastery = !char.jobMastery && jobBookCount >= 5;
                const canUnlockJobMastery2 = char.jobMastery && !char.jobMastery2 && jobBookCount >= 10;
                // 秘宝使用可能判定（まだ使用してない場合）
                const canUseRaceTreasure = hasRaceTreasure && !char.raceTreasureBonus;
                const canUseJobTreasure = hasJobTreasure && !char.jobTreasureBonus;
                // 強化可能フラグ
                const canUpgrade = canUnlockRaceMastery || canUnlockRaceMastery2 || canUnlockJobMastery || canUnlockJobMastery2 || canUseRaceTreasure || canUseJobTreasure;
                
                return (
                <Link key={char.id} href={`/character/${char.id}`} className="block">
                  <div className={`flex items-center gap-3 p-2 rounded hover:bg-slate-600 transition-colors ${canUpgrade ? 'bg-amber-900/30 border border-amber-600' : 'bg-slate-700'}`}>
                    {/* キャラアイコン */}
                    <div className="relative">
                      <CharacterIcon race={char.race} job={char.job} size={40} />
                      {canUpgrade && (
                        <span className="absolute -top-1 -right-1 text-xs">⬆️</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{char.name}</span>
                        <span className="text-xs text-amber-400 flex-shrink-0">Lv.{char.level || 1}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {races[char.race]?.name || char.race} / {jobs[char.job]?.name || char.job}
                        {eq && <span className={`ml-2 ${eq.rarity === "rare" ? "text-yellow-300" : "text-slate-300"}`}>🎒{eq.name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canUpgrade && <span className="text-green-400 text-xs font-bold">強化可</span>}
                      {char.raceMastery && <span className="text-amber-400 text-xs">★種</span>}
                      {char.jobMastery && <span className="text-amber-400 text-xs">★職</span>}
                      {char.raceMastery2 && <span className="text-purple-400 text-xs">★種2</span>}
                      {char.jobMastery2 && <span className="text-purple-400 text-xs">★職2</span>}
                      <span className="text-slate-400">→</span>
                    </div>
                  </div>
                </Link>
              );})}
            </div>
          )}
        </div>
        
        <div className="mt-4 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">💎 アイテム</h3>
          {Object.keys(inventory).filter(id => inventory[id] > 0).length === 0 ? (
            <p className="text-xs text-slate-500">アイテムを持っていません</p>
          ) : (
            <div className="space-y-1 text-sm">
              {Object.entries(inventory)
                .filter(([, count]) => count > 0)
                .map(([itemId, count]) => {
                  const item = getItemById(itemId);
                  if (!item) return null;
                  return (
                    <div key={itemId} className="flex justify-between">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-amber-400">×{count}</span>
                    </div>
                  );
                })}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">
            ダンジョンボス撃破でドロップ
          </p>
        </div>
        
        {/* 装備一覧 */}
        <div className="mt-4 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">⚔️ 装備</h3>
          {Object.keys(equipments).filter(id => equipments[id] > 0).length === 0 ? (
            <p className="text-xs text-slate-500">装備を持っていません</p>
          ) : (
            <div className="space-y-1 text-sm">
              {Object.entries(equipments)
                .filter(([, count]) => count > 0)
                .map(([eqId, count]) => {
                  const eq = getEquipmentById(eqId);
                  if (!eq) return null;
                  return (
                    <div key={eqId} className="flex justify-between">
                      <span className={eq.rarity === 'rare' ? 'text-yellow-300' : 'text-slate-300'}>
                        {eq.name}
                      </span>
                      <span className="text-amber-400">×{count}</span>
                    </div>
                  );
                })}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">
            キャラ詳細から装備可能
          </p>
        </div>
        
        <div className="mt-8 text-center text-slate-500 text-xs">
          <p>v0.9.63 Beta</p>
        </div>
      </div>
      
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </main>
  );
}

export default function Home() {
  const { isLoggedIn, autoLogin, username, _dataLoaded } = useGameStore();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR/CSRハイドレーション同期のための標準パターン
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (mounted && isLoggedIn && username) {
      autoLogin();
    }
  }, [mounted, isLoggedIn, username, autoLogin]);
  
  if (!mounted || (isLoggedIn && !_dataLoaded)) {
    return <LoadingScreen />;
  }
  
  return isLoggedIn ? <GameScreen /> : <LoginScreen />;
}
// Trigger Vercel rebuild - Sun Mar  1 05:19:23 UTC 2026
