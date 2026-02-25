import { EnvironmentData } from '../types';

export const environments: Record<string, EnvironmentData> = {
  grassland: {
    id: 'grassland',
    name: '草原',
    description: '広大な草原で育った。バランスの良い成長。',
    statModifiers: { atk: 1, def: 1, agi: 1, mag: 1 },
    effects: [
      { type: 'expBonus', value: 10 },
      { type: 'healReceived', value: 10 },
    ],
  },
  forest: {
    id: 'forest',
    name: '森林',
    description: '深い森で育った。隠密と先制攻撃が得意。',
    statModifiers: { agi: 3, mag: 1 },
    effects: [
      { type: 'evasionBonus', value: 10 },
      { type: 'firstStrikeBonus', value: 15 },
      { type: 'poisonResist', value: 20 },
    ],
  },
  sea: {
    id: 'sea',
    name: '海辺',
    description: '海沿いで育った。俊敏で回避に優れる。',
    statModifiers: { agi: 2, maxHp: 5 },
    effects: [
      { type: 'evasionBonus', value: 15 },
      { type: 'healReceived', value: 15 },
      { type: 'critBonus', value: 5 },
    ],
  },
  mountain: {
    id: 'mountain',
    name: '山岳',
    description: '険しい山で育った。強靭な肉体を持つ。',
    statModifiers: { maxHp: 15, atk: 2, def: 2, agi: -1 },
    effects: [
      { type: 'damageReduction', value: 10 },
      { type: 'physicalBonus', value: 10 },
    ],
  },
  city: {
    id: 'city',
    name: '都市',
    description: '大都市で育った。知識と商売に長ける。',
    statModifiers: { mag: 2, agi: 1 },
    effects: [
      { type: 'expBonus', value: 25 },
      { type: 'dropBonus', value: 20 },
      { type: 'mpReduction', value: 10 },
    ],
  },
};

export type EnvironmentType = keyof typeof environments;
export const environmentList = Object.values(environments);
