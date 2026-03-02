// 持ち物アイテム（装備）データ
// 各キャラ1つ装備可能
// v0.8.75追加

import { Stats, Effect } from '../types';

export type EquipmentRarity = 'normal' | 'rare';

export interface Equipment {
  id: string;
  name: string;
  description: string;
  rarity: EquipmentRarity;
  statModifiers: Partial<Stats>;
  effects?: Effect[];
}

// ============================================
// 通常アイテム（10種類）- 汎用型
// ============================================

export const normalEquipments: Equipment[] = [
  {
    id: 'eq_normal_01',
    name: '冒険者のお守り',
    description: 'HP+20, ATK+5, DEF+5',
    rarity: 'normal',
    statModifiers: { maxHp: 20, atk: 5, def: 5 },
  },
  {
    id: 'eq_normal_02',
    name: '旅人のブーツ',
    description: 'AGI+8, HP+15, 先制+5',
    rarity: 'normal',
    statModifiers: { agi: 8, maxHp: 15 },
    effects: [{ type: 'firstStrikeBonus', value: 5 }],
  },
  {
    id: 'eq_normal_03',
    name: '銀の腕輪',
    description: 'ATK+6, MAG+6, HP+10',
    rarity: 'normal',
    statModifiers: { atk: 6, mag: 6, maxHp: 10 },
  },
  {
    id: 'eq_normal_04',
    name: '守りの指輪',
    description: 'DEF+8, HP+25, 被ダメ-5%',
    rarity: 'normal',
    statModifiers: { def: 8, maxHp: 25 },
    effects: [{ type: 'damageReduction', value: 5 }],
  },
  {
    id: 'eq_normal_05',
    name: '活力のペンダント',
    description: 'HP+35, MP+10, HP回復+3/ターン',
    rarity: 'normal',
    statModifiers: { maxHp: 35, maxMp: 10 },
    effects: [{ type: 'hpRegen', value: 3 }],
  },
  {
    id: 'eq_normal_06',
    name: '戦士の紋章',
    description: 'ATK+8, DEF+5, HP+15',
    rarity: 'normal',
    statModifiers: { atk: 8, def: 5, maxHp: 15 },
  },
  {
    id: 'eq_normal_07',
    name: '知恵の眼鏡',
    description: 'MAG+8, MP+15, AGI+3',
    rarity: 'normal',
    statModifiers: { mag: 8, maxMp: 15, agi: 3 },
  },
  {
    id: 'eq_normal_08',
    name: '幸運のコイン',
    description: 'HP+15, AGI+5, ドロップ+10%',
    rarity: 'normal',
    statModifiers: { maxHp: 15, agi: 5 },
    effects: [{ type: 'dropBonus', value: 10 }],
  },
  {
    id: 'eq_normal_09',
    name: '勇気の首飾り',
    description: 'ATK+5, DEF+5, AGI+5, HP+10',
    rarity: 'normal',
    statModifiers: { atk: 5, def: 5, agi: 5, maxHp: 10 },
  },
  {
    id: 'eq_normal_10',
    name: '癒しの石',
    description: 'HP+30, DEF+5, 回復量+10%',
    rarity: 'normal',
    statModifiers: { maxHp: 30, def: 5 },
    effects: [{ type: 'healBonus', value: 10 }],
  },
];

// ============================================
// レアアイテム（20種類）- 強力効果
// ============================================

export const rareEquipments: Equipment[] = [
  {
    id: 'eq_rare_01',
    name: '🔥炎剣ラグナロク',
    description: 'ATK+20, HP+30, 物理+25%',
    rarity: 'rare',
    statModifiers: { atk: 20, maxHp: 30 },
    effects: [{ type: 'physicalBonus', value: 25 }],
  },
  {
    id: 'eq_rare_02',
    name: '❄️氷杖フロストバイト',
    description: 'MAG+20, MP+20, 魔法+30%',
    rarity: 'rare',
    statModifiers: { mag: 20, maxMp: 20 },
    effects: [{ type: 'magicBonus', value: 30 }],
  },
  {
    id: 'eq_rare_03',
    name: '⚡雷槍ミョルニル',
    description: 'ATK+15, AGI+15, クリダメ+50%',
    rarity: 'rare',
    statModifiers: { atk: 15, agi: 15 },
    effects: [{ type: 'critDamage', value: 50 }],
  },
  {
    id: 'eq_rare_04',
    name: '🛡️聖盾イージス',
    description: 'DEF+25, HP+50, 被ダメ-20%, 致死HP1耐え',
    rarity: 'rare',
    statModifiers: { def: 25, maxHp: 50 },
    effects: [
      { type: 'damageReduction', value: 20 },
      { type: 'surviveLethal', value: 1 },
    ],
  },
  {
    id: 'eq_rare_05',
    name: '💀死神の大鎌',
    description: 'ATK+20, AGI+10, HP吸収+20%',
    rarity: 'rare',
    statModifiers: { atk: 20, agi: 10 },
    effects: [{ type: 'hpSteal', value: 20 }],
  },
  {
    id: 'eq_rare_06',
    name: '🌟星屑のローブ',
    description: 'MAG+15, HP+40, DEF+10, 完全回避+15%',
    rarity: 'rare',
    statModifiers: { mag: 15, maxHp: 40, def: 10 },
    effects: [{ type: 'perfectEvasion', value: 15 }],
  },
  {
    id: 'eq_rare_07',
    name: '👑王者の冠',
    description: '全ステ+8, 味方ATK+15%',
    rarity: 'rare',
    statModifiers: { maxHp: 8, atk: 8, def: 8, mag: 8, agi: 8 },
    effects: [{ type: 'allyAtkBonus', value: 15 }],
  },
  {
    id: 'eq_rare_08',
    name: '💎賢者の石',
    description: 'MAG+15, MP+25, HP+20, MP消費-25%',
    rarity: 'rare',
    statModifiers: { mag: 15, maxMp: 25, maxHp: 20 },
    effects: [{ type: 'mpReduction', value: 25 }],
  },
  {
    id: 'eq_rare_09',
    name: '🍀四葉のクローバー',
    description: 'HP+30, AGI+10, ドロップ+1',
    rarity: 'rare',
    statModifiers: { maxHp: 30, agi: 10 },
    effects: [{ type: 'doubleDropRoll', value: 1 }],
  },
  {
    id: 'eq_rare_10',
    name: '⚔️英雄の剣',
    description: 'ATK+18, DEF+10, HP+20, 攻撃回数+1',
    rarity: 'rare',
    statModifiers: { atk: 18, def: 10, maxHp: 20 },
    effects: [{ type: 'bonusHits', value: 1 }],
  },
  {
    id: 'eq_rare_11',
    name: '🔮予言の水晶',
    description: 'MAG+15, AGI+15, 先制+50',
    rarity: 'rare',
    statModifiers: { mag: 15, agi: 15 },
    effects: [{ type: 'firstStrikeBonus', value: 50 }],
  },
  {
    id: 'eq_rare_12',
    name: '💉吸血鬼の牙',
    description: 'ATK+15, HP+30, HP吸収+15%, HP回復+8/ターン',
    rarity: 'rare',
    statModifiers: { atk: 15, maxHp: 30 },
    effects: [
      { type: 'hpSteal', value: 15 },
      { type: 'hpRegen', value: 8 },
    ],
  },
  {
    id: 'eq_rare_13',
    name: '🐉竜の心臓',
    description: 'HP+80, DEF+15, HP50%以下で被ダメ-35%',
    rarity: 'rare',
    statModifiers: { maxHp: 80, def: 15 },
    effects: [
      { type: 'lowHpDefense', value: 35 },
      { type: 'lowHpDefenseThreshold', value: 50 },
    ],
  },
  {
    id: 'eq_rare_14',
    name: '👼天使の羽',
    description: 'HP+50, MAG+10, 自動蘇生(HP50%)',
    rarity: 'rare',
    statModifiers: { maxHp: 50, mag: 10 },
    effects: [{ type: 'autoRevive', value: 50 }],
  },
  {
    id: 'eq_rare_15',
    name: '😈悪魔の契約',
    description: 'ATK+18, MAG+18, HP50%以下で全ダメ+40%',
    rarity: 'rare',
    statModifiers: { atk: 18, mag: 18 },
    effects: [
      { type: 'lowHpDamageBonus', value: 40 },
      { type: 'lowHpThreshold', value: 50 },
    ],
  },
  {
    id: 'eq_rare_16',
    name: '🌙月光の首飾り',
    description: 'AGI+18, DEF+10, 回避+20%, 回避後クリ確定',
    rarity: 'rare',
    statModifiers: { agi: 18, def: 10 },
    effects: [
      { type: 'evasionBonus', value: 20 },
      { type: 'critAfterEvade', value: 1 },
    ],
  },
  {
    id: 'eq_rare_17',
    name: '☀️太陽の紋章',
    description: 'ATK+12, DEF+12, HP+25, 反撃率+35%, 反撃ダメ+50%',
    rarity: 'rare',
    statModifiers: { atk: 12, def: 12, maxHp: 25 },
    effects: [
      { type: 'counterRate', value: 35 },
      { type: 'counterDamageBonus', value: 50 },
    ],
  },
  {
    id: 'eq_rare_18',
    name: '🎭道化師の仮面',
    description: 'AGI+20, HP+20, 完全回避+20%',
    rarity: 'rare',
    statModifiers: { agi: 20, maxHp: 20 },
    effects: [{ type: 'perfectEvasion', value: 20 }],
  },
  {
    id: 'eq_rare_19',
    name: '📖禁断の魔導書',
    description: 'MAG+25, MP+15, 魔法+40%',
    rarity: 'rare',
    statModifiers: { mag: 25, maxMp: 15 },
    effects: [{ type: 'magicBonus', value: 40 }],
  },
  {
    id: 'eq_rare_20',
    name: '💰黄金の羅針盤',
    description: 'HP+25, AGI+8, コイン+40%, ドロップ+25%',
    rarity: 'rare',
    statModifiers: { maxHp: 25, agi: 8 },
    effects: [
      { type: 'coinBonus', value: 40 },
      { type: 'dropBonus', value: 25 },
    ],
  },
];

// 全装備
export const allEquipments: Equipment[] = [...normalEquipments, ...rareEquipments];

// ID → 装備データ
export function getEquipmentById(id: string): Equipment | undefined {
  return allEquipments.find(e => e.id === id);
}

// ダンジョン時間に応じたドロップ率（%）
// ※基本4回抽選のため、確率は1/4に設定（期待値は同じ）
// 1時間 = 5%、それ以下は比例
// 海は5%、それ以降+1%ずつ、神殿は10%
const dungeonEquipmentBonus: Record<string, number> = {
  sea: 0,      // 5%
  desert: 1,   // 6%
  volcano: 2,  // 7%
  snowfield: 3,// 8%
  temple: 5,   // 10%
};

export function getEquipmentDropRate(durationSeconds: number, dungeonId?: string): number {
  const baseRate = (durationSeconds / 3600) * 5; // 20 / 4 = 5
  const bonus = dungeonId ? (dungeonEquipmentBonus[dungeonId] || 0) : 0;
  const rate = baseRate + bonus;
  return Math.max(0.025, rate); // 0.025%〜
}

import { applyDropBonus, getDropRollCount, calculateRareDropBonus } from '../drop/dropBonus';

// 複数装備ドロップ対応（成功した数だけドロップ）
export function rollEquipmentDrops(durationSeconds: number, characters: { race?: string; job?: string; equipmentId?: string; lv3Skill?: string; lv5Skill?: string }[] = [], dungeonId?: string): Equipment[] {
  const baseRate = getEquipmentDropRate(durationSeconds, dungeonId);
  const dropRate = applyDropBonus(baseRate, characters);
  const rolls = getDropRollCount(characters);
  const rareBonus = calculateRareDropBonus(characters);
  
  const drops: Equipment[] = [];
  for (let i = 0; i < rolls; i++) {
    if (Math.random() * 100 < dropRate) {
      // レアリティ判定（基本3% × 割合ボーナス）
      const rareChance = 3 * (1 + rareBonus / 100);
      const isRare = Math.random() * 100 < rareChance;
      const pool = isRare ? rareEquipments : normalEquipments;
      drops.push(pool[Math.floor(Math.random() * pool.length)]);
    }
  }
  return drops;
}

// 後方互換（1つだけ返す）
export function rollEquipmentDrop(durationSeconds: number, characters: { race?: string; job?: string; equipmentId?: string; lv3Skill?: string; lv5Skill?: string }[] = [], dungeonId?: string): Equipment | null {
  const drops = rollEquipmentDrops(durationSeconds, characters, dungeonId);
  return drops[0] || null;
}
