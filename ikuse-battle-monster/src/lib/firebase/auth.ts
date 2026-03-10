// Firebase Authentication - 匿名認証
import {
  signInAnonymously,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirebaseAuth } from "./config";

export interface AuthUser {
  uid: string;
  isAnonymous: boolean;
}

/**
 * 匿名ログイン
 * ユーザーがいなければ新規作成、いれば既存ユーザーでログイン
 */
export async function signInAnonymousUser(): Promise<AuthUser> {
  const auth = getFirebaseAuth();
  const credential = await signInAnonymously(auth);
  return {
    uid: credential.user.uid,
    isAnonymous: credential.user.isAnonymous,
  };
}

/**
 * 現在のユーザーを取得
 */
export function getCurrentUser(): AuthUser | null {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return {
    uid: user.uid,
    isAnonymous: user.isAnonymous,
  };
}

/**
 * 認証状態の変化を監視
 */
export function onAuthChange(
  callback: (user: AuthUser | null) => void
): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        isAnonymous: firebaseUser.isAnonymous,
      });
    } else {
      callback(null);
    }
  });
}

/**
 * ログアウト
 */
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

/**
 * 初回起動時の自動ログイン
 * ブラウザにセッションが残っていればそれを使用、なければ新規匿名ユーザー作成
 */
export async function autoLogin(): Promise<AuthUser> {
  const auth = getFirebaseAuth();
  
  // 既存のセッションがあるかチェック
  const currentUser = auth.currentUser;
  if (currentUser) {
    return {
      uid: currentUser.uid,
      isAnonymous: currentUser.isAnonymous,
    };
  }
  
  // なければ新規匿名ログイン
  return signInAnonymousUser();
}
