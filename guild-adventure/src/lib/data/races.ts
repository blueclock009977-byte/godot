import { RaceData } from '../types';

export const races: Record<string, RaceData> = {
  human: {
    id: 'human',
    name: '人間',
    description: '万能型。経験値ボーナスと幅広い適性を持つ。',
    baseStats: {
      maxHp: 100,
      atk: 10,
      def: 10,
      agi: 10,
      mag: 10,
    },
    passive: '経験値+50%、クリティカル率+5%',
    effects: [
      { type: 'expBonus', value: 50 },
      { type: 'critBonus', value: 5 },
    ],
  },
  elf: {
    id: 'elf',
    name: 'エルフ',
    description: '魔法と俊敏に長けた種族。回避と魔法攻撃が強力。',
    baseStats: {
      maxHp: 75,
      atk: 7,
      def: 6,
      agi: 16,
      mag: 16,
    },
    passive: '魔法威力+25%、回避率+15%、先制率+20%',
    effects: [
      { type: 'magicBonus', value: 25 },
      { type: 'evasionBonus', value: 15 },
      { type: 'firstStrikeBonus', value: 20 },
    ],
  },
  dwarf: {
    id: 'dwarf',
    name: 'ドワーフ',
    description: '頑強な肉体を持つ種族。高い耐久力と攻撃力。',
    baseStats: {
      maxHp: 140,
      atk: 14,
      def: 16,
      agi: 5,
      mag: 5,
    },
    passive: '被ダメージ-20%、物理攻撃+15%、毒耐性+50%',
    effects: [
      { type: 'damageReduction', value: 20 },
      { type: 'physicalBonus', value: 15 },
      { type: 'poisonResist', value: 50 },
    ],
  },
};

export const raceList = Object.values(races);
