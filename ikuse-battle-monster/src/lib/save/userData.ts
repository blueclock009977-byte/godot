// ユーザーデータ管理
import { MonsterInstance, MonsterSpecies } from "../types";
import { ALL_MONSTERS } from "../data/monsters";
import { dbGet, dbSet, dbUpdate } from "../firebase/database";
import { Egg, INITIAL_RATING, obtainEgg, hatchEgg, canHatch } from "../egg";
import { createMonsterInstance as createInstance } from "../monster/create";

// ============================================
// 型定義
// ============================================

/** 保存用モンスターデータ */
export interface SavedMonster {
  id: string;
  speciesId: string;
  nickname?: string;
  ability: string;
  skills: string[];
  // IVs（個体値）- 将来の拡張用
  ivs?: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    mag: number;
    res: number;
  };
}

/** 戦績データ */
export interface BattleRecord {
  wins: number;
  losses: number;
  draws: number;
  streak: number;        // 連勝数
  maxStreak: number;     // 最大連勝数
}

/** ユーザーデータ（完全版） */
export interface UserData {
  // メタ情報
  userId: string;
  createdAt: number;
  lastLogin: number;
  version: number;       // データバージョン（マイグレーション用）
  
  // モンスター
  monsters: SavedMonster[];
  party: string[];       // monster ids (最大6体、バトル時に3体選出)
  
  // 卵システム
  egg: Egg | null;       // 所持中の卵（1個のみ）
  rating: number;        // レート（初期1000）
  
  // 戦績
  record: BattleRecord;
  
  // 設定
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    animationSpeed: 'slow' | 'normal' | 'fast';
  };
}

// ============================================
// 定数
// ============================================

export const CURRENT_DATA_VERSION = 2;
export const MAX_MONSTERS = 50;
export const MAX_PARTY_SIZE = 6;

// 御三家ID
export const STARTER_IDS = ['flameoo', 'frosty', 'gale_wing'];

// 御三家選択時に付与する相性補完の早熟モンスター2体
export const STARTER_BONUS_MONSTERS: Record<string, [string, string]> = {
  flameoo: ['sparky', 'rocky'],
  frosty: ['aquan', 'ember_cat'],
  gale_wing: ['rocky', 'blizzap'],
};

// ============================================
// デフォルト値
// ============================================

export function createDefaultUserData(userId: string): UserData {
  return {
    userId,
    createdAt: Date.now(),
    lastLogin: Date.now(),
    version: CURRENT_DATA_VERSION,
    monsters: [],
    party: [],
    egg: null,
    rating: INITIAL_RATING,
    record: {
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      maxStreak: 0,
    },
    settings: {
      soundEnabled: true,
      musicEnabled: true,
      animationSpeed: 'normal',
    },
  };
}

// ============================================
// モンスター生成
// ============================================

/** 新しいモンスターインスタンスを生成 */
export function createMonsterInstance(
  speciesId: string,
  nickname?: string
): SavedMonster | null {
  const species = ALL_MONSTERS.find(m => m.id === speciesId);
  if (!species) return null;
  
  // 特性をランダム選択
  const ability = species.abilities[Math.floor(Math.random() * species.abilities.length)];
  
  // 技をランダムに4つ選択（または固定技がある場合はそれを使用）
  let skills: string[];
  if (species.fixedSkills) {
    skills = species.fixedSkills;
  } else {
    const shuffled = [...species.skillPool].sort(() => Math.random() - 0.5);
    skills = shuffled.slice(0, 4);
  }
  
  return {
    id: `monster_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    speciesId,
    nickname,
    ability,
    skills,
  };
}

/** SavedMonsterからMonsterInstanceに変換 */
export function toMonsterInstance(
  saved: SavedMonster,
  species: MonsterSpecies
): MonsterInstance {
  const maxHp = calculateMaxHp(species.baseStats.hp);
  return {
    id: saved.id,
    speciesId: saved.speciesId,
    nickname: saved.nickname,
    ability: saved.ability,
    skills: saved.skills,
    currentHp: maxHp,
    maxHp,
  };
}

/** HP計算（レベル50固定、IV=31固定として） */
function calculateMaxHp(baseHp: number): number {
  // 簡易計算: base + 60（ポケモンとは異なる簡易式）
  return baseHp + 60;
}

// ============================================
// Firebase操作
// ============================================

const USER_PATH = (userId: string) => `users/${userId}`;

/** ユーザーデータを取得 */
export async function loadUserData(userId: string): Promise<UserData | null> {
  const data = await dbGet<UserData>(USER_PATH(userId));
  if (data) {
    // バージョンチェック & マイグレーション
    return migrateUserData(data);
  }
  return null;
}

/** ユーザーデータを保存 */
export async function saveUserData(userId: string, data: UserData): Promise<void> {
  data.lastLogin = Date.now();
  await dbSet(USER_PATH(userId), data);
}

/** ユーザーデータを部分更新 */
export async function updateUserData(
  userId: string,
  updates: Partial<UserData>
): Promise<void> {
  updates.lastLogin = Date.now();
  await dbUpdate(USER_PATH(userId), updates as Record<string, unknown>);
}

/** 新規ユーザーを初期化 */
export async function initializeNewUser(userId: string): Promise<UserData> {
  const userData = createDefaultUserData(userId);
  await saveUserData(userId, userData);
  return userData;
}

// ============================================
// モンスター管理
// ============================================

/** モンスターを追加 */
export async function addMonster(
  userId: string,
  userData: UserData,
  monster: SavedMonster
): Promise<UserData> {
  if (userData.monsters.length >= MAX_MONSTERS) {
    throw new Error('モンスターの所持上限に達しています');
  }
  
  userData.monsters.push(monster);
  await saveUserData(userId, userData);
  return userData;
}

/** モンスターを削除 */
export async function removeMonster(
  userId: string,
  userData: UserData,
  monsterId: string
): Promise<UserData> {
  userData.monsters = userData.monsters.filter(m => m.id !== monsterId);
  userData.party = userData.party.filter(id => id !== monsterId);
  await saveUserData(userId, userData);
  return userData;
}

/** パーティを更新 */
export async function updateParty(
  userId: string,
  userData: UserData,
  partyIds: string[]
): Promise<UserData> {
  // バリデーション
  if (partyIds.length > MAX_PARTY_SIZE) {
    throw new Error(`パーティは${MAX_PARTY_SIZE}体までです`);
  }
  
  // 所持しているモンスターかチェック
  const ownedIds = new Set(userData.monsters.map(m => m.id));
  for (const id of partyIds) {
    if (!ownedIds.has(id)) {
      throw new Error('所持していないモンスターがパーティに含まれています');
    }
  }
  
  userData.party = partyIds;
  await saveUserData(userId, userData);
  return userData;
}

// ============================================
// 戦績管理
// ============================================

/** レート変動（勝利+25、敗北-20） */
const RATING_WIN = 25;
const RATING_LOSS = 20;

/** 勝利を記録（卵獲得 + レート上昇） */
export async function recordWin(
  userId: string,
  userData: UserData
): Promise<{ userData: UserData; eggResult: 'new' | 'shortened' | 'replaced' }> {
  // 戦績更新
  userData.record.wins++;
  userData.record.streak++;
  if (userData.record.streak > userData.record.maxStreak) {
    userData.record.maxStreak = userData.record.streak;
  }
  
  // レート上昇
  userData.rating += RATING_WIN;
  
  // 卵獲得
  const hadEgg = userData.egg !== null && !userData.egg.isHatched;
  userData.egg = obtainEgg(userData.rating, userData.egg);
  const eggResult = hadEgg ? 'shortened' : 'new';
  
  await saveUserData(userId, userData);
  return { userData, eggResult };
}

/** 敗北を記録（レート減少） */
export async function recordLoss(
  userId: string,
  userData: UserData
): Promise<UserData> {
  userData.record.losses++;
  userData.record.streak = 0;
  
  // レート減少（最低100）
  userData.rating = Math.max(100, userData.rating - RATING_LOSS);
  
  await saveUserData(userId, userData);
  return userData;
}

/** 引き分けを記録 */
export async function recordDraw(
  userId: string,
  userData: UserData
): Promise<UserData> {
  userData.record.draws++;
  // 引き分けでも連勝は維持
  await saveUserData(userId, userData);
  return userData;
}

// ============================================
// 卵管理
// ============================================

/** 卵を孵化してモンスターを獲得 */
export async function hatchCurrentEgg(
  userId: string,
  userData: UserData
): Promise<{ userData: UserData; newMonster: SavedMonster | null }> {
  if (!userData.egg || !canHatch(userData.egg)) {
    return { userData, newMonster: null };
  }
  
  // 卵を孵化
  const instance = hatchEgg(userData.egg);
  if (!instance) {
    return { userData, newMonster: null };
  }
  
  // SavedMonsterに変換
  const newMonster: SavedMonster = {
    id: instance.id,
    speciesId: instance.speciesId,
    ability: instance.ability,
    skills: instance.skills,
  };
  
  // モンスターを追加
  if (userData.monsters.length < MAX_MONSTERS) {
    userData.monsters.push(newMonster);
  }
  
  // 卵をクリア
  userData.egg = null;
  
  await saveUserData(userId, userData);
  return { userData, newMonster };
}

/** 卵が孵化可能かチェック */
export function isEggReady(userData: UserData): boolean {
  return userData.egg !== null && canHatch(userData.egg);
}

// ============================================
// マイグレーション
// ============================================

function migrateUserData(data: UserData): UserData {
  // バージョン1 → 2: 卵・レートシステム追加
  if (!data.version || data.version < 2) {
    data.egg = data.egg ?? null;
    data.rating = data.rating ?? INITIAL_RATING;
    data.version = 2;
  }
  
  return data;
}
