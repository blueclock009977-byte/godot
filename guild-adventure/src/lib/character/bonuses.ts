/**
 * キャラクターボーナス計算の一元管理モジュール
 * 
 * 種族パッシブ、職業パッシブ、Lvスキル、装備、マスタリーから
 * すべてのボーナスを計算し、Single Source of Truthを提供する。
 */

import { races } from '../data/races';
import { jobs } from '../data/jobs';
import { EffectType, Effect, Stats } from '../types';
import { getLvBonus } from '../data/lvStatBonuses';

// ============================================
// 型定義
// ============================================

/**
 * キャラクター1人分の全ボーナス
 */
export interface CharacterBonuses {
  // トレハン系
  dropBonus: number;
  coinBonus: number;
  rareDropBonus: number;
  explorationSpeedBonus: number;
  doubleDropRoll: number;
  
  // 戦闘系 - 攻撃
  physicalBonus: number;
  magicBonus: number;
  damageBonus: number;
  critBonus: number;
  critDamage: number;
  
  // 戦闘系 - 防御
  damageReduction: number;
  evasionBonus: number;
  statusResist: number;
  degradationResist: number;
  
  // 戦闘系 - その他
  accuracyBonus: number;
  firstStrikeBonus: number;
  healBonus: number;
  hpRegen: number;
  mpRegen: number;
  hpSteal: number;
  mpReduction: number;
  counterRate: number;
  
  // 連撃系
  bonusHits: number;
  noDecayHits: number;
  decayReduction: number;
  fixedHits: number;
  singleHitBonus: number;
  
  // 味方支援系
  allyAtkBonus: number;
  allyDefense: number;
  intimidate: number;
  
  // 系統特攻
  speciesKiller_humanoid: number;
  speciesKiller_beast: number;
  speciesKiller_undead: number;
  speciesKiller_demon: number;
  speciesKiller_dragon: number;
  
  // 系統耐性
  speciesResist_humanoid: number;
  speciesResist_beast: number;
  speciesResist_undead: number;
  speciesResist_demon: number;
  speciesResist_dragon: number;
  
  // 劣化系
  degradationBonus: number;
  
  // マスタリー系（特殊）
  allStats: number;
  cover: number;
  followUp: number;
  doublecast: number;
  perfectEvasion: number;
  autoRevive: number;
  mpOnKill: number;
  
  // 条件付き効果
  lowHpBonus: number;
  fullHpAtkBonus: number;
  surviveLethal: number;
  
  // 生のエフェクトリスト（特殊処理用）
  rawEffects: Effect[];
}

/**
 * ボーナスのソース情報（重複管理用）
 */
interface BonusSource {
  sourceId: string;  // 例: "race_human_幸運", "job_bard_旅の経験"
  effects: Effect[];
}

// ============================================
// ヘルパー関数
// ============================================

/**
 * 空のボーナスオブジェクトを作成
 */
function createEmptyBonuses(): CharacterBonuses {
  return {
    dropBonus: 0,
    coinBonus: 0,
    rareDropBonus: 0,
    explorationSpeedBonus: 0,
    doubleDropRoll: 0,
    physicalBonus: 0,
    magicBonus: 0,
    damageBonus: 0,
    critBonus: 0,
    critDamage: 0,
    damageReduction: 0,
    evasionBonus: 0,
    statusResist: 0,
    degradationResist: 0,
    accuracyBonus: 0,
    firstStrikeBonus: 0,
    healBonus: 0,
    hpRegen: 0,
    mpRegen: 0,
    hpSteal: 0,
    mpReduction: 0,
    counterRate: 0,
    bonusHits: 0,
    noDecayHits: 0,
    decayReduction: 0,
    fixedHits: 0,
    singleHitBonus: 0,
    allyAtkBonus: 0,
    allyDefense: 0,
    intimidate: 0,
    speciesKiller_humanoid: 0,
    speciesKiller_beast: 0,
    speciesKiller_undead: 0,
    speciesKiller_demon: 0,
    speciesKiller_dragon: 0,
    speciesResist_humanoid: 0,
    speciesResist_beast: 0,
    speciesResist_undead: 0,
    speciesResist_demon: 0,
    speciesResist_dragon: 0,
    degradationBonus: 0,
    allStats: 0,
    cover: 0,
    followUp: 0,
    doublecast: 0,
    perfectEvasion: 0,
    autoRevive: 0,
    mpOnKill: 0,
    lowHpBonus: 0,
    fullHpAtkBonus: 0,
    surviveLethal: 0,
    rawEffects: [],
  };
}

/**
 * エフェクトをボーナスに加算
 */
function applyEffect(bonuses: CharacterBonuses, effect: Effect): void {
  const key = effect.type as keyof CharacterBonuses;
  if (key in bonuses && typeof bonuses[key] === 'number') {
    (bonuses[key] as number) += effect.value;
  }
  bonuses.rawEffects.push(effect);
}

/**
 * エフェクト配列をボーナスに加算
 */
function applyEffects(bonuses: CharacterBonuses, effects: Effect[]): void {
  for (const effect of effects) {
    applyEffect(bonuses, effect);
  }
}

// ============================================
// キャラ入力の型（柔軟に受け入れる）
// ============================================

interface CharacterInput {
  race?: string;
  job?: string;
  raceMastery?: boolean;
  jobMastery?: boolean;
  lv3Skill?: string;
  lv5Skill?: string;
  equipmentId?: string;
  ownerId?: string;  // マルチプレイ用
}

// ============================================
// メイン計算関数
// ============================================

/**
 * キャラクター1人のすべてのボーナスを計算
 */
export function calculateCharacterBonuses(char: CharacterInput): CharacterBonuses {
  const bonuses = createEmptyBonuses();
  
  // 1. 種族パッシブ
  if (char.race && races[char.race as keyof typeof races]) {
    const raceData = races[char.race as keyof typeof races];
    for (const passive of raceData.passives || []) {
      applyEffects(bonuses, passive.effects || []);
    }
    
    // 種族マスタリー
    if (char.raceMastery && raceData.masterySkill?.type === 'passive') {
      applyEffects(bonuses, raceData.masterySkill.effects || []);
    }
  }
  
  // 2. 職業パッシブ
  if (char.job && jobs[char.job as keyof typeof jobs]) {
    const jobData = jobs[char.job as keyof typeof jobs];
    for (const passive of jobData.passives || []) {
      applyEffects(bonuses, passive.effects || []);
    }
    
    // 職業マスタリー
    if (char.jobMastery && jobData.masterySkill?.type === 'passive') {
      applyEffects(bonuses, jobData.masterySkill.effects || []);
    }
  }
  
  // 3. Lvスキル
  for (const skillId of [char.lv3Skill, char.lv5Skill]) {
    if (!skillId) continue;
    try {
      const { getLvSkill } = require('../data/lvSkills');
      const skill = getLvSkill(skillId);
      if (skill?.effects) {
        applyEffects(bonuses, skill.effects);
      }
    } catch (e) {
      // スキルデータ読み込み失敗は無視
    }
  }
  
  // 4. 装備
  if (char.equipmentId) {
    try {
      const { getEquipmentById } = require('../data/equipments');
      const equipment = getEquipmentById(char.equipmentId);
      if (equipment?.effects) {
        applyEffects(bonuses, equipment.effects);
      }
    } catch (e) {
      // 装備データ読み込み失敗は無視
    }
  }
  
  return bonuses;
}

// ============================================
// パーティ全体のボーナス計算（トレハン用）
// ============================================

/**
 * パーティ全体のトレハンボーナス
 */
export interface PartyTreasureHuntBonuses {
  dropBonus: number;
  coinBonus: number;
  rareDropBonus: number;
  explorationSpeedBonus: number;
  rollCount: number;  // 基本4 + doubleDropRoll
}

/**
 * パーティ全体のトレハンボーナスを計算
 * 
 * 重複ルール:
 * - 同じプレイヤー内の同じ効果ソースは1回だけカウント
 * - 別プレイヤーの同じ効果ソースは重複OK（マルチプレイ）
 */
export function calculatePartyTreasureHuntBonuses(
  characters: CharacterInput[]
): PartyTreasureHuntBonuses {
  // ソースID → { type → value } のマップ（重複防止）
  const appliedSources: Map<string, Map<string, number>> = new Map();
  
  for (const char of characters) {
    const ownerPrefix = char.ownerId ? `${char.ownerId}_` : '';
    
    // 種族パッシブ
    if (char.race && races[char.race as keyof typeof races]) {
      const raceData = races[char.race as keyof typeof races];
      for (const passive of raceData.passives || []) {
        const sourceId = `${ownerPrefix}race_${char.race}_${passive.name}`;
        if (!appliedSources.has(sourceId)) {
          appliedSources.set(sourceId, new Map());
        }
        for (const effect of passive.effects || []) {
          appliedSources.get(sourceId)!.set(effect.type, effect.value);
        }
      }
      
      // 種族マスタリー
      if (char.raceMastery && raceData.masterySkill?.type === 'passive') {
        const sourceId = `${ownerPrefix}race_mastery_${char.race}`;
        if (!appliedSources.has(sourceId)) {
          appliedSources.set(sourceId, new Map());
        }
        for (const effect of raceData.masterySkill.effects || []) {
          appliedSources.get(sourceId)!.set(effect.type, effect.value);
        }
      }
    }
    
    // 職業パッシブ
    if (char.job && jobs[char.job as keyof typeof jobs]) {
      const jobData = jobs[char.job as keyof typeof jobs];
      for (const passive of jobData.passives || []) {
        const sourceId = `${ownerPrefix}job_${char.job}_${passive.name}`;
        if (!appliedSources.has(sourceId)) {
          appliedSources.set(sourceId, new Map());
        }
        for (const effect of passive.effects || []) {
          appliedSources.get(sourceId)!.set(effect.type, effect.value);
        }
      }
      
      // 職業マスタリー
      if (char.jobMastery && jobData.masterySkill?.type === 'passive') {
        const sourceId = `${ownerPrefix}job_mastery_${char.job}`;
        if (!appliedSources.has(sourceId)) {
          appliedSources.set(sourceId, new Map());
        }
        for (const effect of jobData.masterySkill.effects || []) {
          appliedSources.get(sourceId)!.set(effect.type, effect.value);
        }
      }
    }
    
    // Lvスキル
    for (const skillId of [char.lv3Skill, char.lv5Skill]) {
      if (!skillId) continue;
      try {
        const { getLvSkill } = require('../data/lvSkills');
        const skill = getLvSkill(skillId);
        if (skill?.effects) {
          const sourceId = `${ownerPrefix}lvskill_${skillId}`;
          if (!appliedSources.has(sourceId)) {
            appliedSources.set(sourceId, new Map());
          }
          for (const effect of skill.effects) {
            appliedSources.get(sourceId)!.set(effect.type, effect.value);
          }
        }
      } catch (e) {}
    }
    
    // 装備
    if (char.equipmentId) {
      try {
        const { getEquipmentById } = require('../data/equipments');
        const equipment = getEquipmentById(char.equipmentId);
        if (equipment?.effects) {
          const sourceId = `${ownerPrefix}equipment_${char.equipmentId}`;
          if (!appliedSources.has(sourceId)) {
            appliedSources.set(sourceId, new Map());
          }
          for (const effect of equipment.effects) {
            appliedSources.get(sourceId)!.set(effect.type, effect.value);
          }
        }
      } catch (e) {}
    }
  }
  
  // 集計
  let dropBonus = 0;
  let coinBonus = 0;
  let rareDropBonus = 0;
  let explorationSpeedBonus = 0;
  let doubleDropRoll = 0;
  
  for (const effectMap of appliedSources.values()) {
    dropBonus += effectMap.get('dropBonus') || 0;
    coinBonus += effectMap.get('coinBonus') || 0;
    rareDropBonus += effectMap.get('rareDropBonus') || 0;
    explorationSpeedBonus += effectMap.get('explorationSpeedBonus') || 0;
    doubleDropRoll += effectMap.get('doubleDropRoll') || 0;
  }
  
  return {
    dropBonus,
    coinBonus,
    rareDropBonus,
    explorationSpeedBonus,
    rollCount: 4 + doubleDropRoll,
  };
}

// ============================================
// 便利関数
// ============================================

/**
 * ボーナスが何かあるかチェック（UI表示用）
 */
export function hasTreasureHuntBonuses(bonuses: PartyTreasureHuntBonuses): boolean {
  return bonuses.dropBonus > 0 ||
         bonuses.coinBonus > 0 ||
         bonuses.rareDropBonus > 0 ||
         bonuses.explorationSpeedBonus > 0 ||
         bonuses.rollCount > 4;
}

// ============================================
// 総合ステータス計算
// ============================================

/**
 * キャラクターの総合ステータスを計算
 * 基本ステータス + Lvボーナス + 装備ボーナス
 */
export interface TotalStats extends Stats {
  // 基本statsのフィールドを継承
}

interface CharacterForStats {
  stats: Stats;
  lv2Bonus?: string;
  lv4Bonus?: string;
  equipmentId?: string;
}

interface CharacterForTotalStats extends CharacterForStats {
  lv3Skill?: string;
  lv5Skill?: string;
}

export function calculateTotalStats(char: CharacterForTotalStats): TotalStats {
  // 基本ステータスをコピー
  const total: TotalStats = {
    hp: char.stats.hp,
    maxHp: char.stats.maxHp,
    mp: char.stats.mp,
    maxMp: char.stats.maxMp,
    atk: char.stats.atk,
    def: char.stats.def,
    agi: char.stats.agi,
    mag: char.stats.mag,
  };
  
  // Lv2ボーナスを加算
  if (char.lv2Bonus) {
    const bonus = getLvBonus(char.lv2Bonus);
    if (bonus?.statModifiers) {
      applyStatModifiers(total, bonus.statModifiers);
    }
  }
  
  // Lv4ボーナスを加算
  if (char.lv4Bonus) {
    const bonus = getLvBonus(char.lv4Bonus);
    if (bonus?.statModifiers) {
      applyStatModifiers(total, bonus.statModifiers);
    }
  }
  
  // Lvスキルのstatモディファイア（HP+100など）
  for (const skillId of [char.lv3Skill, char.lv5Skill]) {
    if (!skillId) continue;
    try {
      const { getLvSkill } = require('../data/lvSkills');
      const skill = getLvSkill(skillId);
      if (skill?.statModifiers) {
        applyStatModifiers(total, skill.statModifiers);
      }
    } catch (e) {}
  }
  
  // 装備ボーナスを加算
  if (char.equipmentId) {
    try {
      const { getEquipmentById } = require('../data/equipments');
      const equipment = getEquipmentById(char.equipmentId);
      if (equipment?.statModifiers) {
        applyStatModifiers(total, equipment.statModifiers);
      }
    } catch (e) {}
  }
  
  // hp/mpはmaxHpに連動させる（表示用）
  total.hp = total.maxHp;
  total.mp = total.maxMp;
  
  return total;
}

/**
 * ステータス修正値を適用するヘルパー
 */
function applyStatModifiers(stats: TotalStats, modifiers: Partial<Stats>): void {
  if (modifiers.maxHp) stats.maxHp += modifiers.maxHp;
  if (modifiers.maxMp) stats.maxMp += modifiers.maxMp;
  if (modifiers.atk) stats.atk += modifiers.atk;
  if (modifiers.def) stats.def += modifiers.def;
  if (modifiers.agi) stats.agi += modifiers.agi;
  if (modifiers.mag) stats.mag += modifiers.mag;
}
