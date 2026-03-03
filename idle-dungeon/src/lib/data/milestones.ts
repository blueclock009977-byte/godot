// マイルストーン報酬マスターデータ
import { Milestone, UserData, MilestoneProgress } from '@/lib/types';

export const MILESTONES: Milestone[] = [
  // 初期マイルストーン
  {
    id: 'floor_5',
    name: '地下5階到達',
    description: '初めて5階に到達した記念',
    floor: 5,
    icon: '🥉',
    reward: { coins: 100, exp: 50 },
  },
  {
    id: 'floor_10',
    name: '地下10階到達',
    description: 'ダンジョンの入口を突破！',
    floor: 10,
    icon: '🥈',
    reward: { coins: 300, exp: 100 },
  },
  {
    id: 'floor_15',
    name: '地下15階到達',
    description: '中層への第一歩',
    floor: 15,
    icon: '🏅',
    reward: { coins: 500, exp: 150 },
  },
  {
    id: 'floor_20',
    name: '地下20階到達',
    description: '中層の支配者',
    floor: 20,
    icon: '🎖️',
    reward: { coins: 800, exp: 200 },
  },
  {
    id: 'floor_25',
    name: '地下25階到達',
    description: '深層への入口',
    floor: 25,
    icon: '🥇',
    reward: { coins: 1000, exp: 300 },
  },
  {
    id: 'floor_30',
    name: '地下30階到達',
    description: '深層探索者',
    floor: 30,
    icon: '💎',
    reward: { coins: 1500, exp: 400 },
  },
  {
    id: 'floor_40',
    name: '地下40階到達',
    description: '奈落の挑戦者',
    floor: 40,
    icon: '🔥',
    reward: { coins: 2000, exp: 500 },
  },
  {
    id: 'floor_50',
    name: '地下50階到達',
    description: '伝説の探索者',
    floor: 50,
    icon: '👑',
    reward: { coins: 3000, exp: 800 },
  },
  {
    id: 'floor_75',
    name: '地下75階到達',
    description: '深淵の覇者',
    floor: 75,
    icon: '⚡',
    reward: { coins: 5000, exp: 1000 },
  },
  {
    id: 'floor_100',
    name: '地下100階到達',
    description: 'ダンジョンマスター',
    floor: 100,
    icon: '🏆',
    reward: { coins: 10000, exp: 2000 },
  },
];

// IDでマイルストーン取得
export function getMilestoneById(id: string): Milestone | undefined {
  return MILESTONES.find(m => m.id === id);
}

// フロアでマイルストーン取得
export function getMilestoneByFloor(floor: number): Milestone | undefined {
  return MILESTONES.find(m => m.floor === floor);
}

// 未受け取りのマイルストーンをチェック
export function checkNewMilestones(userData: UserData): Milestone[] {
  return MILESTONES.filter(milestone => {
    // まだ受け取ってない && 必要フロアに到達済み
    const progress = userData.milestones?.[milestone.id];
    return (!progress || progress.claimedAt === 0) && userData.highestFloor >= milestone.floor;
  });
}

// 次に達成できるマイルストーンを取得
export function getNextMilestone(currentFloor: number): Milestone | undefined {
  return MILESTONES.find(m => m.floor > currentFloor);
}

// 進捗率を計算（0-100%）
export function getMilestoneProgress(currentFloor: number): { 
  current: Milestone | undefined; 
  next: Milestone | undefined; 
  progress: number;
} {
  const next = getNextMilestone(currentFloor);
  if (!next) {
    return { current: MILESTONES[MILESTONES.length - 1], next: undefined, progress: 100 };
  }
  
  // 前のマイルストーンを探す
  const idx = MILESTONES.indexOf(next);
  const prev = idx > 0 ? MILESTONES[idx - 1] : undefined;
  const prevFloor = prev?.floor ?? 0;
  
  const progress = Math.floor(((currentFloor - prevFloor) / (next.floor - prevFloor)) * 100);
  
  return { current: prev, next, progress: Math.min(100, Math.max(0, progress)) };
}
