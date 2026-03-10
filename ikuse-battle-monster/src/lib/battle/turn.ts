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
  getAvailableSwitches,
  applyManaChange,
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
    const activeMonster = getActiveMonster(player);
    activeMonster.flinched = false; // ひるみはターン持ち越ししない
    activeMonster.enduring = false; // こらえるはターン持ち越ししない
    activeMonster.physicalDamageTakenThisTurn = 0; // カウンター用
    activeMonster.specialDamageTakenThisTurn = 0;  // ミラーコート用
    player.manaSpentThisTurn = 0;
    player.manaReflectActive = false;

    const manaResult = regenerateMana(player);
    
    if (manaResult.wasSealed) {
      messages.push(`${player.name}はマナシールの効果でマナが回復しない！`);
      addLog(state, `${player.name}のマナが封印されている！`, 'info');
    } else if (manaResult.recovered > 0) {
      const tags: string[] = [];
      if (manaResult.boosted) tags.push('マナブースト効果');
      if (manaResult.charged) tags.push('マナチャージ効果');

      if (tags.length > 0) {
        messages.push(`${player.name}のマナが${manaResult.recovered}回復した！（${tags.join('・')}！）（${player.mana}）`);
      } else {
        messages.push(`${player.name}のマナが${manaResult.recovered}回復した！（${player.mana}）`);
      }
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
  // とんぼがえり/ボルトチェンジ後の交代が必要なプレイヤー
  pendingUTurnSwitch: (0 | 1)[];
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
  const pendingUTurnSwitch: (0 | 1)[] = [];
  
  // 行動順を決定
  const orderedActions = resolveActionOrder(state, action0, action1, skills);
  state.actionOrder = [orderedActions[0].playerIndex, orderedActions[1].playerIndex];
  
  // 行動を順番に実行
  for (const resolvedAction of orderedActions) {
    const { playerIndex, action } = resolvedAction;
    const player = state.players[playerIndex];
    const monster = getActiveMonster(player);
    
    // 戦闘不能チェック（先に倒れた場合はスキップ）
    if (monster.currentHp <= 0) {
      continue;
    }
    
    // 相手の行動を取得（ふいうち判定用）
    const opponentAction = playerIndex === 0 ? action1 : action0;
    
    // 行動実行
    const result = executeAction(state, playerIndex, action, skills, opponentAction);
    messages.push(...result.messages);
    
    actionResults.push({
      playerIndex,
      success: result.success,
      damage: result.damage,
      fainted: result.fainted,
    });
    
    // とんぼがえり/ボルトチェンジの交代処理
    if (result.shouldSwitchAfterAttack) {
      const switchOptions = getAvailableSwitches(player);
      if (switchOptions.length > 0) {
        // HPが最も高いモンスターに自動交代（AI用シンプル実装）
        let bestIndex = switchOptions[0];
        let bestHpRatio = 0;
        for (const idx of switchOptions) {
          const m = player.party[idx];
          const hpRatio = m.currentHp / m.maxHp;
          if (hpRatio > bestHpRatio) {
            bestHpRatio = hpRatio;
            bestIndex = idx;
          }
        }
        
        // 交代実行
        const oldMonster = getActiveMonster(player);
        player.activeIndex = bestIndex;
        const newMonster = getActiveMonster(player);
        
        messages.push(`${player.name}は${oldMonster.species.name}を引っ込めた！`);
        messages.push(`ゆけっ！${newMonster.species.name}！`);
        addLog(state, `${player.name}は${newMonster.species.name}を繰り出した！`, 'switch');
        
        // 登場時特性
        const abilityMessages = processOnEnterAbility(state, playerIndex);
        messages.push(...abilityMessages);
      }
    }
    
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
    pendingUTurnSwitch,
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

  // マナリフレクト処理（このターン相手が使ったマナ分を回復）
  for (let i = 0; i < 2; i++) {
    const playerIndex = i as 0 | 1;
    const player = state.players[playerIndex];
    if (!player.manaReflectActive) continue;

    const opponent = state.players[(1 - i) as 0 | 1];
    const reflectedMana = opponent.manaSpentThisTurn;

    if (reflectedMana > 0) {
      const before = player.mana;
      applyManaChange(player, reflectedMana);
      const recovered = player.mana - before;
      if (recovered > 0) {
        messages.push(`${player.name}はマナリフレクトでマナを${recovered}回復した！`);
        addLog(state, `${player.name}のマナリフレクトが発動！（+${recovered}）`, 'info');
      }
    } else {
      messages.push(`${player.name}のマナリフレクトは不発だった...`);
      addLog(state, `${player.name}のマナリフレクトは不発`, 'info');
    }

    player.manaReflectActive = false;
  }
  
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
