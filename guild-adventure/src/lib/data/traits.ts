import { TraitData } from '../types';

export const traits: Record<string, TraitData> = {
  brave: {
    id: 'brave',
    name: '勇敢',
    description: '恐れを知らない闘志。攻撃的な戦いを好む。',
    statModifiers: { atk: 3, agi: 1 },
    effects: [
      { type: 'damageBonus', value: 15 },
      { type: 'critBonus', value: 5 },
      { type: 'damageReduction', value: -5 },
    ],
  },
  cautious: {
    id: 'cautious',
    name: '慎重',
    description: '石橋を叩いて渡る性格。防御を重視する。',
    statModifiers: { def: 3, maxHp: 10 },
    effects: [
      { type: 'damageReduction', value: 15 },
      { type: 'evasionBonus', value: 5 },
      { type: 'damageBonus', value: -5 },
    ],
  },
  lucky: {
    id: 'lucky',
    name: '幸運',
    description: '生まれながらの強運。良いことが起きやすい。',
    statModifiers: { agi: 2 },
    effects: [
      { type: 'critBonus', value: 15 },
      { type: 'evasionBonus', value: 10 },
      { type: 'dropBonus', value: 30 },
    ],
  },
  genius: {
    id: 'genius',
    name: '天才',
    description: '優れた才能の持ち主。何でも素早く習得する。',
    statModifiers: { atk: 1, def: 1, agi: 1, mag: 1 },
    effects: [
      { type: 'expBonus', value: 75 },
      { type: 'critBonus', value: 5 },
    ],
  },
  stubborn: {
    id: 'stubborn',
    name: '頑固',
    description: '折れない精神の持ち主。状態異常に強い。',
    statModifiers: { def: 2, maxHp: 15 },
    effects: [
      { type: 'statusResist', value: 40 },
      { type: 'damageReduction', value: 10 },
      { type: 'firstStrikeBonus', value: -10 },
    ],
  },
};

export type TraitType = keyof typeof traits;
export const traitList = Object.values(traits);
