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
import { getTypeEffectiveness, hasSTAB } from '../data/types';

// ============================================
// ゲーム状態
// ============================================

export interface GameState {
  battle: BattleState;
  status: 'picking' | 'waiting' | 'selecting' | 'resolving' | 'forced_switch' | 'ended';
  winner: 0 | 1 | null;
  pendingActions: {
    0: BattleAction | null;
    1: BattleAction | null;
  };
  forcedSwitchPending: (0 | 1)[];
  turnMessages: string[];
  // 選出用
  fullParty: {
    0: { instance: MonsterInstance; species: MonsterSpecies }[];
    1: { instance: MonsterInstance; species: MonsterSpecies }[];
  };
  selectedIndices: {
    0: number[];
    1: number[];
  };
}

export interface PlayerData {
  id: string;
  name: string;
  party: { instance: MonsterInstance; species: MonsterSpecies }[];
}

/**
 * ゲーム状態を初期化（選出フェーズから開始）
 */
export function createGameState(
  player1Data: PlayerData,
  player2Data: PlayerData,
  skipPicking: boolean = false
): GameState {
  // 選出をスキップする場合（3体パーティの場合）
  if (skipPicking || (player1Data.party.length <= 3 && player2Data.party.length <= 3)) {
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
      fullParty: {
        0: player1Data.party,
        1: player2Data.party,
      },
      selectedIndices: {
        0: player1Data.party.map((_, i) => i),
        1: player2Data.party.map((_, i) => i),
      },
    };
  }
  
  // 6体以上なら選出フェーズへ
  // バトル状態は空のプレースホルダー（選出完了後に作成）
  const emptyPlayer = createBattlePlayer('', '', []);
  const placeholder = createBattleState(emptyPlayer, emptyPlayer);
  
  return {
    battle: placeholder,
    status: 'picking',
    winner: null,
    pendingActions: { 0: null, 1: null },
    forcedSwitchPending: [],
    turnMessages: [],
    fullParty: {
      0: player1Data.party,
      1: player2Data.party,
    },
    selectedIndices: {
      0: [],
      1: [],
    },
  };
}

/**
 * パーティメンバーを選出
 */
export function pickPartyMember(
  state: GameState,
  playerIndex: 0 | 1,
  monsterIndex: number
): { success: boolean; message: string } {
  if (state.status !== 'picking') {
    return { success: false, message: '選出フェーズではありません' };
  }
  
  const indices = state.selectedIndices[playerIndex];
  const fullParty = state.fullParty[playerIndex];
  
  // 範囲チェック
  if (monsterIndex < 0 || monsterIndex >= fullParty.length) {
    return { success: false, message: '無効なモンスターです' };
  }
  
  // 既に選択済みなら解除
  const existingIndex = indices.indexOf(monsterIndex);
  if (existingIndex !== -1) {
    indices.splice(existingIndex, 1);
    return { success: true, message: '選出を解除しました' };
  }
  
  // 3体まで
  if (indices.length >= 3) {
    return { success: false, message: '3体まで選出できます' };
  }
  
  indices.push(monsterIndex);
  return { success: true, message: '選出しました' };
}

/**
 * 選出を確定してバトル開始準備
 */
export function confirmPicking(
  state: GameState,
  playerIndex: 0 | 1
): { success: boolean; message: string; bothReady: boolean } {
  if (state.status !== 'picking') {
    return { success: false, message: '選出フェーズではありません', bothReady: false };
  }
  
  const indices = state.selectedIndices[playerIndex];
  
  if (indices.length !== 3) {
    return { success: false, message: '3体選出してください', bothReady: false };
  }
  
  // 選出順を記録（後から変更されないようにコピー）
  state.selectedIndices[playerIndex] = [...indices];
  
  // 両方3体選んだ？
  const bothReady = state.selectedIndices[0].length === 3 && state.selectedIndices[1].length === 3;
  
  return { success: true, message: '選出を確定しました', bothReady };
}

/**
 * 選出フェーズからバトル開始へ移行
 */
export function transitionToBattle(
  state: GameState,
  player1Name: string,
  player2Name: string
): { success: boolean; message: string } {
  if (state.status !== 'picking') {
    return { success: false, message: '選出フェーズではありません' };
  }
  
  if (state.selectedIndices[0].length !== 3 || state.selectedIndices[1].length !== 3) {
    return { success: false, message: '両プレイヤーが3体選出していません' };
  }
  
  // 選出されたモンスターでパーティを構築
  const selectedParty0 = state.selectedIndices[0].map(i => state.fullParty[0][i]);
  const selectedParty1 = state.selectedIndices[1].map(i => state.fullParty[1][i]);
  
  // バトル状態を作成
  const player1 = createBattlePlayer('player1', player1Name, selectedParty0);
  const player2 = createBattlePlayer('player2', player2Name, selectedParty1);
  state.battle = createBattleState(player1, player2);
  state.status = 'waiting';
  
  return { success: true, message: 'バトル準備完了' };
}

/**
 * AI用: 自動で3体選出
 */
export function autoPickForAI(
  state: GameState,
  playerIndex: 0 | 1
): void {
  const fullParty = state.fullParty[playerIndex];
  
  // ランダムに3体選ぶ
  const indices = [...Array(fullParty.length).keys()];
  const shuffled = indices.sort(() => Math.random() - 0.5);
  state.selectedIndices[playerIndex] = shuffled.slice(0, 3);
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
  
  // 選出フェーズからの場合は'waiting'、直接開始の場合は'selecting'
  if (state.status !== 'waiting' && state.status !== 'selecting') {
    return { messages: ['バトルを開始できません'], state };
  }
  
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
 * AIの行動を決定（簡易スコアリング）
 * - 有利相性・STAB・威力効率を優先
 * - 不利対面かつHP低下時は交代を優先
 */
export function selectAIAction(
  state: GameState,
  playerIndex: 0 | 1,
  skills: Map<string, Skill>
): BattleAction {
  const available = getAvailableActions(state, playerIndex, skills);
  const player = state.battle.players[playerIndex];
  const opponent = state.battle.players[1 - playerIndex as 0 | 1];
  const attacker = player.party[player.activeIndex];
  const defender = opponent.party[opponent.activeIndex];

  const attackerHpRatio = attacker.currentHp / Math.max(1, attacker.maxHp);

  // 使える技をスコアリング
  let bestSkill: { skillId: string; score: number } | null = null;
  for (const { skillId, skill } of available.skills) {
    const effectiveness = getTypeEffectiveness(skill.type, defender.species.types);
    const stab = hasSTAB(skill.type, attacker.species.types) ? 1.5 : 1;
    const power = skill.power ?? 0;
    const accuracy = (skill.accuracy ?? 100) / 100;

    // 威力期待値 + 相性 + 一致 + 低コストボーナス
    let score = power * effectiveness * stab * accuracy;

    // 相手HPが低いときは命中安定を優先
    const defenderHpRatio = defender.currentHp / Math.max(1, defender.maxHp);
    if (defenderHpRatio <= 0.3 && (skill.accuracy ?? 100) >= 95) {
      score += 20;
    }

    // 低コスト技を少し優遇（マナ管理）
    score += Math.max(0, 6 - skill.manaCost) * 3;

    // 変化技は基本控えめ（ただしマナ操作系は少し優遇）
    if (skill.category === 'status') {
      score *= 0.7;
      if (['mana_drain', 'mana_seal', 'mana_boost', 'mana_reflect'].includes(skill.id)) {
        score += 25;
      }
    }

    if (!bestSkill || score > bestSkill.score) {
      bestSkill = { skillId, score };
    }
  }

  // 交代判断：低HPかつ有効打が薄いとき
  const bestSkillScore = bestSkill?.score ?? 0;
  const hasBadMatchup = available.skills.every(({ skill }) =>
    getTypeEffectiveness(skill.type, defender.species.types) <= 1
  );

  if (
    available.switches.length > 0 &&
    ((attackerHpRatio < 0.35 && hasBadMatchup) || bestSkillScore < 40)
  ) {
    let bestSwitch = available.switches[0];
    let bestSwitchScore = -Infinity;

    for (const sw of available.switches) {
      const candidate = player.party[sw.index];
      const hpRatio = candidate.currentHp / Math.max(1, candidate.maxHp);

      // 候補モンスターが相手に有利なタイプの技を持っているか簡易評価
      const candidateSkillIds = candidate.instance.skills ?? [];
      let offensiveScore = 1;
      for (const sid of candidateSkillIds) {
        const s = skills.get(sid);
        if (!s) continue;
        offensiveScore = Math.max(
          offensiveScore,
          getTypeEffectiveness(s.type, defender.species.types) * (hasSTAB(s.type, candidate.species.types) ? 1.2 : 1)
        );
      }

      const score = hpRatio * 100 + offensiveScore * 50;
      if (score > bestSwitchScore) {
        bestSwitchScore = score;
        bestSwitch = sw;
      }
    }

    return { type: 'switch', switchTo: bestSwitch.index };
  }

  if (bestSkill) {
    return { type: 'skill', skillId: bestSkill.skillId };
  }

  if (available.switches.length > 0) {
    return { type: 'switch', switchTo: available.switches[0].index };
  }

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
/**
 * 降参処理
 * 即座に敗北扱いにする
 */
export function surrender(state: GameState, playerIndex: 0 | 1): { state: GameState; messages: string[] } {
  const loser = state.battle.players[playerIndex];
  const winner = state.battle.players[1 - playerIndex as 0 | 1];
  const messages = [`${loser.name}は降参した！`, `${winner.name}の勝利！`];
  
  addLog(state.battle, `${loser.name}は降参した！`);
  addLog(state.battle, `${winner.name}の勝利！`);
  
  state.status = 'ended';
  state.winner = (1 - playerIndex) as 0 | 1;
  
  return { state: { ...state }, messages };
}

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
