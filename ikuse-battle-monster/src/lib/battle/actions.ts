/**
 * 行動処理モジュール
 */

import {
  BattleState,
  BattlePlayer,
  BattleMonster,
  BattleAction,
  Skill,
} from '../types';
import {
  checkAccuracy,
  checkCritical,
  calculateDamage,
  calculateConfusionDamage,
  getEffectiveSpd,
} from './damage';
import {
  getActiveMonster,
  applyHpChange,
  applyManaChange,
  switchMonster,
  addLog,
  addDamageLog,
} from './state';
import { applySkillEffects, processOnEnterAbility } from './effects';

// ============================================
// 行動順決定
// ============================================

export interface ResolvedAction {
  playerIndex: 0 | 1;
  action: BattleAction;
  priority: number;
  speed: number;
}

/**
 * 行動順を決定
 */
export function resolveActionOrder(
  state: BattleState,
  action0: BattleAction,
  action1: BattleAction,
  skills: Map<string, Skill>
): ResolvedAction[] {
  const actions: ResolvedAction[] = [];
  
  // Player 0の行動
  const monster0 = getActiveMonster(state.players[0]);
  const priority0 = getActionPriority(action0, skills, monster0);
  const speed0 = getEffectiveSpd(monster0);
  actions.push({ playerIndex: 0, action: action0, priority: priority0, speed: speed0 });
  
  // Player 1の行動
  const monster1 = getActiveMonster(state.players[1]);
  const priority1 = getActionPriority(action1, skills, monster1);
  const speed1 = getEffectiveSpd(monster1);
  actions.push({ playerIndex: 1, action: action1, priority: priority1, speed: speed1 });
  
  // ソート: 交代 > 優先度 > 速度 > ランダム
  actions.sort((a, b) => {
    // 交代は技より先
    if (a.action.type === 'switch' && b.action.type !== 'switch') return -1;
    if (a.action.type !== 'switch' && b.action.type === 'switch') return 1;
    
    // 優先度
    if (a.priority !== b.priority) return b.priority - a.priority;
    
    // 速度
    if (a.speed !== b.speed) return b.speed - a.speed;
    
    // ランダム
    return Math.random() - 0.5;
  });
  
  return actions;
}

/**
 * 行動の優先度を取得（特性による補正込み）
 */
function getActionPriority(
  action: BattleAction,
  skills: Map<string, Skill>,
  monster: BattleMonster
): number {
  if (action.type !== 'skill' || !action.skillId) return 0;
  const skill = skills.get(action.skillId);
  if (!skill) return 0;
  
  let priority = skill.priority;
  const ability = monster.instance.ability;
  
  // 疾風（gale_wings）: 先制技の優先度+1
  // ※本家は「HP満タン時に飛行技の優先度+1」だが、
  //   企画書では「先制技の優先度+1」なのでそちらに従う
  if (ability === 'gale_wings' && priority > 0) {
    priority += 1;
  }
  
  // 悪戯心（prankster）: 変化技の優先度+1
  if (ability === 'prankster' && skill.category === 'status') {
    priority += 1;
  }
  
  return priority;
}

// ============================================
// 行動実行
// ============================================

export interface ActionResult {
  success: boolean;
  damage?: number;
  fainted?: boolean;
  switched?: boolean;
  messages: string[];
}

/**
 * 行動を実行
 */
export function executeAction(
  state: BattleState,
  playerIndex: 0 | 1,
  action: BattleAction,
  skills: Map<string, Skill>
): ActionResult {
  const player = state.players[playerIndex];
  const monster = getActiveMonster(player);
  const messages: string[] = [];
  
  // 戦闘不能チェック
  if (monster.currentHp <= 0) {
    return { success: false, messages: [`${monster.species.name}は倒れている！`] };
  }
  
  switch (action.type) {
    case 'switch':
      return executeSwitch(state, playerIndex, player, action.switchTo!, messages);
    
    case 'wait':
      return executeWait(monster, messages);
    
    case 'skill':
      return executeSkill(state, playerIndex, action.skillId!, skills, messages);
  }
}

/**
 * 交代を実行
 */
function executeSwitch(
  state: BattleState,
  playerIndex: 0 | 1,
  player: BattlePlayer,
  switchTo: number,
  messages: string[]
): ActionResult {
  const oldMonster = getActiveMonster(player);
  
  try {
    const newMonster = switchMonster(player, switchTo);
    messages.push(`${player.name}は${oldMonster.species.name}を引っ込めた！`);
    messages.push(`ゆけっ！${newMonster.species.name}！`);

    // 交代先の登場時特性を発動
    const abilityMessages = processOnEnterAbility(state, playerIndex);
    messages.push(...abilityMessages);

    addLog(state, messages.join(' '), 'switch');
    
    return { success: true, switched: true, messages };
  } catch {
    messages.push(`交代できない！`);
    return { success: false, messages };
  }
}

/**
 * 待機を実行
 */
function executeWait(
  monster: BattleMonster,
  messages: string[]
): ActionResult {
  messages.push(`${monster.species.name}は様子を見ている...`);
  return { success: true, messages };
}

/**
 * 技を実行
 */
function executeSkill(
  state: BattleState,
  playerIndex: 0 | 1,
  skillId: string,
  skills: Map<string, Skill>,
  messages: string[]
): ActionResult {
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex as 0 | 1];
  const attacker = getActiveMonster(player);
  const defender = getActiveMonster(opponent);
  const skill = skills.get(skillId);
  
  if (!skill) {
    messages.push('技が見つからない！');
    return { success: false, messages };
  }
  
  // マナチェック
  if (player.mana < skill.manaCost) {
    messages.push(`マナが足りない！`);
    return { success: false, messages };
  }
  
  // 行動不能チェック
  const canActResult = checkCanAct(attacker, messages);
  if (!canActResult.canAct) {
    return { success: false, messages };
  }
  
  // 混乱自傷チェック
  if (canActResult.selfDamage) {
    const confusionDmg = calculateConfusionDamage(attacker);
    const { fainted } = applyHpChange(attacker, -confusionDmg);
    messages.push(`${attacker.species.name}は混乱して自分を攻撃した！ ${confusionDmg}ダメージ！`);
    
    return { 
      success: false, 
      damage: confusionDmg, 
      fainted, 
      messages 
    };
  }
  
  // マナ消費
  applyManaChange(player, -skill.manaCost);
  attacker.lastUsedSkill = skillId;
  
  // まもる中の相手には効かない（一部技を除く）
  if (defender.protected && !skill.ignoresProtect) {
    messages.push(`${attacker.species.name}の${skill.name}！`);
    messages.push(`しかし${defender.species.name}は身を守っている！`);
    addLog(state, messages.join(' '), 'info');
    return { success: true, damage: 0, messages };
  }
  
  // 命中判定
  if (!checkAccuracy(attacker, defender, skill)) {
    messages.push(`${attacker.species.name}の${skill.name}！`);
    messages.push(`しかし攻撃は外れた！`);
    addLog(state, messages.join(' '), 'info');
    return { success: true, damage: 0, messages };
  }
  
  // ダメージ技の処理
  let totalDamage = 0;
  let fainted = false;
  
  if (skill.power > 0) {
    const isCritical = checkCritical(attacker, defender, skill);
    const damageResult = calculateDamage(attacker, defender, skill, state.weather, isCritical);

    // 頑丈: HP満タン時、一撃では倒れずHP1で耐える
    let damageToApply = damageResult.damage;
    const wasFullHp = defender.currentHp === defender.maxHp;
    const wouldFaint = damageToApply >= defender.currentHp;
    const sturdyTriggered =
      defender.instance.ability === 'sturdy' &&
      wasFullHp &&
      wouldFaint;

    if (sturdyTriggered) {
      damageToApply = defender.currentHp - 1;
    }

    totalDamage = damageToApply;

    const hpResult = applyHpChange(defender, -damageToApply);
    fainted = hpResult.fainted;

    addDamageLog(
      state,
      attacker.species.name,
      defender.species.name,
      skill.name,
      totalDamage,
      damageResult.isCritical,
      damageResult.effectiveness
    );

    messages.push(`${attacker.species.name}の${skill.name}！`);
    if (damageResult.isCritical) messages.push('急所に当たった！');
    messages.push(`${defender.species.name}に${totalDamage}ダメージ！`);
    if (damageResult.effectiveness > 1) messages.push('効果は抜群だ！');
    if (damageResult.effectiveness < 1) messages.push('効果はいまひとつ...');
    if (sturdyTriggered) messages.push(`${defender.species.name}は頑丈で耐えた！`);
  } else {
    messages.push(`${attacker.species.name}の${skill.name}！`);
    addLog(state, messages.join(' '), 'info');
  }
  
  // 追加効果
  if (!fainted) {
    const effectMessages = applySkillEffects(state, playerIndex, skill, totalDamage);
    messages.push(...effectMessages);
  }
  
  if (fainted) {
    messages.push(`${defender.species.name}は倒れた！`);
    addLog(state, `${defender.species.name}は倒れた！`, 'ko');
  }
  
  return { success: true, damage: totalDamage, fainted, messages };
}

// ============================================
// 行動可否チェック
// ============================================

interface CanActResult {
  canAct: boolean;
  selfDamage: boolean;
}

/**
 * 行動可能かチェック
 */
function checkCanAct(monster: BattleMonster, messages: string[]): CanActResult {
  // ひるみ（同ターン内のみ）
  if (monster.flinched) {
    monster.flinched = false;
    messages.push(`${monster.species.name}はひるんで動けない！`);
    return { canAct: false, selfDamage: false };
  }

  // 眠り
  if (monster.status === 'sleep') {
    monster.statusTurns++;
    if (monster.statusTurns >= 3 || Math.random() < 0.33) {
      monster.status = 'none';
      monster.statusTurns = 0;
      messages.push(`${monster.species.name}は目を覚ました！`);
    } else {
      messages.push(`${monster.species.name}はぐうぐう眠っている...`);
      return { canAct: false, selfDamage: false };
    }
  }
  
  // 凍り
  if (monster.status === 'freeze') {
    if (Math.random() < 0.2) {
      monster.status = 'none';
      messages.push(`${monster.species.name}の氷が溶けた！`);
    } else {
      messages.push(`${monster.species.name}は凍っている！`);
      return { canAct: false, selfDamage: false };
    }
  }
  
  // 麻痺
  if (monster.status === 'paralyze') {
    if (Math.random() < 0.25) {
      messages.push(`${monster.species.name}は体が痺れて動けない！`);
      return { canAct: false, selfDamage: false };
    }
  }
  
  // 混乱
  if (monster.isConfused) {
    monster.confusionTurns++;
    if (monster.confusionTurns >= 4 || Math.random() < 0.25) {
      monster.isConfused = false;
      monster.confusionTurns = 0;
      messages.push(`${monster.species.name}は正気に戻った！`);
    } else {
      messages.push(`${monster.species.name}は混乱している！`);
      if (Math.random() < 0.33) {
        return { canAct: false, selfDamage: true };
      }
    }
  }
  
  return { canAct: true, selfDamage: false };
}

// ============================================
// 強制交代
// ============================================

/**
 * 強制交代が必要かチェック
 */
export function needsForcedSwitch(player: BattlePlayer): boolean {
  const active = getActiveMonster(player);
  if (active.currentHp > 0) return false;
  
  // 生存モンスターがいるかチェック
  return player.party.some(m => m.currentHp > 0);
}

/**
 * 強制交代先の候補を取得
 */
export function getForcedSwitchOptions(player: BattlePlayer): number[] {
  const options: number[] = [];
  player.party.forEach((monster, index) => {
    if (monster.currentHp > 0) {
      options.push(index);
    }
  });
  return options;
}
