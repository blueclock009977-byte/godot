/**
 * ドロップボーナス計算モジュール
 * 
 * 内部で lib/character/bonuses.ts を使用して計算を一元化。
 * 既存のAPIは後方互換性のために維持。
 */

import { 
  calculatePartyTreasureHuntBonuses, 
  PartyTreasureHuntBonuses,
  hasTreasureHuntBonuses as _hasTreasureHuntBonuses,
} from '../character/bonuses';
import { percentBonus } from '../utils';

// ============================================
// 型定義（後方互換性）
// ============================================

interface CharacterWithRace {
  race?: string;
  job?: string;
  raceMastery?: boolean;
  jobMastery?: boolean;
  equipmentId?: string;
  lv3Skill?: string;
  lv5Skill?: string;
  ownerId?: string;
}

// ============================================
// パーティ全体のボーナス計算（新API）
// ============================================

/**
 * パーティ全体のトレハンボーナスを一括計算
 * これを使えば個別の関数を呼ぶ必要なし！
 */
export function getPartyTreasureHuntBonuses(
  characters: CharacterWithRace[]
): PartyTreasureHuntBonuses {
  return calculatePartyTreasureHuntBonuses(characters);
}

/**
 * トレハンボーナスがあるかチェック
 */
export function hasTreasureHuntBonuses(bonuses: PartyTreasureHuntBonuses): boolean {
  return _hasTreasureHuntBonuses(bonuses);
}

// ============================================
// 後方互換API（既存コード用）
// ============================================

/**
 * パーティ全体のドロップボーナス(%)を計算
 */
export function calculateDropBonus(characters: CharacterWithRace[]): number {
  return calculatePartyTreasureHuntBonuses(characters).dropBonus;
}

/**
 * パーティ全体のコインボーナス(%)を計算
 */
export function calculateCoinBonus(characters: CharacterWithRace[]): number {
  return calculatePartyTreasureHuntBonuses(characters).coinBonus;
}

/**
 * パーティ全体のレアドロップボーナス(%)を計算
 */
export function calculateRareDropBonus(characters: CharacterWithRace[]): number {
  return calculatePartyTreasureHuntBonuses(characters).rareDropBonus;
}

/**
 * パーティ全体の探索時間短縮ボーナス(%)を計算
 */
export function calculateExplorationSpeedBonus(characters: CharacterWithRace[]): number {
  return calculatePartyTreasureHuntBonuses(characters).explorationSpeedBonus;
}

/**
 * ドロップ抽選回数を計算（基本4回 + 追加抽選数）
 */
export function getDropRollCount(characters: CharacterWithRace[]): number {
  return calculatePartyTreasureHuntBonuses(characters).rollCount;
}

// 後方互換のため残す
export function hasDoubleDropRoll(characters: CharacterWithRace[]): boolean {
  return getDropRollCount(characters) > 4;
}

// ============================================
// ボーナス適用関数
// ============================================

/**
 * コイン獲得にボーナスを適用
 */
export function applyCoinBonus(baseCoins: number, characters: CharacterWithRace[]): number {
  const bonus = calculateCoinBonus(characters);
  return Math.floor(baseCoins * percentBonus(bonus));
}

/**
 * 探索時間に短縮ボーナスを適用
 */
export function applyExplorationSpeedBonus(
  baseDurationSeconds: number, 
  characters: CharacterWithRace[]
): number {
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

// Re-export for convenience
export type { PartyTreasureHuntBonuses };
