// Firebase Realtime Database REST API

const FIREBASE_URL = 'https://dicedeckrandomtcg-default-rtdb.firebaseio.com';

export interface AdventureHistory {
  id: string;
  type: 'solo' | 'multi';
  dungeonId: string;
  victory: boolean;
  droppedItemId?: string;
  completedAt: number;
  logs: any[];
  // マルチの場合
  roomCode?: string;
  players?: string[];
}

export interface UserData {
  username: string;
  characters: any[];
  party: any;
  inventory: Record<string, number>;
  history?: AdventureHistory[];
  currentAdventure?: {
    dungeon: string;
    startTime: number;
    party: any;
  } | null;
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

// 履歴を追加（最大20件）
export async function addAdventureHistory(username: string, history: AdventureHistory): Promise<boolean> {
  try {
    // 現在の履歴を取得
    const userData = await getUserData(username);
    const currentHistory = userData?.history || [];
    
    // 新しい履歴を先頭に追加し、20件に制限
    const newHistory = [history, ...currentHistory].slice(0, 20);
    
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/history.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHistory),
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to add history:', e);
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
        front: [],
        back: [],
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

export interface RoomCharacter {
  character: any;
  position: 'front' | 'back';
}

export interface RoomPlayer {
  username: string;
  characters: RoomCharacter[];  // 選択したキャラ（position付き）
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
  startTime?: number;  // 冒険開始時刻
  playerDrops?: Record<string, string | undefined>;  // 各プレイヤーのドロップ
  playerClaimed?: Record<string, boolean>;           // 受け取り済みフラグ
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

// ルームステータスを更新（battleの場合はstartTime、battleResult、ドロップも設定）
export async function updateRoomStatus(
  code: string, 
  status: MultiRoom['status'], 
  startTime?: number,
  battleResult?: any,
  playerDrops?: Record<string, string | undefined>
): Promise<boolean> {
  try {
    const data: any = { status, updatedAt: Date.now() };
    if (startTime) {
      data.startTime = startTime;
    }
    if (battleResult) {
      data.battleResult = battleResult;
    }
    // ドロップ情報
    if (playerDrops) {
      data.playerDrops = playerDrops;
      data.playerClaimed = Object.keys(playerDrops).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as Record<string, boolean>);
    }
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms/${code}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// バトル結果を保存（ドロップ情報含む）
export async function saveRoomBattleResult(
  code: string, 
  result: any, 
  playerDrops?: Record<string, string | undefined>
): Promise<boolean> {
  try {
    const data: Record<string, any> = { 
      battleResult: result, 
      status: 'done',
      updatedAt: Date.now(),
    };
    
    // ドロップ情報があれば追加
    if (playerDrops) {
      data.playerDrops = playerDrops;
      // 全員分のclaimedをfalseで初期化
      data.playerClaimed = Object.keys(playerDrops).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms/${code}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// マルチのドロップ受け取り
export async function claimMultiDrop(code: string, username: string): Promise<{ success: boolean; itemId?: string }> {
  try {
    const room = await getRoom(code);
    if (!room || !room.playerDrops || !room.playerClaimed) {
      return { success: false };
    }
    
    // 既に受け取り済み
    if (room.playerClaimed[username]) {
      return { success: false };
    }
    
    // claimed を true に更新
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms/${code}/playerClaimed/${username}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(true),
    });
    
    if (res.ok) {
      return { success: true, itemId: room.playerDrops[username] };
    }
    return { success: false };
  } catch (e) {
    console.error('Failed to claim multi drop:', e);
    return { success: false };
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

// ============================================
// 探索状態管理（排他制御 + バトル結果保存）
// ============================================

export interface ServerAdventure {
  dungeon: string;
  startTime: number;
  party: any;
  battleResult: any;        // バトル結果
  droppedItemId?: string;   // ドロップアイテムID
  claimed: boolean;         // 受け取り済みフラグ
}

// 探索開始（バトル計算+ドロップ抽選済みの結果を保存）
export async function startAdventureOnServer(
  username: string, 
  dungeon: string, 
  party: any,
  battleResult: any,
  droppedItemId?: string
): Promise<{ success: boolean; existingAdventure?: ServerAdventure }> {
  try {
    // 現在の探索状態を確認
    const existing = await getAdventureOnServer(username);
    if (existing) {
      // 既に探索中 - 期限切れチェック（探索時間 + 5分のバッファ）
      const elapsed = Date.now() - existing.startTime;
      const maxDuration = 3 * 60 * 60 * 1000; // 最長3時間（2h探索 + 1hバッファ）
      if (elapsed < maxDuration) {
        return { success: false, existingAdventure: existing };
      }
      // 期限切れなら上書きOK
    }
    
    // 探索開始を記録（バトル結果+ドロップ含む）
    const adventureData: ServerAdventure = {
      dungeon,
      startTime: Date.now(),
      party,
      battleResult,
      droppedItemId,
      claimed: false,
    };
    
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/currentAdventure.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adventureData),
    });
    return { success: res.ok };
  } catch (e) {
    console.error('Failed to start adventure on server:', e);
    return { success: false };
  }
}

// ドロップ受け取り（claimed=falseの場合のみ成功）
export async function claimAdventureDrop(username: string): Promise<{ success: boolean; itemId?: string }> {
  try {
    const adventure = await getAdventureOnServer(username);
    if (!adventure) {
      return { success: false };
    }
    
    // 既に受け取り済み
    if (adventure.claimed) {
      return { success: false };
    }
    
    // claimed を true に更新
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/currentAdventure/claimed.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(true),
    });
    
    if (res.ok) {
      return { success: true, itemId: adventure.droppedItemId };
    }
    return { success: false };
  } catch (e) {
    console.error('Failed to claim drop:', e);
    return { success: false };
  }
}

// 探索完了（サーバーから削除）
export async function clearAdventureOnServer(username: string): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/currentAdventure.json`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to clear adventure on server:', e);
    return false;
  }
}

// 探索状態を取得
export async function getAdventureOnServer(username: string): Promise<ServerAdventure | null> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/currentAdventure.json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
  } catch (e) {
    return null;
  }
}
