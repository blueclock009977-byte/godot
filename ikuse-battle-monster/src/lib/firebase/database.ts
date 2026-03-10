// Firebase Realtime Database操作
import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  push,
  child,
  DataSnapshot,
  Unsubscribe,
} from "firebase/database";
import { getFirebaseDatabase } from "./config";

// ========== 汎用操作 ==========

export async function dbSet<T>(path: string, data: T): Promise<void> {
  const db = getFirebaseDatabase();
  await set(ref(db, path), data);
}

export async function dbGet<T>(path: string): Promise<T | null> {
  const db = getFirebaseDatabase();
  const snapshot = await get(ref(db, path));
  return snapshot.exists() ? (snapshot.val() as T) : null;
}

export async function dbUpdate(
  path: string,
  updates: Record<string, unknown>
): Promise<void> {
  const db = getFirebaseDatabase();
  await update(ref(db, path), updates);
}

export async function dbRemove(path: string): Promise<void> {
  const db = getFirebaseDatabase();
  await remove(ref(db, path));
}

export async function dbPush<T>(path: string, data: T): Promise<string> {
  const db = getFirebaseDatabase();
  const newRef = push(child(ref(db), path));
  await set(newRef, data);
  return newRef.key!;
}

export function dbListen<T>(
  path: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const db = getFirebaseDatabase();
  return onValue(ref(db, path), (snapshot: DataSnapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as T) : null);
  });
}

// ========== ルーム管理 ==========

export interface RoomData {
  code: string;
  hostId: string;
  guestId?: string;
  status: "waiting" | "ready" | "playing" | "finished";
  createdAt: number;
  updatedAt: number;
}

export async function createRoom(
  code: string,
  hostId: string
): Promise<void> {
  const room: RoomData = {
    code,
    hostId,
    status: "waiting",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await dbSet(`rooms/${code}`, room);
}

export async function joinRoom(
  code: string,
  guestId: string
): Promise<boolean> {
  const room = await dbGet<RoomData>(`rooms/${code}`);
  if (!room || room.status !== "waiting") {
    return false;
  }
  await dbUpdate(`rooms/${code}`, {
    guestId,
    status: "ready",
    updatedAt: Date.now(),
  });
  return true;
}

export async function getRoom(code: string): Promise<RoomData | null> {
  return dbGet<RoomData>(`rooms/${code}`);
}

export async function updateRoomStatus(
  code: string,
  status: RoomData["status"]
): Promise<void> {
  await dbUpdate(`rooms/${code}`, { status, updatedAt: Date.now() });
}

export async function deleteRoom(code: string): Promise<void> {
  await dbRemove(`rooms/${code}`);
}

export function listenRoom(
  code: string,
  callback: (room: RoomData | null) => void
): Unsubscribe {
  return dbListen<RoomData>(`rooms/${code}`, callback);
}

// ========== バトル状態同期 ==========

export interface SyncedBattleState {
  turn: number;
  currentPlayer: number;
  actions: Array<{
    playerId: string;
    turn: number;
    action: unknown;
    timestamp: number;
  }>;
  lastUpdate: number;
}

export async function initBattleState(code: string): Promise<void> {
  const state: SyncedBattleState = {
    turn: 1,
    currentPlayer: 0,
    actions: [],
    lastUpdate: Date.now(),
  };
  await dbSet(`battles/${code}`, state);
}

export async function submitAction(
  code: string,
  playerId: string,
  turn: number,
  action: unknown
): Promise<void> {
  const db = getFirebaseDatabase();
  const actionRef = push(ref(db, `battles/${code}/actions`));
  await set(actionRef, {
    playerId,
    turn,
    action,
    timestamp: Date.now(),
  });
}

export function listenBattleState(
  code: string,
  callback: (state: SyncedBattleState | null) => void
): Unsubscribe {
  return dbListen<SyncedBattleState>(`battles/${code}`, callback);
}

// ========== ユーザーデータ ==========

export interface UserData {
  odlastLogin: number;
  createdAt: number;
  monsters: Array<{
    id: string;
    monsterId: string;
    nickname?: string;
    level: number;
    exp: number;
    ivs: { hp: number; atk: number; def: number; spAtk: number; spDef: number; speed: number };
  }>;
  party: string[]; // monster instance ids
  wins: number;
  losses: number;
}

export async function saveUserData(
  userId: string,
  data: UserData
): Promise<void> {
  await dbSet(`users/${userId}`, data);
}

export async function getUserData(userId: string): Promise<UserData | null> {
  return dbGet<UserData>(`users/${userId}`);
}

export async function updateUserData(
  userId: string,
  updates: Partial<UserData>
): Promise<void> {
  await dbUpdate(`users/${userId}`, updates as Record<string, unknown>);
}
