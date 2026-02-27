// 共通ユーティリティ関数

/**
 * 指定範囲のランダムな数値を返す
 * @param min 最小値（含む）
 * @param max 最大値（含む）
 */
export function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * 配列からランダムに1つ選ぶ
 */
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
