/**
 * ダメージ計算モジュール
 * 
 * 基本式（レベル50固定）:
 * ダメージ = (22 × 技威力 × A / D / 50 + 2) × 各種補正
 */

import {
  BattleMonster,
  Skill,
  Weather,
  MonsterType,
  STAB_MULTIPLIER,
  CRIT_DAMAGE_MULTIPLIER,
  STAT_STAGE_MIN,
  STAT_STAGE_MAX,
} from '../types';
import { getTypeEffectiveness, hasSTAB } from '../data/types';

// ============================================
// ランク補正
// ============================================

/** ステータスランク補正倍率 */
const STAT_STAGE_MULTIPLIERS: Record<string, number> = {
  '-6': 0.25,
  '-5': 0.28,
  '-4': 0.33,
  '-3': 0.40,
  '-2': 0.50,
  '-1': 0.66,
  '0': 1.00,
  '1': 1.50,
  '2': 2.00,
  '3': 2.50,
  '4': 3.00,
  '5': 3.50,
  '6': 4.00,
};

/** 命中/回避ランク補正倍率 */
const ACCURACY_STAGE_MULTIPLIERS: Record<string, number> = {
  '-6': 0.33,
  '-5': 0.36,
  '-4': 0.43,
  '-3': 0.50,
  '-2': 0.60,
  '-1': 0.75,
  '0': 1.00,
  '1': 1.33,
  '2': 1.66,
  '3': 2.00,
  '4': 2.33,
  '5': 2.66,
  '6': 3.00,
};

/** 急所ランク確率 */
const CRIT_RATE: Record<number, number> = {
  0: 1 / 24,    // 約4.2%
  1: 1 / 8,     // 12.5%
  2: 1 / 2,     // 50%
  3: 1,         // 100%
};

/**
 * ステータスランク補正を取得
 */
export function getStatMultiplier(stage: number): number {
  const clamped = Math.max(STAT_STAGE_MIN, Math.min(STAT_STAGE_MAX, stage));
  return STAT_STAGE_MULTIPLIERS[clamped.toString()] ?? 1;
}

/**
 * 命中/回避ランク補正を取得
 */
export function getAccuracyMultiplier(stage: number): number {
  const clamped = Math.max(STAT_STAGE_MIN, Math.min(STAT_STAGE_MAX, stage));
  return ACCURACY_STAGE_MULTIPLIERS[clamped.toString()] ?? 1;
}

// ============================================
// ステータス計算
// ============================================

/**
 * 実効ATKを計算（種族値 × ランク補正）
 */
export function getEffectiveAtk(monster: BattleMonster, ignorePenalty = false): number {
  const base = monster.species.baseStats.atk;
  let stage = monster.statStages.atk;
  
  // 急所時は攻撃側のマイナス補正を無視
  if (ignorePenalty && stage < 0) {
    stage = 0;
  }
  
  const value = Math.floor(base * getStatMultiplier(stage));
  
  // やけど状態なら物理攻撃力半減（後で適用するのでここでは計算しない）
  return value;
}

/**
 * 実効DEFを計算
 */
export function getEffectiveDef(monster: BattleMonster, ignoreBonus = false): number {
  const base = monster.species.baseStats.def;
  let stage = monster.statStages.def;
  
  // 急所時は防御側のプラス補正を無視
  if (ignoreBonus && stage > 0) {
    stage = 0;
  }
  
  return Math.floor(base * getStatMultiplier(stage));
}

/**
 * 実効MAGを計算
 */
export function getEffectiveMag(monster: BattleMonster, ignorePenalty = false): number {
  const base = monster.species.baseStats.mag;
  let stage = monster.statStages.mag;
  
  if (ignorePenalty && stage < 0) {
    stage = 0;
  }
  
  return Math.floor(base * getStatMultiplier(stage));
}

/**
 * 実効RESを計算
 */
export function getEffectiveRes(monster: BattleMonster, ignoreBonus = false): number {
  const base = monster.species.baseStats.res;
  let stage = monster.statStages.res;
  
  if (ignoreBonus && stage > 0) {
    stage = 0;
  }
  
  return Math.floor(base * getStatMultiplier(stage));
}

/**
 * 実効SPDを計算
 */
export function getEffectiveSpd(monster: BattleMonster): number {
  const base = monster.species.baseStats.spd;
  let value = Math.floor(base * getStatMultiplier(monster.statStages.spd));
  
  // まひ状態ならSPD半減
  if (monster.status === 'paralyze') {
    value = Math.floor(value * 0.5);
  }
  
  return value;
}

// ============================================
// 命中判定
// ============================================

/**
 * 命中判定を行う
 */
export function checkAccuracy(
  attacker: BattleMonster,
  defender: BattleMonster,
  skill: Skill
): boolean {
  // 必中技（accuracy が 0）
  if (skill.accuracy === 0) {
    return true;
  }
  
  const accuracyStage = attacker.statStages.accuracy;
  const evasionStage = defender.statStages.evasion;
  
  const accuracyMod = getAccuracyMultiplier(accuracyStage);
  const evasionMod = getAccuracyMultiplier(evasionStage);
  
  const finalAccuracy = skill.accuracy * (accuracyMod / evasionMod);
  const roll = Math.random() * 100;
  
  return roll < finalAccuracy;
}

// ============================================
// 急所判定
// ============================================

/**
 * 急所判定を行う
 */
export function checkCritical(
  attacker: BattleMonster,
  defender: BattleMonster,
  skill: Skill
): boolean {
  // シェルアーマー持ちは急所無効
  if (defender.instance.ability === 'shell_armor') {
    return false;
  }

  // 急所ランクを計算
  let critRank = skill.critBonus;

  // きょううん: 急所ランク+1
  if (attacker.instance.ability === 'super_luck') {
    critRank += 1;
  }

  // ランクを0-3にクランプ
  critRank = Math.min(3, Math.max(0, critRank));

  const critChance = CRIT_RATE[critRank] ?? CRIT_RATE[0];
  return Math.random() < critChance;
}

// ============================================
// ダメージ計算
// ============================================

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  effectiveness: number;  // 1, 2, 0.5, 4, 0.25 etc
  isSTAB: boolean;
}

/**
 * ダメージを計算
 */
export function calculateDamage(
  attacker: BattleMonster,
  defender: BattleMonster,
  skill: Skill,
  weather: Weather = 'none',
  isCritical: boolean = false
): DamageResult {
  // 変化技はダメージなし
  if (skill.category === 'status' || skill.power === 0) {
    return { damage: 0, isCritical: false, effectiveness: 1, isSTAB: false };
  }
  
  // 攻撃/防御ステータス選択
  const isPhysical = skill.category === 'physical';
  const attackStat = isPhysical 
    ? getEffectiveAtk(attacker, isCritical)
    : getEffectiveMag(attacker, isCritical);
  const defenseStat = isPhysical
    ? getEffectiveDef(defender, isCritical)
    : getEffectiveRes(defender, isCritical);
  
  // 基本ダメージ（レベル50固定）
  // (22 × 技威力 × A / D / 50 + 2)
  let baseDamage = Math.floor(22 * skill.power * attackStat / defenseStat / 50) + 2;
  
  // タイプ一致ボーナス（STAB）
  const attackerTypes = attacker.species.types as MonsterType[];
  const isSTAB = hasSTAB(skill.type, attackerTypes);
  if (isSTAB) {
    baseDamage = Math.floor(baseDamage * STAB_MULTIPLIER);
  }
  
  // タイプ相性
  const defenderTypes = defender.species.types as MonsterType[];
  const effectiveness = getTypeEffectiveness(skill.type, defenderTypes);
  baseDamage = Math.floor(baseDamage * effectiveness);
  
  // 急所ダメージ（スナイパーは2.25倍）
  if (isCritical) {
    const critMultiplier = attacker.instance.ability === 'sniper' ? 2.25 : CRIT_DAMAGE_MULTIPLIER;
    baseDamage = Math.floor(baseDamage * critMultiplier);
  }
  
  // 天候補正
  baseDamage = applyWeatherModifier(baseDamage, skill.type, weather);
  
  // HP50%以下特性補正（猛火・激流など）
  baseDamage = applyLowHpAbilityModifier(baseDamage, attacker, skill.type);
  
  // やけど補正（物理技 + 攻撃側がやけど）
  if (isPhysical && attacker.status === 'burn') {
    baseDamage = Math.floor(baseDamage * 0.5);
  }
  
  // 乱数補正（0.85〜1.00）
  const randomFactor = 0.85 + Math.random() * 0.15;
  baseDamage = Math.floor(baseDamage * randomFactor);
  
  // 最低1ダメージ保証
  baseDamage = Math.max(1, baseDamage);
  
  return {
    damage: baseDamage,
    isCritical,
    effectiveness,
    isSTAB,
  };
}

/**
 * 天候補正を適用
 */
function applyWeatherModifier(damage: number, skillType: MonsterType, weather: Weather): number {
  switch (weather) {
    case 'sunny':
      if (skillType === 'fire') return Math.floor(damage * 1.5);
      if (skillType === 'water') return Math.floor(damage * 0.5);
      break;
    case 'rain':
      if (skillType === 'water') return Math.floor(damage * 1.5);
      if (skillType === 'fire') return Math.floor(damage * 0.5);
      break;
    // 砂嵐と雪は直接ダメージには影響しない（ターン終了時ダメージ）
  }
  return damage;
}

/**
 * HP50%以下特性補正を適用（猛火・激流など）
 */
function applyLowHpAbilityModifier(
  damage: number,
  attacker: BattleMonster,
  skillType: MonsterType
): number {
  const LOW_HP_ABILITY_MULTIPLIER = 1.3;
  const isLowHp = attacker.currentHp <= attacker.maxHp / 2;
  
  if (!isLowHp) return damage;
  
  const ability = attacker.instance.ability;
  
  // 猛火: HP50%以下で炎技威力1.3倍
  if (ability === 'blaze' && skillType === 'fire') {
    return Math.floor(damage * LOW_HP_ABILITY_MULTIPLIER);
  }
  
  // 激流: HP50%以下で水技威力1.3倍
  if (ability === 'torrent' && skillType === 'water') {
    return Math.floor(damage * LOW_HP_ABILITY_MULTIPLIER);
  }
  
  // 新緑: HP50%以下で草技威力1.3倍（草タイプは無いが将来のため）
  // if (ability === 'overgrow' && skillType === 'grass') {
  //   return Math.floor(damage * LOW_HP_ABILITY_MULTIPLIER);
  // }
  
  return damage;
}

/**
 * 固定ダメージを計算（マナバーストなど）
 */
export function calculateFixedDamage(amount: number): DamageResult {
  return {
    damage: Math.max(1, amount),
    isCritical: false,
    effectiveness: 1,
    isSTAB: false,
  };
}

/**
 * 自傷ダメージを計算（混乱時）
 */
export function calculateConfusionDamage(monster: BattleMonster): number {
  // 威力40の物理技として計算
  const atk = getEffectiveAtk(monster);
  const def = getEffectiveDef(monster);
  let damage = Math.floor(22 * 40 * atk / def / 50) + 2;
  
  // 乱数補正
  const randomFactor = 0.85 + Math.random() * 0.15;
  damage = Math.floor(damage * randomFactor);
  
  return Math.max(1, damage);
}
