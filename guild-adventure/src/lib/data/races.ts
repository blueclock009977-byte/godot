import { RaceData } from '../types';

export const races: Record<string, RaceData> = {
  human: {
    id: 'human',
    name: '人間',
    description: 'バランスの取れた種族。適応力が高い。',
    baseStats: {
      maxHp: 100,
      atk: 10,
      def: 10,
      agi: 10,
      mag: 10,
    },
    passive: '経験値ボーナス+10%',
  },
  elf: {
    id: 'elf',
    name: 'エルフ',
    description: '魔法に長けた種族。素早さも高い。',
    baseStats: {
      maxHp: 80,
      atk: 8,
      def: 6,
      agi: 15,
      mag: 14,
    },
    passive: '魔法威力+15%',
  },
  dwarf: {
    id: 'dwarf',
    name: 'ドワーフ',
    description: '頑強な種族。壁役として優秀。',
    baseStats: {
      maxHp: 130,
      atk: 14,
      def: 16,
      agi: 5,
      mag: 4,
    },
    passive: '被ダメージ-10%',
  },
};

export const raceList = Object.values(races);
