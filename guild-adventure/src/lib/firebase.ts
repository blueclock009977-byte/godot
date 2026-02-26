// Firebase Realtime Database REST API

const FIREBASE_URL = 'https://dicedeckrandomtcg-default-rtdb.firebaseio.com';

export interface UserData {
  username: string;
  characters: any[];
  party: any;
  inventory: Record<string, number>;
  createdAt: number;
  lastLogin: number;
}

// ユーザーデータを取得
export async function getUserData(username: string): Promise<UserData | null> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Failed to get user data:', e);
    return null;
  }
}

// ユーザーデータを保存
export async function saveUserData(username: string, data: Partial<UserData>): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        lastLogin: Date.now(),
      }),
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to save user data:', e);
    return false;
  }
}

// 新規ユーザー作成
export async function createUser(username: string): Promise<boolean> {
  // 初期インベントリをインポート
  const { initialInventory } = await import('./data/items');
  
  try {
    const initialData: UserData = {
      username,
      characters: [],
      party: {
        front: [null, null, null],
        back: [null, null, null],
      },
      inventory: { ...initialInventory },
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };
    
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialData),
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to create user:', e);
    return false;
  }
}

// ユーザー名が存在するか確認
export async function userExists(username: string): Promise<boolean> {
  const data = await getUserData(username);
  return data !== null;
}

// ローカルストレージからユーザー名を取得
export function getStoredUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('guild-adventure-username');
}

// ローカルストレージにユーザー名を保存
export function setStoredUsername(username: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('guild-adventure-username', username);
}

// ローカルストレージからユーザー名を削除
export function clearStoredUsername(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('guild-adventure-username');
}

// ============================================
// マルチプレイ機能
// ============================================

export interface RoomPlayer {
  username: string;
  characters: any[];  // 選択したキャラ
  ready: boolean;
  joinedAt: number;
}

export interface MultiRoom {
  code: string;
  hostId: string;
  dungeonId: string;
  maxPlayers: 2 | 3;
  status: 'waiting' | 'ready' | 'battle' | 'done';
  players: Record<string, RoomPlayer>;
  battleResult?: any;
  createdAt: number;
  updatedAt: number;
}

// 6桁のルームコードを生成
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ルームを作成
export async function createRoom(hostUsername: string, dungeonId: string, maxPlayers: 2 | 3): Promise<string | null> {
  const code = generateRoomCode();
  
  const room: MultiRoom = {
    code,
    hostId: hostUsername,
    dungeonId,
    maxPlayers,
    status: 'waiting',
    players: {
      [hostUsername]: {
        username: hostUsername,
        characters: [],
        ready: false,
        joinedAt: Date.now(),
      },
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms/${code}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room),
    });
    return res.ok ? code : null;
  } catch (e) {
    console.error('Failed to create room:', e);
    return null;
  }
}

// ルームを取得
export async function getRoom(code: string): Promise<MultiRoom | null> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms/${code}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Failed to get room:', e);
    return null;
  }
}

// ルームに参加
export async function joinRoom(code: string, username: string): Promise<boolean> {
  const room = await getRoom(code);
  if (!room) return false;
  if (room.status !== 'waiting') return false;
  if (Object.keys(room.players).length >= room.maxPlayers) return false;
  if (room.players[username]) return true; // 既に参加済み
  
  const player: RoomPlayer = {
    username,
    characters: [],
    ready: false,
    joinedAt: Date.now(),
  };
  
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms/${code}/players/${username}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player),
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to join room:', e);
    return false;
  }
}

// キャラ選択を更新
export async function updateRoomCharacters(code: string, username: string, characters: any[]): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms/${code}/players/${username}/characters.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(characters),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// 準備完了を更新
export async function updateRoomReady(code: string, username: string, ready: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms/${code}/players/${username}/ready.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ready),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// ルームステータスを更新
export async function updateRoomStatus(code: string, status: MultiRoom['status']): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms/${code}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, updatedAt: Date.now() }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// バトル結果を保存
export async function saveRoomBattleResult(code: string, result: any): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms/${code}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        battleResult: result, 
        status: 'done',
        updatedAt: Date.now(),
      }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// ルームから退出
export async function leaveRoom(code: string, username: string): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms/${code}/players/${username}.json`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// ルームを削除
export async function deleteRoom(code: string): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms/${code}.json`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
