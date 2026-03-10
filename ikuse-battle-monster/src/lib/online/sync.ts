// 行動同期システム
import {
  initBattleState,
  submitAction,
  listenBattleState,
  SyncedBattleState,
  dbUpdate,
} from "../firebase/database";
import { BattleAction } from "../types";
import { Unsubscribe } from "firebase/database";

export interface SyncedAction {
  playerId: string;
  turn: number;
  action: BattleAction;
  timestamp: number;
}

export type SyncCallback = (actions: SyncedAction[], turn: number) => void;

export class BattleSync {
  private roomCode: string;
  private playerId: string;
  private unsubscribe: Unsubscribe | null = null;
  private pendingActions: Map<number, SyncedAction[]> = new Map();
  private onActionsReady: SyncCallback | null = null;
  private currentTurn: number = 1;
  
  constructor(roomCode: string, playerId: string) {
    this.roomCode = roomCode;
    this.playerId = playerId;
  }
  
  // バトル状態を初期化（ホストが呼ぶ）
  async initialize(): Promise<void> {
    await initBattleState(this.roomCode);
  }
  
  // 同期開始
  startSync(callback: SyncCallback): void {
    this.onActionsReady = callback;
    
    this.unsubscribe = listenBattleState(
      this.roomCode,
      (state: SyncedBattleState | null) => {
        if (!state) return;
        
        this.currentTurn = state.turn;
        this.processActions(state.actions || []);
      }
    );
  }
  
  // 行動処理
  private processActions(rawActions: unknown[]): void {
    const actions = (rawActions || []).filter(
      (a): a is SyncedAction => 
        a !== null && 
        typeof a === "object" && 
        "playerId" in a && 
        "turn" in a
    );
    
    // 現在ターンの行動を集める
    const turnActions = actions.filter((a) => a.turn === this.currentTurn);
    
    // 両プレイヤーの行動が揃ったら通知
    const playerIds = new Set(turnActions.map((a) => a.playerId));
    if (playerIds.size >= 2 && this.onActionsReady) {
      this.onActionsReady(turnActions, this.currentTurn);
    }
  }
  
  // 行動を送信
  async sendAction(action: BattleAction): Promise<void> {
    await submitAction(
      this.roomCode,
      this.playerId,
      this.currentTurn,
      action
    );
  }
  
  // 次のターンへ
  async advanceTurn(): Promise<void> {
    this.currentTurn++;
    await dbUpdate(`battles/${this.roomCode}`, {
      turn: this.currentTurn,
      lastUpdate: Date.now(),
    });
  }
  
  // 同期終了
  stopSync(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.onActionsReady = null;
    this.pendingActions.clear();
  }
  
  getCurrentTurn(): number {
    return this.currentTurn;
  }
}

// オンラインバトル用のターン解決
export function resolveOnlineTurn(
  actions: SyncedAction[],
  hostId: string
): { hostAction: BattleAction | null; guestAction: BattleAction | null } {
  const hostAction = actions.find((a) => a.playerId === hostId)?.action || null;
  const guestAction = actions.find((a) => a.playerId !== hostId)?.action || null;
  
  return { hostAction, guestAction };
}
