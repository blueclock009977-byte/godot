// Firebaseとの同期処理
import { AuthUser } from "../firebase/auth";
import { dbListen } from "../firebase/database";
import { 
  UserData, 
  loadUserData, 
  saveUserData, 
  initializeNewUser,
  createDefaultUserData 
} from "./userData";

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncTime: number | null;
  error: string | null;
}

// ============================================
// ローカルストレージ（オフライン対応）
// ============================================

const LOCAL_STORAGE_KEY = 'ikuse_battle_user_data';

/** ローカルストレージからデータを取得 */
export function getLocalUserData(): UserData | null {
  if (typeof window === 'undefined') return null;
  try {
    const json = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as UserData;
  } catch {
    return null;
  }
}

/** ローカルストレージにデータを保存 */
export function setLocalUserData(data: UserData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

/** ローカルストレージをクリア */
export function clearLocalUserData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

// ============================================
// 同期ロジック
// ============================================

/**
 * ユーザーデータを同期（ログイン時に呼ぶ）
 * 1. Firebaseからデータ取得
 * 2. なければ新規作成
 * 3. ローカルストレージにキャッシュ
 */
export async function syncUserData(user: AuthUser): Promise<UserData> {
  try {
    // Firebaseからデータを取得
    let userData = await loadUserData(user.uid);
    
    if (!userData) {
      // 新規ユーザー
      userData = await initializeNewUser(user.uid);
    } else {
      // 既存ユーザー - lastLoginを更新
      userData.lastLogin = Date.now();
      await saveUserData(user.uid, userData);
    }
    
    // ローカルにキャッシュ
    setLocalUserData(userData);
    
    return userData;
  } catch (error) {
    console.error('Sync failed:', error);
    
    // オフラインの場合はローカルデータを使用
    const localData = getLocalUserData();
    if (localData && localData.userId === user.uid) {
      return localData;
    }
    
    // どうしようもない場合は仮のデータを返す
    return createDefaultUserData(user.uid);
  }
}

/**
 * データの変更をFirebaseに保存し、ローカルキャッシュも更新
 */
export async function saveAndSync(userData: UserData): Promise<void> {
  // まずローカルに保存（即座に反映）
  setLocalUserData(userData);
  
  // Firebaseに保存
  try {
    await saveUserData(userData.userId, userData);
  } catch (error) {
    console.error('Failed to save to Firebase:', error);
    // ローカルには保存済みなので、次回オンライン時に同期される
  }
}

/**
 * Firebaseからのリアルタイム更新を監視
 * 他デバイスでの変更を検知
 */
export function listenUserData(
  userId: string,
  callback: (data: UserData | null) => void
): () => void {
  return dbListen<UserData>(`users/${userId}`, (data) => {
    if (data) {
      // ローカルキャッシュも更新
      setLocalUserData(data);
    }
    callback(data);
  });
}

// ============================================
// オフライン検知
// ============================================

export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

export function onOnlineStatusChange(
  callback: (online: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// ============================================
// 競合解決（シンプル版：サーバー優先）
// ============================================

/**
 * ローカルとサーバーのデータを比較し、最新を採用
 * 基本はサーバー優先だが、ローカルの方が新しい場合はローカルを使う
 */
export function resolveConflict(
  local: UserData | null,
  server: UserData | null
): UserData | null {
  if (!local && !server) return null;
  if (!local) return server;
  if (!server) return local;
  
  // lastLoginが新しい方を採用
  if (local.lastLogin > server.lastLogin) {
    return local;
  }
  return server;
}
