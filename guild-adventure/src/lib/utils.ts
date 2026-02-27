// 共通ユーティリティ関数

import { Stats } from './types';

/**
 * ステータスオブジェクトのシャローコピー
 */
export function cloneStats(stats: Stats): Stats {
  return { ...stats };
}

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
 * ログのスタイルルール定義
 */
interface LogClassRule {
  includes?: string | string[];  // 含む文字列（複数指定でOR）
  startsWith?: string;           // 先頭一致
  className: string;             // 適用するクラス
}

const LOG_CLASS_RULES: LogClassRule[] = [
  { includes: '🔴BOSS:', className: 'text-red-500 font-bold mt-3' },
  { includes: '【遭遇', className: 'text-yellow-400 font-bold mt-3' },
  { includes: '【冒険開始】', className: 'text-cyan-400 font-bold' },
  { includes: '【味方】', className: 'text-cyan-400 text-xs font-bold mt-1' },
  { includes: '【敵】', className: 'text-rose-400 text-xs font-bold mt-1' },
  { includes: ['勝利', '踏破'], className: 'text-green-400 font-bold' },
  { includes: ['全滅', '敗北'], className: 'text-red-400 font-bold' },
  { includes: '倒した', className: 'text-green-300' },
  { includes: 'ダメージ', className: 'text-orange-300' },
  { includes: '回復', className: 'text-blue-300' },
  { includes: '会心', className: 'text-yellow-300' },
  { includes: '--- ターン', className: 'text-slate-400 text-xs mt-3 border-t border-slate-600 pt-2' },
];

const HP_STATUS_CLASS = 'text-slate-300 text-xs ml-2 bg-slate-700/30 px-2 py-0.5 rounded';
const DEFAULT_LOG_CLASS = 'text-slate-300';

/**
 * バトルログ行にTailwindクラスを返す
 */
export function getLogClassName(log: string): string {
  // 特殊ケース: インデント付きHP表示
  if (log.startsWith('  ') && log.includes('HP')) {
    return HP_STATUS_CLASS;
  }

  // ルールベースのマッチング
  for (const rule of LOG_CLASS_RULES) {
    if (rule.startsWith && log.startsWith(rule.startsWith)) {
      return rule.className;
    }
    if (rule.includes) {
      const patterns = Array.isArray(rule.includes) ? rule.includes : [rule.includes];
      if (patterns.some(p => log.includes(p))) {
        return rule.className;
      }
    }
  }

  return DEFAULT_LOG_CLASS;
}
