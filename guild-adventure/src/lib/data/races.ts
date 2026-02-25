import { RaceData } from '../types';

export const races: Record<string, RaceData> = {
  human: {
    id: 'human',
    name: '人間',
    description: '万能型。あらゆる職業に適性を持ち、成長が早い。',
    baseStats: { maxHp: 100, atk: 10, def: 10, agi: 10, mag: 10 },
    passive: '経験値+50%、クリティカル率+5%',
    effects: [
      { type: 'expBonus', value: 50 },
      { type: 'critBonus', value: 5 },
    ],
  },
  elf: {
    id: 'elf',
    name: 'エルフ',
    description: '魔法と俊敏に長けた長命種族。回避と魔法が強力。',
    baseStats: { maxHp: 75, atk: 7, def: 6, agi: 16, mag: 16 },
    passive: '魔法威力+25%、回避率+15%、先制+20%',
    effects: [
      { type: 'magicBonus', value: 25 },
      { type: 'evasionBonus', value: 15 },
      { type: 'firstStrikeBonus', value: 20 },
    ],
  },
  dwarf: {
    id: 'dwarf',
    name: 'ドワーフ',
    description: '頑強な肉体を持つ種族。鉄壁の防御と物理攻撃。',
    baseStats: { maxHp: 140, atk: 14, def: 16, agi: 5, mag: 5 },
    passive: '被ダメ-20%、物理+15%、毒耐性+50%',
    effects: [
      { type: 'damageReduction', value: 20 },
      { type: 'physicalBonus', value: 15 },
      { type: 'poisonResist', value: 50 },
    ],
  },
  halfling: {
    id: 'halfling',
    name: 'ハーフリング',
    description: '小柄で幸運な種族。回避と幸運に優れる。',
    baseStats: { maxHp: 70, atk: 8, def: 8, agi: 14, mag: 10 },
    passive: 'クリティカル+15%、回避+20%、ドロップ+30%',
    effects: [
      { type: 'critBonus', value: 15 },
      { type: 'evasionBonus', value: 20 },
      { type: 'dropBonus', value: 30 },
    ],
  },
  orc: {
    id: 'orc',
    name: 'オーク',
    description: '凶暴な戦闘種族。圧倒的な攻撃力を誇る。',
    baseStats: { maxHp: 120, atk: 18, def: 8, agi: 7, mag: 3 },
    passive: '物理+30%、クリティカル+10%、被ダメ+10%',
    effects: [
      { type: 'physicalBonus', value: 30 },
      { type: 'critBonus', value: 10 },
      { type: 'damageReduction', value: -10 },
    ],
  },
  lizardman: {
    id: 'lizardman',
    name: 'リザードマン',
    description: '爬虫類系の戦士種族。毒と水に強い。',
    baseStats: { maxHp: 110, atk: 12, def: 14, agi: 9, mag: 8 },
    passive: '毒耐性+100%、被ダメ-10%、回復量+15%',
    effects: [
      { type: 'poisonResist', value: 100 },
      { type: 'damageReduction', value: 10 },
      { type: 'healReceived', value: 15 },
    ],
  },
  fairy: {
    id: 'fairy',
    name: 'フェアリー',
    description: '妖精族。極めて高い魔力と回避を持つが脆い。',
    baseStats: { maxHp: 45, atk: 4, def: 3, agi: 18, mag: 22 },
    passive: '魔法+50%、回避+30%、MP消費-25%',
    effects: [
      { type: 'magicBonus', value: 50 },
      { type: 'evasionBonus', value: 30 },
      { type: 'mpReduction', value: 25 },
    ],
  },
  undead: {
    id: 'undead',
    name: 'アンデッド',
    description: '不死者。回復魔法が効かないが毒・状態異常無効。',
    baseStats: { maxHp: 90, atk: 11, def: 12, agi: 6, mag: 11 },
    passive: '状態異常耐性+100%、被回復-100%、被ダメ-15%',
    effects: [
      { type: 'statusResist', value: 100 },
      { type: 'healReceived', value: -100 },
      { type: 'damageReduction', value: 15 },
    ],
  },
};

export type RaceType = keyof typeof races;
export const raceList = Object.values(races);
