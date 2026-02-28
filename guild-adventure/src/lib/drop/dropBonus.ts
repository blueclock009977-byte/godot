/**
 * ドロップボーナス計算の共通モジュール
 * 書・装備・その他すべてのドロップで使用
 */

import { races } from '../data/races';

interface CharacterWithRace {
  race?: string;
  equipmentId?: string;
}

/**
 * パーティ全体のドロップボーナス(%)を計算
 * - 種族パッシブ（人間など）
 * - 装備効果
 */
export function calculateDropBonus(characters: CharacterWithRace[]): number {
  let bonus = 0;
  
  for (const char of characters) {
    // 種族パッシブからのドロップボーナス
    if (char.race && races[char.race as keyof typeof races]) {
      const raceData = races[char.race as keyof typeof races];
      for (const passive of raceData.passives || []) {
        for (const effect of passive.effects || []) {
          if (effect.type === 'dropBonus') {
            bonus += effect.value;
          }
        }
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
              bonus += effect.value;
            }
          }
        }
      } catch (e) {
        // 装備データ読み込み失敗は無視
      }
    }
  }
  
  return bonus;
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
