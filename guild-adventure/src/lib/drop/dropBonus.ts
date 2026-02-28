/**
 * ドロップボーナス計算の共通モジュール
 * 書・装備・その他すべてのドロップで使用
 * 
 * 重複ルール：同じ効果ソースは1回だけカウント
 * - 人間4人いても「幸運+40%」は1回
 * - 人間の「幸運」とシーフLv3の「宝探し」は別々にカウント
 */

import { races } from '../data/races';

interface CharacterWithRace {
  race?: string;
  equipmentId?: string;
  lv3Skill?: string;
  lv5Skill?: string;
}

/**
 * パーティ全体のドロップボーナス(%)を計算
 * - 種族パッシブ（人間など）
 * - Lvスキル
 * - 装備効果
 * ※同じ効果ソースは重複しない
 */
export function calculateDropBonus(characters: CharacterWithRace[]): number {
  // 効果ソースID → ボーナス値（重複防止用）
  const appliedBonuses: Map<string, number> = new Map();
  
  for (const char of characters) {
    // 種族パッシブからのドロップボーナス
    if (char.race && races[char.race as keyof typeof races]) {
      const raceData = races[char.race as keyof typeof races];
      for (const passive of raceData.passives || []) {
        for (const effect of passive.effects || []) {
          if (effect.type === 'dropBonus') {
            const sourceId = `race_${char.race}_${passive.name}`;
            if (!appliedBonuses.has(sourceId)) {
              appliedBonuses.set(sourceId, effect.value);
            }
          }
        }
      }
    }
    
    // Lvスキルからのドロップボーナス
    for (const skillId of [char.lv3Skill, char.lv5Skill]) {
      if (!skillId) continue;
      try {
        const { getLvSkill } = require('../data/lvSkills');
        const skill = getLvSkill(skillId);
        if (skill?.effects) {
          for (const effect of skill.effects) {
            if (effect.type === 'dropBonus') {
              const sourceId = `lvskill_${skillId}`;
              if (!appliedBonuses.has(sourceId)) {
                appliedBonuses.set(sourceId, effect.value);
              }
            }
          }
        }
      } catch (e) {
        // スキルデータ読み込み失敗は無視
      }
    }
    
    // 装備からのドロップボーナス（装備は各キャラ1個なので自然に重複しない）
    if (char.equipmentId) {
      try {
        const { getEquipmentById } = require('../data/equipments');
        const equipment = getEquipmentById(char.equipmentId);
        if (equipment?.effects) {
          for (const effect of equipment.effects) {
            if (effect.type === 'dropBonus') {
              const sourceId = `equipment_${char.equipmentId}`;
              if (!appliedBonuses.has(sourceId)) {
                appliedBonuses.set(sourceId, effect.value);
              }
            }
          }
        }
      } catch (e) {
        // 装備データ読み込み失敗は無視
      }
    }
  }
  
  // 全ボーナスを合計
  let bonus = 0;
  for (const value of appliedBonuses.values()) {
    bonus += value;
  }
  
  return bonus;
}

/**
 * パーティ全体のコインボーナス(%)を計算
 * ※同じ効果ソースは重複しない
 */
export function calculateCoinBonus(characters: CharacterWithRace[]): number {
  const appliedBonuses: Map<string, number> = new Map();
  
  for (const char of characters) {
    // Lvスキルからのコインボーナス
    for (const skillId of [char.lv3Skill, char.lv5Skill]) {
      if (!skillId) continue;
      try {
        const { getLvSkill } = require('../data/lvSkills');
        const skill = getLvSkill(skillId);
        if (skill?.effects) {
          for (const effect of skill.effects) {
            if (effect.type === 'coinBonus') {
              const sourceId = `lvskill_${skillId}`;
              if (!appliedBonuses.has(sourceId)) {
                appliedBonuses.set(sourceId, effect.value);
              }
            }
          }
        }
      } catch (e) {}
    }
    
    // 装備からのコインボーナス
    if (char.equipmentId) {
      try {
        const { getEquipmentById } = require('../data/equipments');
        const equipment = getEquipmentById(char.equipmentId);
        if (equipment?.effects) {
          for (const effect of equipment.effects) {
            if (effect.type === 'coinBonus') {
              const sourceId = `equipment_${char.equipmentId}`;
              if (!appliedBonuses.has(sourceId)) {
                appliedBonuses.set(sourceId, effect.value);
              }
            }
          }
        }
      } catch (e) {}
    }
  }
  
  let bonus = 0;
  for (const value of appliedBonuses.values()) {
    bonus += value;
  }
  return bonus;
}

/**
 * ドロップ抽選回数を計算（1 + 追加抽選数）
 * ※同じ効果ソースは重複しない
 * 例: 人間Lv5 + 四葉のクローバー = 1 + 1 + 1 = 3回
 */
export function getDropRollCount(characters: CharacterWithRace[]): number {
  const appliedSources: Set<string> = new Set();
  let extraRolls = 0;
  
  for (const char of characters) {
    // LvスキルからのdoubleDropRoll
    for (const skillId of [char.lv3Skill, char.lv5Skill]) {
      if (!skillId) continue;
      try {
        const { getLvSkill } = require('../data/lvSkills');
        const skill = getLvSkill(skillId);
        if (skill?.effects) {
          for (const effect of skill.effects) {
            if (effect.type === 'doubleDropRoll' && effect.value > 0) {
              const sourceId = `lvskill_${skillId}`;
              if (!appliedSources.has(sourceId)) {
                appliedSources.add(sourceId);
                extraRolls += effect.value;
              }
            }
          }
        }
      } catch (e) {}
    }
    
    // 装備からのdoubleDropRoll
    if (char.equipmentId) {
      try {
        const { getEquipmentById } = require('../data/equipments');
        const equipment = getEquipmentById(char.equipmentId);
        if (equipment?.effects) {
          for (const effect of equipment.effects) {
            if (effect.type === 'doubleDropRoll' && effect.value > 0) {
              const sourceId = `equipment_${char.equipmentId}`;
              if (!appliedSources.has(sourceId)) {
                appliedSources.add(sourceId);
                extraRolls += effect.value;
              }
            }
          }
        }
      } catch (e) {}
    }
  }
  
  return 4 + extraRolls; // 基本4回 + 追加抽選
}

// 後方互換のため残す
export function hasDoubleDropRoll(characters: CharacterWithRace[]): boolean {
  return getDropRollCount(characters) > 1;
}

/**
 * コイン獲得にボーナスを適用
 */
export function applyCoinBonus(baseCoins: number, characters: CharacterWithRace[]): number {
  const bonus = calculateCoinBonus(characters);
  return Math.floor(baseCoins * percentBonus(bonus));
}

/**
 * %ボーナスを倍率に変換
 * 例: 40% → 1.4
 */
export function percentBonus(percent: number): number {
  return 1 + percent / 100;
}

/**
 * ドロップ率にボーナスを適用
 */
export function applyDropBonus(baseRate: number, characters: CharacterWithRace[]): number {
  const bonus = calculateDropBonus(characters);
  return baseRate * percentBonus(bonus);
}
