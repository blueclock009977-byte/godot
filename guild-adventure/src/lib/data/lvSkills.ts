// レベルスキルデータ（Lv3, Lv5で習得）
// 種族12 × 2 + 職業16 × 2 = 56スキル

import { Stats, Effect } from '../types';

export interface LvSkill {
  id: string;
  name: string;
  description: string;
  statModifiers?: Partial<Stats>;
  effects?: Effect[];
}

// ============================================
// 種族Lvスキル（12種族 × 2 = 24）
// ============================================

export const raceLvSkills: Record<string, LvSkill> = {
  // 人間
  human_lv3: {
    id: 'human_lv3',
    name: '適応力',
    description: '全ステータス+5',
    statModifiers: { hp: 5, atk: 5, def: 5, agi: 5 },
  },
  human_lv5: {
    id: 'human_lv5',
    name: '万能の才',
    description: '全ステータス+10',
    statModifiers: { hp: 10, atk: 10, def: 10, agi: 10 },
  },
  
  // エルフ
  elf_lv3: {
    id: 'elf_lv3',
    name: '精霊の加護',
    description: '魔法+15',
    statModifiers: { mag: 15 },
  },
  elf_lv5: {
    id: 'elf_lv5',
    name: '森の祝福',
    description: '魔法+10、回避+20%',
    statModifiers: { mag: 10 },
    effects: [{ type: 'evasionBonus', value: 20 }],
  },
  
  // ドワーフ
  dwarf_lv3: {
    id: 'dwarf_lv3',
    name: '鋼の肉体',
    description: '防御+20',
    statModifiers: { def: 20 },
  },
  dwarf_lv5: {
    id: 'dwarf_lv5',
    name: '不屈の魂',
    description: 'HP+30、防御+15',
    statModifiers: { hp: 30, def: 15 },
  },
  
  // オーク
  orc_lv3: {
    id: 'orc_lv3',
    name: '蛮族の怒り',
    description: '攻撃+20',
    statModifiers: { atk: 20 },
  },
  orc_lv5: {
    id: 'orc_lv5',
    name: '破壊衝動',
    description: '攻撃+25、HP+20',
    statModifiers: { atk: 25, hp: 20 },
  },
  
  // ゴブリン
  goblin_lv3: {
    id: 'goblin_lv3',
    name: '狡猾',
    description: '素早さ+15、回避+10%',
    statModifiers: { agi: 15 },
    effects: [{ type: 'evasionBonus', value: 10 }],
  },
  goblin_lv5: {
    id: 'goblin_lv5',
    name: '卑怯な一撃',
    description: 'クリティカル率+15%',
    effects: [{ type: 'critBonus', value: 15 }],
  },
  
  // リザードマン
  lizardman_lv3: {
    id: 'lizardman_lv3',
    name: '硬い鱗',
    description: '防御+15、被ダメ-5%',
    statModifiers: { def: 15 },
    effects: [{ type: 'damageReduction', value: 5 }],
  },
  lizardman_lv5: {
    id: 'lizardman_lv5',
    name: '冷血',
    description: '状態異常耐性+30%',
    effects: [{ type: 'statusResist', value: 30 }],
  },
  
  // フェアリー
  fairy_lv3: {
    id: 'fairy_lv3',
    name: '妖精の踊り',
    description: '回避+25%',
    effects: [{ type: 'evasionBonus', value: 25 }],
  },
  fairy_lv5: {
    id: 'fairy_lv5',
    name: '幻惑',
    description: '回避+15%、命中+15%',
    effects: [
      { type: 'evasionBonus', value: 15 },
      { type: 'accuracyBonus', value: 15 },
    ],
  },
  
  // ハーフリング
  halfling_lv3: {
    id: 'halfling_lv3',
    name: '幸運の星',
    description: '回避+10%、素早さ+10',
    statModifiers: { agi: 10 },
    effects: [{ type: 'evasionBonus', value: 10 }],
  },
  halfling_lv5: {
    id: 'halfling_lv5',
    name: '奇跡',
    description: 'クリティカル+10%、回避+15%',
    effects: [
      { type: 'critBonus', value: 10 },
      { type: 'evasionBonus', value: 15 },
    ],
  },
  
  // 獣人
  beastman_lv3: {
    id: 'beastman_lv3',
    name: '野生の本能',
    description: '素早さ+20',
    statModifiers: { agi: 20 },
  },
  beastman_lv5: {
    id: 'beastman_lv5',
    name: '獣化',
    description: '攻撃+20、素早さ+15',
    statModifiers: { atk: 20, agi: 15 },
  },
  
  // 魔族
  demon_lv3: {
    id: 'demon_lv3',
    name: '魔力の波動',
    description: '魔法+20',
    statModifiers: { mag: 20 },
  },
  demon_lv5: {
    id: 'demon_lv5',
    name: '深淵の力',
    description: 'HP50%以下で全ダメージ+80%',
    effects: [
      { type: 'lowHpDamageBonus', value: 80 },
      { type: 'lowHpThreshold', value: 50 },
    ],
  },
  
  // 天使
  angel_lv3: {
    id: 'angel_lv3',
    name: '聖なる光',
    description: '魔法+15、被ダメ-5%',
    statModifiers: { mag: 15 },
    effects: [{ type: 'damageReduction', value: 5 }],
  },
  angel_lv5: {
    id: 'angel_lv5',
    name: '神聖なる守護',
    description: '被ダメ-15%、HP+15',
    statModifiers: { hp: 15 },
    effects: [{ type: 'damageReduction', value: 15 }],
  },
  
  // ドラゴニュート
  dragonewt_lv3: {
    id: 'dragonewt_lv3',
    name: '竜の威圧',
    description: '攻撃+15、防御+10',
    statModifiers: { atk: 15, def: 10 },
  },
  dragonewt_lv5: {
    id: 'dragonewt_lv5',
    name: '竜の血',
    description: 'HP+40、状態異常耐性+10%',
    statModifiers: { hp: 40 },
    effects: [{ type: 'statusResist', value: 10 }],
  },
};

// ============================================
// 職業Lvスキル（16職業 × 2 = 32）
// ============================================

export const jobLvSkills: Record<string, LvSkill> = {
  // 戦士
  warrior_lv3: {
    id: 'warrior_lv3',
    name: '闘志',
    description: 'HP+25、攻撃+10',
    statModifiers: { hp: 25, atk: 10 },
  },
  warrior_lv5: {
    id: 'warrior_lv5',
    name: '武の極み',
    description: '攻撃回数+1',
    effects: [{ type: 'bonusHits', value: 1 }],
  },
  
  // 騎士
  knight_lv3: {
    id: 'knight_lv3',
    name: '鉄壁',
    description: '防御+25',
    statModifiers: { def: 25 },
  },
  knight_lv5: {
    id: 'knight_lv5',
    name: '守護の誓い',
    description: '防御+20、HP+20',
    statModifiers: { def: 20, hp: 20 },
  },
  
  // 狩人
  hunter_lv3: {
    id: 'hunter_lv3',
    name: '鷹の目',
    description: '命中+20%',
    effects: [{ type: 'accuracyBonus', value: 20 }],
  },
  hunter_lv5: {
    id: 'hunter_lv5',
    name: '急所狙い',
    description: 'クリティカルダメージ+30%',
    effects: [{ type: 'critDamage', value: 30 }],
  },
  
  // 盗賊
  thief_lv3: {
    id: 'thief_lv3',
    name: '俊敏',
    description: '素早さ+20、回避+10%',
    statModifiers: { agi: 20 },
    effects: [{ type: 'evasionBonus', value: 10 }],
  },
  thief_lv5: {
    id: 'thief_lv5',
    name: '暗殺術',
    description: 'クリティカル率+20%',
    effects: [{ type: 'critBonus', value: 20 }],
  },
  
  // 魔法使い
  mage_lv3: {
    id: 'mage_lv3',
    name: '魔力集中',
    description: '魔法+25',
    statModifiers: { mag: 25 },
  },
  mage_lv5: {
    id: 'mage_lv5',
    name: '魔力暴走',
    description: '魔法威力+20%',
    effects: [{ type: 'magicBonus', value: 20 }],
  },
  
  // 僧侶
  priest_lv3: {
    id: 'priest_lv3',
    name: '慈愛',
    description: '回復量+20%',
    effects: [{ type: 'healBonus', value: 20 }],
  },
  priest_lv5: {
    id: 'priest_lv5',
    name: '神の恩寵',
    description: 'HP+30、被ダメ-10%',
    statModifiers: { hp: 30 },
    effects: [{ type: 'damageReduction', value: 10 }],
  },
  
  // 武闘家
  monk_lv3: {
    id: 'monk_lv3',
    name: '練気',
    description: '攻撃+15、素早さ+15',
    statModifiers: { atk: 15, agi: 15 },
  },
  monk_lv5: {
    id: 'monk_lv5',
    name: '無拍子',
    description: '2回攻撃確率+15%',
    effects: [{ type: 'doubleAttack', value: 15 }],
  },
  
  // 暗殺者
  assassin_lv3: {
    id: 'assassin_lv3',
    name: '影潜み',
    description: '先制率+30%',
    effects: [{ type: 'firstStrikeBonus', value: 30 }],
  },
  assassin_lv5: {
    id: 'assassin_lv5',
    name: '必殺',
    description: 'クリティカルダメージ+50%',
    effects: [{ type: 'critDamage', value: 50 }],
  },
  
  // 聖騎士
  paladin_lv3: {
    id: 'paladin_lv3',
    name: '聖盾',
    description: '防御+15、被ダメ-5%',
    statModifiers: { def: 15 },
    effects: [{ type: 'damageReduction', value: 5 }],
  },
  paladin_lv5: {
    id: 'paladin_lv5',
    name: '聖域',
    description: '被ダメージ-15%',
    effects: [{ type: 'damageReduction', value: 15 }],
  },
  
  // 魔剣士
  darkKnight_lv3: {
    id: 'darkKnight_lv3',
    name: '魔剣',
    description: '攻撃+15、魔法+15',
    statModifiers: { atk: 15, mag: 15 },
  },
  darkKnight_lv5: {
    id: 'darkKnight_lv5',
    name: '闘魔融合',
    description: '物理・魔法威力+15%',
    effects: [
      { type: 'physicalBonus', value: 15 },
      { type: 'magicBonus', value: 15 },
    ],
  },
  
  // 賢者
  sage_lv3: {
    id: 'sage_lv3',
    name: '叡智',
    description: '魔法+15、被ダメ-5%',
    statModifiers: { mag: 15 },
    effects: [{ type: 'damageReduction', value: 5 }],
  },
  sage_lv5: {
    id: 'sage_lv5',
    name: '魔力還元',
    description: 'HP吸収+10%',
    effects: [{ type: 'hpSteal', value: 10 }],
  },
  
  // 吟遊詩人
  bard_lv3: {
    id: 'bard_lv3',
    name: '戦いの歌',
    description: '素早さ+15、命中+10%',
    statModifiers: { agi: 15 },
    effects: [{ type: 'accuracyBonus', value: 10 }],
  },
  bard_lv5: {
    id: 'bard_lv5',
    name: '英雄譚',
    description: '攻撃+10、防御+10、素早さ+10',
    statModifiers: { atk: 10, def: 10, agi: 10 },
  },
  
  // 錬金術師
  alchemist_lv3: {
    id: 'alchemist_lv3',
    name: '調合',
    description: '回復量+30%',
    effects: [{ type: 'healBonus', value: 30 }],
  },
  alchemist_lv5: {
    id: 'alchemist_lv5',
    name: '賢者の石',
    description: 'HP+20、攻撃+5、防御+5、素早さ+5',
    statModifiers: { hp: 20, atk: 5, def: 5, agi: 5 },
  },
  
  // 召喚士
  summoner_lv3: {
    id: 'summoner_lv3',
    name: '契約強化',
    description: '魔法+20',
    statModifiers: { mag: 20 },
  },
  summoner_lv5: {
    id: 'summoner_lv5',
    name: '召喚獣の加護',
    description: '与ダメージ+15%',
    effects: [{ type: 'damageBonus', value: 15 }],
  },
  
  // 踊り子
  dancer_lv3: {
    id: 'dancer_lv3',
    name: '魅惑の舞',
    description: '回避+20%、素早さ+10',
    statModifiers: { agi: 10 },
    effects: [{ type: 'evasionBonus', value: 20 }],
  },
  dancer_lv5: {
    id: 'dancer_lv5',
    name: '死の舞踏',
    description: '回避+25%、クリティカル+10%',
    effects: [
      { type: 'evasionBonus', value: 25 },
      { type: 'critBonus', value: 10 },
    ],
  },
  
  // 忍者
  ninja_lv3: {
    id: 'ninja_lv3',
    name: '隠密',
    description: '回避+25%',
    effects: [{ type: 'evasionBonus', value: 25 }],
  },
  ninja_lv5: {
    id: 'ninja_lv5',
    name: '影分身',
    description: '完全回避率50%',
    effects: [{ type: 'perfectEvasion', value: 50 }],
  },
};

// 全Lvスキルを統合
export const allLvSkills: Record<string, LvSkill> = {
  ...raceLvSkills,
  ...jobLvSkills,
};

// スキルID→スキルデータ取得
export function getLvSkill(skillId: string): LvSkill | undefined {
  return allLvSkills[skillId];
}
