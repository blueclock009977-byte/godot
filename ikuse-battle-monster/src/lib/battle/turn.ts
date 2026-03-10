/**
 * ターン処理モジュール
 * ターンの流れ: 選択フェーズ → 行動解決フェーズ → ターン終了フェーズ
 */

import {
  BattleState,
  BattleAction,
  BattlePhase,
  Skill,
} from '../types';
import {
  getActiveMonster,
  regenerateMana,
  advancePhase,
  addLog,
  checkWinner,
} from './state';
import {
  resolveActionOrder,
  executeAction,
  needsForcedSwitch,
  getForcedSwitchOptions,
} from './actions';
import { processTurnEndEffects, processOnEnterAbility } from './effects';

// ============================================
// ターン開始処理
// ============================================

export interface TurnStartResult {
  messages: string[];
  phase: BattlePhase;
}

/**
 * ターン開始処理
 * - マナ回復
 * - ターン開始ログ
 */
export function processTurnStart(state: BattleState): TurnStartResult {
  const messages: string[] = [];
  
  messages.push(`=== ターン ${state.turn} ===`);
  addLog(state, `ターン ${state.turn} 開始`, 'info');
  
  // 両プレイヤーのマナを回復
  for (let i = 0; i < 2; i++) {
    const player = state.players[i as 0 | 1];
    const beforeMana = player.mana;
    regenerateMana(player);
    
    if (player.mana > beforeMana) {
      messages.push(`${player.name}のマナが${player.mana - beforeMana}回復した！（${player.mana}）`);
    }
  }
  
  return {
    messages,
    phase: state.phase,
  };
}

// ============================================
// 行動解決処理
// ============================================

export interface ActionResolutionResult {
  messages: string[];
  phase: BattlePhase;
  winner: 0 | 1 | null;
  actionResults: {
    playerIndex: 0 | 1;
    success: boolean;
    damage?: number;
    fainted?: boolean;
  }[];
}

/**
 * 両プレイヤーの行動を解決
 */
export function resolveActions(
  state: BattleState,
  action0: BattleAction,
  action1: BattleAction,
  skills: Map<string, Skill>
): ActionResolutionResult {
  const messages: string[] = [];
  const actionResults: ActionResolutionResult['actionResults'] = [];
  
  // 行動順を決定
  const orderedActions = resolveActionOrder(state, action0, action1, skills);
  
  // 行動を順番に実行
  for (const resolvedAction of orderedActions) {
    const { playerIndex, action } = resolvedAction;
    const player = state.players[playerIndex];
    const monster = getActiveMonster(player);
    
    // 戦闘不能チェック（先に倒れた場合はスキップ）
    if (monster.currentHp <= 0) {
      continue;
    }
    
    // 行動実行
    const result = executeAction(state, playerIndex, action, skills);
    messages.push(...result.messages);
    
    actionResults.push({
      playerIndex,
      success: result.success,
      damage: result.damage,
      fainted: result.fainted,
    });
    
    // 相手が倒れたかチェック
    if (result.fainted) {
      const opponentIndex = 1 - playerIndex as 0 | 1;
      const opponent = state.players[opponentIndex];
      
      // 交代が必要かチェック
      if (needsForcedSwitch(opponent)) {
        messages.push(`${opponent.name}は次のモンスターを選ぶ必要がある...`);
      }
    }
  }
  
  // フェーズを進める
  advancePhase(state);
  
  // 勝敗チェック
  const winner = checkWinner(state);
  
  return {
    messages,
    phase: state.phase,
    winner,
    actionResults,
  };
}

// ============================================
// 強制交代処理
// ============================================

export interface ForcedSwitchResult {
  messages: string[];
  success: boolean;
}

/**
 * 強制交代を実行（モンスターが倒れた後）
 */
export function executeForcedSwitch(
  state: BattleState,
  playerIndex: 0 | 1,
  switchTo: number
): ForcedSwitchResult {
  const messages: string[] = [];
  const player = state.players[playerIndex];
  
  // 交代先が有効かチェック
  const options = getForcedSwitchOptions(player);
  if (!options.includes(switchTo)) {
    return {
      messages: ['無効な交代先です！'],
      success: false,
    };
  }
  
  // 交代実行
  player.activeIndex = switchTo;
  const newMonster = getActiveMonster(player);
  
  messages.push(`${player.name}は${newMonster.species.name}を繰り出した！`);
  addLog(state, messages[messages.length - 1], 'switch');
  
  // 登場時特性を処理
  const abilityMessages = processOnEnterAbility(state, playerIndex);
  messages.push(...abilityMessages);
  
  return {
    messages,
    success: true,
  };
}

// ============================================
// ターン終了処理
// ============================================

export interface TurnEndResult {
  messages: string[];
  phase: BattlePhase;
  winner: 0 | 1 | null;
  faintedPlayers: (0 | 1)[];
}

/**
 * ターン終了処理
 * - 状態異常ダメージ
 * - 天候ダメージ
 * - まもる解除
 * - 天候ターン経過
 */
export function processTurnEnd(state: BattleState): TurnEndResult {
  const messages: string[] = [];
  const faintedPlayers: (0 | 1)[] = [];
  
  // ターン終了効果を処理
  const effectMessages = processTurnEndEffects(state);
  messages.push(...effectMessages);
  
  // 戦闘不能チェック
  for (let i = 0; i < 2; i++) {
    const player = state.players[i as 0 | 1];
    const monster = getActiveMonster(player);
    
    if (monster.currentHp <= 0) {
      messages.push(`${monster.species.name}は倒れた！`);
      addLog(state, `${monster.species.name}は倒れた！`, 'ko');
      
      if (needsForcedSwitch(player)) {
        faintedPlayers.push(i as 0 | 1);
      }
    }
  }
  
  // フェーズを進める（強制交代がなければ次のターンへ）
  if (faintedPlayers.length === 0) {
    advancePhase(state);
  }
  
  // 勝敗チェック
  const winner = checkWinner(state);
  
  return {
    messages,
    phase: state.phase,
    winner,
    faintedPlayers,
  };
}

// ============================================
// 完全なターン実行（AI戦用）
// ============================================

export interface FullTurnResult {
  messages: string[];
  phase: BattlePhase;
  winner: 0 | 1 | null;
  needsForcedSwitch: { playerIndex: 0 | 1; options: number[] }[];
}

/**
 * 1ターンを完全に実行（行動が両方決まっている場合）
 */
export function executeFullTurn(
  state: BattleState,
  action0: BattleAction,
  action1: BattleAction,
  skills: Map<string, Skill>
): FullTurnResult {
  const allMessages: string[] = [];
  const forcedSwitchNeeded: FullTurnResult['needsForcedSwitch'] = [];
  
  // ターン開始
  const startResult = processTurnStart(state);
  allMessages.push(...startResult.messages);
  
  // 行動解決
  const resolutionResult = resolveActions(state, action0, action1, skills);
  allMessages.push(...resolutionResult.messages);
  
  // 勝敗が決まっていれば終了
  if (resolutionResult.winner !== null) {
    return {
      messages: allMessages,
      phase: 'ended',
      winner: resolutionResult.winner,
      needsForcedSwitch: [],
    };
  }
  
  // ターン終了処理
  const endResult = processTurnEnd(state);
  allMessages.push(...endResult.messages);
  
  // 強制交代が必要なプレイヤーをリストアップ
  for (const playerIndex of endResult.faintedPlayers) {
    const options = getForcedSwitchOptions(state.players[playerIndex]);
    if (options.length > 0) {
      forcedSwitchNeeded.push({ playerIndex, options });
    }
  }
  
  return {
    messages: allMessages,
    phase: endResult.phase,
    winner: endResult.winner,
    needsForcedSwitch: forcedSwitchNeeded,
  };
}
