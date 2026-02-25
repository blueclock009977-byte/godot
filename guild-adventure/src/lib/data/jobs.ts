import { JobData } from '../types';

export const jobs: Record<string, JobData> = {
  warrior: {
    id: 'warrior',
    name: '戦士',
    description: '前衛の要。高い攻撃力と防御力で敵を圧倒する。',
    statModifiers: {
      maxHp: 20,
      atk: 5,
      def: 3,
      agi: -1,
      mag: -2,
    },
    passive: '物理攻撃+20%、被ダメージ-10%',
    effects: [
      { type: 'physicalBonus', value: 20 },
      { type: 'damageReduction', value: 10 },
    ],
    skill: {
      id: 'heavy_strike',
      name: '強撃',
      description: '渾身の一撃（ATK×1.8）。HP50%以上で発動。',
      type: 'attack',
      target: 'single',
      multiplier: 1.8,
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
    description: '後衛から魔法で敵全体を焼き払う。高い魔力を持つ。',
    statModifiers: {
      maxHp: -15,
      atk: -2,
      def: -3,
      agi: 1,
      mag: 8,
    },
    passive: '魔法威力+30%、MP消費-20%',
    effects: [
      { type: 'magicBonus', value: 30 },
      { type: 'mpReduction', value: 20 },
    ],
    skill: {
      id: 'fire',
      name: 'ファイア',
      description: '敵全体に炎の魔法（MAG×1.3）。敵2体以上で発動。',
      type: 'magic',
      target: 'all',
      multiplier: 1.3,
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
    description: '味方を回復し守護する。状態異常にも強い。',
    statModifiers: {
      maxHp: 5,
      atk: -1,
      def: 2,
      agi: 0,
      mag: 4,
    },
    passive: '回復量+40%、状態異常耐性+30%',
    effects: [
      { type: 'healBonus', value: 40 },
      { type: 'statusResist', value: 30 },
    ],
    skill: {
      id: 'heal',
      name: 'ヒール',
      description: '味方1体のHPを大回復（MAG×1.2）。味方HP50%以下で発動。',
      type: 'heal',
      target: 'ally',
      multiplier: 1.2,
      condition: {
        type: 'hpBelow',
        value: 50,
        target: 'ally',
      },
    },
  },
};

export const jobList = Object.values(jobs);
