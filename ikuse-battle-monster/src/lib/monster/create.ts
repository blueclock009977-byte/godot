/**
 * モンスター個体生成
 * 企画書通り: 8技候補から4技をランダム、2特性から1特性をランダム
 * 御三家は固定構成
 */

import { MonsterInstance, MonsterSpecies, SKILL_SLOT_SIZE } from '../types';

/**
 * 配列からランダムにn個を選択（重複なし）
 */
function pickRandom<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return [...arr];
  
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

/**
 * 配列からランダムに1つを選択
 */
function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * ユニークIDを生成
 */
function generateId(): string {
  return `mon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * モンスター種族からランダムに個体を生成
 * 
 * - 御三家: 固定特性・固定技
 * - その他: skillPoolから4技、abilitiesから1特性をランダム選択
 */
export function createMonsterInstance(
  species: MonsterSpecies,
  options?: {
    nickname?: string;
    forceAbility?: string;   // 特性を指定（テスト用）
    forceSkills?: string[];  // 技を指定（テスト用）
  }
): MonsterInstance {
  const { nickname, forceAbility, forceSkills } = options ?? {};
  
  // 特性の決定
  let ability: string;
  if (forceAbility) {
    ability = forceAbility;
  } else if (species.fixedAbility) {
    // 御三家は固定特性
    ability = species.fixedAbility;
  } else {
    // 通常モンスターは特性候補からランダム
    ability = pickOne(species.abilities);
  }
  
  // 技の決定
  let skills: string[];
  if (forceSkills) {
    skills = forceSkills;
  } else if (species.fixedSkills) {
    // 御三家は固定技
    skills = [...species.fixedSkills];
  } else {
    // 通常モンスターはskillPoolから4技をランダム選択
    skills = pickRandom(species.skillPool, SKILL_SLOT_SIZE);
  }
  
  // HPの計算（レベル50固定として簡易計算）
  // 実際の計算式: HP = (種族値×2 + 31 + 252/4) × Lv/100 + Lv + 10
  // 簡略化: HP = 種族値 + 60 (Lv50相当)
  const maxHp = species.baseStats.hp + 60;
  
  return {
    id: generateId(),
    speciesId: species.id,
    nickname,
    ability,
    skills,
    currentHp: maxHp,
    maxHp,
  };
}

/**
 * 御三家用の初期パーティ生成
 * 
 * 御三家1体 + 相性の良い早熟モンスター2体（ランダム構成）
 */
export function createStarterParty(
  starterSpecies: MonsterSpecies,
  companionSpecies: MonsterSpecies[]
): MonsterInstance[] {
  // 御三家は固定構成
  const starter = createMonsterInstance(starterSpecies);
  
  // 早熟モンスター2体はランダム構成
  const companions = companionSpecies.slice(0, 2).map(species => 
    createMonsterInstance(species)
  );
  
  return [starter, ...companions];
}

/**
 * テスト用: 同じ技・特性のモンスターを複数生成
 */
export function createTestMonsterInstance(
  species: MonsterSpecies,
  options?: {
    nickname?: string;
    ability?: string;
    skills?: string[];
  }
): MonsterInstance {
  return createMonsterInstance(species, {
    nickname: options?.nickname,
    forceAbility: options?.ability,
    forceSkills: options?.skills,
  });
}
