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
  
  // === マナバースト特殊処理 ===
  // 残りマナを全消費して マナ×20 の固定ダメージ
  if (skillId === 'mana_burst') {
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
    applyManaChange(player, -manaToConsume);
    attacker.lastUsedSkill = skillId;
    
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
  if (skillId === 'mana_drain') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    applyManaChange(player, -skill.manaCost);
    attacker.lastUsedSkill = skillId;
    
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
  
  // === マナチャージ特殊処理 ===
  // 次ターンマナ+5（待機技扱い）
  if (skillId === 'mana_charge') {
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    attacker.lastUsedSkill = skillId;
    
    // このターンは待機、次ターン開始時に+5回復（regenerateManaで+3なので実質+2追加）
    // 簡易実装: 即座に+5
    applyManaChange(player, 5);
    
    messages.push(`${attacker.species.name}のマナチャージ！`);
    messages.push(`${player.name}のマナが5増えた！`);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === マナシール特殊処理 ===
  // 次ターン、相手のマナ回復を0に
  if (skillId === 'mana_seal') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    applyManaChange(player, -skill.manaCost);
    attacker.lastUsedSkill = skillId;
    
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
  if (skillId === 'mana_boost') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    applyManaChange(player, -skill.manaCost);
    attacker.lastUsedSkill = skillId;
    
    // 3ターンのマナブースト付与
    player.manaBoostTurns = 3;
    
    messages.push(`${attacker.species.name}のマナブースト！`);
    messages.push(`3ターンの間、マナ回復が+2される！`);
    addLog(state, messages.join(' '), 'info');
    
    return { success: true, damage: 0, messages };
  }
  
  // === マナシェア特殊処理 ===
  // お互いのマナを合計して半分ずつ
  if (skillId === 'mana_share') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    applyManaChange(player, -skill.manaCost);
    attacker.lastUsedSkill = skillId;
    
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
  
  // === がむしゃら特殊処理 ===
  // 相手のHPを自分と同じにする（自分より相手のHPが高い場合のみダメージ）
  if (skillId === 'endeavor') {
    if (player.mana < skill.manaCost) {
      messages.push(`マナが足りない！`);
      return { success: false, messages };
    }
    
    const canActResult = checkCanAct(attacker, messages);
    if (!canActResult.canAct) {
      return { success: false, messages };
    }
    
    // マナ消費
    applyManaChange(player, -skill.manaCost);
    attacker.lastUsedSkill = skillId;
    
    // まもる中の相手には効かない
    if (defender.protected) {
      messages.push(`${attacker.species.name}のがむしゃら！`);
      messages.push(`しかし${defender.species.name}は身を守っている！`);
      addLog(state, messages.join(' '), 'info');
      return { success: true, damage: 0, messages };
    }
    
    // 命中判定
    if (!checkAccuracy(attacker, defender, skill)) {
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
  
  // === 一撃必殺技（OHKO）の処理 ===
  // 地割れ（fissure）、絶対零度（sheer_cold）など
  const ohkoEffect = skill.effects.find(e => e.type === 'ohko');
  if (ohkoEffect) {
    messages.push(`${attacker.species.name}の${skill.name}！`);
    
    // 命中判定（通常30%）
    if (!checkAccuracy(attacker, defender, skill)) {
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
  
  if (skill.power > 0) {
    messages.push(`${attacker.species.name}の${skill.name}！`);
    
    // 連続技のヒット回数を決定（2-5回: 2回35%, 3回35%, 4回15%, 5回15%）
    const maxHits = isMultiHit ? rollMultiHitCount() : 1;
    
    for (let i = 0; i < maxHits; i++) {
      // 各ヒットで命中判定（最初のヒットで外れたら終了）
      if (!checkAccuracy(attacker, defender, skill)) {
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
        messages.push(`${defender.species.name}は頑丈で耐えた！`);
      }

      totalDamage += damageToApply;
      hitCount++;
      if (isCritical) criticalCount++;
      lastEffectiveness = damageResult.effectiveness;

      const hpResult = applyHpChange(defender, -damageToApply);
      fainted = hpResult.fainted;
      
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
    if (!checkAccuracy(attacker, defender, skill)) {
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
