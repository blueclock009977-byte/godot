'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePolling } from '@/hooks/usePolling';
import { useGameStore } from '@/store/gameStore';
import { 
  getRoom, 
  updateRoomCharacters, 
  updateRoomReady, 
  updateRoomStatus,
  leaveRoom,
  deleteRoom,
  claimMultiDrop,
  clearMultiAdventure,
  updateUserStatus,
  getFriends,
  sendInvitation,
  getMultipleFriendFullStatus,
  MultiRoom,
  RoomCharacter,
  FriendFullStatus,
} from '@/lib/firebase';
import { dungeons } from '@/lib/data/dungeons';
import { BattleResult } from '@/lib/types';
import InviteModal from '@/components/multi/InviteModal';
import BattleResultView from '@/components/multi/BattleResultView';
import BattleProgressView from '@/components/multi/BattleProgressView';
import WaitingRoomView from '@/components/multi/WaitingRoomView';
import { startMultiBattle } from '@/lib/multi/battleStarter';
import { useBattleProgress } from '@/hooks/useBattleProgress';

export default function MultiRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { username, characters, addItem, addEquipment, addCoins, syncToServer, isLoading, autoLogin, addHistory, setCurrentMultiRoom, saveMultiParty, getLastMultiParty } = useGameStore();
  
  const [room, setRoom] = useState<MultiRoom | null>(null);
  const [roomDeleted, setRoomDeleted] = useState(false);
  const [hadRoomOnce, setHadRoomOnce] = useState(false);
  const [selectedChars, setSelectedChars] = useState<RoomCharacter[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [myDrop, setMyDrop] = useState<string | null>(null);
  const [dropClaimed, setDropClaimed] = useState(false);
  const dropClaimedRef = useRef(false); // 二重実行防止用
  
  // フレンド招待関連
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, FriendFullStatus>>({});
  const [inviteSent, setInviteSent] = useState<string[]>([]);
  
  // 冒険中のログ表示用（カスタムフック）
  const { displayedLogs, progress } = useBattleProgress({
    roomStatus: room?.status,
    battleResult: room?.battleResult,
    startTime: room?.startTime,
    dungeonId: room?.dungeonId,
    roomCode: code,
    actualDurationSeconds: room?.actualDurationSeconds,
  });
  
  // 自動ログイン（ストアの初期化）
  useEffect(() => {
    if (!username) {
      autoLogin();
    }
  }, [username, autoLogin]);
  
  // ルーム情報をポーリング（1秒ごと）
  const fetchRoom = useCallback(async () => {
    const data = await getRoom(code);
    if (data) {
      setHadRoomOnce(true);
      setRoom(data);
      setCurrentMultiRoom(code); // ホームからの自動リダイレクト用
      
      // 自分の選択状態を復元
      if (username && data.players && data.players[username]) {
        const myChars = data.players[username].characters || [];
        setSelectedChars(myChars);
        setIsReady(data.players[username].ready);
      }
      
      // 自分がキックされた（playersに自分がいない）場合
      if (username && data.players && !data.players[username] && data.status === 'waiting') {
        setRoomDeleted(true);
      }
    } else if (hadRoomOnce) {
      // ルームが存在していたのに消えた場合（ホストが退出）
      setRoomDeleted(true);
    }
  }, [code, username, hadRoomOnce, setCurrentMultiRoom]);
  usePolling(fetchRoom, 1000);
  
  // ステータス更新（マルチ中、30秒ごと）
  const updateStatus = useCallback(async () => {
    if (!username || !room) return;
    updateUserStatus(username, 'multi', { roomCode: code, dungeonId: room.dungeonId, startTime: room.startTime });
  }, [username, room, code]);
  usePolling(updateStatus, 30000, !!username && !!room);
  
  // フレンドリスト取得（招待モーダル表示中のみ、5秒ごと）
  const loadFriends = useCallback(async () => {
    if (!username) return;
    try {
      const f = await getFriends(username);
      setFriends(f);
      if (f.length > 0) {
        const statuses = await getMultipleFriendFullStatus(f);
        setFriendStatuses(statuses);
      }
    } catch (e) {
      console.error('Failed to load friends:', e);
    }
  }, [username]);
  usePolling(loadFriends, 5000, !!username && showInviteModal);
  
  // フレンド招待
  const handleInviteFriend = async (friendName: string) => {
    if (!username || !room) return;
    await sendInvitation(username, friendName, code, room.dungeonId);
    setInviteSent([...inviteSent, friendName]);
  };
  
  // キャラ選択数の上限
  const maxCharsPerPlayer = room?.maxPlayers === 2 ? 3 : 2;
  
  // キャラ選択トグル（前衛/後衛を選んで追加）
  const addChar = useCallback(async (charId: string, position: 'front' | 'back') => {
    if (!username || !room || isReady) return;
    if (selectedChars.length >= maxCharsPerPlayer) return;
    if (selectedChars.some(c => c.character.id === charId)) return;
    
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    
    const newSelected = [...selectedChars, { character: char, position }];
    setSelectedChars(newSelected);
    await updateRoomCharacters(code, username, newSelected);
  }, [username, room, isReady, selectedChars, maxCharsPerPlayer, characters, code]);
  
  // キャラを外す
  const removeChar = useCallback(async (charId: string) => {
    if (!username || !room || isReady) return;
    
    const newSelected = selectedChars.filter(c => c.character.id !== charId);
    setSelectedChars(newSelected);
    await updateRoomCharacters(code, username, newSelected);
  }, [username, room, isReady, selectedChars, code]);
  
  // マルチ編成保存
  const handleSaveParty = useCallback(() => {
    if (!room || selectedChars.length === 0) return;
    const playerCount = room.maxPlayers as 2 | 3;
    const chars = selectedChars.map(c => ({ charId: c.character.id, position: c.position }));
    saveMultiParty(playerCount, chars);
  }, [room, selectedChars, saveMultiParty]);
  
  // マルチ編成復元
  const handleLoadParty = useCallback(async () => {
    if (!username || !room || isReady) return;
    const playerCount = room.maxPlayers as 2 | 3;
    const savedChars = getLastMultiParty(playerCount);
    if (!savedChars) return;
    
    // 保存されたキャラIDから現在のキャラを取得
    const newSelected: { character: any; position: 'front' | 'back' }[] = [];
    for (const saved of savedChars) {
      const char = characters.find(c => c.id === saved.charId);
      if (char && newSelected.length < maxCharsPerPlayer) {
        newSelected.push({ character: char, position: saved.position });
      }
    }
    
    setSelectedChars(newSelected);
    await updateRoomCharacters(code, username, newSelected);
  }, [username, room, isReady, characters, maxCharsPerPlayer, code, getLastMultiParty]);
  
  // 保存された編成があるか
  const hasLastParty = room ? !!getLastMultiParty(room.maxPlayers as 2 | 3) : false;
  
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
  
  // バトル開始（誰でも可）- バトル結果+ドロップを事前計算してFirebaseに保存
  const [isStarting, setIsStarting] = useState(false);
  const startBattle = async () => {
    if (!room || !username || isStarting) return;
    setIsStarting(true);
    
    const result = await startMultiBattle(code);
    if (!result.success) {
      console.error(result.error);
    }
  };
  
  // バトル完了時にドロップ受け取り（サーバーでclaimed管理）
  useEffect(() => {
    if (room?.status === 'done' && room.battleResult && !dropClaimedRef.current && username) {
      dropClaimedRef.current = true; // 即座にフラグを立てて二重実行防止
      
      const handleClaim = async () => {
        // サーバーからドロップ受け取り
        // claimMultiDropは既に受け取り済みならsuccess=falseを返す（敗北時もフラグ更新）
        const result = await claimMultiDrop(code, username);
        
        // success=false は既に処理済み（別端末やリロードで再実行された場合）
        if (!result.success) {
          setCurrentMultiRoom(null);
        setDropClaimed(true);
          return;
        }
        
        if (result.itemId) {
          setMyDrop(result.itemId);
          addItem(result.itemId);
          syncToServer();
        }
        
        // 装備ドロップを受け取り
        if (result.equipmentId) {
          addEquipment(result.equipmentId);
          syncToServer();
        }
        
        // multiAdventureもクリア（ログイン時の二重受け取り防止）
        await clearMultiAdventure(username);
        
        // 勝利時はコインを付与（自分のキャラのボーナス適用）
        if (room.battleResult.victory) {
          const baseCoinReward = dungeons[room.dungeonId as keyof typeof dungeons]?.coinReward || 0;
          if (baseCoinReward > 0) {
            const { applyCoinBonus } = require('@/lib/drop/dropBonus');
            const myChars = (room.players[username]?.characters || []).map(rc => rc.character);
            const coinReward = applyCoinBonus(baseCoinReward, myChars);
            addCoins(coinReward);
            syncToServer();
          }
        }

        // 履歴を追加（初回のみ）
        addHistory({
          type: 'multi',
          dungeonId: room.dungeonId,
          victory: room.battleResult.victory,
          droppedItemId: result.itemId,
          logs: room.battleResult.logs || [],
          roomCode: code,
          players: Object.keys(room.players),
        });
        
        setCurrentMultiRoom(null);
        setDropClaimed(true);
      };
      
      handleClaim();
    }
  }, [room?.status, room?.battleResult, room?.dungeonId, code, username, addItem, addEquipment, syncToServer, room?.players, addHistory]);
  
  // 退出
  const handleLeave = async () => {
    if (!username) return;
    
    if (room?.hostId === username) {
      await deleteRoom(code);
    } else {
      await leaveRoom(code, username);
    }
    setCurrentMultiRoom(null);
    router.push('/multi');
  };
  
  // ルームが削除された場合
  if (roomDeleted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">😢 ルームが解散されました</div>
          <Link href="/multi" className="text-amber-400 hover:underline">マルチプレイに戻る</Link>
        </div>
      </main>
    );
  }
  
  if (!room || isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div>読み込み中...</div>
      </main>
    );
  }
  
  const dungeonData = dungeons[room.dungeonId as keyof typeof dungeons];
  
  // 冒険中のUI
  if (room.status === 'battle' && room.startTime) {
    return (
      <BattleProgressView
        dungeonName={dungeonData?.name || '不明なダンジョン'}
        durationSeconds={room.actualDurationSeconds || dungeonData?.durationSeconds || 30}
        startTime={room.startTime}
        progress={progress}
        displayedLogs={displayedLogs}
      />
    );
  }
  
  // 結果画面
  if (room.status === 'done' && room.battleResult) {
    return (
      <BattleResultView
        onGoHome={() => { setCurrentMultiRoom(null); router.push("/"); }}
        victory={room.battleResult.victory}
        dungeonName={dungeonData?.name || '不明なダンジョン'}
        myDrop={myDrop}
        dropClaimed={dropClaimed}
        logs={room.battleResult.logs || []}
        coinReward={room.battleResult.victory ? dungeonData?.coinReward : undefined}
      />
    );
  }
  
  // 待機中のUI
  return (
    <>
      <WaitingRoomView
        room={room}
        code={code}
        dungeonName={dungeonData?.name || '不明なダンジョン'}
        dungeonRecommendedPlayers={dungeonData?.recommendedPlayers || 2}
        dungeonDurationSeconds={dungeonData?.durationSeconds || 30}
        selectedChars={selectedChars}
        characters={characters}
        maxCharsPerPlayer={maxCharsPerPlayer}
        isReady={isReady}
        isStarting={isStarting}
        allReady={allReady || false}
        onAddChar={addChar}
        onRemoveChar={removeChar}
        onToggleReady={toggleReady}
        onStartBattle={startBattle}
        onLeave={handleLeave}
        onShowInviteModal={() => setShowInviteModal(true)}
        onSaveParty={handleSaveParty}
        onLoadParty={handleLoadParty}
        hasLastParty={hasLastParty}
      />
      
      {/* フレンド招待モーダル */}
      {showInviteModal && (
        <InviteModal
          code={code}
          players={room.players}
          friends={friends}
          friendStatuses={friendStatuses}
          inviteSent={inviteSent}
          onInvite={handleInviteFriend}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </>
  );
}
