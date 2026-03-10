/**
 * レートマッチメイキング
 * - Firebase Realtime Databaseのキューにエントリーを追加
 * - 近いレート帯の相手を自動マッチング
 * - マッチ成立時にルームを自動作成してバトルへ遷移
 */

import { dbSet, dbGet, dbRemove, dbListen, dbUpdate } from '../firebase/database';
import { createRoom } from '../firebase/database';
import { generateRoomCode } from './room';
import { Unsubscribe } from 'firebase/database';
import { getFirebaseDatabase } from '../firebase/config';
import { ref, onValue, get, query, orderByChild, startAt, endAt } from 'firebase/database';

// マッチメイキングキューのエントリー
export interface QueueEntry {
  userId: string;
  rating: number;
  joinedAt: number;
  // マッチ成立後に書き込まれる
  matchedRoomCode?: string;
  matchedOpponentId?: string;
}

// レート差の許容範囲（時間経過で広がる）
const INITIAL_RANGE = 100;  // 最初は±100
const RANGE_EXPAND_PER_SEC = 10; // 1秒ごとに±10拡大
const MAX_RANGE = 500; // 最大±500

/**
 * マッチキューに参加
 */
export async function joinMatchQueue(userId: string, rating: number): Promise<void> {
  const entry: QueueEntry = {
    userId,
    rating,
    joinedAt: Date.now(),
  };
  await dbSet(`matchQueue/${userId}`, entry);
}

/**
 * マッチキューから退出
 */
export async function leaveMatchQueue(userId: string): Promise<void> {
  await dbRemove(`matchQueue/${userId}`);
}

/**
 * キュー内の自分のエントリーを監視（マッチ成立検知用）
 */
export function watchMyQueueEntry(
  userId: string,
  callback: (entry: QueueEntry | null) => void
): Unsubscribe {
  return dbListen<QueueEntry>(`matchQueue/${userId}`, callback);
}

/**
 * マッチング試行（クライアント側でポーリング）
 * - 自分のレート±範囲内の相手を検索
 * - 見つかったらルーム作成してお互いのエントリーに書き込む
 * 
 * 返り値: マッチ成立したらroomCode、なければnull
 */
export async function tryMatch(userId: string, rating: number): Promise<string | null> {
  const db = getFirebaseDatabase();
  
  // 自分のエントリーを確認（既にマッチ済みか）
  const myEntry = await dbGet<QueueEntry>(`matchQueue/${userId}`);
  if (!myEntry) return null;
  if (myEntry.matchedRoomCode) return myEntry.matchedRoomCode;
  
  // 経過時間に応じてレート範囲を拡大
  const elapsed = (Date.now() - myEntry.joinedAt) / 1000;
  const range = Math.min(INITIAL_RANGE + elapsed * RANGE_EXPAND_PER_SEC, MAX_RANGE);
  
  // キュー全体を取得して近いレートの相手を探す
  const snapshot = await get(ref(db, 'matchQueue'));
  if (!snapshot.exists()) return null;
  
  const entries = snapshot.val() as Record<string, QueueEntry>;
  let bestMatch: QueueEntry | null = null;
  let bestDiff = Infinity;
  
  for (const [key, entry] of Object.entries(entries)) {
    // 自分自身はスキップ
    if (key === userId) continue;
    // 既にマッチ済みはスキップ
    if (entry.matchedRoomCode) continue;
    
    const diff = Math.abs(entry.rating - rating);
    if (diff <= range && diff < bestDiff) {
      bestMatch = entry;
      bestDiff = diff;
    }
  }
  
  if (!bestMatch) return null;
  
  // マッチ成立！ルーム作成
  const roomCode = generateRoomCode();
  await createRoom(roomCode, userId);
  
  // 両者のエントリーにルームコードを書き込む
  await dbUpdate(`matchQueue/${userId}`, {
    matchedRoomCode: roomCode,
    matchedOpponentId: bestMatch.userId,
  });
  await dbUpdate(`matchQueue/${bestMatch.userId}`, {
    matchedRoomCode: roomCode,
    matchedOpponentId: userId,
  });
  
  return roomCode;
}

/**
 * マッチング完了後のクリーンアップ
 */
export async function cleanupAfterMatch(userId: string): Promise<void> {
  await dbRemove(`matchQueue/${userId}`);
}
