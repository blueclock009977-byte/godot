'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePolling } from '@/hooks/usePolling';
import { useGameStore } from '@/store/gameStore';
import { LoadingScreen } from '@/components/LoadingScreen';
import { 
  getRoom, 
  updateRoomCharacters, 
  updateRoomReady, 
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
import { applyCoinBonus } from '@/lib/drop/dropBonus';
import InviteModal from '@/components/multi/InviteModal';
import BattleResultView from '@/components/multi/BattleResultView';
import BattleProgressView from '@/components/multi/BattleProgressView';
import WaitingRoomView from '@/components/multi/WaitingRoomView';
import { startMultiBattle } from '@/lib/multi/battleStarter';
import { useBattleProgress } from '@/hooks/useBattleProgress';

export default function MultiRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { username, characters, addItem, addEquipment, addCoins, syncToServer, isLoading, isLoggedIn, autoLogin, addHistory, setCurrentMultiRoom, saveMultiParty, getLastMultiParty } = useGameStore();
  
  const [room, setRoom] = useState<MultiRoom | null>(null);
  const [roomDeleted, setRoomDeleted] = useState(false);
  const [hadRoomOnce, setHadRoomOnce] = useState(false);
  const [selectedChars, setSelectedChars] = useState<RoomCharacter[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [myDrop, setMyDrop] = useState<string[] | null>(null);
  const [myEquipment, setMyEquipment] = useState<string[] | null>(null);
  const [myCoinReward, setMyCoinReward] = useState<number>(0);
  const [dropClaimed, setDropClaimed] = useState(false);
  const dropClaimedRef = useRef(false); // 二重実行防止用
  const [isClaimingDrop, setIsClaimingDrop] = useState(false); // 報酬受け取り中フラグ
  
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
        
        // 新しいマルチに参加したら、古いmultiAdventureをクリア（ステータス表示のため）
        // waiting/battleどちらでもクリアする（冒険中に参加した場合も対応）
        if (data.status === 'waiting' || data.status === 'battle') {
          clearMultiAdventure(username);  // 非同期だが待たない
          // ステータスも即座に更新（フレンド画面から正しく見えるように）
          updateUserStatus(username, 'multi', { roomCode: code, dungeonId: data.dungeonId, startTime: data.startTime });
        }
      }
      
      // 自分がキックされた（playersに自分がいない）場合
      if (username && data.players && !data.players[username] && data.status === 'waiting') {
        setRoomDeleted(true);
      }
    } else if (hadRoomOnce && !dropClaimedRef.current) {
      // ルームが存在していたのに消えた場合（ホストが退出）、ただし報酬受け取り済みなら正常終了
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
  
  // マルチ編成復元
  const handleLoadParty = useCallback(async () => {
    if (!username || !room || isReady) return;
    const playerCount = room.maxPlayers as 2 | 3;
    const savedChars = getLastMultiParty(playerCount);
    if (!savedChars || savedChars.length === 0) return;
    
    // 保存されたキャラIDから現在のキャラを取得
    const newSelected: RoomCharacter[] = [];
    for (const saved of savedChars) {
      const char = characters.find(c => c.id === saved.charId);
      if (char && newSelected.length < maxCharsPerPlayer) {
        newSelected.push({ character: char, position: saved.position });
      }
    }
    
    // キャラが1人も見つからなかった場合は何もしない
    if (newSelected.length === 0) return;
    
    setSelectedChars(newSelected);
    await updateRoomCharacters(code, username, newSelected);
    
    // 自動的に準備完了にする
    setIsReady(true);
    await updateRoomReady(code, username, true);
  }, [username, room, isReady, characters, maxCharsPerPlayer, code, getLastMultiParty]);
  
  // 保存された編成があるか
  const hasLastParty = room ? !!getLastMultiParty(room.maxPlayers as 2 | 3) : false;
  
  // 準備完了トグル
  const toggleReady = async () => {
    if (!username || selectedChars.length === 0) return;
    
    const newReady = !isReady;
    setIsReady(newReady);
    await updateRoomReady(code, username, newReady);
    
    // 準備完了時に編成を保存（次回の「前の編成を使う」用）
    if (newReady && room) {
      const playerCount = room.maxPlayers as 2 | 3;
      const chars = selectedChars.map(c => ({ charId: c.character.id, position: c.position }));
      await saveMultiParty(playerCount, chars);
    }
    
    // 準備完了で全員揃ったら自動出撃
    if (newReady && room) {
      // 自分を含めて全員readyになるかチェック
      const updatedPlayers = { ...room.players };
      if (updatedPlayers[username]) {
        updatedPlayers[username] = { ...updatedPlayers[username], ready: true };
      }
      const willAllReady = Object.keys(updatedPlayers).length === room.maxPlayers &&
        Object.values(updatedPlayers).every(p => p.ready && p.characters.length > 0);
      
      if (willAllReady) {
        // 少し待ってから自動出撃（UIの更新を待つ）
        setTimeout(() => {
          startBattle();
        }, 500);
      }
    }
  };
  
  // 全員準備完了かチェック
  const allReady = room && Object.values(room.players).length === room.maxPlayers &&
    Object.values(room.players).every(p => p.ready && p.characters.length > 0);
  
  // バトル開始（誰でも可）- バトル結果+ドロップを事前計算してFirebaseに保存
  const [isStarting, setIsStarting] = useState(false);
  const startBattle = async () => {
    if (!room || !username || isStarting) return;
    setIsStarting(true);
    
    // 出撃時に編成を自動保存
    const playerCount = room.maxPlayers as 2 | 3;
    const chars = selectedChars.map(c => ({ charId: c.character.id, position: c.position }));
    await saveMultiParty(playerCount, chars);
    
    const result = await startMultiBattle(code);
    if (!result.success) {
      console.error(result.error);
    }
  };
  
  // バトル完了時のドロップ表示用（自動受け取りはしない）
  useEffect(() => {
    if (room?.status === 'done' && room.battleResult && !dropClaimedRef.current && username) {
      // playerClaimedをチェック（既に受け取り済みかどうか）
      if (room.playerClaimed?.[username]) {
        dropClaimedRef.current = true;
        // 既に処理済みの場合、表示用にドロップ情報を取得
        const drops = room?.playerDropsMulti?.[username] || (room?.playerDrops?.[username] ? [room.playerDrops[username]] : null);
        const equips = room?.playerEquipmentDropsMulti?.[username] || (room?.playerEquipmentDrops?.[username] ? [room.playerEquipmentDrops[username]] : null);
        if (drops) setMyDrop(drops);
        if (equips) setMyEquipment(equips);
        if (room.battleResult?.victory) {
          const baseCoinReward = dungeons[room.dungeonId as keyof typeof dungeons]?.coinReward || 0;
          if (baseCoinReward > 0) {
            const myChars = (room.players[username]?.characters || []).map((rc: RoomCharacter) => rc.character);
            setMyCoinReward(applyCoinBonus(baseCoinReward, myChars));
          }
        }
        setDropClaimed(true);
      }
    }
  }, [room?.status, room?.battleResult, room?.dungeonId, username, room?.playerClaimed, room?.players, room?.playerDrops, room?.playerDropsMulti, room?.playerEquipmentDrops, room?.playerEquipmentDropsMulti]);
  
  // 報酬を手動で受け取る
  const handleClaimDrop = useCallback(async () => {
    if (!room || !username || isClaimingDrop || dropClaimed) return;
    setIsClaimingDrop(true);
    dropClaimedRef.current = true;
    
    try {
      // サーバーからドロップ受け取り
      const result = await claimMultiDrop(code, username);
      
      if (!result.success) {
        // 既に受け取り済み
        setDropClaimed(true);
        setIsClaimingDrop(false);
        return;
      }
      
      // 複数アイテムドロップを受け取り
      if (result.itemIds && result.itemIds.length > 0) {
        setMyDrop(result.itemIds);
        result.itemIds.forEach(id => addItem(id));
        syncToServer();
      } else if (result.itemId) {
        setMyDrop([result.itemId]);
        addItem(result.itemId);
        syncToServer();
      }
      
      // 複数装備ドロップを受け取り
      if (result.equipmentIds && result.equipmentIds.length > 0) {
        setMyEquipment(result.equipmentIds);
        result.equipmentIds.forEach(id => addEquipment(id));
        syncToServer();
      } else if (result.equipmentId) {
        setMyEquipment([result.equipmentId]);
        addEquipment(result.equipmentId);
        syncToServer();
      }
      
      // multiAdventureもクリア
      await clearMultiAdventure(username);
      
      // 勝利時はコインを付与
      if (room.battleResult?.victory) {
        const baseCoinReward = dungeons[room.dungeonId as keyof typeof dungeons]?.coinReward || 0;
        if (baseCoinReward > 0) {
          const myChars = (room.players[username]?.characters || []).map(rc => rc.character);
          const coinReward = applyCoinBonus(baseCoinReward, myChars);
          addCoins(coinReward);
          setMyCoinReward(coinReward);
          syncToServer();
        }
      }

      // 履歴を追加
      const baseCoinRewardForHistory = dungeons[room.dungeonId as keyof typeof dungeons]?.coinReward || 0;
      const myCharsForHistory = (room.players[username]?.characters || []).map((rc: RoomCharacter) => rc.character);
      const coinRewardForHistory = room.battleResult?.victory ? applyCoinBonus(baseCoinRewardForHistory, myCharsForHistory) : 0;
      
      addHistory({
        type: 'multi',
        dungeonId: room.dungeonId,
        victory: room.battleResult?.victory ?? false,
        droppedItemId: result.itemId,
        droppedEquipmentId: result.equipmentId,
        coinReward: coinRewardForHistory,
        logs: room.battleResult?.logs || [],
        roomCode: code,
        players: Object.keys(room.players),
        playerDrops: room.playerDrops,
        playerEquipmentDrops: room.playerEquipmentDrops,
      });
      
      // pendingResultsから削除
      const { removePendingResult, deleteRoomIfAllClaimed, updateUserStatus, getAdventureOnServer } = await import('@/lib/firebase');
      await removePendingResult(username, code);
      await deleteRoomIfAllClaimed(code);
      
      // ソロ冒険中でなければステータスをロビーに戻す
      const soloAdventure = await getAdventureOnServer(username);
      if (!soloAdventure) {
        await updateUserStatus(username, 'lobby');
      }
      
      setCurrentMultiRoom(null);
      setDropClaimed(true);
    } finally {
      setIsClaimingDrop(false);
    }
  }, [room, code, username, isClaimingDrop, dropClaimed, addItem, addEquipment, addCoins, syncToServer, addHistory, setCurrentMultiRoom]);
  
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
  
  // ホームに戻る（退出せずに）
  const handleGoHome = () => {
    // currentMultiRoomは維持したまま（後で戻れるように）
    router.push('/');
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
  
  if (!room || isLoading || !isLoggedIn) {
    return <LoadingScreen />;
  }
  
  const dungeonData = dungeons[room.dungeonId as keyof typeof dungeons];
  
  // バトルログ表示用のキャラとモンスター情報
  const allCharacters = Object.values(room.players || {})
    .flatMap(p => (p.characters || []).map(rc => rc.character));
  const dungeonMonsters = dungeonData ? [
    ...dungeonData.monsters.map(m => m.monster),
    ...(dungeonData.boss ? [dungeonData.boss] : [])
  ] : [];
  
  // 冒険中のUI
  if (room.status === 'battle' && room.startTime) {
    return (
      <BattleProgressView
        dungeonName={dungeonData?.name || '不明なダンジョン'}
        durationSeconds={room.actualDurationSeconds || dungeonData?.durationSeconds || 30}
        startTime={room.startTime}
        progress={progress}
        displayedLogs={displayedLogs}
        characters={allCharacters}
        monsters={dungeonMonsters}
      />
    );
  }
  
  // 結果画面
  if (room.status === 'done' && room.battleResult) {
    return (
      <BattleResultView
        onGoHome={() => { setCurrentMultiRoom(null); router.push("/"); }}
        onClaimDrop={handleClaimDrop}
        isClaiming={isClaimingDrop}
        victory={room.battleResult.victory}
        dungeonName={dungeonData?.name || '不明なダンジョン'}
        myDrop={myDrop}
        myEquipment={myEquipment}
        dropClaimed={dropClaimed}
        logs={room.battleResult.logs || []}
        coinReward={room.battleResult.victory ? myCoinReward : undefined}
        players={Object.keys(room.players)}
        playerDrops={room.playerDrops}
        playerEquipmentDrops={room.playerEquipmentDrops}
        playerDropsMulti={room.playerDropsMulti}
        playerEquipmentDropsMulti={room.playerEquipmentDropsMulti}
        myUsername={username || undefined}
        characters={allCharacters}
        monsters={dungeonMonsters}
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
        onGoHome={handleGoHome}
        onShowInviteModal={() => setShowInviteModal(true)}
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
