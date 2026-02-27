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

/**
 * バトルログ行にTailwindクラスを返す
 */
export function getLogClassName(log: string): string {
  if (log.includes('🔴BOSS:')) return 'text-red-500 font-bold mt-3';
  if (log.includes('【遭遇')) return 'text-yellow-400 font-bold mt-3';
  if (log.includes('【冒険開始】')) return 'text-cyan-400 font-bold';
  if (log.includes('【味方】')) return 'text-cyan-400 text-xs font-bold mt-1';
  if (log.includes('【敵】')) return 'text-rose-400 text-xs font-bold mt-1';
  if (log.startsWith('  ') && log.includes('HP')) return 'text-slate-300 text-xs ml-2 bg-slate-700/30 px-2 py-0.5 rounded';
  if (log.includes('勝利') || log.includes('踏破')) return 'text-green-400 font-bold';
  if (log.includes('全滅') || log.includes('敗北')) return 'text-red-400 font-bold';
  if (log.includes('倒した')) return 'text-green-300';
  if (log.includes('ダメージ')) return 'text-orange-300';
  if (log.includes('回復')) return 'text-blue-300';
  if (log.includes('会心')) return 'text-yellow-300';
  if (log.includes('--- ターン')) return 'text-slate-400 text-xs mt-3 border-t border-slate-600 pt-2';
  return 'text-slate-300';
}
