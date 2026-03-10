// マッチング処理
import { getRoom, RoomData } from "../firebase/database";
import { createRoom, joinRoom, watchRoom, startGame } from "./room";
import { Unsubscribe } from "firebase/database";

export type MatchStatus = 
  | "idle"
  | "creating"
  | "waiting"
  | "joining"
  | "ready"
  | "starting"
  | "playing"
  | "error";

export interface MatchState {
  status: MatchStatus;
  roomCode: string | null;
  userId: string;
  isHost: boolean;
  opponentId: string | null;
  error: string | null;
}

export class MatchManager {
  private state: MatchState;
  private roomUnsubscribe: Unsubscribe | null = null;
  private onStateChange: (state: MatchState) => void;
  
  constructor(
    userId: string,
    onStateChange: (state: MatchState) => void
  ) {
    this.state = {
      status: "idle",
      roomCode: null,
      userId,
      isHost: false,
      opponentId: null,
      error: null,
    };
    this.onStateChange = onStateChange;
  }
  
  private setState(updates: Partial<MatchState>) {
    this.state = { ...this.state, ...updates };
    this.onStateChange(this.state);
  }
  
  // ルーム作成
  async create(): Promise<string | null> {
    try {
      this.setState({ status: "creating", error: null });
      
      const code = await createRoom(this.state.userId);
      
      this.setState({
        status: "waiting",
        roomCode: code,
        isHost: true,
      });
      
      // ルーム監視開始
      this.watchRoomChanges(code);
      
      return code;
    } catch (error) {
      this.setState({
        status: "error",
        error: `ルーム作成失敗: ${error}`,
      });
      return null;
    }
  }
  
  // ルーム参加
  async join(code: string): Promise<boolean> {
    try {
      this.setState({ status: "joining", error: null });
      
      const result = await joinRoom(code, this.state.userId);
      
      if (!result.success) {
        this.setState({
          status: "error",
          error: result.error || "参加に失敗しました",
        });
        return false;
      }
      
      const room = await getRoom(code);
      
      this.setState({
        status: "ready",
        roomCode: code,
        isHost: false,
        opponentId: room?.hostId || null,
      });
      
      // ルーム監視開始
      this.watchRoomChanges(code);
      
      return true;
    } catch (error) {
      this.setState({
        status: "error",
        error: `参加失敗: ${error}`,
      });
      return false;
    }
  }
  
  // ゲーム開始（ホストのみ）
  async start(): Promise<boolean> {
    if (!this.state.isHost || !this.state.roomCode) {
      return false;
    }
    
    try {
      this.setState({ status: "starting" });
      
      const success = await startGame(this.state.roomCode);
      
      if (success) {
        this.setState({ status: "playing" });
      }
      
      return success;
    } catch (error) {
      this.setState({
        status: "error",
        error: `開始失敗: ${error}`,
      });
      return false;
    }
  }
  
  // ルーム変更監視
  private watchRoomChanges(code: string) {
    this.roomUnsubscribe = watchRoom(code, (room: RoomData | null) => {
      if (!room) {
        this.setState({
          status: "error",
          error: "ルームが削除されました",
          roomCode: null,
        });
        return;
      }
      
      // ゲスト参加を検知（ホスト側）
      if (this.state.isHost && room.guestId && !this.state.opponentId) {
        this.setState({
          status: "ready",
          opponentId: room.guestId,
        });
      }
      
      // ゲーム開始を検知（ゲスト側）
      if (!this.state.isHost && room.status === "playing") {
        this.setState({ status: "playing" });
      }
      
      // ゲーム終了を検知
      if (room.status === "finished") {
        this.cleanup();
      }
    });
  }
  
  // クリーンアップ
  cleanup() {
    if (this.roomUnsubscribe) {
      this.roomUnsubscribe();
      this.roomUnsubscribe = null;
    }
    this.setState({
      status: "idle",
      roomCode: null,
      isHost: false,
      opponentId: null,
    });
  }
  
  getState(): MatchState {
    return this.state;
  }
}
