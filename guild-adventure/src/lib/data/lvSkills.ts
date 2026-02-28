// レベルスキルデータ（Lv3, Lv5で習得）
// 種族12 × 2 + 職業16 × 2 = 56スキル
// v0.8.70: 条件付き効果で完全実装

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
    description: 'コイン獲得+50%',
    effects: [{ type: 'coinBonus', value: 50 }],
  },
  human_lv5: {
    id: 'human_lv5',
    name: '幸運の極み',
    description: '抽選回数+1',
    effects: [{ type: 'doubleDropRoll', value: 1 }],
  },
  
  // エルフ - 魔法特化
  elf_lv3: {
    id: 'elf_lv3',
    name: '詠唱加速',
    description: '魔法+25%、先制+30',
    effects: [
      { type: 'magicBonus', value: 25 },
      { type: 'firstStrikeBonus', value: 30 },
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
    description: '状態異常耐性+80%',
    effects: [{ type: 'statusResist', value: 80 }],
  },
  dwarf_lv5: {
    id: 'dwarf_lv5',
    name: '山の心臓',
    description: 'HP+100、HP50%以下で被ダメ-50%',
    statModifiers: { maxHp: 100 },
    effects: [
      { type: 'lowHpDefense', value: 50 },
      { type: 'lowHpDefenseThreshold', value: 50 },
    ],
  },
  
  // ハーフリング - クリティカル特化
  halfling_lv3: {
    id: 'halfling_lv3',
    name: '幸運の風',
    description: '回避成功→次クリ確定',
    effects: [{ type: 'critAfterEvade', value: 1 }],
  },
  halfling_lv5: {
    id: 'halfling_lv5',
    name: '星の導き',
    description: 'クリダメ+100%、クリ+20%',
    effects: [
      { type: 'critDamage', value: 100 },
      { type: 'critBonus', value: 20 },
    ],
  },
  
  // オーク - 火力特化
  orc_lv3: {
    id: 'orc_lv3',
    name: '肉の鎧',
    description: '被ダメ-20%（デメリット相殺）',
    effects: [{ type: 'damageReduction', value: 20 }],
  },
  orc_lv5: {
    id: 'orc_lv5',
    name: '破壊衝動',
    description: '与ダメ+50%、物理+30%',
    effects: [
      { type: 'damageBonus', value: 50 },
      { type: 'physicalBonus', value: 30 },
    ],
  },
  
  // リザードマン - 回復特化
  lizardman_lv3: {
    id: 'lizardman_lv3',
    name: '脱皮',
    description: '状態異常耐性+50%、HP回復+8/ターン',
    effects: [
      { type: 'statusResist', value: 50 },
      { type: 'hpRegen', value: 8 },
    ],
  },
  lizardman_lv5: {
    id: 'lizardman_lv5',
    name: '原始の血',
    description: 'HP回復+20/ターン、被ダメ-15%',
    effects: [
      { type: 'hpRegen', value: 20 },
      { type: 'damageReduction', value: 15 },
    ],
  },
  
  // フェアリー - 支援特化
  fairy_lv3: {
    id: 'fairy_lv3',
    name: '祝福の粉',
    description: '回復量+40%、味方防御+15%',
    effects: [
      { type: 'healBonus', value: 40 },
      { type: 'allyDefense', value: 15 },
    ],
  },
  fairy_lv5: {
    id: 'fairy_lv5',
    name: '大妖精化',
    description: 'HP回復+10/ターン（味方全体に波及）',
    effects: [
      { type: 'hpRegen', value: 10 },
      { type: 'healBonus', value: 50 },
    ],
  },
  
  // アンデッド - HP吸収特化
  undead_lv3: {
    id: 'undead_lv3',
    name: '恐怖の眼差し',
    description: '威圧+20%、HP吸収+15%',
    effects: [
      { type: 'intimidate', value: 20 },
      { type: 'hpSteal', value: 15 },
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
    description: '追撃率+20%、先制+20',
    effects: [
      { type: 'followUp', value: 20 },
      { type: 'firstStrikeBonus', value: 20 },
    ],
  },
  goblin_lv5: {
    id: 'goblin_lv5',
    name: '群れの王',
    description: '味方ATK+25%、味方数ボーナス+15%',
    effects: [
      { type: 'allyAtkBonus', value: 25 },
      { type: 'allyCountBonus', value: 15 },
    ],
  },
  
  // ドラゴニュート - 属性・物理特化
  dragonewt_lv3: {
    id: 'dragonewt_lv3',
    name: '竜鱗強化',
    description: '被ダメ-25%、HP+50',
    statModifiers: { maxHp: 50 },
    effects: [{ type: 'damageReduction', value: 25 }],
  },
  dragonewt_lv5: {
    id: 'dragonewt_lv5',
    name: '竜の血脈',
    description: '与ダメ+60%、物理+30%',
    effects: [
      { type: 'damageBonus', value: 60 },
      { type: 'physicalBonus', value: 30 },
    ],
  },
  
  // エンジェル - 蘇生・回復特化
  angel_lv3: {
    id: 'angel_lv3',
    name: '聖なる加護',
    description: 'HP満タン時ATK+30%、回復+25%',
    effects: [
      { type: 'fullHpAtkBonus', value: 30 },
      { type: 'healBonus', value: 25 },
    ],
  },
  angel_lv5: {
    id: 'angel_lv5',
    name: '神の祝福',
    description: '自動蘇生（HP50%）、回復量+50%',
    effects: [
      { type: 'autoRevive', value: 50 },
      { type: 'healBonus', value: 50 },
    ],
  },
  
  // デーモン - リスク特化
  demon_lv3: {
    id: 'demon_lv3',
    name: '悪魔の囁き',
    description: '与ダメ+25%、HP吸収+20%',
    effects: [
      { type: 'damageBonus', value: 25 },
      { type: 'hpSteal', value: 20 },
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
    description: 'HP満タン時ATK+30%',
    effects: [{ type: 'fullHpAtkBonus', value: 30 }],
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
    description: '魔法+35%、MP消費-15%',
    effects: [
      { type: 'magicBonus', value: 35 },
      { type: 'mpReduction', value: 15 },
    ],
  },
  mage_lv5: {
    id: 'mage_lv5',
    name: '終焉の詠唱',
    description: '魔法+50%、クリティカル+25%',
    effects: [
      { type: 'magicBonus', value: 50 },
      { type: 'critBonus', value: 25 },
    ],
  },
  
  // 司祭
  priest_lv3: {
    id: 'priest_lv3',
    name: '加護の祈り',
    description: '回復量+40%、味方防御+15%',
    effects: [
      { type: 'healBonus', value: 40 },
      { type: 'allyDefense', value: 15 },
    ],
  },
  priest_lv5: {
    id: 'priest_lv5',
    name: '神聖結界',
    description: '味方防御+25%、被ダメ-25%',
    effects: [
      { type: 'allyDefense', value: 25 },
      { type: 'damageReduction', value: 25 },
    ],
  },
  
  // 盗賊
  thief_lv3: {
    id: 'thief_lv3',
    name: '宝探し',
    description: 'ドロップ率+30%、コイン+30%',
    effects: [
      { type: 'dropBonus', value: 30 },
      { type: 'coinBonus', value: 30 },
    ],
  },
  thief_lv5: {
    id: 'thief_lv5',
    name: '致命の一撃',
    description: 'クリダメ+100%、クリ+25%',
    effects: [
      { type: 'critDamage', value: 100 },
      { type: 'critBonus', value: 25 },
    ],
  },
  
  // 騎士
  knight_lv3: {
    id: 'knight_lv3',
    name: '守りの陣',
    description: '庇う率+40%、被ダメ-20%',
    effects: [
      { type: 'cover', value: 40 },
      { type: 'damageReduction', value: 20 },
    ],
  },
  knight_lv5: {
    id: 'knight_lv5',
    name: '不動の要塞',
    description: 'HP50%以下で被ダメ-50%、HP+100',
    statModifiers: { maxHp: 100 },
    effects: [
      { type: 'lowHpDefense', value: 50 },
      { type: 'lowHpDefenseThreshold', value: 50 },
    ],
  },
  
  // 狩人
  hunter_lv3: {
    id: 'hunter_lv3',
    name: '弱点看破',
    description: '命中+30%、クリティカル+20%',
    effects: [
      { type: 'accuracyBonus', value: 30 },
      { type: 'critBonus', value: 20 },
    ],
  },
  hunter_lv5: {
    id: 'hunter_lv5',
    name: '一撃必中',
    description: '最初の攻撃確定クリ、クリダメ+50%',
    effects: [
      { type: 'firstHitCrit', value: 1 },
      { type: 'critDamage', value: 50 },
    ],
  },
  
  // 忍者
  ninja_lv3: {
    id: 'ninja_lv3',
    name: '煙幕',
    description: '回避成功→次クリ確定',
    effects: [{ type: 'critAfterEvade', value: 1 }],
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
    description: '魔法+25%、回復量+25%',
    effects: [
      { type: 'magicBonus', value: 25 },
      { type: 'healBonus', value: 25 },
    ],
  },
  sage_lv5: {
    id: 'sage_lv5',
    name: '万能の知識',
    description: '魔法+40%、MP消費-40%',
    effects: [
      { type: 'magicBonus', value: 40 },
      { type: 'mpReduction', value: 40 },
    ],
  },
  
  // バーサーカー
  berserker_lv3: {
    id: 'berserker_lv3',
    name: '痛覚遮断',
    description: '被ダメ-25%（デメリット相殺）',
    effects: [{ type: 'damageReduction', value: 25 }],
  },
  berserker_lv5: {
    id: 'berserker_lv5',
    name: '狂乱',
    description: 'HP25%以下で攻撃回数+2',
    effects: [
      { type: 'lowHpBonusHits', value: 2 },
      { type: 'lowHpHitsThreshold', value: 25 },
    ],
  },
  
  // パラディン
  paladin_lv3: {
    id: 'paladin_lv3',
    name: '聖なる光',
    description: '不死特攻+50%、回復量+25%',
    effects: [
      { type: 'speciesKiller_undead', value: 50 },
      { type: 'healBonus', value: 25 },
    ],
  },
  paladin_lv5: {
    id: 'paladin_lv5',
    name: '最後の砦',
    description: '致死HP1耐え、被ダメ-30%',
    effects: [
      { type: 'surviveLethal', value: 1 },
      { type: 'damageReduction', value: 30 },
    ],
  },
  
  // ネクロマンサー
  necromancer_lv3: {
    id: 'necromancer_lv3',
    name: '死の宣告',
    description: '魔法+30%、HP吸収+20%',
    effects: [
      { type: 'magicBonus', value: 30 },
      { type: 'hpSteal', value: 20 },
    ],
  },
  necromancer_lv5: {
    id: 'necromancer_lv5',
    name: '冥界の支配者',
    description: '魔法+60%、与ダメ+40%',
    effects: [
      { type: 'magicBonus', value: 60 },
      { type: 'damageBonus', value: 40 },
    ],
  },
  
  // モンク
  monk_lv3: {
    id: 'monk_lv3',
    name: '練気',
    description: 'HP満タン時ATK+40%',
    effects: [{ type: 'fullHpAtkBonus', value: 40 }],
  },
  monk_lv5: {
    id: 'monk_lv5',
    name: '阿修羅',
    description: '反撃率+60%、反撃ダメ+100%',
    effects: [
      { type: 'counterRate', value: 60 },
      { type: 'counterDamageBonus', value: 100 },
    ],
  },
  
  // レンジャー
  ranger_lv3: {
    id: 'ranger_lv3',
    name: '大自然の恵み',
    description: 'HP回復+10/ターン、状態耐性+40%',
    effects: [
      { type: 'hpRegen', value: 10 },
      { type: 'statusResist', value: 40 },
    ],
  },
  ranger_lv5: {
    id: 'ranger_lv5',
    name: '森の守護者',
    description: '後衛時回避+50%、被ダメ-25%',
    effects: [
      { type: 'backlineEvasion', value: 50 },
      { type: 'damageReduction', value: 25 },
    ],
  },
  
  // サムライ
  samurai_lv3: {
    id: 'samurai_lv3',
    name: '居合',
    description: '先制成功→クリ確定',
    effects: [{ type: 'critOnFirstStrike', value: 1 }],
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
    description: 'デバフ+40%、威圧+15%',
    effects: [
      { type: 'debuffBonus', value: 40 },
      { type: 'intimidate', value: 15 },
    ],
  },
  witch_lv5: {
    id: 'witch_lv5',
    name: '大呪い',
    description: 'デバフ+80%、威圧+30%',
    effects: [
      { type: 'debuffBonus', value: 80 },
      { type: 'intimidate', value: 30 },
    ],
  },
  
  // 吟遊詩人（bard）
  bard_lv3: {
    id: 'bard_lv3',
    name: '勇気の歌',
    description: '味方ATK+20%、HP回復+5/ターン',
    effects: [
      { type: 'allyAtkBonus', value: 20 },
      { type: 'hpRegen', value: 5 },
    ],
  },
  bard_lv5: {
    id: 'bard_lv5',
    name: '伝説の調べ',
    description: '味方ATK+40%、味方防御+30%',
    effects: [
      { type: 'allyAtkBonus', value: 40 },
      { type: 'allyDefense', value: 30 },
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
