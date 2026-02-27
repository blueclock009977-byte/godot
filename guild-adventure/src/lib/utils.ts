// 共通ユーティリティ関数

import { Stats } from './types';

/**
 * IDで配列から要素を検索する汎用ヘルパー
 * @param items id プロパティを持つオブジェクトの配列
 * @param id 検索するID
 * @returns 見つかった要素、または undefined
 */
export function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

/**
 * 日時を「M/D H:MM」形式にフォーマット
 * @param timestamp Unix timestamp (ミリ秒) または Date
 * @returns "2/27 14:05" のような文字列
 * @example formatDateTime(Date.now()) => "2/27 14:05"
 */
export function formatDateTime(timestamp: number | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

/**
 * 秒数を日本語の時間表記に変換
 * @param seconds 秒数
 * @param detailed true: "1分30秒" / false: "1分" (概算表示)
 */
export function formatDuration(seconds: number, detailed: boolean = false): string {
  if (seconds < 60) return `${seconds}秒`;
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (!detailed) {
    // 概算表示: "1分" or "1時間"
    if (hours > 0) return `${hours}時間`;
    return `${mins}分`;
  }
  
  // 詳細表示: "1分30秒" or "1時間1分"
  if (hours > 0) {
    return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
  }
  return secs > 0 ? `${mins}分${secs}秒` : `${mins}分`;
}

/**
 * ステータスオブジェクトのシャローコピー
 */
export function cloneStats(stats: Stats): Stats {
  return { ...stats };
}

/**
 * パーセントボーナスを乗算係数に変換
 * @param percent ボーナス値（%）
 * @returns 1 + percent/100
 * @example percentBonus(50) => 1.5
 */
export function percentBonus(percent: number): number {
  return 1 + percent / 100;
}

/**
 * パーセント軽減を乗算係数に変換
 * @param percent 軽減値（%）
 * @returns 1 - percent/100
 * @example percentReduce(30) => 0.7
 */
export function percentReduce(percent: number): number {
  return 1 - percent / 100;
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
 * HP > 0 のユニットのみをフィルタリング（生存ユニット取得）
 */
export function getAliveUnits<T extends { stats: { hp: number } }>(units: T[]): T[] {
  return units.filter(u => u.stats.hp > 0);
}

/**
 * 実際のMP消費を計算（MP軽減適用後、最低1）
 */
export function calculateActualMpCost(baseCost: number, mpReduction: number): number {
  return Math.max(1, Math.floor(baseCost * percentReduce(mpReduction)));
}

/**
 * 基準値にパーセント割合を適用して切り捨て
 * @param base 基準値
 * @param percent パーセント値（0-100）
 * @returns Math.floor(base * percent / 100)
 * @example applyPercent(100, 30) => 30
 */
export function applyPercent(base: number, percent: number): number {
  return Math.floor(base * percent / 100);
}

/**
 * 値を指定範囲に制限する（クランプ）
 * @param value 対象の値
 * @param min 最小値
 * @param max 最大値
 * @returns min <= value <= max に制限された値
 * @example clamp(150, 30, 99) => 99
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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
 * モンスター種族の日本語表示名
 */
export const speciesNames: Record<string, string> = {
  humanoid: '🧑 人型',
  beast: '🐺 獣',
  undead: '💀 不死',
  demon: '😈 悪魔',
  dragon: '🐉 竜',
};

/**
 * 属性の日本語表示名
 */
export const elementNames: Record<string, string> = {
  none: '無',
  fire: '🔥 火',
  water: '💧 水',
  wind: '🌪️ 風',
  earth: '🪨 地',
};

/**
 * IDから省略表示名を取得する汎用ヘルパー
 * @param id 検索するID
 * @param mapping IDと省略名のマッピング
 * @returns 省略名、またはIDの先頭1文字
 */
function getShortName(id: string, mapping: Record<string, string>): string {
  return mapping[id] || id.charAt(0);
}

/** 種族の省略名マッピング */
const RACE_SHORT_NAMES: Record<string, string> = {
  human: '人',
  elf: 'エ',
  dwarf: 'ド',
  halfling: 'ハ',
  orc: 'オ',
  lizardman: 'リ',
  fairy: 'フ',
  undead: 'ア',
  goblin: 'ゴ',
  dragonewt: '竜',
  angel: '天',
  demon: '悪',
};

/** 職業の省略名マッピング */
const JOB_SHORT_NAMES: Record<string, string> = {
  warrior: '戦',
  mage: '魔',
  priest: '司',
  thief: '盗',
  knight: '騎',
  hunter: '狩',
  ninja: '忍',
  sage: '賢',
  berserker: '狂',
  paladin: '聖',
  necromancer: '死',
  monk: '拳',
  ranger: '野',
  samurai: '侍',
  witch: '魔女',
  bard: '詩',
};

/**
 * 種族IDから省略表示名（1文字）を取得
 * page.tsxでのキャラクター一覧表示に使用
 */
export function getRaceShortName(raceId: string): string {
  return getShortName(raceId, RACE_SHORT_NAMES);
}

/**
 * 職業IDから省略表示名（1-2文字）を取得
 * page.tsxでのキャラクター一覧表示に使用
 */
export function getJobShortName(jobId: string): string {
  return getShortName(jobId, JOB_SHORT_NAMES);
}

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
