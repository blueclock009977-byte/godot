import { 
  getRoom, 
  updateRoomStatus,
  saveMultiAdventureForUser,
  RoomCharacter,
} from '@/lib/firebase';
import { dungeons } from '@/lib/data/dungeons';
import { runBattle, rollDrop } from '@/lib/battle/engine';
import { Character, Party, BattleResult } from '@/lib/types';

/**
 * 全プレイヤーのキャラクターからパーティを構築
 */
function buildPartyFromPlayers(
  players: Record<string, { characters: RoomCharacter[] }>
): Party {
  const frontChars: Character[] = [];
  const backChars: Character[] = [];

  Object.values(players).forEach(p => {
    (p.characters || []).forEach((rc: RoomCharacter) => {
      if (rc.position === 'front') {
        frontChars.push(rc.character);
      } else {
        backChars.push(rc.character);
      }
    });
  });

  return { front: frontChars, back: backChars };
}

/**
 * バトル結果に参加者情報を追加
 */
function createStartLog(
  dungeonId: string,
  players: Record<string, { characters: RoomCharacter[] }>
): string {
  const dungeonData = dungeons[dungeonId as keyof typeof dungeons];
  let log = `【冒険開始】${dungeonData?.name || dungeonId}\n👥 参加者:\n`;
  
  Object.entries(players).forEach(([playerName, player]) => {
    const chars = (player.characters || []).map((rc: RoomCharacter) => {
      const pos = rc.position === 'front' ? '前' : '後';
      return `${rc.character.name}(${pos})`;
    }).join(', ');
    log += `  ${playerName}: ${chars}\n`;
  });
  
  return log;
}

/**
 * 各プレイヤーのドロップを計算
 */
function calculatePlayerDrops(
  dungeonId: string,
  players: Record<string, { characters: RoomCharacter[] }>
): Record<string, string | undefined> {
  const playerDrops: Record<string, string | undefined> = {};
  
  Object.entries(players).forEach(([playerName, player]) => {
    const chars = (player.characters || []).map(rc => rc.character);
    const drop = rollDrop(dungeonId as any, chars);
    playerDrops[playerName] = drop;
  });
  
  return playerDrops;
}

// 装備ドロップを各プレイヤーごとに計算
function calculatePlayerEquipmentDrops(
  dungeonId: string,
  players: Record<string, { characters: RoomCharacter[] }>
): Record<string, string | undefined> {
  const { dungeons } = require('@/lib/data/dungeons');
  const { rollEquipmentDrop } = require('@/lib/data/equipments');
  
  const dungeonData = dungeons[dungeonId];
  const durationSeconds = dungeonData?.durationSeconds || 3600;
  
  const playerEquipmentDrops: Record<string, string | undefined> = {};
  
  Object.keys(players).forEach((playerName) => {
    const equipment = rollEquipmentDrop(durationSeconds);
    playerEquipmentDrops[playerName] = equipment?.id;
  });
  
  return playerEquipmentDrops;
}

interface StartBattleResult {
  success: boolean;
  error?: string;
}

/**
 * マルチバトルを開始する
 * - 最新のルーム情報を取得
 * - パーティ構築、バトル実行
 * - ドロップ計算
 * - Firebase更新
 */
export async function startMultiBattle(
  roomCode: string
): Promise<StartBattleResult> {
  // 最新のroomデータを再取得
  const latestRoom = await getRoom(roomCode);
  if (!latestRoom) {
    return { success: false, error: 'Room not found' };
  }
  if (latestRoom.status === 'battle' || latestRoom.status === 'done') {
    return { success: false, error: 'Room already in battle or done' };
  }

  // パーティ作成
  const party = buildPartyFromPlayers(latestRoom.players);
  
  // バトル実行
  const result = runBattle(party, latestRoom.dungeonId as any);
  
  // 参加者ログを追加
  const startLog = createStartLog(latestRoom.dungeonId, latestRoom.players);
  (result as any).startLog = startLog;
  
  // 勝利時は各プレイヤーのドロップを計算
  let playerDrops: Record<string, string | undefined> | undefined;
  let playerEquipmentDrops: Record<string, string | undefined> | undefined;
  if (result.victory) {
    playerDrops = calculatePlayerDrops(latestRoom.dungeonId, latestRoom.players);
    playerEquipmentDrops = calculatePlayerEquipmentDrops(latestRoom.dungeonId, latestRoom.players);
  }
  
  const startTime = Date.now();
  
  // Firebaseにバトル結果を保存
  await updateRoomStatus(roomCode, 'battle', startTime, result, playerDrops, playerEquipmentDrops);
  
  // 各プレイヤーにマルチ冒険結果を保存
  const playerNames = Object.keys(latestRoom.players);
  for (const playerName of playerNames) {
    await saveMultiAdventureForUser(
      playerName,
      roomCode,
      latestRoom.dungeonId,
      result.victory,
      playerDrops?.[playerName],
      result.logs,
      playerNames,
      playerEquipmentDrops?.[playerName]
    );
  }
  
  return { success: true };
}
