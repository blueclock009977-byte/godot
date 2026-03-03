// 実績マスターデータ
import { Achievement, Statistics, UserData } from '@/lib/types';

export const ACHIEVEMENTS: Achievement[] = [
  // 撃破系
  {
    id: 'first_kill',
    name: '初めての勝利',
    description: '敵を1体倒す',
    icon: '⚔️',
    condition: (stats) => stats.totalKills >= 1,
    reward: { coins: 50 },
  },
  {
    id: 'kill_10',
    name: '見習い冒険者',
    description: '敵を10体倒す',
    icon: '🗡️',
    condition: (stats) => stats.totalKills >= 10,
    reward: { coins: 100 },
  },
  {
    id: 'kill_100',
    name: '熟練の戦士',
    description: '敵を100体倒す',
    icon: '⚔️',
    condition: (stats) => stats.totalKills >= 100,
    reward: { coins: 500, exp: 100 },
  },
  {
    id: 'kill_500',
    name: 'モンスターハンター',
    description: '敵を500体倒す',
    icon: '🏹',
    condition: (stats) => stats.totalKills >= 500,
    reward: { coins: 1000, exp: 300 },
  },
  {
    id: 'kill_1000',
    name: '伝説の狩人',
    description: '敵を1000体倒す',
    icon: '🏆',
    condition: (stats) => stats.totalKills >= 1000,
    reward: { coins: 2000, exp: 500 },
  },
  
  // ボス撃破系
  {
    id: 'first_boss',
    name: '初ボス撃破',
    description: 'ボスを1体倒す',
    icon: '👑',
    condition: (stats) => stats.totalBossKills >= 1,
    reward: { coins: 200 },
  },
  {
    id: 'boss_5',
    name: 'ボスキラー',
    description: 'ボスを5体倒す',
    icon: '👑',
    condition: (stats) => stats.totalBossKills >= 5,
    reward: { coins: 500, exp: 200 },
  },
  {
    id: 'boss_10',
    name: 'ボスハンター',
    description: 'ボスを10体倒す',
    icon: '🎖️',
    condition: (stats) => stats.totalBossKills >= 10,
    reward: { coins: 1000, exp: 500 },
  },
  
  // フロア進行系
  {
    id: 'floor_5',
    name: '5階到達',
    description: 'フロア5に到達する',
    icon: '🏔️',
    condition: (_, userData) => userData.highestFloor >= 5,
    reward: { coins: 100 },
  },
  {
    id: 'floor_10',
    name: '10階突破',
    description: 'フロア10に到達する',
    icon: '🏰',
    condition: (_, userData) => userData.highestFloor >= 10,
    reward: { coins: 300, exp: 100 },
  },
  {
    id: 'floor_25',
    name: '深層探索者',
    description: 'フロア25に到達する',
    icon: '🗿',
    condition: (_, userData) => userData.highestFloor >= 25,
    reward: { coins: 500, exp: 200 },
  },
  {
    id: 'floor_50',
    name: '奈落の挑戦者',
    description: 'フロア50に到達する',
    icon: '🔥',
    condition: (_, userData) => userData.highestFloor >= 50,
    reward: { coins: 1000, exp: 500 },
  },
  
  // レベル系
  {
    id: 'level_5',
    name: 'Lv.5達成',
    description: 'レベル5に到達する',
    icon: '📈',
    condition: (_, userData) => userData.character.level >= 5,
    reward: { coins: 100 },
  },
  {
    id: 'level_10',
    name: 'Lv.10達成',
    description: 'レベル10に到達する',
    icon: '📊',
    condition: (_, userData) => userData.character.level >= 10,
    reward: { coins: 300, exp: 100 },
  },
  {
    id: 'level_25',
    name: 'Lv.25達成',
    description: 'レベル25に到達する',
    icon: '⭐',
    condition: (_, userData) => userData.character.level >= 25,
    reward: { coins: 500, exp: 300 },
  },
  
  // コイン系
  {
    id: 'coins_1000',
    name: '千金持ち',
    description: '累計1,000コイン獲得',
    icon: '💰',
    condition: (stats) => stats.totalCoinsEarned >= 1000,
    reward: { coins: 100 },
  },
  {
    id: 'coins_10000',
    name: '富豪',
    description: '累計10,000コイン獲得',
    icon: '💎',
    condition: (stats) => stats.totalCoinsEarned >= 10000,
    reward: { coins: 500 },
  },
  
  // 死亡系（ネタ実績）
  {
    id: 'first_death',
    name: '初めての敗北',
    description: '初めて倒される',
    icon: '💀',
    condition: (stats) => stats.totalDeaths >= 1,
    reward: { coins: 10 },
  },
  {
    id: 'death_10',
    name: '不屈の精神',
    description: '10回倒されても諦めない',
    icon: '🔄',
    condition: (stats) => stats.totalDeaths >= 10,
    reward: { coins: 100 },
  },
  
  // ポーション系
  {
    id: 'potion_10',
    name: 'ポーション愛好家',
    description: 'ポーションを10回使用',
    icon: '🧪',
    condition: (stats) => stats.totalPotionsUsed >= 10,
    reward: { coins: 50 },
  },
];

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

// 新規解除可能な実績をチェック
export function checkNewAchievements(
  stats: Statistics,
  userData: UserData
): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => {
    // 既に解除済みなら除外
    if (userData.achievements[achievement.id]?.unlockedAt > 0) {
      return false;
    }
    // 条件を満たしているか
    return achievement.condition(stats, userData);
  });
}
