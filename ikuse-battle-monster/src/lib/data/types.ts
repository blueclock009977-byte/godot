/**
 * タイプシステム - 相性表とメタデータ
 */

import { MonsterType, TypeInfo, TypeChart } from '../types';

/** タイプ情報 */
export const TYPE_INFO: Record<MonsterType, TypeInfo> = {
  fire: { id: 'fire', name: '炎', emoji: '🔥' },
  water: { id: 'water', name: '水', emoji: '💧' },
  earth: { id: 'earth', name: '土', emoji: '🪨' },
  wind: { id: 'wind', name: '風', emoji: '🌪️' },
  light: { id: 'light', name: '光', emoji: '✨' },
  dark: { id: 'dark', name: '闇', emoji: '🌑' },
  thunder: { id: 'thunder', name: '雷', emoji: '⚡' },
  ice: { id: 'ice', name: '氷', emoji: '❄️' },
  none: { id: 'none', name: '無', emoji: '⚪' },
};

/**
 * タイプ相性表
 * 
 * TYPE_CHART[攻撃タイプ][防御タイプ] = 倍率
 * 
 * 相性の理由:
 * - 炎→氷（溶かす）、氷→風（凍結）、風→炎（酸素供給）：御三家三つ巴
 * - 水→炎（消火）、土→雷（アース）、雷→水（感電）
 * - 光⇔闇（対立）
 * - 風→土（砂嵐）、土→炎（窒息）
 */
export const TYPE_CHART: TypeChart = {
  // 炎の攻撃
  fire: {
    fire: 0.5,    // 炎→炎: 半減
    water: 0.5,   // 炎→水: 半減
    earth: 2,     // 炎→土: 2倍（焼く）
    wind: 0.5,    // 炎→風: 半減
    light: 1,
    dark: 1,
    thunder: 1,
    ice: 2,       // 炎→氷: 2倍（溶かす）
    none: 1,
  },
  // 水の攻撃
  water: {
    fire: 2,      // 水→炎: 2倍（消火）
    water: 0.5,   // 水→水: 半減
    earth: 1,
    wind: 1,
    light: 1,
    dark: 1,
    thunder: 0.5, // 水→雷: 半減（危険だから避ける？）
    ice: 0.5,     // 水→氷: 半減
    none: 1,
  },
  // 土の攻撃
  earth: {
    fire: 0.5,    // 土→炎: 半減
    water: 1,
    earth: 0.5,   // 土→土: 半減
    wind: 2,      // 土→風: 2倍（砂嵐）
    light: 1,
    dark: 1,
    thunder: 2,   // 土→雷: 2倍（アース）
    ice: 1,
    none: 1,
  },
  // 風の攻撃
  wind: {
    fire: 2,      // 風→炎: 2倍（酸素供給で燃やす）
    water: 1,
    earth: 0.5,   // 風→土: 半減
    wind: 0.5,    // 風→風: 半減
    light: 1,
    dark: 1,
    thunder: 0.5, // 風→雷: 半減
    ice: 2,       // 風→氷: 2倍（吹き飛ばす）
    none: 1,
  },
  // 光の攻撃
  light: {
    fire: 1,
    water: 1,
    earth: 1,
    wind: 1,
    light: 0.5,   // 光→光: 半減
    dark: 2,      // 光→闇: 2倍（対立）
    thunder: 1,
    ice: 1,
    none: 1,
  },
  // 闇の攻撃
  dark: {
    fire: 1,
    water: 1,
    earth: 1,
    wind: 1,
    light: 2,     // 闇→光: 2倍（対立）
    dark: 0.5,    // 闇→闇: 半減
    thunder: 1,
    ice: 1,
    none: 1,
  },
  // 雷の攻撃
  thunder: {
    fire: 1,
    water: 2,     // 雷→水: 2倍（感電）
    earth: 0.5,   // 雷→土: 半減（アース）
    wind: 2,      // 雷→風: 2倍（落雷）
    light: 1,
    dark: 1,
    thunder: 0.5, // 雷→雷: 半減
    ice: 1,
    none: 1,
  },
  // 氷の攻撃
  ice: {
    fire: 0.5,    // 氷→炎: 半減
    water: 2,     // 氷→水: 2倍（凍らせる）
    earth: 1,
    wind: 0.5,    // 氷→風: 半減
    light: 1,
    dark: 1,
    thunder: 1,
    ice: 0.5,     // 氷→氷: 半減
    none: 1,
  },
  // 無属性の攻撃
  none: {
    fire: 1,
    water: 1,
    earth: 1,
    wind: 1,
    light: 1,
    dark: 1,
    thunder: 1,
    ice: 1,
    none: 1,
  },
};

/**
 * タイプ相性を取得
 */
export function getTypeEffectiveness(
  attackType: MonsterType,
  defenseTypes: MonsterType[]
): number {
  let multiplier = 1;
  for (const defType of defenseTypes) {
    multiplier *= TYPE_CHART[attackType][defType];
  }
  return multiplier;
}

/**
 * タイプ一致ボーナス（STAB）をチェック
 */
export function hasSTAB(
  skillType: MonsterType,
  monsterTypes: MonsterType[]
): boolean {
  return monsterTypes.includes(skillType);
}

/**
 * 複合タイプの弱点を取得
 */
export function getWeaknesses(types: MonsterType[]): MonsterType[] {
  const weaknesses: MonsterType[] = [];
  const allTypes: MonsterType[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark', 'thunder', 'ice'];
  
  for (const attackType of allTypes) {
    const effectiveness = getTypeEffectiveness(attackType, types);
    if (effectiveness > 1) {
      weaknesses.push(attackType);
    }
  }
  return weaknesses;
}

/**
 * 複合タイプの耐性を取得
 */
export function getResistances(types: MonsterType[]): MonsterType[] {
  const resistances: MonsterType[] = [];
  const allTypes: MonsterType[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark', 'thunder', 'ice'];
  
  for (const attackType of allTypes) {
    const effectiveness = getTypeEffectiveness(attackType, types);
    if (effectiveness < 1) {
      resistances.push(attackType);
    }
  }
  return resistances;
}

/**
 * タイプ情報を取得
 */
export function getTypeInfo(type: MonsterType): TypeInfo {
  return TYPE_INFO[type];
}
