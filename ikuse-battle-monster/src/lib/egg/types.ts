/**
 * 卵システムの型定義
 */

/** 卵の種類（レート帯で出現が変わる） */
export type EggType = 'early' | 'normal' | 'late';
// early: 早熟卵 (450族) - 孵化が早い
// normal: 普通卵 (490族) - 普通
// late: 晩成卵 (530族) - 孵化が遅い

/** 卵データ */
export interface Egg {
  id: string;
  type: EggType;
  obtainedAt: number; // timestamp
  hatchTime: number; // 孵化完了時刻 (timestamp)
  isHatched: boolean;
}

/** レート帯 */
export type RatingTier = 'beginner' | 'intermediate' | 'advanced';
// beginner: ~1499 (早熟卵のみ)
// intermediate: 1500~1999 (普通卵も出る)
// advanced: 2000~ (晩成卵も出る)

/** 卵の孵化時間（ミリ秒） */
export const EGG_HATCH_TIMES: Record<EggType, number> = {
  early: 5 * 60 * 1000,     // 5分（デバッグ用に短く。本番は1時間など）
  normal: 15 * 60 * 1000,   // 15分
  late: 30 * 60 * 1000,     // 30分
};

/** レート帯の閾値 */
export const RATING_THRESHOLDS = {
  intermediate: 1500,
  advanced: 2000,
};

/** 初期レート */
export const INITIAL_RATING = 1000;
