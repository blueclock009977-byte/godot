/**
 * 卵システム - 獲得・孵化ロジック
 */

import {
  Egg,
  EggType,
  RatingTier,
  EGG_HATCH_TIMES,
  RATING_THRESHOLDS,
} from './types';
import { MonsterInstance, MonsterSpecies } from '../types';
import { createMonsterInstance } from '../monster/create';
import { ALL_MONSTERS } from '../data/monsters';

// ============================================
// レート計算
// ============================================

/**
 * レートからレート帯を取得
 */
export function getRatingTier(rating: number): RatingTier {
  if (rating >= RATING_THRESHOLDS.advanced) return 'advanced';
  if (rating >= RATING_THRESHOLDS.intermediate) return 'intermediate';
  return 'beginner';
}

// ============================================
// 卵獲得
// ============================================

/**
 * レート帯に応じた卵タイプの抽選
 */
function rollEggType(tier: RatingTier): EggType {
  const rand = Math.random();
  
  switch (tier) {
    case 'beginner':
      // 早熟卵のみ
      return 'early';
    
    case 'intermediate':
      // 70% 早熟、30% 普通
      return rand < 0.7 ? 'early' : 'normal';
    
    case 'advanced':
      // 50% 早熟、35% 普通、15% 晩成
      if (rand < 0.5) return 'early';
      if (rand < 0.85) return 'normal';
      return 'late';
  }
}

/**
 * 卵を生成（バトル勝利時に呼ぶ）
 * @param rating 現在のレート
 * @param existingEgg 既存の卵（あれば孵化時間短縮）
 * @returns 新しい卵 or 孵化短縮された既存卵
 */
export function obtainEgg(rating: number, existingEgg: Egg | null): Egg {
  const tier = getRatingTier(rating);
  const now = Date.now();
  
  // 既に卵を持っている場合 → 孵化時間を25%短縮
  if (existingEgg && !existingEgg.isHatched) {
    const remaining = existingEgg.hatchTime - now;
    if (remaining > 0) {
      const reduction = remaining * 0.25;
      return {
        ...existingEgg,
        hatchTime: existingEgg.hatchTime - reduction,
      };
    }
    // 既に孵化可能なら新しい卵に置き換え
  }
  
  // 新しい卵を生成
  const eggType = rollEggType(tier);
  const hatchDuration = EGG_HATCH_TIMES[eggType];
  
  return {
    id: generateEggId(),
    type: eggType,
    obtainedAt: now,
    hatchTime: now + hatchDuration,
    isHatched: false,
  };
}

/**
 * ユニークな卵IDを生成
 */
function generateEggId(): string {
  return `egg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================
// 卵孵化
// ============================================

/**
 * 卵が孵化可能か確認
 */
export function canHatch(egg: Egg): boolean {
  return !egg.isHatched && Date.now() >= egg.hatchTime;
}

/**
 * 孵化までの残り時間（ミリ秒）
 */
export function getTimeUntilHatch(egg: Egg): number {
  if (egg.isHatched) return 0;
  return Math.max(0, egg.hatchTime - Date.now());
}

/**
 * 孵化可能なモンスター種族を取得
 */
function getHatchableMonsters(eggType: EggType): MonsterSpecies[] {
  // 御三家（isStarter）は卵からは出ない
  const nonStarterMonsters = ALL_MONSTERS.filter(m => !m.isStarter);
  
  switch (eggType) {
    case 'early':
      // 早熟: 450族 (statTier === 'early')
      return nonStarterMonsters.filter(m => m.statTier === 'early');
    case 'normal':
      // 普通: 490族 (statTier === 'normal')
      return nonStarterMonsters.filter(m => m.statTier === 'normal');
    case 'late':
      // 晩成: 530族 (statTier === 'late')
      return nonStarterMonsters.filter(m => m.statTier === 'late');
  }
}

/**
 * 卵を孵化させてモンスターを生成
 * @param egg 孵化する卵
 * @returns 生成されたモンスターインスタンス（まだ孵化できない場合はnull）
 */
export function hatchEgg(egg: Egg): MonsterInstance | null {
  if (!canHatch(egg)) {
    return null;
  }
  
  // 卵タイプに応じたモンスター候補を取得
  const candidates = getHatchableMonsters(egg.type);
  
  if (candidates.length === 0) {
    console.error(`No monsters available for egg type: ${egg.type}`);
    return null;
  }
  
  // ランダムにモンスター種族を選択
  const species = candidates[Math.floor(Math.random() * candidates.length)];
  
  // モンスターインスタンスを生成（技・特性ランダム）
  const instance = createMonsterInstance(species);
  
  // 卵を孵化済みにマーク
  egg.isHatched = true;
  
  return instance;
}

// ============================================
// ユーティリティ
// ============================================

/**
 * 卵タイプの表示名
 */
export function getEggTypeName(type: EggType): string {
  switch (type) {
    case 'early': return '早熟卵';
    case 'normal': return '普通卵';
    case 'late': return '晩成卵';
  }
}

/**
 * 孵化残り時間を読みやすい形式で取得
 */
export function formatTimeUntilHatch(egg: Egg): string {
  const remaining = getTimeUntilHatch(egg);
  
  if (remaining <= 0) return '孵化可能！';
  
  const seconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `残り ${hours}時間${minutes % 60}分`;
  }
  if (minutes > 0) {
    return `残り ${minutes}分${seconds % 60}秒`;
  }
  return `残り ${seconds}秒`;
}
