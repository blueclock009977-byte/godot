import { RaceData } from '../types';

export const races: Record<string, RaceData> = {
  human: {
    id: 'human',
    name: '人間',
    description: '万能型。あらゆる職業に適性を持つ。',
    baseStats: { maxHp: 100, maxMp: 50, atk: 10, def: 10, agi: 10, mag: 10 },
    passives: [
      {
        name: '適応力',
        description: '全ステータスにバランス良く適性を持つ',
        effects: [
          { type: 'critBonus', value: 5 },
          { type: 'evasionBonus', value: 5 },
        ],
      },
      {
        name: '不屈の精神',
        description: 'HPが低いほど攻撃力が上がる',
        effects: [{ type: 'damageBonus', value: 10 }],
      },
    ],
  },
  elf: {
    id: 'elf',
    name: 'エルフ',
    description: '魔法と俊敏に長けた長命種族。',
    baseStats: { maxHp: 75, maxMp: 80, atk: 7, def: 6, agi: 16, mag: 16 },
    passives: [
      {
        name: '魔力の血統',
        description: '魔法攻撃の威力が大幅に上昇',
        effects: [{ type: 'magicBonus', value: 25 }],
      },
      {
        name: '風の加護',
        description: '回避率と先制率が上昇',
        effects: [
          { type: 'evasionBonus', value: 15 },
          { type: 'firstStrikeBonus', value: 20 },
        ],
      },
      {
        name: 'MP自然回復',
        description: '毎ターンMPが少量回復',
        effects: [{ type: 'mpRegen', value: 3 }],
      },
    ],
  },
  dwarf: {
    id: 'dwarf',
    name: 'ドワーフ',
    description: '頑強な肉体を持つ種族。鉄壁の防御。',
    baseStats: { maxHp: 140, maxMp: 30, atk: 14, def: 16, agi: 5, mag: 5 },
    passives: [
      {
        name: '鋼の肉体',
        description: '被ダメージを大幅に軽減',
        effects: [{ type: 'damageReduction', value: 20 }],
      },
      {
        name: '怪力',
        description: '物理攻撃の威力が上昇',
        effects: [{ type: 'physicalBonus', value: 15 }],
      },
      {
        name: '毒耐性',
        description: '毒への高い耐性を持つ',
        effects: [{ type: 'poisonResist', value: 50 }],
      },
    ],
  },
  halfling: {
    id: 'halfling',
    name: 'ハーフリング',
    description: '小柄で幸運な種族。回避と急所攻撃が得意。',
    baseStats: { maxHp: 70, maxMp: 45, atk: 8, def: 8, agi: 14, mag: 10 },
    passives: [
      {
        name: '幸運の星',
        description: 'クリティカル率が大幅に上昇',
        effects: [{ type: 'critBonus', value: 20 }],
      },
      {
        name: '小さな体',
        description: '回避率が上昇するが被ダメージ増加',
        effects: [
          { type: 'evasionBonus', value: 25 },
          { type: 'damageReduction', value: -10 },
        ],
      },
    ],
  },
  orc: {
    id: 'orc',
    name: 'オーク',
    description: '凶暴な戦闘種族。圧倒的な攻撃力。',
    baseStats: { maxHp: 120, maxMp: 20, atk: 18, def: 8, agi: 7, mag: 3 },
    passives: [
      {
        name: '狂戦士',
        description: '物理攻撃力が大幅に上昇',
        effects: [{ type: 'physicalBonus', value: 30 }],
      },
      {
        name: '血の渇望',
        description: 'クリティカル時にHP回復',
        effects: [
          { type: 'critBonus', value: 10 },
          { type: 'hpRegen', value: 5 },
        ],
      },
      {
        name: '無謀',
        description: '被ダメージが増加',
        effects: [{ type: 'damageReduction', value: -15 }],
      },
    ],
  },
  lizardman: {
    id: 'lizardman',
    name: 'リザードマン',
    description: '爬虫類系の戦士種族。再生力が高い。',
    baseStats: { maxHp: 110, maxMp: 40, atk: 12, def: 14, agi: 9, mag: 8 },
    passives: [
      {
        name: '再生能力',
        description: '毎ターンHPが回復',
        effects: [{ type: 'hpRegen', value: 5 }],
      },
      {
        name: '硬い鱗',
        description: '物理防御が上昇',
        effects: [{ type: 'damageReduction', value: 10 }],
      },
      {
        name: '毒免疫',
        description: '毒を完全に無効化',
        effects: [{ type: 'poisonResist', value: 100 }],
      },
    ],
  },
  fairy: {
    id: 'fairy',
    name: 'フェアリー',
    description: '妖精族。極めて高い魔力だが脆い。',
    baseStats: { maxHp: 45, maxMp: 100, atk: 4, def: 3, agi: 18, mag: 22 },
    passives: [
      {
        name: '魔力の奔流',
        description: '魔法威力が大幅に上昇',
        effects: [{ type: 'magicBonus', value: 50 }],
      },
      {
        name: '妖精の翅',
        description: '回避率が大幅に上昇',
        effects: [{ type: 'evasionBonus', value: 30 }],
      },
      {
        name: '魔力効率',
        description: 'MP消費が軽減',
        effects: [{ type: 'mpReduction', value: 25 }],
      },
    ],
  },
  undead: {
    id: 'undead',
    name: 'アンデッド',
    description: '不死者。回復魔法が効かないが状態異常無効。',
    baseStats: { maxHp: 90, maxMp: 35, atk: 11, def: 12, agi: 6, mag: 11 },
    passives: [
      {
        name: '不死の呪い',
        description: '状態異常を完全に無効化',
        effects: [{ type: 'statusResist', value: 100 }],
      },
      {
        name: '腐った肉体',
        description: '回復を受けられない',
        effects: [{ type: 'healReceived', value: -100 }],
      },
      {
        name: '冥界の加護',
        description: '被ダメージ軽減',
        effects: [{ type: 'damageReduction', value: 15 }],
      },
      {
        name: '恐怖のオーラ',
        description: '敵の命中率を下げる',
        effects: [{ type: 'evasionBonus', value: 10 }],
      },
    ],
  },
};

export type RaceType = keyof typeof races;
export const raceList = Object.values(races);
