import { EnvironmentData } from '../types';

export const environments: Record<string, EnvironmentData> = {
  grassland: {
    id: 'grassland',
    name: '草原育ち',
    description: '広大な草原で育った。バランスの取れた万能型。',
    statModifiers: {
      maxHp: 10,
      atk: 1,
      def: 1,
      agi: 1,
      mag: 1,
    },
    effects: [
      { type: 'expBonus', value: 15 },
      { type: 'healReceived', value: 10 },
    ],
  },
  forest: {
    id: 'forest',
    name: '森林育ち',
    description: '深い森で鍛えられた。素早さと先制に優れる。',
    statModifiers: {
      atk: 2,
      agi: 3,
      mag: -1,
    },
    effects: [
      { type: 'firstStrikeBonus', value: 25 },
      { type: 'evasionBonus', value: 10 },
      { type: 'critBonus', value: 5 },
    ],
  },
  sea: {
    id: 'sea',
    name: '海育ち',
    description: '海辺で育った。高い魔力と精神力を持つ。',
    statModifiers: {
      maxHp: 5,
      def: -1,
      mag: 4,
    },
    effects: [
      { type: 'magicBonus', value: 15 },
      { type: 'statusResist', value: 20 },
      { type: 'healBonus', value: 10 },
    ],
  },
};

export const environmentList = Object.values(environments);
