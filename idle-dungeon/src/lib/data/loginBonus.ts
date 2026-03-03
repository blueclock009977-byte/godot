// デイリーログインボーナス定義

export interface LoginBonusReward {
  day: number;
  coins?: number;
  potions?: number;
  exp?: number;
  special?: string;  // 特別報酬の説明
}

// 7日サイクルのログインボーナス
export const LOGIN_BONUS_REWARDS: LoginBonusReward[] = [
  { day: 1, coins: 100 },
  { day: 2, coins: 150, potions: 1 },
  { day: 3, coins: 200, exp: 50 },
  { day: 4, coins: 250, potions: 1 },
  { day: 5, coins: 300, exp: 100 },
  { day: 6, coins: 400, potions: 2 },
  { day: 7, coins: 500, potions: 3, exp: 200, special: '🎉 週間ボーナス！' },
];

// 今日の日付文字列を取得（YYYY-MM-DD）
export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

// 昨日の日付文字列を取得
export function getYesterdayString(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toISOString().slice(0, 10);
}

// 今日受け取れるボーナスを計算
export function getTodayBonus(consecutiveDays: number): LoginBonusReward {
  const dayIndex = consecutiveDays % 7;  // 0-6
  return LOGIN_BONUS_REWARDS[dayIndex];
}

// 連続ログイン判定
export function isConsecutiveLogin(lastClaimDate: string | undefined): boolean {
  if (!lastClaimDate) return false;
  return lastClaimDate === getYesterdayString();
}

// 今日既に受け取り済みか
export function hasClaimedToday(lastClaimDate: string | undefined): boolean {
  if (!lastClaimDate) return false;
  return lastClaimDate === getTodayString();
}
