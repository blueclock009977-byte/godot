/**
 * ドロップボーナス計算の共通モジュール
 * 書・装備・その他すべてのドロップで使用
 * 
 * 重複ルール：
 * - 同じプレイヤー内の同じ効果ソースは1回だけカウント
 *   （人間4人いても「幸運+40%」は1回）
 * - 別プレイヤーの同じ効果ソースは重複OK
 *   （マルチで俺と他の人が人間出してたら両方有効）
 */

import { races } from '../data/races';
import { percentBonus } from '../utils';

interface CharacterWithRace {
  race?: string;
  job?: string;
  equipmentId?: string;
  lv3Skill?: string;
  lv5Skill?: string;
  ownerId?: string;  // プレイヤー識別子（マルチ用）
}

/**
 * パーティ全体のドロップボーナス(%)を計算
 * - 種族パッシブ（人間など）
 * - Lvスキル
 * - 装備効果
 * ※同じプレイヤー内の同じ効果ソースは重複しない
 * ※別プレイヤーの同じスキルは重複OK
 */
export function calculateDropBonus(characters: CharacterWithRace[]): number {
  // 効果ソースID → ボーナス値（重複防止用）
  const appliedBonuses: Map<string, number> = new Map();
  
  for (const char of characters) {
    const ownerPrefix = char.ownerId ? `${char.ownerId}_` : '';
    
    // 種族パッシブからのドロップボーナス
    if (char.race && races[char.race as keyof typeof races]) {
      const raceData = races[char.race as keyof typeof races];
      for (const passive of raceData.passives || []) {
        for (const effect of passive.effects || []) {
          if (effect.type === 'dropBonus') {
            const sourceId = `${ownerPrefix}race_${char.race}_${passive.name}`;
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
              const sourceId = `${ownerPrefix}lvskill_${skillId}`;
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
    
    // 装備からのドロップボーナス
    if (char.equipmentId) {
      try {
        const { getEquipmentById } = require('../data/equipments');
        const equipment = getEquipmentById(char.equipmentId);
        if (equipment?.effects) {
          for (const effect of equipment.effects) {
            if (effect.type === 'dropBonus') {
              const sourceId = `${ownerPrefix}equipment_${char.equipmentId}`;
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
 * ※同じプレイヤー内の同じ効果ソースは重複しない
 * ※別プレイヤーの同じスキルは重複OK
 */
export function calculateCoinBonus(characters: CharacterWithRace[]): number {
  const appliedBonuses: Map<string, number> = new Map();
  
  for (const char of characters) {
    const ownerPrefix = char.ownerId ? `${char.ownerId}_` : '';
    
    // 種族パッシブからのコインボーナス
    if (char.race) {
      try {
        const { races } = require('../data/races');
        if (races[char.race]) {
          const raceData = races[char.race];
          for (const passive of raceData.passives || []) {
            for (const effect of passive.effects || []) {
              if (effect.type === 'coinBonus') {
                const sourceId = `${ownerPrefix}race_${char.race}_${passive.name}`;
                if (!appliedBonuses.has(sourceId)) {
                  appliedBonuses.set(sourceId, effect.value);
                }
              }
            }
          }
        }
      } catch (e) {}
    }
    
    // Lvスキルからのコインボーナス
    for (const skillId of [char.lv3Skill, char.lv5Skill]) {
      if (!skillId) continue;
      try {
        const { getLvSkill } = require('../data/lvSkills');
        const skill = getLvSkill(skillId);
        if (skill?.effects) {
          for (const effect of skill.effects) {
            if (effect.type === 'coinBonus') {
              const sourceId = `${ownerPrefix}lvskill_${skillId}`;
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
              const sourceId = `${ownerPrefix}equipment_${char.equipmentId}`;
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
 * ドロップ抽選回数を計算（基本4回 + 追加抽選数）
 * ※同じプレイヤー内の同じ効果ソースは重複しない
 * ※別プレイヤーの同じスキルは重複OK
 */
export function getDropRollCount(characters: CharacterWithRace[]): number {
  const appliedSources: Set<string> = new Set();
  let extraRolls = 0;
  
  for (const char of characters) {
    const ownerPrefix = char.ownerId ? `${char.ownerId}_` : '';
    
    // LvスキルからのdoubleDropRoll
    for (const skillId of [char.lv3Skill, char.lv5Skill]) {
      if (!skillId) continue;
      try {
        const { getLvSkill } = require('../data/lvSkills');
        const skill = getLvSkill(skillId);
        if (skill?.effects) {
          for (const effect of skill.effects) {
            if (effect.type === 'doubleDropRoll' && effect.value > 0) {
              const sourceId = `${ownerPrefix}lvskill_${skillId}`;
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
              const sourceId = `${ownerPrefix}equipment_${char.equipmentId}`;
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
 * レア装備ドロップボーナス(%)を計算
 * ※同じプレイヤー内の同じ効果ソースは重複しない
 * ※別プレイヤーの同じスキルは重複OK
 */
export function calculateRareDropBonus(characters: CharacterWithRace[]): number {
  const appliedBonuses: Map<string, number> = new Map();
  
  for (const char of characters) {
    const ownerPrefix = char.ownerId ? `${char.ownerId}_` : '';
    
    // 種族パッシブからのボーナス
    if (char.race) {
      try {
        const { races } = require('../data/races');
        if (races[char.race]) {
          const raceData = races[char.race];
          for (const passive of raceData.passives || []) {
            for (const effect of passive.effects || []) {
              if (effect.type === 'rareDropBonus') {
                const sourceId = `${ownerPrefix}race_${char.race}_${passive.name}`;
                if (!appliedBonuses.has(sourceId)) {
                  appliedBonuses.set(sourceId, effect.value);
                }
              }
            }
          }
        }
      } catch (e) {}
    }
    
    // 職業パッシブからのボーナス
    if (char.job) {
      try {
        const { jobs } = require('../data/jobs');
        if (jobs[char.job]) {
          const jobData = jobs[char.job];
          for (const passive of jobData.passives || []) {
            for (const effect of passive.effects || []) {
              if (effect.type === 'rareDropBonus') {
                const sourceId = `${ownerPrefix}job_${char.job}_${passive.name}`;
                if (!appliedBonuses.has(sourceId)) {
                  appliedBonuses.set(sourceId, effect.value);
                }
              }
            }
          }
        }
      } catch (e) {}
    }
    
    // 装備からのボーナス
    if (char.equipmentId) {
      try {
        const { getEquipmentById } = require('../data/equipments');
        const equipment = getEquipmentById(char.equipmentId);
        if (equipment?.effects) {
          for (const effect of equipment.effects) {
            if (effect.type === 'rareDropBonus') {
              const sourceId = `${ownerPrefix}equipment_${char.equipmentId}`;
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
 * 探索時間短縮ボーナス(%)を計算
 * ※同じプレイヤー内の同じ効果ソースは重複しない
 * ※別プレイヤーの同じスキルは重複OK
 */
export function calculateExplorationSpeedBonus(characters: CharacterWithRace[]): number {
  const appliedBonuses: Map<string, number> = new Map();
  
  for (const char of characters) {
    const ownerPrefix = char.ownerId ? `${char.ownerId}_` : '';
    
    // 種族パッシブからのボーナス
    if (char.race) {
      try {
        const { races } = require('../data/races');
        if (races[char.race]) {
          const raceData = races[char.race];
          for (const passive of raceData.passives || []) {
            for (const effect of passive.effects || []) {
              if (effect.type === 'explorationSpeedBonus') {
                const sourceId = `${ownerPrefix}race_${char.race}_${passive.name}`;
                if (!appliedBonuses.has(sourceId)) {
                  appliedBonuses.set(sourceId, effect.value);
                }
              }
            }
          }
        }
      } catch (e) {}
    }
    
    // 職業パッシブからのボーナス
    if (char.job) {
      try {
        const { jobs } = require('../data/jobs');
        if (jobs[char.job]) {
          const jobData = jobs[char.job];
          for (const passive of jobData.passives || []) {
            for (const effect of passive.effects || []) {
              if (effect.type === 'explorationSpeedBonus') {
                const sourceId = `${ownerPrefix}job_${char.job}_${passive.name}`;
                if (!appliedBonuses.has(sourceId)) {
                  appliedBonuses.set(sourceId, effect.value);
                }
              }
            }
          }
        }
      } catch (e) {}
    }
    
    // Lvスキルからのボーナス
    for (const skillId of [char.lv3Skill, char.lv5Skill]) {
      if (!skillId) continue;
      try {
        const { getLvSkill } = require('../data/lvSkills');
        const skill = getLvSkill(skillId);
        if (skill?.effects) {
          for (const effect of skill.effects) {
            if (effect.type === 'explorationSpeedBonus') {
              const sourceId = `${ownerPrefix}lvskill_${skillId}`;
              if (!appliedBonuses.has(sourceId)) {
                appliedBonuses.set(sourceId, effect.value);
              }
            }
          }
        }
      } catch (e) {}
    }
    
    // 装備からのボーナス
    if (char.equipmentId) {
      try {
        const { getEquipmentById } = require('../data/equipments');
        const equipment = getEquipmentById(char.equipmentId);
        if (equipment?.effects) {
          for (const effect of equipment.effects) {
            if (effect.type === 'explorationSpeedBonus') {
              const sourceId = `${ownerPrefix}equipment_${char.equipmentId}`;
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
 * 探索時間に短縮ボーナスを適用
 */
export function applyExplorationSpeedBonus(baseDurationSeconds: number, characters: CharacterWithRace[]): number {
  const bonus = calculateExplorationSpeedBonus(characters);
  // ボーナス%分だけ時間短縮（最低10%の時間は残す）
  const reduction = Math.min(bonus, 90); // 最大90%短縮
  return Math.floor(baseDurationSeconds * (100 - reduction) / 100);
}

/**
 * ドロップ率にボーナスを適用
 */
export function applyDropBonus(baseRate: number, characters: CharacterWithRace[]): number {
  const bonus = calculateDropBonus(characters);
  return baseRate * percentBonus(bonus);
}
