import { UserData } from './types';

const FIREBASE_URL = 'https://dicedeckrandomtcg-default-rtdb.firebaseio.com';

// Firebase REST API
async function firebaseGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${FIREBASE_URL}/${path}.json`);
    const data = await res.json();
    return data as T;
  } catch (e) {
    console.error('Firebase GET error:', e);
    return null;
  }
}

async function firebaseSet<T>(path: string, data: T): Promise<boolean> {
  try {
    await fetch(`${FIREBASE_URL}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return true;
  } catch (e) {
    console.error('Firebase SET error:', e);
    return false;
  }
}

// ユーザーデータ操作
export async function getUserData(username: string): Promise<UserData | null> {
  return firebaseGet<UserData>(`idle-dungeon/users/${username}`);
}

export async function saveUserData(username: string, data: UserData): Promise<boolean> {
  return firebaseSet(`idle-dungeon/users/${username}`, data);
}

// 新規ユーザー作成
export function createNewUser(username: string): UserData {
  return {
    username,
    character: {
      level: 1,
      exp: 0,
      maxHp: 100,
      hp: 100,
      atk: 10,
      def: 5,
      spd: 10,
    },
    currentFloor: 1,
    highestFloor: 1,
    equippedWeapon: null,
    equippedArmor: null,
    equippedAccessory: null,
    inventory: ['wooden_sword', 'cloth_armor'], // 初期装備
    equippedSkills: [],
    skillInventory: [],
    lastActiveAt: Date.now(),
    coins: 0,
    potions: 3, // 初期ポーション
    statistics: {
      totalKills: 0,
      totalBossKills: 0,
      totalCoinsEarned: 0,
      totalFloorsCleared: 0,
      totalDeaths: 0,
      totalPotionsUsed: 0,
      totalPlayTimeSeconds: 0,
      totalExpEarned: 0,
    },
    battleHistory: [],
    achievements: {},
  };
}

// ユーザー存在確認
export async function checkUserExists(username: string): Promise<boolean> {
  const data = await getUserData(username);
  return data !== null;
}

// ランキング取得
export interface RankingEntry {
  username: string;
  highestFloor: number;
  level: number;
}

export async function getRanking(): Promise<RankingEntry[]> {
  const users = await firebaseGet<Record<string, UserData>>('idle-dungeon/users');
  if (!users) return [];
  
  return Object.values(users)
    .map(u => ({
      username: u.username,
      highestFloor: u.highestFloor,
      level: u.character.level,
    }))
    .sort((a, b) => b.highestFloor - a.highestFloor)
    .slice(0, 100);
}
