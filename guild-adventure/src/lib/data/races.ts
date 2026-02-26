import { RaceData } from '../types';

export const races: Record<string, RaceData> = {
  human: {
    id: 'human',
    name: '人間',
    description: 'ステータスは控えめだが、ドロップ率+40%の幸運が最大の武器。ファーム周回に最適な種族。',
    baseStats: { maxHp: 85, maxMp: 40, atk: 8, def: 8, agi: 9, mag: 8 },
    passives: [
      { name: '適応力', description: 'クリティカル率と回避率が上昇', effects: [{ type: 'critBonus', value: 5 }, { type: 'evasionBonus', value: 5 }] },
      { name: '不屈の精神', description: 'HPが低いほど攻撃力が上がる', effects: [{ type: 'damageBonus', value: 10 }] },
      { name: '幸運', description: 'アイテムのドロップ率が上昇', effects: [{ type: 'dropBonus', value: 40 }] },
    ],
    skills: [
      { id: 'inspire', name: '鼓舞', description: '味方全体の攻撃力を上昇', type: 'buff', target: 'allAllies', multiplier: 0, mpCost: 15, effect: { type: 'atkUp', value: 20, duration: 3 } },
    ],
    masterySkill: { name: '英雄の器', description: '味方全員の全ステータス+10%', type: 'passive', effects: [{ type: 'allStats', value: 10 }] },
  },
  elf: {
    id: 'elf',
    name: 'エルフ',
    description: '魔法と素早さに特化した種族。HPは低いがMAGとAGIが高く、魔法攻撃が強力。MP自然回復で長期戦に強い。魔法使いや賢者と相性◎',
    baseStats: { maxHp: 75, maxMp: 80, atk: 7, def: 6, agi: 16, mag: 16 },
    passives: [
      { name: '魔力の血統', description: '魔法攻撃の威力が上昇', effects: [{ type: 'magicBonus', value: 25 }] },
      { name: '風の加護', description: '回避率と先制率が上昇', effects: [{ type: 'evasionBonus', value: 15 }, { type: 'firstStrikeBonus', value: 20 }] },
      { name: 'MP自然回復', description: '毎ターンMPが回復', effects: [{ type: 'mpRegen', value: 3 }] },
    ],
    skills: [
      { id: 'spirit_arrow', name: '精霊の矢', description: '精霊の力で敵を攻撃', type: 'magic', target: 'single', multiplier: 1.4, mpCost: 10 },
    ],
    masterySkill: { name: '精霊契約', description: '味方の魔法攻撃後に追撃', type: 'passive', effects: [{ type: 'followUp', value: 50 }] },
  },
  dwarf: {
    id: 'dwarf',
    name: 'ドワーフ',
    description: '最高のHPとDEF、高いATKを持つ重装タンク。AGIとMAGは低いが、被ダメ20%軽減+毒耐性で生存力抜群。騎士やパラディンと相性◎',
    baseStats: { maxHp: 140, maxMp: 30, atk: 14, def: 16, agi: 5, mag: 5 },
    passives: [
      { name: '鋼の肉体', description: '被ダメージを軽減', effects: [{ type: 'damageReduction', value: 20 }] },
      { name: '怪力', description: '物理攻撃の威力が上昇', effects: [{ type: 'physicalBonus', value: 15 }] },
      { name: '毒耐性', description: '毒への高い耐性', effects: [{ type: 'poisonResist', value: 50 }] },
    ],
    skills: [
      { id: 'iron_wall', name: '鉄壁', description: '自身の防御力を大幅上昇', type: 'buff', target: 'self', multiplier: 0, mpCost: 12, effect: { type: 'defUp', value: 50, duration: 3 } },
    ],
    masterySkill: { name: '守護の盾', description: '50%の確率で味方を庇う', type: 'passive', effects: [{ type: 'cover', value: 50 }] },
  },
  halfling: {
    id: 'halfling',
    name: 'ハーフリング',
    description: '小柄で幸運な種族。クリティカル率+20%、回避率+25%と運に特化。被ダメ増加のデメリットあり。盗賊やサムライで一撃必殺を狙え！',
    baseStats: { maxHp: 70, maxMp: 45, atk: 8, def: 8, agi: 14, mag: 10 },
    passives: [
      { name: '幸運の星', description: 'クリティカル率が上昇', effects: [{ type: 'critBonus', value: 20 }] },
      { name: '小さな体', description: '回避率上昇、被ダメージ増加', effects: [{ type: 'evasionBonus', value: 25 }, { type: 'damageReduction', value: -10 }] },
      { name: '先制の才', description: '先制率が上昇', effects: [{ type: 'firstStrikeBonus', value: 20 }] },
    ],
    skills: [
      { id: 'vital_strike', name: '急所狙い', description: 'クリティカル率の高い一撃', type: 'attack', target: 'single', multiplier: 1.5, mpCost: 8 },
    ],
    masterySkill: { name: '幸運の星', description: 'クリティカル時ダメージ2倍', type: 'passive', effects: [{ type: 'critDamage', value: 100 }] },
  },
  orc: {
    id: 'orc',
    name: 'オーク',
    description: '最高クラスのATKを持つ脳筋種族。物理ダメ+30%だが被ダメ+15%。HP30%以下で攻撃力2倍のマスタリーは超火力。バーサーカーで最強火力！',
    baseStats: { maxHp: 120, maxMp: 20, atk: 18, def: 8, agi: 7, mag: 3 },
    passives: [
      { name: '狂戦士', description: '物理攻撃力が大幅上昇', effects: [{ type: 'physicalBonus', value: 30 }] },
      { name: '血の渇望', description: 'クリティカル時にHP回復', effects: [{ type: 'critBonus', value: 10 }, { type: 'hpRegen', value: 5 }] },
      { name: '無謀', description: '被ダメージが増加', effects: [{ type: 'damageReduction', value: -15 }] },
    ],
    skills: [
      { id: 'fury_strike', name: '怒りの一撃', description: '渾身の大ダメージ攻撃', type: 'attack', target: 'single', multiplier: 2.2, mpCost: 12 },
    ],
    masterySkill: { name: '狂戦士の魂', description: 'HP30%以下で攻撃力2倍', type: 'passive', effects: [{ type: 'lowHpBonus', value: 100 }] },
  },
  lizardman: {
    id: 'lizardman',
    name: 'リザードマン',
    description: '毎ターンHP回復+物理魔法両方に適性を持つバランス型。硬い鱗で被ダメ軽減。マスタリーで瀕死から全回復！戦士やパラディンと好相性。',
    baseStats: { maxHp: 110, maxMp: 40, atk: 12, def: 14, agi: 9, mag: 8 },
    passives: [
      { name: '再生能力', description: '毎ターンHP回復', effects: [{ type: 'hpRegen', value: 8 }] },
      { name: '硬い鱗', description: '物理防御が上昇', effects: [{ type: 'damageReduction', value: 10 }] },
      { name: '両刀の才', description: '物理と魔法の威力上昇', effects: [{ type: 'physicalBonus', value: 10 }, { type: 'magicBonus', value: 10 }] },
    ],
    skills: [
      { id: 'regenerate', name: '再生', description: '自身のHPを回復', type: 'heal', target: 'self', multiplier: 1.5, mpCost: 10 },
    ],
    masterySkill: { name: '不死の再生', description: '戦闘中1回、瀕死から全回復', type: 'passive', effects: [{ type: 'revive', value: 100 }] },
  },
  fairy: {
    id: 'fairy',
    name: 'フェアリー',
    description: '最高のMAGとMP、回避率+30%を持つ魔法特化種族。HPとDEFは最低クラス。魔法ダメ+35%、回復量+30%。司祭で最強ヒーラー、魔法使いで火力特化！',
    baseStats: { maxHp: 45, maxMp: 100, atk: 4, def: 3, agi: 18, mag: 22 },
    passives: [
      { name: '魔力の奔流', description: '魔法威力が大幅上昇', effects: [{ type: 'magicBonus', value: 35 }] },
      { name: '妖精の翅', description: '回避率が大幅上昇', effects: [{ type: 'evasionBonus', value: 30 }] },
      { name: '癒しの力', description: '回復量が上昇', effects: [{ type: 'healBonus', value: 30 }] },
    ],
    skills: [
      { id: 'fairy_heal', name: '癒しの光', description: '味方一人のHPを回復', type: 'heal', target: 'ally', multiplier: 1.3, mpCost: 12 },
    ],
    masterySkill: { name: '妖精の祝福', description: '味方への回復量+50%', type: 'passive', effects: [{ type: 'healBonus', value: 50 }] },
  },
  undead: {
    id: 'undead',
    name: 'アンデッド',
    description: '状態異常耐性80%+被ダメ軽減+HP吸収を持つ不死種族。回復効果半減のデメリットあり。ネクロマンサーで自己完結した闇魔法アタッカーに。',
    baseStats: { maxHp: 90, maxMp: 50, atk: 11, def: 12, agi: 6, mag: 14 },
    passives: [
      { name: '不死の呪い', description: '状態異常耐性上昇', effects: [{ type: 'statusResist', value: 80 }] },
      { name: '回復無効', description: '回復効果が半減', effects: [{ type: 'healReceived', value: -50 }] },
      { name: '冥界の加護', description: '被ダメージ軽減', effects: [{ type: 'damageReduction', value: 15 }] },
      { name: 'HP吸収', description: '与ダメージの一部をHP回復', effects: [{ type: 'hpSteal', value: 20 }] },
    ],
    skills: [
      { id: 'life_drain', name: '生命吸収', description: 'ダメージを与えHP吸収', type: 'magic', target: 'single', multiplier: 1.2, mpCost: 14 },
    ],
    masterySkill: { name: '死の抱擁', description: '与ダメージの30%HP吸収', type: 'passive', effects: [{ type: 'hpSteal', value: 30 }] },
  },
  goblin: {
    id: 'goblin',
    name: 'ゴブリン',
    description: '先制率+35%で確実に先手を取れる小鬼。HPとDEFは低いが、AGIが高く奇襲が得意。忍者やレンジャーで開幕速攻型に。味方が多いほど強化されるマスタリーも◎',
    baseStats: { maxHp: 60, maxMp: 35, atk: 9, def: 5, agi: 18, mag: 6 },
    passives: [
      { name: '狡猾', description: '先制率が大幅上昇', effects: [{ type: 'firstStrikeBonus', value: 35 }] },
      { name: '弱者の知恵', description: 'HP低下時に回避率上昇', effects: [{ type: 'evasionBonus', value: 20 }] },
      { name: '急所狙い', description: 'クリティカル率上昇', effects: [{ type: 'critBonus', value: 15 }] },
    ],
    skills: [
      { id: 'ambush', name: '奇襲', description: '先制で高ダメージの一撃', type: 'attack', target: 'single', multiplier: 1.8, mpCost: 10 },
    ],
    masterySkill: { name: '群狼戦術', description: '味方が多いほどダメージ上昇', type: 'passive', effects: [{ type: 'allyCountBonus', value: 10 }] },
  },
  dragonewt: {
    id: 'dragonewt',
    name: 'ドラゴニュート',
    description: 'ATK・MAG両方が高い万能アタッカー。物理魔法+15%、被ダメ軽減、敵の攻撃力低下。マスタリーの竜の咆哮は防御無視全体攻撃。賢者やパラディンで強力！',
    baseStats: { maxHp: 115, maxMp: 55, atk: 14, def: 12, agi: 8, mag: 14 },
    passives: [
      { name: '竜の血', description: '物理・魔法威力が上昇', effects: [{ type: 'physicalBonus', value: 15 }, { type: 'magicBonus', value: 15 }] },
      { name: '竜鱗', description: '炎耐性と被ダメージ軽減', effects: [{ type: 'damageReduction', value: 10 }] },
      { name: '威圧', description: '敵の攻撃力を下げる', effects: [{ type: 'intimidate', value: 10 }] },
    ],
    skills: [
      { id: 'dragon_breath', name: 'ドラゴンブレス', description: '全体に炎のブレス', type: 'magic', target: 'all', multiplier: 1.3, mpCost: 20 },
    ],
    masterySkill: {
      name: '竜の咆哮',
      description: '全体に防御無視ダメージ',
      type: 'active',
      skill: { id: 'dragon_roar', name: '竜の咆哮', description: '防御無視の全体攻撃', type: 'magic', target: 'all', multiplier: 2.0, mpCost: 35 },
    },
  },
  angel: {
    id: 'angel',
    name: 'エンジェル',
    description: '回復量+40%、味方の被ダメ軽減、状態異常耐性を持つサポート特化種族。マスタリーで味方が死んでも1回自動蘇生！司祭やパラディンで最高のヒーラーに。',
    baseStats: { maxHp: 85, maxMp: 90, atk: 6, def: 8, agi: 12, mag: 18 },
    passives: [
      { name: '聖なる光', description: '回復量が大幅上昇', effects: [{ type: 'healBonus', value: 40 }] },
      { name: '守護の翼', description: '味方の被ダメージを軽減', effects: [{ type: 'allyDefense', value: 10 }] },
      { name: '浄化', description: '状態異常耐性上昇', effects: [{ type: 'statusResist', value: 50 }] },
    ],
    skills: [
      { id: 'divine_blessing', name: '聖なる祝福', description: '味方全体を回復', type: 'heal', target: 'allAllies', multiplier: 0.9, mpCost: 22 },
    ],
    masterySkill: { name: '奇跡の復活', description: '味方死亡時、戦闘中1回蘇生', type: 'passive', effects: [{ type: 'autoRevive', value: 1 }] },
  },
  demon: {
    id: 'demon',
    name: 'デーモン',
    description: '高いMAGと魔法ダメ+25%、HP吸収15%を持つ闇の魔法使い。敵の命中率を下げて生存力も高い。マスタリーでHP消費して超火力魔法！ウィッチやネクロと相性◎',
    baseStats: { maxHp: 95, maxMp: 70, atk: 10, def: 9, agi: 10, mag: 18 },
    passives: [
      { name: '闇の力', description: '魔法威力が上昇', effects: [{ type: 'magicBonus', value: 25 }] },
      { name: '生命吸収', description: '与ダメージの一部をHP回復', effects: [{ type: 'hpSteal', value: 15 }] },
      { name: '恐怖のオーラ', description: '敵の命中率を下げる', effects: [{ type: 'evasionBonus', value: 15 }] },
    ],
    skills: [
      { id: 'curse_eye', name: '呪いの眼', description: '敵の攻撃・防御を低下', type: 'debuff', target: 'single', multiplier: 0, mpCost: 14, effect: { type: 'statDown', value: 25, duration: 3 } },
    ],
    masterySkill: {
      name: '魂の契約',
      description: 'HP消費で超高威力魔法',
      type: 'active',
      skill: { id: 'soul_pact', name: '魂の契約', description: 'HP20%消費、超高威力魔法', type: 'magic', target: 'single', multiplier: 4.0, mpCost: 30 },
    },
  },
};

export type RaceType = keyof typeof races;
export const raceList = Object.values(races);
