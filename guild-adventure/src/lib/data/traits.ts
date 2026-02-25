import { TraitData } from '../types';

export const traits: Record<string, TraitData> = {
  brave: {
    id: 'brave',
    name: '勇敢',
    description: '恐れを知らぬ戦士。先制攻撃しやすく、与ダメージも上昇。',
    effects: [
      { type: 'firstStrikeBonus', value: 30 },
      { type: 'damageBonus', value: 5 },
    ],
  },
  cautious: {
    id: 'cautious',
    name: '慎重',
    description: '用心深い性格。被ダメージを軽減し、回避率も上昇。',
    effects: [
      { type: 'damageReduction', value: 15 },
      { type: 'evasionBonus', value: 10 },
    ],
  },
  lucky: {
    id: 'lucky',
    name: '幸運',
    description: '運に恵まれている。クリティカル率が大幅上昇。',
    effects: [
      { type: 'critBonus', value: 20 },
    ],
  },
};

export const traitList = Object.values(traits);
