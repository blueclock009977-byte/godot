import { UserData, RankingEntry, FriendRequest } from './types';

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

async function firebasePatch<T>(path: string, data: Partial<T>): Promise<boolean> {
  try {
    await fetch(`${FIREBASE_URL}/${path}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return true;
  } catch (e) {
    console.error('Firebase PATCH error:', e);
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
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  
  // 週の開始日（月曜日）を計算
  const nowDate = new Date();
  const day = nowDate.getDay();
  const diff = day === 0 ? 6 : day - 1;
  nowDate.setDate(nowDate.getDate() - diff);
  const weekStart = nowDate.toISOString().slice(0, 10);
  
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
    lastActiveAt: now,
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
    milestones: {},
    sessionStartedAt: now,
    
    // ソーシャル機能
    friends: [],
    friendRequests: [],
    sentRequests: [],
    
    // ログインボーナス
    loginBonus: {
      lastClaimDate: '',
      consecutiveDays: 0,
      totalDays: 0,
    },
    
    // ウィークリーチャレンジ
    weeklyChallenge: {
      weekStartDate: weekStart,
      challenges: [
        { id: 'boss_kill_10', type: 'boss_kill', target: 10, current: 0, reward: { coins: 500, exp: 200 }, claimed: false },
        { id: 'floor_clear_50', type: 'floor_clear', target: 50, current: 0, reward: { coins: 300, exp: 150 }, claimed: false },
        { id: 'enemy_kill_500', type: 'enemy_kill', target: 500, current: 0, reward: { coins: 400, exp: 250 }, claimed: false },
        { id: 'coins_earn_5000', type: 'coins_earn', target: 5000, current: 0, reward: { coins: 250, exp: 100 }, claimed: false },
        { id: 'level_up_5', type: 'level_up', target: 5, current: 0, reward: { coins: 600, exp: 300 }, claimed: false },
      ],
    },
  };
}

// ユーザー存在確認
export async function checkUserExists(username: string): Promise<boolean> {
  const data = await getUserData(username);
  return data !== null;
}

// ランキング取得（階層順）
export async function getFloorRanking(): Promise<RankingEntry[]> {
  const users = await firebaseGet<Record<string, UserData>>('idle-dungeon/users');
  if (!users) return [];
  
  return Object.values(users)
    .map(u => ({
      username: u.username,
      highestFloor: u.highestFloor,
      level: u.character.level,
      totalKills: u.statistics?.totalKills ?? 0,
      lastActiveAt: u.lastActiveAt,
    }))
    .sort((a, b) => b.highestFloor - a.highestFloor)
    .slice(0, 100);
}

// ランキング取得（レベル順）
export async function getLevelRanking(): Promise<RankingEntry[]> {
  const users = await firebaseGet<Record<string, UserData>>('idle-dungeon/users');
  if (!users) return [];
  
  return Object.values(users)
    .map(u => ({
      username: u.username,
      highestFloor: u.highestFloor,
      level: u.character.level,
      totalKills: u.statistics?.totalKills ?? 0,
      lastActiveAt: u.lastActiveAt,
    }))
    .sort((a, b) => b.level - a.level)
    .slice(0, 100);
}

// 旧API互換
export async function getRanking(): Promise<RankingEntry[]> {
  return getFloorRanking();
}

// フレンドリクエスト送信
export async function sendFriendRequest(fromUsername: string, toUsername: string): Promise<boolean> {
  const toUser = await getUserData(toUsername);
  if (!toUser) return false;
  
  // 既にフレンドか確認
  if (toUser.friends?.includes(fromUsername)) return false;
  
  // 既にリクエスト送信済みか確認
  if (toUser.friendRequests?.some(r => r.from === fromUsername)) return false;
  
  // リクエストを追加
  const requests: FriendRequest[] = toUser.friendRequests ?? [];
  requests.push({
    from: fromUsername,
    timestamp: Date.now(),
  });
  
  return firebasePatch(`idle-dungeon/users/${toUsername}`, { friendRequests: requests });
}

// フレンドリクエスト承認
export async function acceptFriendRequest(username: string, fromUsername: string): Promise<boolean> {
  const user = await getUserData(username);
  const fromUser = await getUserData(fromUsername);
  if (!user || !fromUser) return false;
  
  // リクエストを削除
  const requests = (user.friendRequests ?? []).filter(r => r.from !== fromUsername);
  
  // 双方をフレンドに追加
  const userFriends = [...(user.friends ?? [])];
  const fromUserFriends = [...(fromUser.friends ?? [])];
  
  if (!userFriends.includes(fromUsername)) {
    userFriends.push(fromUsername);
  }
  if (!fromUserFriends.includes(username)) {
    fromUserFriends.push(username);
  }
  
  // 送信側の sentRequests からも削除
  const sentRequests = (fromUser.sentRequests ?? []).filter(u => u !== username);
  
  await firebasePatch(`idle-dungeon/users/${username}`, {
    friendRequests: requests,
    friends: userFriends,
  });
  await firebasePatch(`idle-dungeon/users/${fromUsername}`, {
    friends: fromUserFriends,
    sentRequests,
  });
  
  return true;
}

// フレンドリクエスト拒否
export async function rejectFriendRequest(username: string, fromUsername: string): Promise<boolean> {
  const user = await getUserData(username);
  if (!user) return false;
  
  const requests = (user.friendRequests ?? []).filter(r => r.from !== fromUsername);
  return firebasePatch(`idle-dungeon/users/${username}`, { friendRequests: requests });
}

// フレンド削除
export async function removeFriend(username: string, friendUsername: string): Promise<boolean> {
  const user = await getUserData(username);
  const friendUser = await getUserData(friendUsername);
  if (!user || !friendUser) return false;
  
  const userFriends = (user.friends ?? []).filter(f => f !== friendUsername);
  const friendFriends = (friendUser.friends ?? []).filter(f => f !== username);
  
  await firebasePatch(`idle-dungeon/users/${username}`, { friends: userFriends });
  await firebasePatch(`idle-dungeon/users/${friendUsername}`, { friends: friendFriends });
  
  return true;
}

// フレンドの進捗情報取得
export interface FriendProgress {
  username: string;
  level: number;
  highestFloor: number;
  currentFloor: number;
  lastActiveAt: number;
  isOnline: boolean;  // 5分以内にアクティブ
}

export async function getFriendsProgress(friendUsernames: string[]): Promise<FriendProgress[]> {
  const now = Date.now();
  const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5分
  
  const results: FriendProgress[] = [];
  
  for (const username of friendUsernames) {
    const user = await getUserData(username);
    if (user) {
      results.push({
        username: user.username,
        level: user.character.level,
        highestFloor: user.highestFloor,
        currentFloor: user.currentFloor,
        lastActiveAt: user.lastActiveAt,
        isOnline: (now - user.lastActiveAt) < ONLINE_THRESHOLD,
      });
    }
  }
  
  // オンライン順、次にレベル順
  return results.sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    return b.level - a.level;
  });
}
