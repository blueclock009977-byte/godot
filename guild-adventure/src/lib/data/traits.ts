import { TraitData } from '../types';

export const traits: Record<string, TraitData> = {
  brave: {
    id: 'brave',
    name: '勇敢',
    description: '恐れを知らぬ戦士。攻撃的なステータスボーナス。',
    statModifiers: {
      atk: 3,
      def: -1,
      agi: 1,
    },
    effects: [
      { type: 'firstStrikeBonus', value: 25 },
      { type: 'damageBonus', value: 10 },
      { type: 'critBonus', value: 5 },
    ],
  },
  cautious: {
    id: 'cautious',
    name: '慎重',
    description: '用心深く堅実。防御と生存に優れる。',
    statModifiers: {
      maxHp: 15,
      def: 2,
      agi: -1,
    },
    effects: [
      { type: 'damageReduction', value: 15 },
      { type: 'evasionBonus', value: 10 },
      { type: 'healReceived', value: 20 },
    ],
  },
  lucky: {
    id: 'lucky',
    name: '幸運',
    description: '運に恵まれた者。クリティカルと回避が大幅上昇。',
    statModifiers: {
      agi: 2,
    },
    effects: [
      { type: 'critBonus', value: 20 },
      { type: 'evasionBonus', value: 15 },
      { type: 'dropBonus', value: 25 },
    ],
  },
};

export const traitList = Object.values(traits);
