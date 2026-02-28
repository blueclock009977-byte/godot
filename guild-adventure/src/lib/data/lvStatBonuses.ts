// レベルアップ時のステータスボーナス（Lv2, Lv4で獲得）
// 種族16 × 2 + 職業20 × 2 = 72ボーナス

import { Stats } from '../types';

export interface LvStatBonus {
  id: string;
  name: string;
  description: string;
  statModifiers: Partial<Stats>;
}

// ============================================
// 種族Lvボーナス（12種族 × 2 = 24）
// ============================================

export const raceLvBonuses: Record<string, LvStatBonus> = {
  // 人間 - バランス型
  human_lv2: {
    id: 'human_lv2',
    name: '適応の兆し',
    description: '全ステ+3',
    statModifiers: { maxHp: 3, atk: 3, def: 3, agi: 3, mag: 3 },
  },
  human_lv4: {
    id: 'human_lv4',
    name: '適応の証',
    description: '全ステ+5',
    statModifiers: { maxHp: 5, atk: 5, def: 5, agi: 5, mag: 5 },
  },
  
  // エルフ - 魔法・素早さ型
  elf_lv2: {
    id: 'elf_lv2',
    name: '森の息吹',
    description: 'MAG+8, AGI+5',
    statModifiers: { mag: 8, agi: 5 },
  },
  elf_lv4: {
    id: 'elf_lv4',
    name: '精霊の導き',
    description: 'MAG+12, AGI+8',
    statModifiers: { mag: 12, agi: 8 },
  },
  
  // ドワーフ - HP・防御型
  dwarf_lv2: {
    id: 'dwarf_lv2',
    name: '岩の身体',
    description: 'HP+20, DEF+8',
    statModifiers: { maxHp: 20, def: 8 },
  },
  dwarf_lv4: {
    id: 'dwarf_lv4',
    name: '鉄の意志',
    description: 'HP+30, DEF+12',
    statModifiers: { maxHp: 30, def: 12 },
  },
  
  // ハーフリング - 素早さ・回避型
  halfling_lv2: {
    id: 'halfling_lv2',
    name: '軽やかな足',
    description: 'AGI+10, DEF+3',
    statModifiers: { agi: 10, def: 3 },
  },
  halfling_lv4: {
    id: 'halfling_lv4',
    name: '風の如く',
    description: 'AGI+15, ATK+5',
    statModifiers: { agi: 15, atk: 5 },
  },
  
  // オーク - 攻撃・HP型
  orc_lv2: {
    id: 'orc_lv2',
    name: '野獣の力',
    description: 'ATK+10, HP+15',
    statModifiers: { atk: 10, maxHp: 15 },
  },
  orc_lv4: {
    id: 'orc_lv4',
    name: '猛獣の咆哮',
    description: 'ATK+15, HP+20',
    statModifiers: { atk: 15, maxHp: 20 },
  },
  
  // リザードマン - HP・防御型
  lizardman_lv2: {
    id: 'lizardman_lv2',
    name: '堅牢な鱗',
    description: 'HP+18, DEF+5',
    statModifiers: { maxHp: 18, def: 5 },
  },
  lizardman_lv4: {
    id: 'lizardman_lv4',
    name: '竜鱗の守り',
    description: 'HP+25, DEF+10',
    statModifiers: { maxHp: 25, def: 10 },
  },
  
  // フェアリー - 魔法・MP型
  fairy_lv2: {
    id: 'fairy_lv2',
    name: '妖精の輝き',
    description: 'MAG+10, MP+8',
    statModifiers: { mag: 10, maxMp: 8 },
  },
  fairy_lv4: {
    id: 'fairy_lv4',
    name: '光の恩恵',
    description: 'MAG+15, MP+12',
    statModifiers: { mag: 15, maxMp: 12 },
  },
  
  // アンデッド - HP・攻撃型
  undead_lv2: {
    id: 'undead_lv2',
    name: '不滅の肉体',
    description: 'HP+20, ATK+5',
    statModifiers: { maxHp: 20, atk: 5 },
  },
  undead_lv4: {
    id: 'undead_lv4',
    name: '死を超えし者',
    description: 'HP+30, ATK+10',
    statModifiers: { maxHp: 30, atk: 10 },
  },
  
  // ゴブリン - 素早さ・攻撃型
  goblin_lv2: {
    id: 'goblin_lv2',
    name: '狡猾な動き',
    description: 'AGI+8, ATK+5',
    statModifiers: { agi: 8, atk: 5 },
  },
  goblin_lv4: {
    id: 'goblin_lv4',
    name: '集団の知恵',
    description: 'AGI+12, ATK+8',
    statModifiers: { agi: 12, atk: 8 },
  },
  
  // ドラゴニュート - 攻撃・防御型
  dragonewt_lv2: {
    id: 'dragonewt_lv2',
    name: '竜の片鱗',
    description: 'ATK+8, DEF+6',
    statModifiers: { atk: 8, def: 6 },
  },
  dragonewt_lv4: {
    id: 'dragonewt_lv4',
    name: '竜の継承',
    description: 'ATK+12, DEF+10, HP+10',
    statModifiers: { atk: 12, def: 10, maxHp: 10 },
  },
  
  // エンジェル - 魔法・HP型
  angel_lv2: {
    id: 'angel_lv2',
    name: '聖なる力',
    description: 'MAG+8, HP+10',
    statModifiers: { mag: 8, maxHp: 10 },
  },
  angel_lv4: {
    id: 'angel_lv4',
    name: '天使の祝福',
    description: 'MAG+12, HP+15, MP+5',
    statModifiers: { mag: 12, maxHp: 15, maxMp: 5 },
  },
  
  // デーモン - 攻撃・魔法型
  demon_lv2: {
    id: 'demon_lv2',
    name: '魔の力',
    description: 'ATK+8, MAG+8',
    statModifiers: { atk: 8, mag: 8 },
  },
  demon_lv4: {
    id: 'demon_lv4',
    name: '深淵の力',
    description: 'ATK+12, MAG+12',
    statModifiers: { atk: 12, mag: 12 },
  },

  // ジェナシ - 元素・両刀型
  genasi_lv2: {
    id: 'genasi_lv2',
    name: '元素の目覚め',
    description: 'ATK+5, MAG+5, MP+10',
    statModifiers: { atk: 5, mag: 5, maxMp: 10 },
  },
  genasi_lv4: {
    id: 'genasi_lv4',
    name: '元素の覚醒',
    description: 'ATK+8, MAG+8, MP+15',
    statModifiers: { atk: 8, mag: 8, maxMp: 15 },
  },

  // アアシマール - 万能型
  aasimar_lv2: {
    id: 'aasimar_lv2',
    name: '聖なる光',
    description: 'MAG+8, HP+10, DEF+3',
    statModifiers: { mag: 8, maxHp: 10, def: 3 },
  },
  aasimar_lv4: {
    id: 'aasimar_lv4',
    name: '天使の祝福',
    description: 'MAG+12, HP+15, DEF+5',
    statModifiers: { mag: 12, maxHp: 15, def: 5 },
  },

  // ティーフリング - 攻撃・魔法型
  tiefling_lv2: {
    id: 'tiefling_lv2',
    name: '闘争本能',
    description: 'ATK+7, MAG+7',
    statModifiers: { atk: 7, mag: 7 },
  },
  tiefling_lv4: {
    id: 'tiefling_lv4',
    name: '悪魔の血脈',
    description: 'ATK+10, MAG+10',
    statModifiers: { atk: 10, mag: 10 },
  },

  // ダンピール - 攻撃・HP型
  dhampir_lv2: {
    id: 'dhampir_lv2',
    name: '渇きの衝動',
    description: 'ATK+8, HP+15',
    statModifiers: { atk: 8, maxHp: 15 },
  },
  dhampir_lv4: {
    id: 'dhampir_lv4',
    name: '真祖の覚醒',
    description: 'ATK+12, HP+20, AGI+5',
    statModifiers: { atk: 12, maxHp: 20, agi: 5 },
  },
};

// ============================================
// 職業Lvボーナス（16職業 × 2 = 32）
// ============================================

export const jobLvBonuses: Record<string, LvStatBonus> = {
  // 戦士 - 攻撃・HP型
  warrior_lv2: {
    id: 'warrior_lv2',
    name: '戦士の鍛錬',
    description: 'ATK+10, HP+10',
    statModifiers: { atk: 10, maxHp: 10 },
  },
  warrior_lv4: {
    id: 'warrior_lv4',
    name: '熟練の技',
    description: 'ATK+15, HP+15',
    statModifiers: { atk: 15, maxHp: 15 },
  },
  
  // 魔法使い - 魔法・MP型
  mage_lv2: {
    id: 'mage_lv2',
    name: '魔力の研鑽',
    description: 'MAG+12, MP+8',
    statModifiers: { mag: 12, maxMp: 8 },
  },
  mage_lv4: {
    id: 'mage_lv4',
    name: '秘術の習得',
    description: 'MAG+18, MP+12',
    statModifiers: { mag: 18, maxMp: 12 },
  },
  
  // 司祭 - 魔法・HP型
  priest_lv2: {
    id: 'priest_lv2',
    name: '信仰の力',
    description: 'MAG+8, HP+12',
    statModifiers: { mag: 8, maxHp: 12 },
  },
  priest_lv4: {
    id: 'priest_lv4',
    name: '神の加護',
    description: 'MAG+12, HP+18, MP+5',
    statModifiers: { mag: 12, maxHp: 18, maxMp: 5 },
  },
  
  // 盗賊 - 素早さ・攻撃型
  thief_lv2: {
    id: 'thief_lv2',
    name: '素早い手',
    description: 'AGI+10, ATK+5',
    statModifiers: { agi: 10, atk: 5 },
  },
  thief_lv4: {
    id: 'thief_lv4',
    name: '影の技',
    description: 'AGI+15, ATK+10',
    statModifiers: { agi: 15, atk: 10 },
  },
  
  // 騎士 - 防御・HP型
  knight_lv2: {
    id: 'knight_lv2',
    name: '騎士の誇り',
    description: 'DEF+10, HP+15',
    statModifiers: { def: 10, maxHp: 15 },
  },
  knight_lv4: {
    id: 'knight_lv4',
    name: '鉄壁の守り',
    description: 'DEF+15, HP+25',
    statModifiers: { def: 15, maxHp: 25 },
  },
  
  // 狩人 - 素早さ・攻撃型
  hunter_lv2: {
    id: 'hunter_lv2',
    name: '狩りの本能',
    description: 'AGI+8, ATK+8',
    statModifiers: { agi: 8, atk: 8 },
  },
  hunter_lv4: {
    id: 'hunter_lv4',
    name: '獲物を狙う眼',
    description: 'AGI+12, ATK+12',
    statModifiers: { agi: 12, atk: 12 },
  },
  
  // 忍者 - 素早さ特化
  ninja_lv2: {
    id: 'ninja_lv2',
    name: '忍びの歩み',
    description: 'AGI+12, ATK+3',
    statModifiers: { agi: 12, atk: 3 },
  },
  ninja_lv4: {
    id: 'ninja_lv4',
    name: '影渡り',
    description: 'AGI+18, ATK+7',
    statModifiers: { agi: 18, atk: 7 },
  },
  
  // 賢者 - バランス魔法型
  sage_lv2: {
    id: 'sage_lv2',
    name: '知識の探求',
    description: 'MAG+10, MP+10',
    statModifiers: { mag: 10, maxMp: 10 },
  },
  sage_lv4: {
    id: 'sage_lv4',
    name: '叡智の結晶',
    description: 'MAG+15, MP+15',
    statModifiers: { mag: 15, maxMp: 15 },
  },
  
  // バーサーカー - 攻撃特化
  berserker_lv2: {
    id: 'berserker_lv2',
    name: '狂戦士の血',
    description: 'ATK+15, HP+5',
    statModifiers: { atk: 15, maxHp: 5 },
  },
  berserker_lv4: {
    id: 'berserker_lv4',
    name: '破壊の衝動',
    description: 'ATK+22, HP+8',
    statModifiers: { atk: 22, maxHp: 8 },
  },
  
  // パラディン - 防御・魔法型
  paladin_lv2: {
    id: 'paladin_lv2',
    name: '聖騎士の心得',
    description: 'DEF+8, MAG+5, HP+10',
    statModifiers: { def: 8, mag: 5, maxHp: 10 },
  },
  paladin_lv4: {
    id: 'paladin_lv4',
    name: '神聖なる盾',
    description: 'DEF+12, MAG+8, HP+15',
    statModifiers: { def: 12, mag: 8, maxHp: 15 },
  },
  
  // ネクロマンサー - 魔法・HP型
  necromancer_lv2: {
    id: 'necromancer_lv2',
    name: '死霊の知識',
    description: 'MAG+10, HP+8',
    statModifiers: { mag: 10, maxHp: 8 },
  },
  necromancer_lv4: {
    id: 'necromancer_lv4',
    name: '冥界の秘術',
    description: 'MAG+15, HP+12',
    statModifiers: { mag: 15, maxHp: 12 },
  },
  
  // モンク - 攻撃・素早さ型
  monk_lv2: {
    id: 'monk_lv2',
    name: '拳の鍛錬',
    description: 'ATK+8, AGI+8',
    statModifiers: { atk: 8, agi: 8 },
  },
  monk_lv4: {
    id: 'monk_lv4',
    name: '無拍子',
    description: 'ATK+12, AGI+12',
    statModifiers: { atk: 12, agi: 12 },
  },
  
  // レンジャー - バランス型
  ranger_lv2: {
    id: 'ranger_lv2',
    name: '野生の勘',
    description: 'AGI+6, ATK+5, DEF+5',
    statModifiers: { agi: 6, atk: 5, def: 5 },
  },
  ranger_lv4: {
    id: 'ranger_lv4',
    name: '森の導き',
    description: 'AGI+10, ATK+8, DEF+8',
    statModifiers: { agi: 10, atk: 8, def: 8 },
  },
  
  // サムライ - 攻撃・素早さ型
  samurai_lv2: {
    id: 'samurai_lv2',
    name: '武士の心',
    description: 'ATK+10, AGI+6',
    statModifiers: { atk: 10, agi: 6 },
  },
  samurai_lv4: {
    id: 'samurai_lv4',
    name: '剣の道',
    description: 'ATK+15, AGI+10',
    statModifiers: { atk: 15, agi: 10 },
  },
  
  // 呪術師 - 魔法特化
  witch_lv2: {
    id: 'witch_lv2',
    name: '呪いの習得',
    description: 'MAG+12, MP+5',
    statModifiers: { mag: 12, maxMp: 5 },
  },
  witch_lv4: {
    id: 'witch_lv4',
    name: '禁断の知識',
    description: 'MAG+18, MP+8',
    statModifiers: { mag: 18, maxMp: 8 },
  },
  
  // 吟遊詩人 - バランス支援型
  bard_lv2: {
    id: 'bard_lv2',
    name: '旅の経験',
    description: 'AGI+5, MAG+5, HP+8',
    statModifiers: { agi: 5, mag: 5, maxHp: 8 },
  },
  bard_lv4: {
    id: 'bard_lv4',
    name: '伝説の詩',
    description: 'AGI+8, MAG+8, HP+12',
    statModifiers: { agi: 8, mag: 8, maxHp: 12 },
  },
  
  // 踊り子 - 素早さ・魔法型
  dancer_lv2: {
    id: 'dancer_lv2',
    name: '軽やかなステップ',
    description: 'AGI+10, MAG+5',
    statModifiers: { agi: 10, mag: 5 },
  },
  dancer_lv4: {
    id: 'dancer_lv4',
    name: '魅惑の舞踏',
    description: 'AGI+15, MAG+10',
    statModifiers: { agi: 15, mag: 10 },
  },

  // 魔法剣士 - 両刀型
  spellblade_lv2: {
    id: 'spellblade_lv2',
    name: '魔法剣の基礎',
    description: 'ATK+5, MAG+5',
    statModifiers: { atk: 5, mag: 5 },
  },
  spellblade_lv4: {
    id: 'spellblade_lv4',
    name: '剣魔一体',
    description: 'ATK+8, MAG+8, MP+10',
    statModifiers: { atk: 8, mag: 8, maxMp: 10 },
  },

  // 戦闘魔導士 - 魔法寄り両刀
  battlemage_lv2: {
    id: 'battlemage_lv2',
    name: '戦闘魔術の心得',
    description: 'MAG+7, ATK+5, HP+10',
    statModifiers: { mag: 7, atk: 5, maxHp: 10 },
  },
  battlemage_lv4: {
    id: 'battlemage_lv4',
    name: '魔導戦士の覚醒',
    description: 'MAG+10, ATK+8, HP+15',
    statModifiers: { mag: 10, atk: 8, maxHp: 15 },
  },

  // 符術士 - バランス両刀
  runesmith_lv2: {
    id: 'runesmith_lv2',
    name: 'ルーンの知識',
    description: 'ATK+5, MAG+5, DEF+3',
    statModifiers: { atk: 5, mag: 5, def: 3 },
  },
  runesmith_lv4: {
    id: 'runesmith_lv4',
    name: '大符術師',
    description: 'ATK+8, MAG+8, DEF+5',
    statModifiers: { atk: 8, mag: 8, def: 5 },
  },

  // 赤魔道士 - 万能型
  redmage_lv2: {
    id: 'redmage_lv2',
    name: '赤魔法の基礎',
    description: 'ATK+4, MAG+4, AGI+4',
    statModifiers: { atk: 4, mag: 4, agi: 4 },
  },
  redmage_lv4: {
    id: 'redmage_lv4',
    name: '万能の極意',
    description: 'ATK+6, MAG+6, AGI+6, HP+10',
    statModifiers: { atk: 6, mag: 6, agi: 6, maxHp: 10 },
  },
};

// 全Lvボーナスを統合
export const allLvBonuses: Record<string, LvStatBonus> = {
  ...raceLvBonuses,
  ...jobLvBonuses,
};

// ボーナスID→ボーナスデータ取得
export function getLvBonus(bonusId: string): LvStatBonus | undefined {
  return allLvBonuses[bonusId];
}
