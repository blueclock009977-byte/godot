import { 
  getRoom, 
  updateRoomStatus,
  saveMultiAdventureForUser,
  RoomCharacter,
} from '@/lib/firebase';
import { dungeons } from '@/lib/data/dungeons';
import { runBattle, rollDrops } from '@/lib/battle/engine';
import { Character, Party, BattleResult } from '@/lib/types';
import {
  calculateDropBonus,
  calculateRareDropBonus,
  calculateCoinBonus,
  calculateExplorationSpeedBonus,
  getDropRollCount,
  applyExplorationSpeedBonus,
} from '@/lib/drop/dropBonus';

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
 * バトル結果に参加者情報とトレハンスキルを追加
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
  
  // トレハンスキル情報を追加
  const allCharsWithOwner = Object.entries(players).flatMap(([playerName, p]) =>
    (p.characters || []).map(rc => ({
      ...rc.character,
      ownerId: playerName,
    }))
  );
  
  const dropBonus = calculateDropBonus(allCharsWithOwner);
  const rareDropBonus = calculateRareDropBonus(allCharsWithOwner);
  const coinBonus = calculateCoinBonus(allCharsWithOwner);
  const speedBonus = calculateExplorationSpeedBonus(allCharsWithOwner);
  const rollCount = getDropRollCount(allCharsWithOwner);
  
  const bonuses: string[] = [];
  if (dropBonus > 0) bonuses.push(`ドロップ+${dropBonus}%`);
  if (rareDropBonus > 0) bonuses.push(`レア発見+${rareDropBonus}%`);
  if (coinBonus > 0) bonuses.push(`コイン+${coinBonus}%`);
  if (speedBonus > 0) bonuses.push(`探索時間-${speedBonus}%`);
  if (rollCount > 4) bonuses.push(`抽選${rollCount}回`);
  
  if (bonuses.length > 0) {
    log += `🔍 トレハン: ${bonuses.join(', ')}\n`;
  }
  
  return log;
}

/**
 * 各プレイヤーのドロップを計算
 * マルチでは全員のキャラを合算してボーナス計算（ただしownerId付き）
 */
function calculatePlayerDrops(
  dungeonId: string,
  players: Record<string, { characters: RoomCharacter[] }>
): Record<string, string[] | undefined> {
  const playerDrops: Record<string, string[] | undefined> = {};
  
  // 全員のキャラにownerIdを付けて結合（マルチボーナス計算用）
  const allCharsWithOwner = Object.entries(players).flatMap(([playerName, player]) => 
    (player.characters || []).map(rc => ({
      ...rc.character,
      ownerId: playerName,
    }))
  );
  
  // 各プレイヤーごとに個別抽選（ボーナスは全員分で計算）
  Object.entries(players).forEach(([playerName, _]) => {
    const drops = rollDrops(dungeonId as any, allCharsWithOwner);
    playerDrops[playerName] = drops.length > 0 ? drops : undefined;
  });
  
  return playerDrops;
}

// 装備ドロップを各プレイヤーごとに計算
function calculatePlayerEquipmentDrops(
  dungeonId: string,
  players: Record<string, { characters: RoomCharacter[] }>
): Record<string, string[] | undefined> {
  const { dungeons } = require('@/lib/data/dungeons');
  const { rollEquipmentDrops } = require('@/lib/data/equipments');
  
  const dungeonData = dungeons[dungeonId];
  const durationSeconds = dungeonData?.durationSeconds || 3600;
  
  const playerEquipmentDrops: Record<string, string[] | undefined> = {};
  
  // 全員のキャラにownerIdを付けて結合（マルチボーナス計算用）
  const allCharsWithOwner = Object.entries(players).flatMap(([playerName, player]) => 
    (player.characters || []).map(rc => ({
      ...rc.character,
      ownerId: playerName,
    }))
  );
  
  // 各プレイヤーごとに個別抽選（ボーナスは全員分で計算）
  Object.entries(players).forEach(([playerName, _]) => {
    const equipments = rollEquipmentDrops(durationSeconds, allCharsWithOwner);
    playerEquipmentDrops[playerName] = equipments.length > 0 ? equipments.map((e: any) => e.id) : undefined;
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
  
  // 参加者ログを追加（トレハンスキル情報含む）
  const startLog = createStartLog(latestRoom.dungeonId, latestRoom.players);
  (result as any).startLog = startLog;
  
  // 勝利時は各プレイヤーのドロップを計算（複数対応）
  let playerDrops: Record<string, string | undefined> | undefined;
  let playerEquipmentDrops: Record<string, string | undefined> | undefined;
  let playerDropsMulti: Record<string, string[] | undefined> | undefined;
  let playerEquipmentDropsMulti: Record<string, string[] | undefined> | undefined;
  if (result.victory) {
    playerDropsMulti = calculatePlayerDrops(latestRoom.dungeonId, latestRoom.players);
    playerEquipmentDropsMulti = calculatePlayerEquipmentDrops(latestRoom.dungeonId, latestRoom.players);
    
    // 後方互換用（最初の1つだけ）
    playerDrops = Object.fromEntries(
      Object.entries(playerDropsMulti).map(([k, v]) => [k, v?.[0]])
    );
    playerEquipmentDrops = Object.fromEntries(
      Object.entries(playerEquipmentDropsMulti).map(([k, v]) => [k, v?.[0]])
    );
  }
  
  const startTime = Date.now();
  
  // 探索時間短縮ボーナスを計算（全員のキャラで、ownerId付き）
  const allCharsWithOwner = Object.entries(latestRoom.players).flatMap(([playerName, p]) => 
    (p.characters || []).map(rc => ({
      ...rc.character,
      ownerId: playerName,
    }))
  );
  const { dungeons } = require('../data/dungeons');
  const dungeonData = dungeons[latestRoom.dungeonId];
  const actualDurationSeconds = applyExplorationSpeedBonus(dungeonData?.durationSeconds || 3600, allCharsWithOwner);
  
  // Firebaseにバトル結果を保存
  await updateRoomStatus(roomCode, 'battle', startTime, result, playerDrops, playerEquipmentDrops, actualDurationSeconds);
  
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
