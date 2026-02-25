import { EnvironmentData } from '../types';

export const environments: Record<string, EnvironmentData> = {
  grassland: {
    id: 'grassland',
    name: '草原育ち',
    description: '広大な草原で育った。草原ダンジョンで能力上昇。',
    bonusDungeon: 'grassland',
    bonusStats: {
      atk: 1,
      def: 1,
      agi: 1,
      mag: 1,
    },
    bonusEffects: [
      { type: 'evasionBonus', value: 10 },
    ],
  },
  forest: {
    id: 'forest',
    name: '森林育ち',
    description: '深い森で育った。森林ダンジョンで能力上昇。',
    bonusDungeon: 'forest',
    bonusStats: {
      atk: 2,
    },
    bonusEffects: [
      { type: 'firstStrikeBonus', value: 20 },
    ],
  },
  sea: {
    id: 'sea',
    name: '海育ち',
    description: '海辺で育った。海ダンジョンで能力上昇。',
    bonusDungeon: 'sea',
    bonusStats: {
      mag: 3,
      maxHp: 10,
    },
  },
};

export const environmentList = Object.values(environments);
