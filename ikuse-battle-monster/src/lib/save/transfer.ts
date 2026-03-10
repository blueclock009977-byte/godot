// データ引き継ぎ機能
import { verifyPassword } from "./password";
import { loadUserData, saveUserData, UserData } from "./userData";
import { setLocalUserData, clearLocalUserData } from "./sync";
import { getCurrentUser, signOut, signInAnonymousUser } from "../firebase/auth";

// ============================================
// 引き継ぎ結果
// ============================================

export interface TransferResult {
  success: boolean;
  error?: string;
  userData?: UserData;
  newUid?: string;
}

// ============================================
// データ引き継ぎ
// ============================================

/**
 * パスワードでデータを引き継ぐ
 * 1. パスワードからuidを取得
 * 2. 現在のユーザーとuidが異なる場合、データをマージまたは上書き
 * 3. ローカルストレージを更新
 * 
 * @param password 引き継ぎパスワード
 * @returns 結果
 */
export async function transferData(password: string): Promise<TransferResult> {
  // パスワード検証
  const targetUid = await verifyPassword(password);
  if (!targetUid) {
    return { success: false, error: 'パスワードが正しくありません' };
  }
  
  // 現在のユーザー情報
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'ログインしていません' };
  }
  
  // 同じユーザーの場合は何もしない
  if (currentUser.uid === targetUid) {
    return { success: false, error: '既にこのデータでログインしています' };
  }
  
  // 引き継ぎ先のデータを取得
  const targetData = await loadUserData(targetUid);
  if (!targetData) {
    return { success: false, error: '引き継ぎ先のデータが見つかりません' };
  }
  
  // ローカルストレージをクリア
  clearLocalUserData();
  
  // 現在のセッションをログアウト
  await signOut();
  
  // 新しい匿名ユーザーを作成
  const newUser = await signInAnonymousUser();
  
  // 引き継ぎ先のデータを新しいユーザーにコピー
  const newUserData: UserData = {
    ...targetData,
    userId: newUser.uid,
    lastLogin: Date.now(),
  };
  
  await saveUserData(newUser.uid, newUserData);
  setLocalUserData(newUserData);
  
  return {
    success: true,
    userData: newUserData,
    newUid: newUser.uid,
  };
}

/**
 * 引き継ぎの確認（破壊的操作の警告用）
 * 現在のデータがあるかどうかをチェック
 */
export async function checkCurrentData(): Promise<{
  hasData: boolean;
  monsterCount: number;
  wins: number;
}> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { hasData: false, monsterCount: 0, wins: 0 };
  }
  
  const userData = await loadUserData(currentUser.uid);
  if (!userData) {
    return { hasData: false, monsterCount: 0, wins: 0 };
  }
  
  return {
    hasData: userData.monsters.length > 0,
    monsterCount: userData.monsters.length,
    wins: userData.record.wins,
  };
}
