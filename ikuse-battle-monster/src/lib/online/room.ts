// ルーム管理
import {
  createRoom as dbCreateRoom,
  joinRoom as dbJoinRoom,
  getRoom,
  deleteRoom,
  listenRoom,
  updateRoomStatus,
  RoomData,
} from "../firebase/database";
import { Unsubscribe } from "firebase/database";

// 6文字のルームコード生成
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ユーザーID生成（セッション用）
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ルーム作成
export async function createRoom(hostId: string): Promise<string> {
  let code = generateRoomCode();
  let attempts = 0;
  
  // コードが既に使われていたら再生成
  while (attempts < 10) {
    const existing = await getRoom(code);
    if (!existing) {
      break;
    }
    // 古いルームは削除（5分以上経過）
    if (Date.now() - existing.updatedAt > 5 * 60 * 1000) {
      await deleteRoom(code);
      break;
    }
    code = generateRoomCode();
    attempts++;
  }
  
  await dbCreateRoom(code, hostId);
  return code;
}

// ルーム参加
export async function joinRoom(
  code: string,
  guestId: string
): Promise<{ success: boolean; error?: string }> {
  const room = await getRoom(code);
  
  if (!room) {
    return { success: false, error: "ルームが見つかりません" };
  }
  
  if (room.status !== "waiting") {
    return { success: false, error: "このルームは既に対戦中です" };
  }
  
  const success = await dbJoinRoom(code, guestId);
  if (!success) {
    return { success: false, error: "参加に失敗しました" };
  }
  
  return { success: true };
}

// ルーム退出
export async function leaveRoom(
  code: string,
  userId: string
): Promise<void> {
  const room = await getRoom(code);
  if (!room) return;
  
  if (room.hostId === userId) {
    // ホストが退出したらルーム削除
    await deleteRoom(code);
  } else if (room.guestId === userId) {
    // ゲストが退出したら待機状態に戻す
    await updateRoomStatus(code, "waiting");
  }
}

// ルーム監視
export function watchRoom(
  code: string,
  callback: (room: RoomData | null) => void
): Unsubscribe {
  return listenRoom(code, callback);
}

// ゲーム開始
export async function startGame(code: string): Promise<boolean> {
  const room = await getRoom(code);
  if (!room || room.status !== "ready") {
    return false;
  }
  
  await updateRoomStatus(code, "playing");
  return true;
}

// ゲーム終了
export async function endGame(code: string): Promise<void> {
  await updateRoomStatus(code, "finished");
  // 少し待ってからルーム削除
  setTimeout(async () => {
    await deleteRoom(code);
  }, 5000);
}

export type { RoomData };
