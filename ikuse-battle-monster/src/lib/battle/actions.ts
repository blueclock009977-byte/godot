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
import {
  applySkillEffects,
  processOnEnterAbility,
  processContactAbility,
  checkAbsorbAbility,
  applyStatChange,
  setHazard,
  applyEntryHazards,
} from './effects';

// ============================================
// ヘルパー関数
// ============================================

/**
 * 連続技のヒット回数を決定（2-5回）
 * ポケモン式: 2回35%, 3回35%, 4回15%, 5回15%
 */
function rollMultiHitCount(): number {
  const roll = Math.random() * 100;
  if (roll < 35) return 2;      // 35%
  if (roll < 70) return 3;      // 35%
  if (roll < 85) return 4;      // 15%
  return 5;                     // 15%
}

/**
 * マナ消費（ターン内消費量トラッキング込み）
 */
function consumeMana(player: BattlePlayer, amount: number): void {
  if (amount <= 0) return;
  applyManaChange(player, -amount);
  player.manaSpentThisTurn += amount;
}

/**
 * 壁補正を適用（リフレクター/光の壁）
 * 物理技: リフレクターで0.5倍
 * 特殊技: 光の壁で0.5倍
 */
function applyScreenModifier(
  damage: number,
  skillCategory: 'physical' | 'special' | 'status',
  defenderPlayer: BattlePlayer
): number {
  // 物理技: リフレクター
  if (skillCategory === 'physical' && defenderPlayer.reflectTurns > 0) {
    return Math.floor(damage * 0.5);
  }
  // 特殊技: 光の壁
  if (skillCategory === 'special' && defenderPlayer.lightScreenTurns > 0) {
    return Math.floor(damage * 0.5);
  }
  return damage;
}

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
  // とんぼがえり/ボルトチェンジ用: 攻撃後に交代するか
  shouldSwitchAfterAttack?: boolean;
}

/**
 * ふいうち判定用: 相手が攻撃技を選んでいるかチェック
 */
export function isOpponentUsingAttack(
  action: BattleAction | undefined,
  skills: Map<string, Skill>
): boolean {
  if (!action) return false;
  if (action.type !== 'skill' || !action.skillId) return false;
  const skill = skills.get(action.skillId);
  if (!skill) return false;
  // power > 0 の技を攻撃技とみなす
  return skill.power > 0;
}

/**
 * 行動を実行
 * @param opponentAction ふいうち判定用（相手が攻撃技を使うかどうか）
 */
export function executeAction(
  state: BattleState,
  playerIndex: 0 | 1,
  action: BattleAction,
  skills: Map<string, Skill>,
  opponentAction?: BattleAction
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
      return executeSkill(state, playerIndex, action.skillId!, skills, messages, opponentAction);
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

  if (oldMonster.trapped) {
    messages.push(`${oldMonster.species.name}は拘束されていて交代できない！`);
    return { success: false, messages };
  }
  
  try {
    const newMonster = switchMonster(player, switchTo);
    messages.push(`${player.name}は${oldMonster.species.name}を引っ込めた！`);
    messages.push(`ゆけっ！${newMonster.species.name}！`);

    // いやしのねがい/みかづきのまいの効果を適用
    if (player.healingWishPending) {
      const healAmount = newMonster.maxHp - newMonster.currentHp;
      if (healAmount > 0) {
        applyHpChange(newMonster, healAmount);
        messages.push(`癒しの力が${newMonster.species.name}を包み込んだ！`);
        messages.push(`${newMonster.species.name}のHPが全回復した！`);
      }
      player.healingWishPending = false;
    }
    if (player.lunarDancePending) {
      const healAmount = newMonster.maxHp - newMonster.currentHp;
      if (healAmount > 0) {
        applyHpChange(newMonster, healAmount);
        messages.push(`月の光が${newMonster.species.name}を癒した！`);
        messages.push(`${newMonster.species.name}のHPが全回復した！`);
      }
      // 状態異常も回復
      if (newMonster.status !== 'none') {
        const oldStatus = newMonster.status;
        newMonster.status = 'none';
        newMonster.statusTurns = 0;
        messages.push(`${newMonster.species.name}の状態異常が回復した！`);
      }
      player.lunarDancePending = false;
    }

    // 設置技ダメージを適用（ステルスロック、まきびし、どくびし）
    const hazardMessages = applyEntryHazards(state, playerIndex);
    messages.push(...hazardMessages);

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
 * @param opponentAction ふいうち判定用（相手の行動）
 */
function executeSkill(
  state: BattleState,
  playerIndex: 0 | 1,
  skillId: string,
  skills: Map<string, Skill>,
  messages: string[],
  opponentAction?: BattleAction
): ActionResult {
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex as 0 | 1];
  const attacker = getActiveMonster(player);
  const defender = getActiveMonster(opponent);
  let actualSkillId = skillId;
  let skill = skills.get(actualSkillId);
  let isChargeReleaseTurn = false;
  
  // 溜め技の2ターン目: 前ターンで溜めた技を自動で発動（マナ消費なし）
  if (attacker.charging && attacker.lastUsedSkill) {
    const chargedSkill = skills.get(attacker.lastUsedSkill);
    if (chargedSkill && chargedSkill.effects.some(e => e.type === 'charge')) {
      actualSkillId = chargedSkill.id;
      skill = chargedSkill;
      isChargeReleaseTurn = true;
      attacker.charging = false;
      attacker.diving = false;
      attacker.flying = false;
    }
  }

  if (!skill) {
    messages.push('技が見つからない！');
    return { success: false, messages };
  }

  // === アンコール状態チェック ===
  // アンコール中は強制的にアンコール対象の技を使う
  if (!isChargeReleaseTurn && attacker.encoreTurns > 0 && attacker.encoredSkillId) {
    const encoredSkill = skills.get(attacker.encoredSkillId);
    if (encoredSkill) {
      // アンコール対象の技に強制変更
      actualSkillId = attacker.encoredSkillId;
      skill = encoredSkill;
    }
  }

  // おいうち: 相手が交代を選んだターンは威力2倍
  const isPursuitOnSwitch = actualSkillId === 'pursuit' && opponentAction?.type === 'switch';
  if (isPursuitOnSwitch) {
    skill = { ...skill, power: skill.power * 2 };
  }
  
  // === ふいうち特殊処理 ===
  // 相手が攻撃技を選んでいない場合、失敗する
  if (actualSkillId === 'sucker_punch') {
    if (!isOpponentUsingAttack(opponentAction, skills)) {
      // マナは消費しない（技自体が失敗）
      messages.push(`${attacker.species.name}のふいうち！`);
      messages.push(`しかし相手は攻撃してこなかった！`);
      addLog(state, messages.join(' '), 'info');
      return { success: false, damage: 0, messages };
    }
    // 相手が攻撃技を選んでいる場合は通常通り実行
  }
  
  // === マナバースト特殊処理 ===
  // 残りマナを全消費して マナ×20 の固定ダメージ
  if (actualSkillId === 'mana_burst') {
    const manaToConsume = player.mana;
    if (manaToConsume === 0) {
      messages.push(`マナがない！`);
      return { success: false, messages };
    }
    
    // 行動不能チェック
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ全消費
    consumeMana(player, manaToConsume);
    attacker.lastUsedSkill = actualSkillId;
    
    // まもる中の相手には効かない
    if (defender.protected) {
      messages.push(`${attacker.species.name}のマナバースト！`);
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 固定ダメージ = マナ × 20
    const fixedDamage = manaToConsume * 20;
    const { fainted } = applyHpChange(defender, -fixedDamage);
    
    messages.push(`${attacker.species.name}のマナバースト！`);
    messages.push(`マナ${manaToConsume}を全消費！`);
    messages.push(`${defender.species.name}に${fixedDamage}の固定ダメージ！`);
    addLog(state, messages.join(' '), 'damage');
    
    if (fainted) {
      messages.push(`${defender.species.name}は倒れた！`);
      addLog(state, `${defender.species.name}は倒れた！`, 'ko');
    }
    
    return { success: true, damage: fixedDamage, fainted, messages };
  }
  
  // === マナドレイン特殊処理 ===
  // 相手のマナを3奪う（自分+3、相手-3）
  if (actualSkillId === 'mana_drain') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    // まもる中の相手には効かない
    if (defender.protected) {
      messages.push(`${attacker.species.name}のマナドレイン！`);
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 相手から3奪う
    const stolenMana = Math.min(3, opponent.mana);
    applyManaChange(opponent, -stolenMana);
    applyManaChange(player, stolenMana);
    
    messages.push(`${attacker.species.name}のマナドレイン！`);
    messages.push(`${defender.species.name}からマナを${stolenMana}奪った！`);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === カウンター特殊処理 ===
  // このターンに受けた物理ダメージを2倍返し（後攻技）
  if (actualSkillId === 'counter') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}のカウンター！`);
    
    // このターンに受けた物理ダメージをチェック
    const physicalDamage = attacker.physicalDamageTakenThisTurn;
    if (physicalDamage === 0) {
      messages.push(`しかし物理攻撃を受けていない！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // まもる中の相手には効かない
    if (defender.protected) {
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 2倍返し
    const counterDamage = physicalDamage * 2;
    const { fainted } = applyHpChange(defender, -counterDamage);
    
    messages.push(`受けた物理ダメージを2倍にして返した！`);
    messages.push(`${defender.species.name}に${counterDamage}ダメージ！`);
    addLog(state, messages.join(' '), 'damage');
    
    if (fainted) {
      messages.push(`${defender.species.name}は倒れた！`);
      addLog(state, `${defender.species.name}は倒れた！`, 'ko');
    }
    
    return { success: true, damage: counterDamage, fainted, messages };
  }
  
  // === ミラーコート特殊処理 ===
  // このターンに受けた特殊ダメージを2倍返し（後攻技）
  if (actualSkillId === 'mirror_coat') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}のミラーコート！`);
    
    // このターンに受けた特殊ダメージをチェック
    const specialDamage = attacker.specialDamageTakenThisTurn;
    if (specialDamage === 0) {
      messages.push(`しかし特殊攻撃を受けていない！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // まもる中の相手には効かない
    if (defender.protected) {
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 2倍返し
    const mirrorDamage = specialDamage * 2;
    const { fainted } = applyHpChange(defender, -mirrorDamage);
    
    messages.push(`受けた特殊ダメージを2倍にして返した！`);
    messages.push(`${defender.species.name}に${mirrorDamage}ダメージ！`);
    addLog(state, messages.join(' '), 'damage');
    
    if (fainted) {
      messages.push(`${defender.species.name}は倒れた！`);
      addLog(state, `${defender.species.name}は倒れた！`, 'ko');
    }
    
    return { success: true, damage: mirrorDamage, fainted, messages };
  }
  
  // === マナチャージ特殊処理 ===
  // このターンは待機し、次ターン開始時にマナ回復量を+2（通常+3と合わせて合計+5）
  if (actualSkillId === 'mana_charge') {
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }

    attacker.lastUsedSkill = actualSkillId;
    player.manaChargePending = true;

    messages.push(`${attacker.species.name}のマナチャージ！`);
    messages.push(`エネルギーを溜めている...（次ターンのマナ回復量+2）`);
    addLog(state, messages.join(' '), 'info');

    return { success: true, damage: 0, messages };
  }
  
  // === こらえる特殊処理 ===
  // このターン、HP1で耐える
  if (actualSkillId === 'endure') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }

    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }

    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    // こらえる状態をセット
    attacker.enduring = true;

    messages.push(`${attacker.species.name}はこらえる態勢に入った！`);
    addLog(state, messages.join(' '), 'info');

    return { success: true, damage: 0, messages };
  }
  
  // === 設置技特殊処理（ステルスロック、まきびし、どくびし） ===
  if (actualSkillId === 'stealth_rock' || actualSkillId === 'spikes' || actualSkillId === 'toxic_spikes') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    // 設置技を設置
    const hazardMessages = setHazard(state, playerIndex, actualSkillId as 'stealth_rock' | 'spikes' | 'toxic_spikes');
    messages.push(`${attacker.species.name}の${skill.name}！`);
    messages.push(...hazardMessages);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === 壁技特殊処理（リフレクター/光の壁） ===
  if (actualSkillId === 'reflect' || actualSkillId === 'light_screen') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}の${skill.name}！`);
    
    if (actualSkillId === 'reflect') {
      if (player.reflectTurns > 0) {
        messages.push(`リフレクターは既に展開されている！`);
      } else {
        player.reflectTurns = 5;
        messages.push(`リフレクターを展開した！物理ダメージが半減する！`);
      }
    } else {
      if (player.lightScreenTurns > 0) {
        messages.push(`光の壁は既に展開されている！`);
      } else {
        player.lightScreenTurns = 5;
        messages.push(`光の壁を展開した！特殊ダメージが半減する！`);
      }
    }
    
    addLog(state, messages.join(' '), 'info');
    return { success: true, damage: 0, messages };
  }
  
  // === おきみやげ特殊処理 ===
  // 自分は瀕死になるが、相手の攻撃と特攻を2段階下げる
  if (actualSkillId === 'memento') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}のおきみやげ！`);
    
    // まもる中の相手には効かない（自分は倒れない）
    if (defender.protected) {
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 自分を瀕死にする
    applyHpChange(attacker, -attacker.currentHp);
    messages.push(`${attacker.species.name}は倒れた！`);
    
    // 相手の攻撃と特攻を2段階下げる
    applyStatChange(defender, 'atk', -2);
    applyStatChange(defender, 'mag', -2);
    messages.push(`${defender.species.name}の攻撃と特攻が2段階下がった！`);
    
    addLog(state, messages.join(' '), 'info');
    addLog(state, `${attacker.species.name}は倒れた！`, 'ko');
    
    return { success: true, damage: 0, fainted: true, messages };
  }
  
  // === いやしのねがい特殊処理 ===
  // 自分は瀕死になり、次に出てくる控えを全回復
  if (actualSkillId === 'healing_wish') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // 控えがいなければ失敗
    const hasReserve = player.party.some((m, i) => i !== player.activeIndex && m.currentHp > 0);
    if (!hasReserve) {
      messages.push(`しかし控えがいないため失敗した！`);
      addLog(state, messages.join(' '), 'info');
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}のいやしのねがい！`);
    
    // 自分を瀕死にする
    applyHpChange(attacker, -attacker.currentHp);
    messages.push(`${attacker.species.name}は倒れた！`);
    
    // 待機フラグを設定（次の交代先が全回復）
    player.healingWishPending = true;
    messages.push(`次に出てくるモンスターは癒しの力を受ける...`);
    
    addLog(state, messages.join(' '), 'info');
    addLog(state, `${attacker.species.name}は倒れた！`, 'ko');
    
    return { success: true, damage: 0, fainted: true, messages };
  }
  
  // === みかづきのまい特殊処理 ===
  // 自分は瀕死になり、次に出てくる控えを全回復+状態異常回復
  if (actualSkillId === 'lunar_dance') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // 控えがいなければ失敗
    const hasReserve = player.party.some((m, i) => i !== player.activeIndex && m.currentHp > 0);
    if (!hasReserve) {
      messages.push(`しかし控えがいないため失敗した！`);
      addLog(state, messages.join(' '), 'info');
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}のみかづきのまい！`);
    
    // 自分を瀕死にする
    applyHpChange(attacker, -attacker.currentHp);
    messages.push(`${attacker.species.name}は倒れた！`);
    
    // 待機フラグを設定（次の交代先が全回復+状態異常回復）
    player.lunarDancePending = true;
    messages.push(`月の光が次のモンスターを包み込む...`);
    
    addLog(state, messages.join(' '), 'info');
    addLog(state, `${attacker.species.name}は倒れた！`, 'ko');
    
    return { success: true, damage: 0, fainted: true, messages };
  }
  
  // === あくび特殊処理 ===
  // 次ターン終了時に眠り（yawning状態を付与）
  if (actualSkillId === 'yawn') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}のあくび！`);
    
    // まもる中の相手には効かない
    if (defender.protected) {
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // すでに状態異常がある場合は効かない
    if (defender.status !== 'none') {
      messages.push(`しかし${defender.species.name}には効かなかった！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // すでにあくび状態なら効かない
    if (defender.yawning) {
      messages.push(`しかし${defender.species.name}には効かなかった！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // あくび状態を付与（次ターン終了時に眠り）
    defender.yawning = true;
    messages.push(`${defender.species.name}は眠気を誘われた！`);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === ねがいごと特殊処理 ===
  // 次ターン終了時にHP50%回復（自分に付与）
  if (actualSkillId === 'wish') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}のねがいごと！`);
    
    // すでにねがいごと状態なら重複付与しない（上書き）
    attacker.wishPending = true;
    messages.push(`${attacker.species.name}は願いを込めた！`);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === ねむる特殊処理 ===
  // HP全回復して2ターン眠る
  if (actualSkillId === 'rest') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // 既に眠っている場合は失敗
    if (attacker.status === 'sleep') {
      messages.push(`${attacker.species.name}は既に眠っている！`);
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}のねむる！`);
    
    // HP全回復
    const healAmount = attacker.maxHp - attacker.currentHp;
    applyHpChange(attacker, healAmount);
    messages.push(`${attacker.species.name}は眠って体力を回復した！`);
    
    // 2ターンの眠り状態を付与（既存の状態異常は上書き）
    attacker.status = 'sleep';
    attacker.statusTurns = 2;
    
    addLog(state, messages.join(' '), 'heal');
    
    return { success: true, damage: 0, messages };
  }
  
  // === みがわり特殊処理 ===
  // HP25%を消費して身代わりを生成
  if (actualSkillId === 'substitute') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    messages.push(`${attacker.species.name}のみがわり！`);
    
    // 既にみがわりがある場合は失敗
    if (attacker.substituteHp > 0) {
      messages.push(`すでにみがわりがある！`);
      addLog(state, messages.join(' '), 'info');
      return { success: false, messages };
    }
    
    // HP25%を計算
    const hpCost = Math.floor(attacker.maxHp / 4);
    
    // HP25%未満の場合は失敗
    if (attacker.currentHp <= hpCost) {
      messages.push(`HPが足りない！`);
      addLog(state, messages.join(' '), 'info');
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    // HP消費してみがわり生成
    applyHpChange(attacker, -hpCost);
    attacker.substituteHp = hpCost;
    
    messages.push(`${attacker.species.name}はHPを削ってみがわりを作った！`);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === ちょうはつ特殊処理 ===
  // 相手を3ターンの間、変化技を使えなくする
  if (actualSkillId === 'taunt') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}のちょうはつ！`);
    
    // まもる中の相手には効かない
    if (defender.protected) {
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // すでにちょうはつ状態の場合
    if (defender.tauntTurns > 0) {
      messages.push(`${defender.species.name}はすでに挑発されている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // ちょうはつ状態を付与（3ターン持続）
    defender.tauntTurns = 3;
    messages.push(`${defender.species.name}は挑発された！変化技が使えなくなった！`);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === アンコール特殊処理 ===
  // 相手に同じ技を3ターン繰り返させる
  if (actualSkillId === 'encore') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}のアンコール！`);
    
    // まもる中の相手には効かない
    if (defender.protected) {
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // すでにアンコール状態の場合
    if (defender.encoreTurns > 0) {
      messages.push(`${defender.species.name}はすでにアンコール状態だ！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 相手が前のターンに技を使っていない場合は失敗
    if (!defender.lastUsedSkill) {
      messages.push(`しかし失敗した！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // アンコール状態を付与（3ターン持続）
    defender.encoreTurns = 3;
    defender.encoredSkillId = defender.lastUsedSkill;
    messages.push(`${defender.species.name}は${defender.lastUsedSkill}をアンコールされた！`);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === 金縛り特殊処理 ===
  // 相手の最後に使った技を4ターン封じる
  if (actualSkillId === 'disable') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}の金縛り！`);
    
    // まもる中の相手には効かない
    if (defender.protected) {
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // すでに金縛り状態の場合
    if (defender.disableTurns > 0) {
      messages.push(`${defender.species.name}はすでに金縛り状態だ！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 相手が前のターンに技を使っていない場合は失敗
    if (!defender.lastUsedSkill) {
      messages.push(`しかし失敗した！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 金縛り状態を付与（4ターン持続）
    defender.disableTurns = 4;
    defender.disabledSkillId = defender.lastUsedSkill;
    messages.push(`${defender.species.name}の${defender.lastUsedSkill}を封じた！`);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === マナシール特殊処理 ===
  // 次ターン、相手のマナ回復を0に
  if (actualSkillId === 'mana_seal') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    // まもる中の相手には効かない
    if (defender.protected) {
      messages.push(`${attacker.species.name}のマナシール！`);
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 相手にマナシール状態を付与
    opponent.manaSealed = true;
    
    messages.push(`${attacker.species.name}のマナシール！`);
    messages.push(`${opponent.name}のマナ回復が封印された！`);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === マナブースト特殊処理 ===
  // 3ターンの間、毎ターンマナ回復+2
  if (actualSkillId === 'mana_boost') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    // 3ターンのマナブースト付与
    player.manaBoostTurns = 3;
    
    messages.push(`${attacker.species.name}のマナブースト！`);
    messages.push(`3ターンの間、マナ回復が+2される！`);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === マナドレイン特殊処理 ===
  // 相手のマナを3奪う（自分+3、相手-3）
  if (actualSkillId === 'mana_drain') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    // 相手のマナを3奪う（相手のマナが足りない場合はある分だけ）
    const drainAmount = Math.min(3, opponent.mana);
    
    if (drainAmount > 0) {
      applyManaChange(opponent, -drainAmount);
      applyManaChange(player, drainAmount);
      
      messages.push(`${attacker.species.name}のマナドレイン！`);
      messages.push(`${defender.species.name}からマナを${drainAmount}奪った！`);
      addLog(state, messages.join(' '), 'info');
    } else {
      messages.push(`${attacker.species.name}のマナドレイン！`);
      messages.push(`しかし${defender.species.name}にはマナがなかった！`);
      addLog(state, messages.join(' '), 'info');
    }
    
    return { success: true, damage: 0, messages };
  }
  
  // === マナバースト特殊処理 ===
  // 残りマナ全消費、マナ×20の固定ダメージ
  if (actualSkillId === 'mana_burst') {
    if (player.mana <= 0) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // 残りマナを記録してから全消費
    const burstMana = player.mana;
    consumeMana(player, burstMana);
    attacker.lastUsedSkill = actualSkillId;
    
    messages.push(`${attacker.species.name}のマナバースト！`);
    messages.push(`マナ${burstMana}を全て解放！`);
    
    // 命中判定
    if (!checkAccuracy(attacker, defender, skill, state.weather)) {
      messages.push(`しかし攻撃は外れた！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // まもる判定
    if (defender.protected) {
      messages.push(`${defender.species.name}はまもっている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 固定ダメージ（タイプ相性・急所・乱数なし）
    const fixedDamage = burstMana * 20;
    const actualDamage = Math.min(fixedDamage, defender.currentHp);
    
    applyHpChange(defender, -actualDamage);
    messages.push(`${defender.species.name}に${actualDamage}の固定ダメージ！`);
    
    // 瀕死判定
    if (defender.currentHp <= 0) {
      defender.currentHp = 0;
      messages.push(`${defender.species.name}は倒れた！`);
    }
    
    addLog(state, messages.join(' '), 'damage');
    return { success: true, damage: actualDamage, messages };
  }
  
  // === マナシェア特殊処理 ===
  // お互いのマナを合計して半分ずつ
  if (actualSkillId === 'mana_share') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    // お互いのマナを合計して半分ずつ（端数は自分が多く）
    const totalMana = player.mana + opponent.mana;
    const halfMana = Math.floor(totalMana / 2);
    const remainder = totalMana % 2;
    
    // 新しいマナ値を設定（直接代入）
    const playerNewMana = halfMana + remainder;  // 端数は自分がもらう
    const opponentNewMana = halfMana;
    
    // 現在値との差分を計算してapply
    const playerDiff = playerNewMana - player.mana;
    const opponentDiff = opponentNewMana - opponent.mana;
    
    applyManaChange(player, playerDiff);
    applyManaChange(opponent, opponentDiff);
    
    messages.push(`${attacker.species.name}のマナシェア！`);
    messages.push(`マナが均等になった！ (${player.name}: ${playerNewMana}, ${opponent.name}: ${opponentNewMana})`);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === マナリフレクト特殊処理 ===
  // このターン終了時、相手が使ったマナ分だけ回復
  if (actualSkillId === 'mana_reflect') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }

    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }

    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    player.manaReflectActive = true;

    messages.push(`${attacker.species.name}のマナリフレクト！`);
    messages.push(`このターン、相手が使ったマナを反射して回収する！`);
    addLog(state, messages.join(' '), 'info');

    return { success: true, damage: 0, messages };
  }

  // === バトンタッチ特殊処理 ===
  // 能力変化を引き継いで交代
  if (actualSkillId === 'baton_pass') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }

    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }

    // 交代可能な控えを検索
    const switchOptions = player.party
      .map((m, i) => ({ monster: m, index: i }))
      .filter(({ monster, index }) => index !== player.activeIndex && monster.currentHp > 0);

    if (switchOptions.length === 0) {
      messages.push(`${attacker.species.name}のバトンタッチ！`);
      messages.push(`しかし控えのモンスターがいない！`);
      addLog(state, messages.join(' '), 'info');
      return { success: false, messages };
    }

    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;

    // 最初の生存控えに交代（能力変化を引き継ぐ）
    const targetIndex = switchOptions[0].index;
    const newMonster = switchMonster(player, targetIndex, true);  // batonPass = true

    messages.push(`${attacker.species.name}のバトンタッチ！`);
    messages.push(`${attacker.species.name}は引っ込んだ！`);
    messages.push(`ゆけっ！${newMonster.species.name}！`);
    messages.push(`能力変化を引き継いだ！`);
    
    // 設置技ダメージを適用
    const hazardMessages = applyEntryHazards(state, playerIndex);
    messages.push(...hazardMessages);
    
    // 交代先の登場時特性を発動
    const abilityMessages = processOnEnterAbility(state, playerIndex);
    messages.push(...abilityMessages);

    addLog(state, messages.join(' '), 'switch');

    return { success: true, damage: 0, switched: true, messages };
  }

  // === エナジースティール特殊処理 ===
  // ダメージの10%をマナとして吸収
  if (actualSkillId === 'energy_steal') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    // まもる中の相手には効かない
    if (defender.protected) {
      messages.push(`${attacker.species.name}のエナジースティール！`);
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 命中判定
    if (!checkAccuracy(attacker, defender, skill, state.weather)) {
      messages.push(`${attacker.species.name}のエナジースティール！`);
      messages.push(`しかし攻撃は外れた！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 吸収系特性チェック
    const absorbResult = checkAbsorbAbility(defender, skill.type);
    if (absorbResult.absorbed) {
      messages.push(`${attacker.species.name}のエナジースティール！`);
      messages.push(absorbResult.message || '');
      if (absorbResult.healAmount) {
        applyHpChange(defender, absorbResult.healAmount);
      }
      addLog(state, messages.join(' '), 'ability');
      return { success: true, damage: 0, messages };
    }
    
    // 急所・ダメージ計算
    const isCritical = checkCritical(attacker, defender, skill);
    const damageResult = calculateDamage(attacker, defender, skill, state.weather, isCritical);
    
    // 壁補正（リフレクター/光の壁）
    const damageAfterScreen = applyScreenModifier(damageResult.damage, skill.category, opponent);
    
    // 頑丈チェック
    let damageToApply = damageAfterScreen;
    const wasFullHp = defender.currentHp === defender.maxHp;
    const wouldFaint = damageToApply >= defender.currentHp;
    const sturdyTriggered =
      defender.instance.ability === 'sturdy' &&
      wasFullHp &&
      wouldFaint;
    
    if (sturdyTriggered) {
      damageToApply = defender.currentHp - 1;
      messages.push(`${defender.species.name}は頑丈で耐えた！`);
    }
    
    // こらえる: HP1で耐える
    const endureTriggeredEnergy =
      defender.enduring &&
      !sturdyTriggered &&
      damageToApply >= defender.currentHp;

    if (endureTriggeredEnergy) {
      damageToApply = defender.currentHp - 1;
      messages.push(`${defender.species.name}はこらえた！`);
    }
    
    // ダメージ適用
    const hpResult = applyHpChange(defender, -damageToApply);
    let fainted = hpResult.fainted;
    
    // 不死鳥復活チェック
    if (fainted && defender.instance.ability === 'phoenix' && !defender.abilityDisabled) {
      defender.currentHp = 1;
      defender.abilityDisabled = true;
      fainted = false;
      messages.push(`${defender.species.name}は不死鳥の力で復活した！`);
    }
    
    // メッセージ
    messages.push(`${attacker.species.name}のエナジースティール！`);
    if (isCritical) messages.push('急所に当たった！');
    messages.push(`${defender.species.name}に${damageToApply}ダメージ！`);
    if (damageResult.effectiveness > 1) messages.push('効果は抜群だ！');
    if (damageResult.effectiveness < 1) messages.push('効果はいまひとつ...');
    
    // マナ吸収: ダメージの10%をマナとして回復
    const manaStolen = Math.max(1, Math.floor(damageToApply / 10));
    applyManaChange(player, manaStolen);
    messages.push(`エネルギーを吸収してマナが${manaStolen}回復した！`);
    
    addLog(state, messages.join(' '), 'damage');
    
    // 接触技時の特性発動
    if (skill.makesContact && attacker.currentHp > 0) {
      const contactMessages = processContactAbility(
        state,
        playerIndex,
        1 - playerIndex as 0 | 1,
        damageToApply
      );
      messages.push(...contactMessages);
    }
    
    if (fainted) {
      messages.push(`${defender.species.name}は倒れた！`);
      addLog(state, `${defender.species.name}は倒れた！`, 'ko');
    }
    
    return { success: true, damage: damageToApply, fainted, messages };
  }
  
  // === がむしゃら特殊処理 ===
  // 相手のHPを自分と同じにする（自分より相手のHPが高い場合のみダメージ）
  if (actualSkillId === 'endeavor') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    
    // まもる中の相手には効かない
    if (defender.protected) {
      messages.push(`${attacker.species.name}のがむしゃら！`);
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 命中判定
    if (!checkAccuracy(attacker, defender, skill, state.weather)) {
      messages.push(`${attacker.species.name}のがむしゃら！`);
      messages.push(`しかし攻撃は外れた！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    messages.push(`${attacker.species.name}のがむしゃら！`);
    
    // 自分より相手のHPが高い場合のみダメージ
    if (defender.currentHp > attacker.currentHp) {
      const damage = defender.currentHp - attacker.currentHp;
      const { fainted } = applyHpChange(defender, -damage);
      
      messages.push(`${defender.species.name}のHPが${attacker.currentHp}になった！（${damage}ダメージ）`);
      addLog(state, messages.join(' '), 'damage');
      
      // 不死鳥（phoenix）: 1回だけHP1で復活
      if (fainted && defender.instance.ability === 'phoenix' && !defender.abilityDisabled) {
        defender.currentHp = 1;
        defender.abilityDisabled = true;
        messages.push(`${defender.species.name}は不死鳥の力で復活した！`);
      }
      
      if (fainted && defender.currentHp === 0) {
        messages.push(`${defender.species.name}は倒れた！`);
        addLog(state, `${defender.species.name}は倒れた！`, 'ko');
      }
      
      return { success: true, damage, fainted: defender.currentHp === 0, messages };
    } else {
      messages.push(`しかし効果がなかった！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
  }
  
  // === 溜め技の1ターン目処理 ===
  const hasChargeEffect = skill.effects.some(e => e.type === 'charge');
  if (hasChargeEffect && !isChargeReleaseTurn) {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }

    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }

    consumeMana(player, skill.manaCost);
    attacker.lastUsedSkill = actualSkillId;
    attacker.charging = true;
    attacker.diving = actualSkillId === 'dive' || actualSkillId === 'dig';
    attacker.flying = actualSkillId === 'fly';

    messages.push(`${attacker.species.name}の${skill.name}！`);
    messages.push(`${attacker.species.name}は力を溜めている...`);
    addLog(state, messages.join(' '), 'info');
    return { success: true, damage: 0, messages };
  }

  // マナチェック（溜め技の2ターン目は消費済み）
  if (!isChargeReleaseTurn && player.mana < skill.manaCost) {
    messages.push(`マナが足りない！`);
    return { success: false, messages };
  }
  
  // ちょうはつ状態チェック（変化技使用不可）
  if (attacker.tauntTurns > 0 && skill.category === 'status') {
    messages.push(`${attacker.species.name}は挑発されていて変化技が使えない！`);
    addLog(state, messages.join(' '), 'info');
    return { success: false, messages };
  }
  
  // 金縛り状態チェック（封じられた技は使用不可）
  if (attacker.disableTurns > 0 && attacker.disabledSkillId === actualSkillId) {
    messages.push(`${attacker.species.name}の${skill.name}は金縛りで封じられている！`);
    addLog(state, messages.join(' '), 'info');
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
  
  // マナ消費（溜め技の2ターン目は消費済み）
  if (!isChargeReleaseTurn) {
    consumeMana(player, skill.manaCost);
  }
  attacker.lastUsedSkill = actualSkillId;
  
  // まもる中の相手には効かない（一部技を除く）
  if (defender.protected && !skill.ignoresProtect) {
    messages.push(`${attacker.species.name}の${skill.name}！`);
    messages.push(`しかし${defender.species.name}は身を守っている！`);
    addLog(state, messages.join(' '), 'info');
    return { success: true, damage: 0, messages };
  }
  
  // === 一撃必殺技（OHKO）の処理 ===
  // 地割れ（fissure）、絶対零度（sheer_cold）など
  const ohkoEffect = skill.effects.find(e => e.type === 'ohko');
  if (ohkoEffect) {
    messages.push(`${attacker.species.name}の${skill.name}！`);
    
    // 命中判定（通常30%）
    if (!checkAccuracy(attacker, defender, skill, state.weather)) {
      messages.push(`しかし攻撃は外れた！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 頑丈（sturdy）は一撃必殺を防げない（ポケモン準拠）
    // 不死鳥（phoenix）も一撃必殺では復活しない
    const damage = defender.currentHp;
    applyHpChange(defender, -damage);
    
    messages.push(`一撃必殺！`);
    messages.push(`${defender.species.name}は倒れた！`);
    addLog(state, messages.join(' '), 'damage');
    addLog(state, `${defender.species.name}は倒れた！`, 'ko');
    
    return { success: true, damage, fainted: true, messages };
  }
  
  // 吸収系特性チェック（ダメージ計算前）
  if (skill.power > 0) {
    const absorbResult = checkAbsorbAbility(defender, skill.type);
    if (absorbResult.absorbed) {
      messages.push(`${attacker.species.name}の${skill.name}！`);
      messages.push(absorbResult.message || '');
      
      // HP回復
      if (absorbResult.healAmount) {
        const { fainted } = applyHpChange(defender, absorbResult.healAmount);
      }
      
      // 避雷針: MAG+1
      if (defender.instance.ability === 'lightning_rod') {
        applyStatChange(defender, 'mag', 1);
      }
      
      // 電気エンジン: SPD+1
      if (defender.instance.ability === 'motor_drive') {
        applyStatChange(defender, 'spd', 1);
      }
      
      addLog(state, messages.join(' '), 'ability');
      return { success: true, damage: 0, messages };
    }
  }
  
  // 連続技かどうか判定
  const multiHitEffect = skill.effects.find(e => e.type === 'multi_hit');
  const isMultiHit = multiHitEffect !== undefined;
  
  // ダメージ技の処理
  let totalDamage = 0;
  let fainted = false;
  let hitCount = 0;
  let criticalCount = 0;
  let lastEffectiveness = 1;
  let thawedByFire = false;
  
  if (skill.power > 0) {
    messages.push(`${attacker.species.name}の${skill.name}！`);
    if (isPursuitOnSwitch) {
      messages.push('交代先に追い打ちして威力が上がった！');
    }
    
    // 連続技のヒット回数を決定（2-5回: 2回35%, 3回35%, 4回15%, 5回15%）
    const maxHits = isMultiHit ? rollMultiHitCount() : 1;
    
    for (let i = 0; i < maxHits; i++) {
      // 各ヒットで命中判定（最初のヒットで外れたら終了）
      if (!checkAccuracy(attacker, defender, skill, state.weather)) {
        if (hitCount === 0) {
          messages.push(`しかし攻撃は外れた！`);
          addLog(state, messages.join(' '), 'info');
          return { success: true, damage: 0, messages };
        }
        // 2回目以降で外れたらその時点で終了
        break;
      }
      
      const isCritical = checkCritical(attacker, defender, skill);
      const damageResult = calculateDamage(attacker, defender, skill, state.weather, isCritical);

      // 壁補正（リフレクター/光の壁）
      const damageAfterScreen = applyScreenModifier(damageResult.damage, skill.category, opponent);

      // 頑丈: HP満タン時、一撃では倒れずHP1で耐える
      let damageToApply = damageAfterScreen;
      const wasFullHp = defender.currentHp === defender.maxHp;
      const wouldFaint = damageToApply >= defender.currentHp;
      const sturdyTriggered =
        defender.instance.ability === 'sturdy' &&
        wasFullHp &&
        wouldFaint;

      if (sturdyTriggered) {
        damageToApply = defender.currentHp - 1;
        messages.push(`${defender.species.name}は頑丈で耐えた！`);
      }

      // こらえる: HP1で耐える
      const endureTriggered =
        defender.enduring &&
        !sturdyTriggered &&
        damageToApply >= defender.currentHp;

      if (endureTriggered) {
        damageToApply = defender.currentHp - 1;
        messages.push(`${defender.species.name}はこらえた！`);
      }

      hitCount++;
      if (isCritical) criticalCount++;
      lastEffectiveness = damageResult.effectiveness;

      // みがわりチェック: みがわりがあればそちらにダメージを与える
      if (defender.substituteHp > 0) {
        const substituteDamage = Math.min(damageToApply, defender.substituteHp);
        defender.substituteHp -= substituteDamage;
        totalDamage += substituteDamage;
        
        if (defender.substituteHp <= 0) {
          defender.substituteHp = 0;
          messages.push(`${defender.species.name}のみがわりが壊れた！`);
        }
        // みがわりがダメージを受けた場合、本体へのダメージはなし
        continue;
      }
      
      totalDamage += damageToApply;

      const hpResult = applyHpChange(defender, -damageToApply);
      fainted = hpResult.fainted;

      // 炎技を受けた凍り状態は解除（BATTLE_SYSTEM仕様）
      if (!fainted && defender.status === 'freeze' && skill.type === 'fire' && damageToApply > 0 && !thawedByFire) {
        defender.status = 'none';
        defender.statusTurns = 0;
        thawedByFire = true;
        messages.push(`${defender.species.name}の氷が炎で溶けた！`);
      }
      
      // 不死鳥（phoenix）: 1回だけHP1で復活
      if (fainted && defender.instance.ability === 'phoenix' && !defender.abilityDisabled) {
        defender.currentHp = 1;
        defender.abilityDisabled = true;  // 特性を使用済みにする
        fainted = false;
        messages.push(`${defender.species.name}は不死鳥の力で復活した！`);
      }
      
      // 相手が倒れたら残りのヒットはスキップ
      if (fainted) break;
    }
    
    // カウンター/ミラーコート用: 被ダメージを記録
    if (totalDamage > 0) {
      if (skill.category === 'physical') {
        defender.physicalDamageTakenThisTurn += totalDamage;
      } else if (skill.category === 'special') {
        defender.specialDamageTakenThisTurn += totalDamage;
      }
    }
    
    // ログ出力
    addDamageLog(
      state,
      attacker.species.name,
      defender.species.name,
      skill.name,
      totalDamage,
      criticalCount > 0,
      lastEffectiveness
    );

    // メッセージ組み立て
    if (criticalCount > 0) messages.push('急所に当たった！');
    if (isMultiHit) {
      messages.push(`${hitCount}回ヒット！`);
    }
    messages.push(`${defender.species.name}に${totalDamage}ダメージ！`);
    if (lastEffectiveness > 1) messages.push('効果は抜群だ！');
    if (lastEffectiveness < 1) messages.push('効果はいまひとつ...');
  } else {
    // 命中判定（変化技）
    if (!checkAccuracy(attacker, defender, skill, state.weather)) {
      messages.push(`${attacker.species.name}の${skill.name}！`);
      messages.push(`しかし攻撃は外れた！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    messages.push(`${attacker.species.name}の${skill.name}！`);
    addLog(state, messages.join(' '), 'info');
  }
  
  // 追加効果
  if (!fainted) {
    const effectMessages = applySkillEffects(state, playerIndex, skill, totalDamage);
    messages.push(...effectMessages);
  }
  
  // 接触技時の特性発動（攻撃側/防御側どちらか倒れていなければ）
  if (skill.makesContact && totalDamage > 0 && attacker.currentHp > 0) {
    const contactMessages = processContactAbility(
      state,
      playerIndex,
      1 - playerIndex as 0 | 1,
      totalDamage
    );
    messages.push(...contactMessages);
    
    // 接触特性で攻撃側が倒れた場合
    if (attacker.currentHp <= 0) {
      messages.push(`${attacker.species.name}は倒れた！`);
      addLog(state, `${attacker.species.name}は倒れた！`, 'ko');
    }
  }
  
  if (fainted) {
    messages.push(`${defender.species.name}は倒れた！`);
    addLog(state, `${defender.species.name}は倒れた！`, 'ko');
  }
  
  // とんぼがえり/ボルトチェンジ: 攻撃後に交代
  // 条件: ダメージを与えた && 控えがいる && 自分が生きている
  const switchEffect = skill.effects.find(e => e.type === 'switch');
  let shouldSwitchAfterAttack = false;
  
  if (switchEffect && totalDamage > 0 && attacker.currentHp > 0) {
    // 交代可能な控えがいるかチェック
    const switchOptions = player.party
      .map((m, i) => ({ monster: m, index: i }))
      .filter(({ monster, index }) => index !== player.activeIndex && monster.currentHp > 0);
    
    if (switchOptions.length > 0) {
      shouldSwitchAfterAttack = true;
      messages.push(`${attacker.species.name}は攻撃後に戻ってきた！`);
    }
  }
  
  // 連続切り（fury_cutter）のストリーク更新
  // 連続切りを使った場合: ストリークを増加（最大2）
  // 他の技を使った場合: ストリークをリセット
  if (actualSkillId === 'fury_cutter' && totalDamage > 0) {
    // 命中してダメージを与えた場合のみストリーク増加
    attacker.furyCutterStreak = Math.min(2, (attacker.furyCutterStreak || 0) + 1);
  } else if (actualSkillId !== 'fury_cutter') {
    // 他の技を使ったらリセット
    attacker.furyCutterStreak = 0;
  }
  
  return { success: true, damage: totalDamage, fainted, messages, shouldSwitchAfterAttack };
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
  // リチャージ中（ギガインパクト等の反動）
  if (monster.mustRecharge) {
    monster.mustRecharge = false;  // リチャージ完了、フラグリセット
    messages.push(`${monster.species.name}は攻撃の反動で動けない！`);
    return { canAct: false, selfDamage: false };
  }
  
  // ひるみ（同ターン内のみ）
  if (monster.flinched) {
    monster.flinched = false;
    messages.push(`${monster.species.name}はひるんで動けない！`);
    return { canAct: false, selfDamage: false };
  }

  // 眠り（1〜3ターン継続）
  if (monster.status === 'sleep') {
    // 旧データ互換: 異常値の場合のみ最低1ターンを補う
    if (!Number.isFinite(monster.statusTurns) || monster.statusTurns < 0) {
      monster.statusTurns = 1;
    }

    if (monster.statusTurns > 0) {
      monster.statusTurns--;
      messages.push(`${monster.species.name}はぐうぐう眠っている...`);
      return { canAct: false, selfDamage: false };
    }

    monster.status = 'none';
    monster.statusTurns = 0;
    messages.push(`${monster.species.name}は目を覚ました！`);
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
  
  // 混乱（1〜4ターン継続、毎ターン33%で自傷）
  if (monster.isConfused) {
    // 旧データ互換: 異常値は最低1ターン補う
    if (!Number.isFinite(monster.confusionTurns) || monster.confusionTurns < 1) {
      monster.confusionTurns = 1;
    }

    messages.push(`${monster.species.name}は混乱している！`);

    const selfHit = Math.random() < 0.33;

    // 1ターン経過
    monster.confusionTurns--;
    if (monster.confusionTurns <= 0) {
      monster.isConfused = false;
      monster.confusionTurns = 0;
      messages.push(`${monster.species.name}は正気に戻った！`);
    }

    if (selfHit) {
      return { canAct: false, selfDamage: true };
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
