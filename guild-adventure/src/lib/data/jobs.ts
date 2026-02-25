import { JobData } from '../types';

export const jobs: Record<string, JobData> = {
  warrior: {
    id: 'warrior',
    name: '戦士',
    description: '物理攻撃に特化したアタッカー。',
    statModifiers: {
      atk: 2,  // +20%相当の固定値
      def: 1,
    },
    skill: {
      id: 'heavy_strike',
      name: '強撃',
      description: '強力な一撃を与える（ATK×1.5）',
      type: 'attack',
      target: 'single',
      multiplier: 1.5,
      condition: {
        type: 'hpAbove',
        value: 50,
        target: 'self',
      },
    },
  },
  mage: {
    id: 'mage',
    name: '魔法使い',
    description: '魔法攻撃で敵全体を焼き払う。',
    statModifiers: {
      mag: 3,  // +30%相当
      def: -1,
    },
    skill: {
      id: 'fire',
      name: 'ファイア',
      description: '敵全体に炎の魔法（MAG×1.2）',
      type: 'magic',
      target: 'all',
      multiplier: 1.2,
      condition: {
        type: 'enemyCount',
        value: 2,
        target: 'enemy',
      },
    },
  },
  priest: {
    id: 'priest',
    name: '僧侶',
    description: '味方を回復するヒーラー。',
    statModifiers: {
      def: 1,
      mag: 1,
    },
    skill: {
      id: 'heal',
      name: 'ヒール',
      description: '味方1体のHPを回復（MAG×0.8）',
      type: 'heal',
      target: 'ally',
      multiplier: 0.8,
      condition: {
        type: 'hpBelow',
        value: 50,
        target: 'ally',
      },
    },
  },
};

export const jobList = Object.values(jobs);
