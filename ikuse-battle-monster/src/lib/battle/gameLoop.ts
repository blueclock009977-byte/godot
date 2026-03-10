/**
 * ゲームループ管理モジュール
 * バトル全体の流れを制御
 */

import {
  BattleState,
  BattleAction,
  BattlePhase,
  Skill,
  MonsterSpecies,
  MonsterInstance,
} from '../types';
import {
  createBattleState,
  createBattlePlayer,
  getActiveMonster,
  checkWinner,
  addLog,
  getAvailableSwitches,
  getUsableSkills,
} from './state';
import {
  executeFullTurn,
  executeForcedSwitch,
  processTurnStart,
} from './turn';
import { processOnEnterAbility } from './effects';
import { getForcedSwitchOptions } from './actions';

// ============================================
// ゲーム状態
// ============================================

export interface GameState {
  battle: BattleState;
  status: 'waiting' | 'selecting' | 'resolving' | 'forced_switch' | 'ended';
  winner: 0 | 1 | null;
  pendingActions: {
    0: BattleAction | null;
    1: BattleAction | null;
  };
  forcedSwitchPending: (0 | 1)[];
  turnMessages: string[];
}

/**
 * ゲーム状態を初期化
 */
export function createGameState(
  player1Data: {
    id: string;
    name: string;
    party: { instance: MonsterInstance; species: MonsterSpecies }[];
  },
  player2Data: {
    id: string;
    name: string;
    party: { instance: MonsterInstance; species: MonsterSpecies }[];
  }
): GameState {
  const player1 = createBattlePlayer(player1Data.id, player1Data.name, player1Data.party);
  const player2 = createBattlePlayer(player2Data.id, player2Data.name, player2Data.party);
  const battle = createBattleState(player1, player2);
  
  return {
    battle,
    status: 'selecting',
    winner: null,
    pendingActions: { 0: null, 1: null },
    forcedSwitchPending: [],
    turnMessages: [],
  };
}

// ============================================
// バトル開始
// ============================================

export interface BattleStartResult {
  messages: string[];
  state: GameState;
}

/**
 * バトルを開始
 */
export function startBattle(state: GameState): BattleStartResult {
  const messages: string[] = [];
  
  messages.push('バトル開始！');
  addLog(state.battle, 'バトル開始！', 'info');
  
  // 両プレイヤーの初期モンスターを出す
  for (let i = 0; i < 2; i++) {
    const player = state.battle.players[i as 0 | 1];
    const monster = getActiveMonster(player);
    
    messages.push(`${player.name}は${monster.species.name}を繰り出した！`);
    addLog(state.battle, `${player.name}は${monster.species.name}を繰り出した！`, 'switch');
    
    // 登場時特性
    const abilityMessages = processOnEnterAbility(state.battle, i as 0 | 1);
    messages.push(...abilityMessages);
  }
  
  // ターン1開始
  const turnStartResult = processTurnStart(state.battle);
  messages.push(...turnStartResult.messages);
  
  state.status = 'selecting';
  state.turnMessages = messages;
  
  return { messages, state };
}

// ============================================
// 行動選択
// ============================================

export interface ActionSubmitResult {
  success: boolean;
  message: string;
  bothReady: boolean;
}

/**
 * プレイヤーの行動を設定
 */
export function submitAction(
  state: GameState,
  playerIndex: 0 | 1,
  action: BattleAction,
  skills: Map<string, Skill>
): ActionSubmitResult {
  // ステータスチェック
  if (state.status !== 'selecting') {
    return {
      success: false,
      message: '今は行動を選択できません',
      bothReady: false,
    };
  }
  
  const player = state.battle.players[playerIndex];
  
  // 行動の妥当性チェック
  switch (action.type) {
    case 'skill':
      if (!action.skillId) {
        return { success: false, message: '技が指定されていません', bothReady: false };
      }
      const usableSkills = getUsableSkills(player, skills as Map<string, { manaCost: number }>);
      if (!usableSkills.includes(action.skillId)) {
        return { success: false, message: 'その技は使えません（マナ不足または未習得）', bothReady: false };
      }
      break;
      
    case 'switch':
      if (action.switchTo === undefined) {
        return { success: false, message: '交代先が指定されていません', bothReady: false };
      }
      const switchOptions = getAvailableSwitches(player);
      if (!switchOptions.includes(action.switchTo)) {
        return { success: false, message: 'そのモンスターには交代できません', bothReady: false };
      }
      break;
  }
  
  // 行動を登録
  state.pendingActions[playerIndex] = action;
  
  // 両方揃ったかチェック
  const bothReady = state.pendingActions[0] !== null && state.pendingActions[1] !== null;
  
  return {
    success: true,
    message: '行動を選択しました',
    bothReady,
  };
}

// ============================================
// ターン実行
// ============================================

export interface TurnExecutionResult {
  messages: string[];
  phase: BattlePhase;
  winner: 0 | 1 | null;
  needsForcedSwitch: boolean;
  state: GameState;
}

/**
 * ターンを実行（両方の行動が揃っている場合）
 */
export function executeTurn(
  state: GameState,
  skills: Map<string, Skill>
): TurnExecutionResult {
  const action0 = state.pendingActions[0];
  const action1 = state.pendingActions[1];
  
  if (!action0 || !action1) {
    return {
      messages: ['両プレイヤーの行動が揃っていません'],
      phase: state.battle.phase,
      winner: null,
      needsForcedSwitch: false,
      state,
    };
  }
  
  state.status = 'resolving';
  
  // ターン実行
  const result = executeFullTurn(state.battle, action0, action1, skills);
  
  // 行動をリセット
  state.pendingActions = { 0: null, 1: null };
  
  // 勝敗チェック
  if (result.winner !== null) {
    state.status = 'ended';
    state.winner = result.winner;
    
    const winnerPlayer = state.battle.players[result.winner];
    result.messages.push(`${winnerPlayer.name}の勝利！`);
    addLog(state.battle, `${winnerPlayer.name}の勝利！`, 'info');
  }
  // 強制交代が必要
  else if (result.needsForcedSwitch.length > 0) {
    state.status = 'forced_switch';
    state.forcedSwitchPending = result.needsForcedSwitch.map(s => s.playerIndex);
  }
  // 次のターンへ
  else {
    state.status = 'selecting';
  }
  
  state.turnMessages = result.messages;
  
  return {
    messages: result.messages,
    phase: result.phase,
    winner: result.winner,
    needsForcedSwitch: result.needsForcedSwitch.length > 0,
    state,
  };
}

// ============================================
// 強制交代
// ============================================

export interface ForcedSwitchSubmitResult {
  success: boolean;
  messages: string[];
  allSwitched: boolean;
  state: GameState;
}

/**
 * 強制交代を実行
 */
export function submitForcedSwitch(
  state: GameState,
  playerIndex: 0 | 1,
  switchTo: number
): ForcedSwitchSubmitResult {
  // ステータスチェック
  if (state.status !== 'forced_switch') {
    return {
      success: false,
      messages: ['今は交代できません'],
      allSwitched: false,
      state,
    };
  }
  
  // このプレイヤーが交代待ちかチェック
  if (!state.forcedSwitchPending.includes(playerIndex)) {
    return {
      success: false,
      messages: ['交代の必要がありません'],
      allSwitched: false,
      state,
    };
  }
  
  // 交代実行
  const result = executeForcedSwitch(state.battle, playerIndex, switchTo);
  
  if (!result.success) {
    return {
      success: false,
      messages: result.messages,
      allSwitched: false,
      state,
    };
  }
  
  // 交代待ちリストから削除
  state.forcedSwitchPending = state.forcedSwitchPending.filter(i => i !== playerIndex);
  
  // 全員交代完了？
  const allSwitched = state.forcedSwitchPending.length === 0;
  
  if (allSwitched) {
    // 勝敗再チェック
    const winner = checkWinner(state.battle);
    if (winner !== null) {
      state.status = 'ended';
      state.winner = winner;
      
      const winnerPlayer = state.battle.players[winner];
      result.messages.push(`${winnerPlayer.name}の勝利！`);
    } else {
      // 次のターンへ
      state.status = 'selecting';
      state.battle.turn++;
      state.battle.phase = 'selection';
      
      // ターン開始処理
      const turnStartResult = processTurnStart(state.battle);
      result.messages.push(...turnStartResult.messages);
    }
  }
  
  return {
    success: true,
    messages: result.messages,
    allSwitched,
    state,
  };
}

// ============================================
// 行動選択肢の取得
// ============================================

export interface AvailableActions {
  skills: { skillId: string; skill: Skill }[];
  switches: { index: number; monster: { name: string; hp: number; maxHp: number } }[];
  canWait: boolean;
}

/**
 * 選択可能な行動を取得
 */
export function getAvailableActions(
  state: GameState,
  playerIndex: 0 | 1,
  skills: Map<string, Skill>
): AvailableActions {
  const player = state.battle.players[playerIndex];
  
  // 使用可能な技
  const usableSkillIds = getUsableSkills(player, skills as Map<string, { manaCost: number }>);
  const availableSkills = usableSkillIds
    .map(id => {
      const skill = skills.get(id);
      return skill ? { skillId: id, skill } : null;
    })
    .filter((s): s is { skillId: string; skill: Skill } => s !== null);
  
  // 交代可能なモンスター
  const switchIndices = getAvailableSwitches(player);
  const availableSwitches = switchIndices.map(index => {
    const m = player.party[index];
    return {
      index,
      monster: {
        name: m.species.name,
        hp: m.currentHp,
        maxHp: m.maxHp,
      },
    };
  });
  
  return {
    skills: availableSkills,
    switches: availableSwitches,
    canWait: true,
  };
}

// ============================================
// AI行動選択（シンプル版）
// ============================================

/**
 * AIの行動を決定（シンプルなランダム選択）
 */
export function selectAIAction(
  state: GameState,
  playerIndex: 0 | 1,
  skills: Map<string, Skill>
): BattleAction {
  const available = getAvailableActions(state, playerIndex, skills);
  
  // 使える技があればランダムに選ぶ
  if (available.skills.length > 0) {
    const randomSkill = available.skills[Math.floor(Math.random() * available.skills.length)];
    return { type: 'skill', skillId: randomSkill.skillId };
  }
  
  // 技がなければ交代
  if (available.switches.length > 0) {
    const randomSwitch = available.switches[Math.floor(Math.random() * available.switches.length)];
    return { type: 'switch', switchTo: randomSwitch.index };
  }
  
  // 何もできなければ待機
  return { type: 'wait' };
}

/**
 * AI用の強制交代先を選択
 */
export function selectAIForcedSwitch(
  state: GameState,
  playerIndex: 0 | 1
): number {
  const player = state.battle.players[playerIndex];
  const options = getForcedSwitchOptions(player);
  
  // HPが最も高いモンスターを選ぶ
  let bestIndex = options[0];
  let bestHpRatio = 0;
  
  for (const index of options) {
    const monster = player.party[index];
    const hpRatio = monster.currentHp / monster.maxHp;
    if (hpRatio > bestHpRatio) {
      bestHpRatio = hpRatio;
      bestIndex = index;
    }
  }
  
  return bestIndex;
}

// ============================================
// バトル結果
// ============================================

export interface BattleResult {
  winner: 0 | 1;
  winnerName: string;
  loserName: string;
  turns: number;
  log: {
    turn: number;
    message: string;
    type: string;
  }[];
}

/**
 * バトル結果を取得
 */
export function getBattleResult(state: GameState): BattleResult | null {
  if (state.status !== 'ended' || state.winner === null) {
    return null;
  }
  
  const winner = state.battle.players[state.winner];
  const loser = state.battle.players[1 - state.winner as 0 | 1];
  
  return {
    winner: state.winner,
    winnerName: winner.name,
    loserName: loser.name,
    turns: state.battle.turn,
    log: state.battle.log,
  };
}
