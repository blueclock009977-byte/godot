// パスワード管理（引き継ぎ用）
import { dbGet, dbSet, dbRemove } from "../firebase/database";

// ============================================
// SHA-256 ハッシュ
// ============================================

/** パスワードをSHA-256でハッシュ化 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// Firebaseパス
// ============================================

const PASSWORD_PATH = (hashedPassword: string) => `passwords/${hashedPassword}`;
const USER_PASSWORD_PATH = (uid: string) => `user_passwords/${uid}`;

// ============================================
// パスワード設定
// ============================================

export interface PasswordData {
  uid: string;
  createdAt: number;
}

/**
 * パスワードを設定
 * @param uid ユーザーID
 * @param password パスワード（8文字以上）
 * @returns 成功/失敗
 */
export async function setPassword(uid: string, password: string): Promise<{ success: boolean; error?: string }> {
  // バリデーション
  if (password.length < 8) {
    return { success: false, error: 'パスワードは8文字以上で入力してください' };
  }
  
  const hashedPassword = await hashPassword(password);
  
  // 既に同じパスワードが使われていないかチェック
  const existing = await dbGet<PasswordData>(PASSWORD_PATH(hashedPassword));
  if (existing && existing.uid !== uid) {
    return { success: false, error: 'このパスワードは既に使用されています' };
  }
  
  // 古いパスワードを削除（既に設定済みの場合）
  const oldHash = await dbGet<string>(USER_PASSWORD_PATH(uid));
  if (oldHash) {
    await dbRemove(PASSWORD_PATH(oldHash));
  }
  
  // 新しいパスワードを保存
  const passwordData: PasswordData = {
    uid,
    createdAt: Date.now(),
  };
  await dbSet(PASSWORD_PATH(hashedPassword), passwordData);
  await dbSet(USER_PASSWORD_PATH(uid), hashedPassword);
  
  return { success: true };
}

/**
 * パスワードを検証してユーザーIDを返す
 * @param password パスワード
 * @returns uid または null
 */
export async function verifyPassword(password: string): Promise<string | null> {
  if (password.length < 8) {
    return null;
  }
  
  const hashedPassword = await hashPassword(password);
  const data = await dbGet<PasswordData>(PASSWORD_PATH(hashedPassword));
  
  return data?.uid ?? null;
}

/**
 * ユーザーがパスワードを設定済みか確認
 * @param uid ユーザーID
 * @returns パスワード設定済みならtrue
 */
export async function hasPassword(uid: string): Promise<boolean> {
  const hash = await dbGet<string>(USER_PASSWORD_PATH(uid));
  return hash !== null;
}

/**
 * パスワードを削除
 * @param uid ユーザーID
 */
export async function removePassword(uid: string): Promise<void> {
  const hash = await dbGet<string>(USER_PASSWORD_PATH(uid));
  if (hash) {
    await dbRemove(PASSWORD_PATH(hash));
    await dbRemove(USER_PASSWORD_PATH(uid));
  }
}
