// ウィークリーチャレンジ定義
import { WeeklyChallengeEntry, WeeklyChallengeProgress } from '../types';

export interface WeeklyChallengeTemplate {
  id: string;
  type: WeeklyChallengeEntry['type'];
  name: string;
  description: string;
  target: number;
  reward: { coins?: number; exp?: number };
}

// 毎週のチャレンジテンプレート
export const WEEKLY_CHALLENGE_TEMPLATES: WeeklyChallengeTemplate[] = [
  {
    id: 'boss_kill_10',
    type: 'boss_kill',
    name: 'ボスハンター',
    description: 'ボスを10体撃破',
    target: 10,
    reward: { coins: 500, exp: 200 },
  },
  {
    id: 'floor_clear_50',
    type: 'floor_clear',
    name: 'フロアクリーナー',
    description: '50フロアをクリア',
    target: 50,
    reward: { coins: 300, exp: 150 },
  },
  {
    id: 'enemy_kill_500',
    type: 'enemy_kill',
    name: 'モンスタースレイヤー',
    description: '敵を500体撃破',
    target: 500,
    reward: { coins: 400, exp: 250 },
  },
  {
    id: 'coins_earn_5000',
    type: 'coins_earn',
    name: 'ゴールドコレクター',
    description: '5000コインを獲得',
    target: 5000,
    reward: { coins: 250, exp: 100 },
  },
  {
    id: 'level_up_5',
    type: 'level_up',
    name: '成長の証',
    description: '5レベルアップ',
    target: 5,
    reward: { coins: 600, exp: 300 },
  },
];

// 週の開始日（月曜日）を取得（YYYY-MM-DD）
export function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // 月曜を基準に
  now.setDate(now.getDate() - diff);
  return now.toISOString().slice(0, 10);
}

// 週が変わったか判定
export function isNewWeek(weekStartDate: string | undefined): boolean {
  if (!weekStartDate) return true;
  return weekStartDate !== getWeekStartDate();
}

// 新しい週のチャレンジを生成
export function generateWeeklyChallenges(): WeeklyChallengeEntry[] {
  return WEEKLY_CHALLENGE_TEMPLATES.map(template => ({
    id: template.id,
    type: template.type,
    target: template.target,
    current: 0,
    reward: template.reward,
    claimed: false,
  }));
}

// チャレンジの進捗を更新
export function updateChallengeProgress(
  challenges: WeeklyChallengeEntry[],
  type: WeeklyChallengeEntry['type'],
  amount: number
): WeeklyChallengeEntry[] {
  return challenges.map(c => {
    if (c.type === type && !c.claimed) {
      return {
        ...c,
        current: Math.min(c.target, c.current + amount),
      };
    }
    return c;
  });
}

// チャレンジが完了しているか
export function isChallengeComplete(challenge: WeeklyChallengeEntry): boolean {
  return challenge.current >= challenge.target;
}

// テンプレートからチャレンジ情報を取得
export function getChallengeTemplate(id: string): WeeklyChallengeTemplate | undefined {
  return WEEKLY_CHALLENGE_TEMPLATES.find(t => t.id === id);
}

// 週の残り時間を計算（秒）
export function getWeekRemainingSeconds(): number {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  
  return Math.max(0, Math.floor((nextMonday.getTime() - now.getTime()) / 1000));
}

// 残り時間をフォーマット
export function formatRemainingTime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  
  if (days > 0) {
    return `${days}日${hours}時間`;
  }
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}時間${minutes}分`;
}
