// レベルスキルデータ（Lv3, Lv5で習得）
// 種族12 × 2 + 職業16 × 2 = 56スキル
// 設計書に基づく強力な効果

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
  // 人間 - ドロップ特化
  human_lv3: {
    id: 'human_lv3',
    name: '学習能力',
    description: 'ドロップ率+30%',
    effects: [{ type: 'dropBonus', value: 30 }],
  },
  human_lv5: {
    id: 'human_lv5',
    name: '幸運の極み',
    description: 'ドロップ率+50%、クリティカル+15%',
    effects: [
      { type: 'dropBonus', value: 50 },
      { type: 'critBonus', value: 15 },
    ],
  },
  
  // エルフ - 魔法特化
  elf_lv3: {
    id: 'elf_lv3',
    name: '詠唱加速',
    description: '魔法ダメージ+25%、先制+20',
    effects: [
      { type: 'magicBonus', value: 25 },
      { type: 'firstStrikeBonus', value: 20 },
    ],
  },
  elf_lv5: {
    id: 'elf_lv5',
    name: '精霊の怒り',
    description: '魔法ダメージ+50%',
    effects: [{ type: 'magicBonus', value: 50 }],
  },
  
  // ドワーフ - タンク特化
  dwarf_lv3: {
    id: 'dwarf_lv3',
    name: '頑固一徹',
    description: '状態異常耐性+50%、被ダメ-10%',
    effects: [
      { type: 'statusResist', value: 50 },
      { type: 'damageReduction', value: 10 },
    ],
  },
  dwarf_lv5: {
    id: 'dwarf_lv5',
    name: '山の心臓',
    description: 'HP+100、被ダメ-25%',
    statModifiers: { maxHp: 100 },
    effects: [{ type: 'damageReduction', value: 25 }],
  },
  
  // ハーフリング - クリティカル特化
  halfling_lv3: {
    id: 'halfling_lv3',
    name: '幸運の風',
    description: 'クリティカル+20%、回避+15%',
    effects: [
      { type: 'critBonus', value: 20 },
      { type: 'evasionBonus', value: 15 },
    ],
  },
  halfling_lv5: {
    id: 'halfling_lv5',
    name: '星の導き',
    description: 'クリダメ+100%、クリティカル+10%',
    effects: [
      { type: 'critDamage', value: 100 },
      { type: 'critBonus', value: 10 },
    ],
  },
  
  // オーク - 火力特化
  orc_lv3: {
    id: 'orc_lv3',
    name: '肉の鎧',
    description: '被ダメ-15%（デメリット相殺）、HP+30',
    statModifiers: { maxHp: 30 },
    effects: [{ type: 'damageReduction', value: 15 }],
  },
  orc_lv5: {
    id: 'orc_lv5',
    name: '破壊衝動',
    description: '与ダメ+40%、物理+30%',
    effects: [
      { type: 'damageBonus', value: 40 },
      { type: 'physicalBonus', value: 30 },
    ],
  },
  
  // リザードマン - 回復特化
  lizardman_lv3: {
    id: 'lizardman_lv3',
    name: '脱皮',
    description: '状態異常耐性+40%、HP回復+5/ターン',
    effects: [
      { type: 'statusResist', value: 40 },
      { type: 'hpRegen', value: 5 },
    ],
  },
  lizardman_lv5: {
    id: 'lizardman_lv5',
    name: '原始の血',
    description: 'HP回復+15/ターン、HP+50',
    statModifiers: { maxHp: 50 },
    effects: [{ type: 'hpRegen', value: 15 }],
  },
  
  // フェアリー - 支援特化
  fairy_lv3: {
    id: 'fairy_lv3',
    name: '祝福の粉',
    description: '回復量+30%、MP回復+3/ターン',
    effects: [
      { type: 'healBonus', value: 30 },
      { type: 'mpRegen', value: 3 },
    ],
  },
  fairy_lv5: {
    id: 'fairy_lv5',
    name: '大妖精化',
    description: '味方全体HP回復+5/ターン、魔法+20%',
    effects: [
      { type: 'hpRegen', value: 5 },
      { type: 'magicBonus', value: 20 },
    ],
  },
  
  // アンデッド - HP吸収特化
  undead_lv3: {
    id: 'undead_lv3',
    name: '恐怖の眼差し',
    description: '威圧+15%（敵ATK低下）、HP吸収+10%',
    effects: [
      { type: 'intimidate', value: 15 },
      { type: 'hpSteal', value: 10 },
    ],
  },
  undead_lv5: {
    id: 'undead_lv5',
    name: '不滅の肉体',
    description: '致死ダメージを1回だけHP1で耐える',
    effects: [{ type: 'surviveLethal', value: 1 }],
  },
  
  // ゴブリン - 集団戦特化
  goblin_lv3: {
    id: 'goblin_lv3',
    name: '連携攻撃',
    description: '追撃率+15%、先制+15',
    effects: [
      { type: 'followUp', value: 15 },
      { type: 'firstStrikeBonus', value: 15 },
    ],
  },
  goblin_lv5: {
    id: 'goblin_lv5',
    name: '群れの王',
    description: '味方数ボーナス+10%、与ダメ+25%',
    effects: [
      { type: 'allyCountBonus', value: 10 },
      { type: 'damageBonus', value: 25 },
    ],
  },
  
  // ドラゴニュート - 属性・物理特化
  dragonewt_lv3: {
    id: 'dragonewt_lv3',
    name: '竜鱗強化',
    description: '被ダメ-20%、HP+40',
    statModifiers: { maxHp: 40 },
    effects: [{ type: 'damageReduction', value: 20 }],
  },
  dragonewt_lv5: {
    id: 'dragonewt_lv5',
    name: '竜の血脈',
    description: '与ダメ+50%、物理+25%',
    effects: [
      { type: 'damageBonus', value: 50 },
      { type: 'physicalBonus', value: 25 },
    ],
  },
  
  // エンジェル - 蘇生・回復特化
  angel_lv3: {
    id: 'angel_lv3',
    name: '聖なる加護',
    description: '被ダメ-15%、回復量+25%',
    effects: [
      { type: 'damageReduction', value: 15 },
      { type: 'healBonus', value: 25 },
    ],
  },
  angel_lv5: {
    id: 'angel_lv5',
    name: '神の祝福',
    description: '自動蘇生（HP50%）、回復量+40%',
    effects: [
      { type: 'autoRevive', value: 50 },
      { type: 'healBonus', value: 40 },
    ],
  },
  
  // デーモン - リスク特化
  demon_lv3: {
    id: 'demon_lv3',
    name: '悪魔の囁き',
    description: '与ダメ+20%、HP吸収+15%',
    effects: [
      { type: 'damageBonus', value: 20 },
      { type: 'hpSteal', value: 15 },
    ],
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
};

// ============================================
// 職業Lvスキル（16職業 × 2 = 32）
// ============================================

export const jobLvSkills: Record<string, LvSkill> = {
  // 戦士
  warrior_lv3: {
    id: 'warrior_lv3',
    name: '闘志',
    description: '物理+25%、ATK+15',
    statModifiers: { atk: 15 },
    effects: [{ type: 'physicalBonus', value: 25 }],
  },
  warrior_lv5: {
    id: 'warrior_lv5',
    name: '武の極み',
    description: '攻撃回数+1',
    effects: [{ type: 'bonusHits', value: 1 }],
  },
  
  // 魔法使い
  mage_lv3: {
    id: 'mage_lv3',
    name: '魔力の渦',
    description: '魔法+30%、MP消費-10%',
    effects: [
      { type: 'magicBonus', value: 30 },
      { type: 'mpReduction', value: 10 },
    ],
  },
  mage_lv5: {
    id: 'mage_lv5',
    name: '終焉の詠唱',
    description: '魔法+50%、クリティカル+20%',
    effects: [
      { type: 'magicBonus', value: 50 },
      { type: 'critBonus', value: 20 },
    ],
  },
  
  // 司祭
  priest_lv3: {
    id: 'priest_lv3',
    name: '加護の祈り',
    description: '回復量+35%、状態異常耐性+20%',
    effects: [
      { type: 'healBonus', value: 35 },
      { type: 'statusResist', value: 20 },
    ],
  },
  priest_lv5: {
    id: 'priest_lv5',
    name: '神聖結界',
    description: '味方防御+20%、被ダメ-20%',
    effects: [
      { type: 'allyDefense', value: 20 },
      { type: 'damageReduction', value: 20 },
    ],
  },
  
  // 盗賊
  thief_lv3: {
    id: 'thief_lv3',
    name: '宝探し',
    description: 'ドロップ率+25%、クリティカル+15%',
    effects: [
      { type: 'dropBonus', value: 25 },
      { type: 'critBonus', value: 15 },
    ],
  },
  thief_lv5: {
    id: 'thief_lv5',
    name: '致命の一撃',
    description: 'クリダメ+80%、クリティカル+20%',
    effects: [
      { type: 'critDamage', value: 80 },
      { type: 'critBonus', value: 20 },
    ],
  },
  
  // 騎士
  knight_lv3: {
    id: 'knight_lv3',
    name: '守りの陣',
    description: '庇う率+30%、被ダメ-15%',
    effects: [
      { type: 'cover', value: 30 },
      { type: 'damageReduction', value: 15 },
    ],
  },
  knight_lv5: {
    id: 'knight_lv5',
    name: '不動の要塞',
    description: '被ダメ-40%、HP+80',
    statModifiers: { maxHp: 80 },
    effects: [{ type: 'damageReduction', value: 40 }],
  },
  
  // 狩人
  hunter_lv3: {
    id: 'hunter_lv3',
    name: '弱点看破',
    description: '命中+25%、クリティカル+20%',
    effects: [
      { type: 'accuracyBonus', value: 25 },
      { type: 'critBonus', value: 20 },
    ],
  },
  hunter_lv5: {
    id: 'hunter_lv5',
    name: '一撃必中',
    description: 'クリティカル+35%、クリダメ+50%',
    effects: [
      { type: 'critBonus', value: 35 },
      { type: 'critDamage', value: 50 },
    ],
  },
  
  // 忍者
  ninja_lv3: {
    id: 'ninja_lv3',
    name: '煙幕',
    description: '回避+30%、クリティカル+15%',
    effects: [
      { type: 'evasionBonus', value: 30 },
      { type: 'critBonus', value: 15 },
    ],
  },
  ninja_lv5: {
    id: 'ninja_lv5',
    name: '影分身',
    description: '完全回避率50%',
    effects: [{ type: 'perfectEvasion', value: 50 }],
  },
  
  // 賢者
  sage_lv3: {
    id: 'sage_lv3',
    name: '知恵の眼',
    description: '魔法+20%、回復量+20%',
    effects: [
      { type: 'magicBonus', value: 20 },
      { type: 'healBonus', value: 20 },
    ],
  },
  sage_lv5: {
    id: 'sage_lv5',
    name: '万能の知識',
    description: '魔法+40%、MP消費-30%',
    effects: [
      { type: 'magicBonus', value: 40 },
      { type: 'mpReduction', value: 30 },
    ],
  },
  
  // バーサーカー
  berserker_lv3: {
    id: 'berserker_lv3',
    name: '痛覚遮断',
    description: '被ダメ-20%（デメリット相殺）、物理+20%',
    effects: [
      { type: 'damageReduction', value: 20 },
      { type: 'physicalBonus', value: 20 },
    ],
  },
  berserker_lv5: {
    id: 'berserker_lv5',
    name: '狂乱',
    description: 'HP25%以下で全ダメ+100%',
    effects: [
      { type: 'lowHpDamageBonus', value: 100 },
      { type: 'lowHpThreshold', value: 25 },
    ],
  },
  
  // パラディン
  paladin_lv3: {
    id: 'paladin_lv3',
    name: '聖なる光',
    description: '不死特攻+50%、回復量+20%',
    effects: [
      { type: 'speciesKiller_undead', value: 50 },
      { type: 'healBonus', value: 20 },
    ],
  },
  paladin_lv5: {
    id: 'paladin_lv5',
    name: '最後の砦',
    description: '致死HP1耐え、被ダメ-25%',
    effects: [
      { type: 'surviveLethal', value: 1 },
      { type: 'damageReduction', value: 25 },
    ],
  },
  
  // ネクロマンサー
  necromancer_lv3: {
    id: 'necromancer_lv3',
    name: '死の宣告',
    description: '魔法+25%、HP吸収+15%',
    effects: [
      { type: 'magicBonus', value: 25 },
      { type: 'hpSteal', value: 15 },
    ],
  },
  necromancer_lv5: {
    id: 'necromancer_lv5',
    name: '冥界の支配者',
    description: '魔法+50%、与ダメ+30%',
    effects: [
      { type: 'magicBonus', value: 50 },
      { type: 'damageBonus', value: 30 },
    ],
  },
  
  // モンク
  monk_lv3: {
    id: 'monk_lv3',
    name: '練気',
    description: '物理+25%、反撃率+25%',
    effects: [
      { type: 'physicalBonus', value: 25 },
      { type: 'counterRate', value: 25 },
    ],
  },
  monk_lv5: {
    id: 'monk_lv5',
    name: '阿修羅',
    description: '反撃率+50%、物理+40%',
    effects: [
      { type: 'counterRate', value: 50 },
      { type: 'physicalBonus', value: 40 },
    ],
  },
  
  // レンジャー
  ranger_lv3: {
    id: 'ranger_lv3',
    name: '大自然の恵み',
    description: 'HP回復+8/ターン、状態異常耐性+30%',
    effects: [
      { type: 'hpRegen', value: 8 },
      { type: 'statusResist', value: 30 },
    ],
  },
  ranger_lv5: {
    id: 'ranger_lv5',
    name: '森の守護者',
    description: '回避+40%、被ダメ-20%',
    effects: [
      { type: 'evasionBonus', value: 40 },
      { type: 'damageReduction', value: 20 },
    ],
  },
  
  // サムライ
  samurai_lv3: {
    id: 'samurai_lv3',
    name: '居合',
    description: 'クリティカル+25%、先制+25',
    effects: [
      { type: 'critBonus', value: 25 },
      { type: 'firstStrikeBonus', value: 25 },
    ],
  },
  samurai_lv5: {
    id: 'samurai_lv5',
    name: '剣聖',
    description: 'クリダメ+100%',
    effects: [{ type: 'critDamage', value: 100 }],
  },
  
  // 魔女（witch）
  witch_lv3: {
    id: 'witch_lv3',
    name: '呪いの連鎖',
    description: 'デバフ+30%、魔法+20%',
    effects: [
      { type: 'debuffBonus', value: 30 },
      { type: 'magicBonus', value: 20 },
    ],
  },
  witch_lv5: {
    id: 'witch_lv5',
    name: '大呪い',
    description: 'デバフ+60%、威圧+25%',
    effects: [
      { type: 'debuffBonus', value: 60 },
      { type: 'intimidate', value: 25 },
    ],
  },
  
  // 吟遊詩人（bard）
  bard_lv3: {
    id: 'bard_lv3',
    name: '勇気の歌',
    description: '味方ATK+15%、MP回復+5/ターン',
    effects: [
      { type: 'allyAtkBonus', value: 15 },
      { type: 'mpRegen', value: 5 },
    ],
  },
  bard_lv5: {
    id: 'bard_lv5',
    name: '伝説の調べ',
    description: '味方ATK+30%、味方防御+20%',
    effects: [
      { type: 'allyAtkBonus', value: 30 },
      { type: 'allyDefense', value: 20 },
    ],
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
