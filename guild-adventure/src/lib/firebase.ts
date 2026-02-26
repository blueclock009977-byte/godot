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
  try {
    const initialData: UserData = {
      username,
      characters: [],
      party: {
        front: [null, null, null],
        back: [null, null, null],
      },
      inventory: {},
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
