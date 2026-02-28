// Firebase Realtime Database REST API

const FIREBASE_URL = 'https://dicedeckrandomtcg-default-rtdb.firebaseio.com';

// ============================================
// 共通ヘルパー関数
// ============================================

/**
 * Firebase GETリクエストの共通ヘルパー
 * @param path Firebase内のパス（先頭スラッシュなし）
 * @returns データまたはnull
 */
async function firebaseGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${FIREBASE_URL}/${path}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data ?? null;
  } catch (e) {
    console.error(`Firebase GET error [${path}]:`, e);
    return null;
  }
}

/**
 * Firebase PUT/PATCHリクエストの共通ヘルパー
 * @param path Firebase内のパス（先頭スラッシュなし）
 * @param data 保存するデータ
 * @param method HTTPメソッド（PUT or PATCH）
 * @returns 成功したらtrue
 */
async function firebaseSet(path: string, data: unknown, method: 'PUT' | 'PATCH' = 'PUT'): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (e) {
    console.error(`Firebase ${method} error [${path}]:`, e);
    return false;
  }
}

/**
 * Firebase DELETEリクエストの共通ヘルパー
 * @param path Firebase内のパス（先頭スラッシュなし）
 * @returns 成功したらtrue
 */
async function firebaseDelete(path: string): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.error(`Firebase DELETE error [${path}]:`, e);
    return false;
  }
}

export interface AdventureHistory {
  id: string;
  type: 'solo' | 'multi';
  dungeonId: string;
  victory: boolean;
  droppedItemId?: string;
  droppedEquipmentId?: string;  // 装備ドロップ
  completedAt: number;
  logs: any[];
  // マルチの場合
  roomCode?: string;
  players?: string[];
  playerDrops?: Record<string, string | undefined>;  // 各プレイヤーのアイテムドロップ
  playerEquipmentDrops?: Record<string, string | undefined>;  // 各プレイヤーの装備ドロップ
}

export interface UserData {
  username: string;
  characters: any[];
  party: any;
  inventory: Record<string, number>;
  equipments?: Record<string, number>;
  history?: AdventureHistory[];
  currentAdventure?: {
    dungeon: string;
    startTime: number;
    party: any;
  } | null;
  createdAt: number;
  lastLogin: number;
  coins?: number;          // 冒険コイン
}

// ユーザーデータを取得
export async function getUserData(username: string): Promise<UserData | null> {
  return firebaseGet<UserData>(`guild-adventure/users/${username}`);
}

// ユーザーデータを保存
export async function saveUserData(username: string, data: Partial<UserData>): Promise<boolean> {
  return firebaseSet(
    `guild-adventure/users/${username}`,
    { ...data, lastLogin: Date.now() },
    'PATCH'
  );
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
  
  return firebaseSet(`guild-adventure/users/${username}`, initialData);
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
  actualDurationSeconds?: number;  // 短縮後の探索時間
  playerDrops?: Record<string, string | undefined>;  // 各プレイヤーのドロップ
  playerEquipmentDrops?: Record<string, string | undefined>;  // 各プレイヤーの装備ドロップ
  playerClaimed?: Record<string, boolean>;           // 受け取り済みフラグ
  isPublic?: boolean;  // 公開ルームかどうか
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
export async function createRoom(hostUsername: string, dungeonId: string, maxPlayers: 2 | 3, isPublic: boolean = false): Promise<string | null> {
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
    isPublic,
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
  return firebaseGet<MultiRoom>(`guild-adventure/rooms/${code}`);
}

// 公開ルーム一覧を取得（待機中のみ）
export async function getPublicRooms(): Promise<MultiRoom[]> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/rooms.json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data) return [];
    
    const rooms: MultiRoom[] = [];
    
    for (const [code, room] of Object.entries(data)) {
      const r = room as MultiRoom;
      // 公開ルーム、待機中、満員でないもの
      if (r.isPublic && r.status === 'waiting' && Object.keys(r.players).length < r.maxPlayers) {
        rooms.push(r);
      }
    }
    
    // 新しい順にソート
    rooms.sort((a, b) => b.createdAt - a.createdAt);
    return rooms;
  } catch (e) {
    console.error('Failed to get public rooms:', e);
    return [];
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
  
  return firebaseSet(`guild-adventure/rooms/${code}/players/${username}`, player);
}

// キャラ選択を更新
// キャラ選択を更新
export async function updateRoomCharacters(code: string, username: string, characters: any[]): Promise<boolean> {
  return firebaseSet(`guild-adventure/rooms/${code}/players/${username}/characters`, characters);
}

// 準備完了を更新
export async function updateRoomReady(code: string, username: string, ready: boolean): Promise<boolean> {
  return firebaseSet(`guild-adventure/rooms/${code}/players/${username}/ready`, ready);
}

// ルームステータスを更新（battleの場合はstartTime、battleResult、ドロップも設定）
export async function updateRoomStatus(
  code: string, 
  status: MultiRoom['status'], 
  startTime?: number,
  battleResult?: any,
  playerDrops?: Record<string, string | undefined>,
  playerEquipmentDrops?: Record<string, string | undefined>,
  actualDurationSeconds?: number
): Promise<boolean> {
  try {
    const data: any = { status, updatedAt: Date.now() };
    if (startTime) {
      data.startTime = startTime;
    }
    if (actualDurationSeconds) {
      data.actualDurationSeconds = actualDurationSeconds;
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
    // 装備ドロップ情報
    if (playerEquipmentDrops) {
      data.playerEquipmentDrops = playerEquipmentDrops;
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
// マルチのドロップ受け取り（ETag条件付き書き込みで競合防止）
export async function claimMultiDrop(code: string, username: string): Promise<{ success: boolean; itemId?: string; equipmentId?: string }> {
  try {
    // まずルーム情報を取得（ドロップアイテム用）
    const room = await getRoom(code);
    if (!room) {
      return { success: false };
    }
    
    // 1. ETag付きでGET（現在の値と一意識別子を取得）
    const getRes = await fetch(
      `${FIREBASE_URL}/guild-adventure/rooms/${code}/playerClaimed/${username}.json`,
      { headers: { 'X-Firebase-ETag': 'true' } }
    );
    
    if (!getRes.ok) return { success: false };
    
    const etag = getRes.headers.get('ETag');
    const currentValue = await getRes.json();
    
    // 既に受け取り済み
    if (currentValue === true) {
      return { success: false };
    }
    
    // 2. ETag条件付きでPUT（他の端末が先に書き込んでたら412エラー）
    const putRes = await fetch(
      `${FIREBASE_URL}/guild-adventure/rooms/${code}/playerClaimed/${username}.json`,
      {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'if-match': etag || ''
        },
        body: JSON.stringify(true),
      }
    );
    
    // 412 = 競合（他の端末が先に書き込んだ）
    if (putRes.status === 412) {
      return { success: false };
    }
    
    if (putRes.ok) {
      // ドロップがあれば返す（勝利時のみ）
      const itemId = room.playerDrops?.[username];
      const equipmentId = room.playerEquipmentDrops?.[username];
      return { success: true, itemId, equipmentId };
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
  droppedItemId?: string;   // ドロップアイテムID（後方互換）
  droppedEquipmentId?: string; // ドロップ装備ID（後方互換）
  droppedItemIds?: string[];    // 複数ドロップ対応
  droppedEquipmentIds?: string[]; // 複数装備ドロップ対応
  claimed: boolean;         // 受け取り済みフラグ
}

// 探索開始（バトル計算+ドロップ抽選済みの結果を保存）
export async function startAdventureOnServer(
  username: string, 
  dungeon: string, 
  party: any,
  battleResult: any,
  droppedItemIds?: string[],
  droppedEquipmentIds?: string[]
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
      droppedItemId: droppedItemIds?.[0],
      droppedEquipmentId: droppedEquipmentIds?.[0],
      droppedItemIds,
      droppedEquipmentIds,
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
// ドロップ受け取り（ETag条件付き書き込みで競合防止）
export async function claimAdventureDrop(username: string): Promise<{ success: boolean; itemId?: string; equipmentId?: string; itemIds?: string[]; equipmentIds?: string[] }> {
  try {
    // 1. ETag付きでGET（現在の値と一意識別子を取得）
    const getRes = await fetch(
      `${FIREBASE_URL}/guild-adventure/users/${username}/currentAdventure/claimed.json`,
      { headers: { 'X-Firebase-ETag': 'true' } }
    );
    
    if (!getRes.ok) return { success: false };
    
    const etag = getRes.headers.get('ETag');
    const currentValue = await getRes.json();
    
    // 既に受け取り済み
    if (currentValue === true) {
      return { success: false };
    }
    
    // 2. ETag条件付きでPUT（他の端末が先に書き込んでたら412エラー）
    const putRes = await fetch(
      `${FIREBASE_URL}/guild-adventure/users/${username}/currentAdventure/claimed.json`,
      {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'if-match': etag || ''
        },
        body: JSON.stringify(true),
      }
    );
    
    // 412 = 競合（他の端末が先に書き込んだ）
    if (putRes.status === 412) {
      return { success: false };
    }
    
    if (putRes.ok) {
      // ドロップアイテム＋装備を取得
      const adventure = await getAdventureOnServer(username);
      return { 
        success: true, 
        itemId: adventure?.droppedItemId, 
        equipmentId: adventure?.droppedEquipmentId,
        itemIds: adventure?.droppedItemIds,
        equipmentIds: adventure?.droppedEquipmentIds,
      };
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
  return firebaseGet<ServerAdventure>(`guild-adventure/users/${username}/currentAdventure`);
}

// ============================================
// フレンド機能
// ============================================

export interface FriendRequest {
  from: string;
  timestamp: number;
}

export interface RoomInvitation {
  id: string;
  from: string;
  roomCode: string;
  dungeonId: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
}

// フレンドリストを取得
export async function getFriends(username: string): Promise<string[]> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/friends.json`);
    if (!res.ok) return [];
    const data = await res.json();
    return data || [];
  } catch (e) {
    return [];
  }
}

// フレンド申請を取得
export async function getFriendRequests(username: string): Promise<FriendRequest[]> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/friendRequests.json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data) return [];
    // オブジェクトを配列に変換
    return Object.values(data) as FriendRequest[];
  } catch (e) {
    return [];
  }
}

// フレンド申請を送信
export async function sendFriendRequest(from: string, to: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 相手が存在するか確認
    const exists = await userExists(to);
    if (!exists) {
      return { success: false, error: 'ユーザーが見つかりません' };
    }
    
    // 既にフレンドか確認
    const friends = await getFriends(from);
    if (friends.includes(to)) {
      return { success: false, error: '既にフレンドです' };
    }
    
    // 申請を追加
    const request: FriendRequest = {
      from,
      timestamp: Date.now(),
    };
    
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${to}/friendRequests/${from}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    return { success: res.ok };
  } catch (e) {
    return { success: false, error: 'エラーが発生しました' };
  }
}

// フレンド申請を承認
export async function acceptFriendRequest(username: string, fromUser: string): Promise<boolean> {
  try {
    // 双方のフレンドリストに追加
    const myFriends = await getFriends(username);
    const theirFriends = await getFriends(fromUser);
    
    if (!myFriends.includes(fromUser)) {
      myFriends.push(fromUser);
    }
    if (!theirFriends.includes(username)) {
      theirFriends.push(username);
    }
    
    // 保存
    await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/friends.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(myFriends),
    });
    
    await fetch(`${FIREBASE_URL}/guild-adventure/users/${fromUser}/friends.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theirFriends),
    });
    
    // 申請を削除
    await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/friendRequests/${fromUser}.json`, {
      method: 'DELETE',
    });
    
    return true;
  } catch (e) {
    return false;
  }
}

// フレンド申請を拒否
export async function rejectFriendRequest(username: string, fromUser: string): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/friendRequests/${fromUser}.json`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// フレンドを削除
export async function removeFriend(username: string, friendName: string): Promise<boolean> {
  try {
    // 双方から削除
    const myFriends = await getFriends(username);
    const theirFriends = await getFriends(friendName);
    
    const newMyFriends = myFriends.filter(f => f !== friendName);
    const newTheirFriends = theirFriends.filter(f => f !== username);
    
    await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/friends.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMyFriends),
    });
    
    await fetch(`${FIREBASE_URL}/guild-adventure/users/${friendName}/friends.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTheirFriends),
    });
    
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================
// 招待機能
// ============================================

// 招待を取得
export async function getInvitations(username: string): Promise<RoomInvitation[]> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/invitations.json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data) return [];
    // オブジェクトを配列に変換し、pendingのみ取得
    const invites = Object.values(data) as RoomInvitation[];
    // 5分以内のpendingのみ
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    return invites.filter(inv => inv.status === 'pending' && inv.timestamp > fiveMinAgo);
  } catch (e) {
    return [];
  }
}

// 招待を送信
export async function sendInvitation(from: string, to: string, roomCode: string, dungeonId: string): Promise<boolean> {
  try {
    const invitation: RoomInvitation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      from,
      roomCode,
      dungeonId,
      timestamp: Date.now(),
      status: 'pending',
    };
    
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${to}/invitations/${invitation.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invitation),
    });
    
    return res.ok;
  } catch (e) {
    return false;
  }
}

// 招待に応答
export async function respondToInvitation(username: string, invitationId: string, accept: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/invitations/${invitationId}/status.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accept ? 'accepted' : 'rejected'),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// 古い招待を削除
export async function cleanupInvitations(username: string): Promise<void> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/invitations.json`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data) return;
    
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    for (const [id, inv] of Object.entries(data) as [string, RoomInvitation][]) {
      if (inv.timestamp < fiveMinAgo || inv.status !== 'pending') {
        await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/invitations/${id}.json`, {
          method: 'DELETE',
        });
      }
    }
  } catch (e) {
    // ignore
  }
}

// ============================================
// オンラインステータス
// ============================================

export type UserActivity = 'lobby' | 'solo' | 'multi' | 'offline';

export interface UserStatus {
  lastSeen: number;
  activity: UserActivity;
  dungeonId?: string;  // ダンジョン中の場合
  roomCode?: string;   // マルチ中の場合
  startTime?: number;  // 冒険開始時刻
}

// ステータスを更新
export async function updateUserStatus(
  username: string,
  activity: UserActivity,
  extra?: { dungeonId?: string; roomCode?: string; startTime?: number }
): Promise<boolean> {
  try {
    const status: UserStatus = {
      lastSeen: Date.now(),
      activity,
      ...extra,
    };
    
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/status.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status),
    });
    
    return res.ok;
  } catch (e) {
    return false;
  }
}

// ステータスを取得
export async function getUserStatus(username: string): Promise<UserStatus | null> {
  return firebaseGet<UserStatus>(`guild-adventure/users/${username}/status`);
}

// 複数ユーザーのステータスを取得
export async function getMultipleUserStatus(usernames: string[]): Promise<Record<string, UserStatus | null>> {
  const results: Record<string, UserStatus | null> = {};
  await Promise.all(
    usernames.map(async (username) => {
      results[username] = await getUserStatus(username);
    })
  );
  return results;
}

// オンライン判定（5分以内に更新があればオンライン）
export function isOnline(status: UserStatus | null): boolean {
  if (!status) return false;
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  return status.lastSeen > fiveMinAgo;
}

// フレンドの詳細ステータスを取得（冒険状態も含む）
export interface FriendFullStatus {
  status: UserStatus | null;
  currentAdventure: ServerAdventure | null;
  multiAdventure: MultiAdventureResult | null;
  multiRoom: MultiRoom | null;  // マルチルーム情報
}

export async function getFriendFullStatus(username: string): Promise<FriendFullStatus> {
  const [status, currentAdventure, multiAdventure] = await Promise.all([
    getUserStatus(username),
    getAdventureOnServer(username),
    getMultiAdventure(username),
  ]);
  
  // マルチ中ならルーム情報も取得
  let multiRoom: MultiRoom | null = null;
  if (status?.activity === 'multi' && status?.roomCode) {
    multiRoom = await getRoom(status.roomCode);
  }
  
  return { status, currentAdventure, multiAdventure, multiRoom };
}

// 複数フレンドの詳細ステータスを取得
export async function getMultipleFriendFullStatus(usernames: string[]): Promise<Record<string, FriendFullStatus>> {
  const results: Record<string, FriendFullStatus> = {};
  await Promise.all(
    usernames.map(async (username) => {
      results[username] = await getFriendFullStatus(username);
    })
  );
  return results;
}

// ============================================
// マルチ冒険結果（ソロと同様にユーザーに保存）
// ============================================

export interface MultiAdventureResult {
  roomCode: string;
  dungeonId: string;
  victory: boolean;
  droppedItemId?: string;
  droppedEquipmentId?: string;
  completedAt: number;
  logs: any[];
  players: string[];
  claimed: boolean;
}

// マルチ冒険結果をユーザーに保存
export async function saveMultiAdventureForUser(
  username: string, 
  roomCode: string,
  dungeonId: string,
  victory: boolean,
  droppedItemId: string | undefined,
  logs: any[],
  players: string[],
  droppedEquipmentId?: string
): Promise<boolean> {
  try {
    const result: MultiAdventureResult = {
      roomCode,
      dungeonId,
      victory,
      droppedItemId,
      droppedEquipmentId,
      completedAt: Date.now(),
      logs,
      players,
      claimed: false,
    };
    
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/multiAdventure.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
    
    return res.ok;
  } catch (e) {
    console.error('Failed to save multi adventure for user:', e);
    return false;
  }
}

// マルチ冒険結果を取得
export async function getMultiAdventure(username: string): Promise<MultiAdventureResult | null> {
  return firebaseGet<MultiAdventureResult>(`guild-adventure/users/${username}/multiAdventure`);
}

// マルチ冒険結果を受け取り済みにする
export async function claimMultiAdventure(username: string): Promise<{ success: boolean; itemId?: string }> {
  try {
    const result = await getMultiAdventure(username);
    if (!result || result.claimed) {
      return { success: false };
    }
    
    // claimed を true に更新
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/multiAdventure/claimed.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(true),
    });
    
    if (res.ok) {
      return { success: true, itemId: result.droppedItemId };
    }
    return { success: false };
  } catch (e) {
    console.error('Failed to claim multi adventure:', e);
    return { success: false };
  }
}

// マルチ冒険結果をクリア
export async function clearMultiAdventure(username: string): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/guild-adventure/users/${username}/multiAdventure.json`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
