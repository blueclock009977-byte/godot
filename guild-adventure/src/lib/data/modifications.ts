// ============================================
// 生物改造ボーナス定義
// ============================================

import { EffectType, Effect } from '../types';

// 改造ボーナスのカテゴリ
export type ModificationCategory = 
  | 'stat1'      // 1枠: ステータス強化
  | 'passive3'   // 3枠: 基本パッシブ
  | 'element5'   // 5枠: 属性・系統特化
  | 'powerful10' // 10枠: 強力パッシブ
;

// 改造ボーナス定義
export interface ModificationData {
  id: string;
  name: string;
  description: string;
  category: ModificationCategory;
  slotCost: 1 | 3 | 5 | 10;
  effects: Effect[];
}

// ============================================
// 1枠: ステータス強化（18種類）
// ============================================

const stat1Modifications: ModificationData[] = [
  // HP強化
  {
    id: 'mod_hp_1',
    name: 'HP強化I',
    description: 'HP +15',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantHp' as EffectType, value: 15 }],
  },
  {
    id: 'mod_hp_2',
    name: 'HP強化II',
    description: 'HP +30',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantHp' as EffectType, value: 30 }],
  },
  {
    id: 'mod_hp_3',
    name: 'HP強化III',
    description: 'HP +50',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantHp' as EffectType, value: 50 }],
  },
  // MP強化
  {
    id: 'mod_mp_1',
    name: 'MP強化I',
    description: 'MP +8',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantMp' as EffectType, value: 8 }],
  },
  {
    id: 'mod_mp_2',
    name: 'MP強化II',
    description: 'MP +15',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantMp' as EffectType, value: 15 }],
  },
  {
    id: 'mod_mp_3',
    name: 'MP強化III',
    description: 'MP +25',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantMp' as EffectType, value: 25 }],
  },
  // ATK強化
  {
    id: 'mod_atk_1',
    name: 'ATK強化I',
    description: 'ATK +3',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantAtk' as EffectType, value: 3 }],
  },
  {
    id: 'mod_atk_2',
    name: 'ATK強化II',
    description: 'ATK +6',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantAtk' as EffectType, value: 6 }],
  },
  {
    id: 'mod_atk_3',
    name: 'ATK強化III',
    description: 'ATK +10',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantAtk' as EffectType, value: 10 }],
  },
  // DEF強化
  {
    id: 'mod_def_1',
    name: 'DEF強化I',
    description: 'DEF +3',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantDef' as EffectType, value: 3 }],
  },
  {
    id: 'mod_def_2',
    name: 'DEF強化II',
    description: 'DEF +6',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantDef' as EffectType, value: 6 }],
  },
  {
    id: 'mod_def_3',
    name: 'DEF強化III',
    description: 'DEF +10',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantDef' as EffectType, value: 10 }],
  },
  // AGI強化
  {
    id: 'mod_agi_1',
    name: 'AGI強化I',
    description: 'AGI +3',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantAgi' as EffectType, value: 3 }],
  },
  {
    id: 'mod_agi_2',
    name: 'AGI強化II',
    description: 'AGI +6',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantAgi' as EffectType, value: 6 }],
  },
  {
    id: 'mod_agi_3',
    name: 'AGI強化III',
    description: 'AGI +10',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantAgi' as EffectType, value: 10 }],
  },
  // MAG強化
  {
    id: 'mod_mag_1',
    name: 'MAG強化I',
    description: 'MAG +3',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantMag' as EffectType, value: 3 }],
  },
  {
    id: 'mod_mag_2',
    name: 'MAG強化II',
    description: 'MAG +6',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantMag' as EffectType, value: 6 }],
  },
  {
    id: 'mod_mag_3',
    name: 'MAG強化III',
    description: 'MAG +10',
    category: 'stat1',
    slotCost: 1,
    effects: [{ type: 'constantMag' as EffectType, value: 10 }],
  },
];

// ============================================
// 3枠: 基本パッシブ（18種類）
// ============================================

const passive3Modifications: ModificationData[] = [
  // 戦闘補助系
  {
    id: 'mod_crit_up',
    name: 'クリティカル率UP',
    description: 'クリティカル率 +8%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'critBonus', value: 8 }],
  },
  {
    id: 'mod_evasion_up',
    name: '回避率UP',
    description: '回避率 +8%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'evasionBonus', value: 8 }],
  },
  {
    id: 'mod_accuracy_up',
    name: '命中率UP',
    description: '命中率 +10%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'accuracyBonus', value: 10 }],
  },
  {
    id: 'mod_first_strike_up',
    name: '先制率UP',
    description: '先制率 +15%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'firstStrikeBonus', value: 15 }],
  },
  {
    id: 'mod_counter_up',
    name: '反撃率UP',
    description: '反撃率 +15%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'counterRate', value: 15 }],
  },
  // 耐性系
  {
    id: 'mod_physical_resist',
    name: '物理耐性',
    description: '物理被ダメ -10%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'physicalResist', value: 10 }],
  },
  {
    id: 'mod_magic_resist',
    name: '魔法耐性',
    description: '魔法被ダメ -10%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'magicResist', value: 10 }],
  },
  {
    id: 'mod_status_resist',
    name: '状態異常耐性',
    description: '状態異常耐性 +20%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'statusResist', value: 20 }],
  },
  {
    id: 'mod_poison_resist',
    name: '毒耐性',
    description: '毒耐性 +30%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'poisonResist', value: 30 }],
  },
  {
    id: 'mod_stun_resist',
    name: 'スタン耐性',
    description: 'スタン耐性 +30%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'stunResist', value: 30 }],
  },
  // 回復系
  {
    id: 'mod_hp_regen',
    name: 'HP自動回復',
    description: '毎ターンHP 5%回復',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'hpRegen', value: 5 }],
  },
  {
    id: 'mod_mp_regen',
    name: 'MP自動回復',
    description: '毎ターンMP 3回復',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'mpRegen', value: 3 }],
  },
  {
    id: 'mod_heal_bonus',
    name: '回復量UP',
    description: '回復量 +15%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'healBonus', value: 15 }],
  },
  {
    id: 'mod_heal_received',
    name: '被回復量UP',
    description: '受ける回復量 +15%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'healReceived', value: 15 }],
  },
  // 攻撃系
  {
    id: 'mod_physical_up',
    name: '物理攻撃UP',
    description: '物理ダメージ +10%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'physicalBonus', value: 10 }],
  },
  {
    id: 'mod_magic_up',
    name: '魔法攻撃UP',
    description: '魔法ダメージ +10%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'magicBonus', value: 10 }],
  },
  {
    id: 'mod_hp_steal',
    name: 'HP吸収',
    description: '与ダメの5%吸収',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'hpSteal', value: 5 }],
  },
  {
    id: 'mod_mp_save',
    name: 'MP節約',
    description: 'スキルMP消費 -15%',
    category: 'passive3',
    slotCost: 3,
    effects: [{ type: 'mpReduction', value: 15 }],
  },
];

// ============================================
// 5枠: 属性・系統特化（24種類）
// ============================================

const element5Modifications: ModificationData[] = [
  // 属性攻撃強化（7種）
  {
    id: 'mod_fire_bonus',
    name: '火属性攻撃UP',
    description: '火属性ダメージ +20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'fireBonus', value: 20 }],
  },
  {
    id: 'mod_water_bonus',
    name: '水属性攻撃UP',
    description: '水属性ダメージ +20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'waterBonus', value: 20 }],
  },
  {
    id: 'mod_wind_bonus',
    name: '風属性攻撃UP',
    description: '風属性ダメージ +20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'windBonus', value: 20 }],
  },
  {
    id: 'mod_earth_bonus',
    name: '土属性攻撃UP',
    description: '土属性ダメージ +20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'earthBonus', value: 20 }],
  },
  {
    id: 'mod_light_bonus',
    name: '光属性攻撃UP',
    description: '光属性ダメージ +20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'lightBonus', value: 20 }],
  },
  {
    id: 'mod_dark_bonus',
    name: '闇属性攻撃UP',
    description: '闇属性ダメージ +20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'darkBonus', value: 20 }],
  },
  {
    id: 'mod_ice_bonus',
    name: '氷属性攻撃UP',
    description: '氷属性ダメージ +20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'iceBonus', value: 20 }],
  },
  // 属性耐性（7種）
  {
    id: 'mod_fire_resist',
    name: '火耐性',
    description: '火属性被ダメ -20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'fireResist', value: 20 }],
  },
  {
    id: 'mod_water_resist',
    name: '水耐性',
    description: '水属性被ダメ -20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'waterResist', value: 20 }],
  },
  {
    id: 'mod_wind_resist',
    name: '風耐性',
    description: '風属性被ダメ -20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'windResist', value: 20 }],
  },
  {
    id: 'mod_earth_resist',
    name: '土耐性',
    description: '土属性被ダメ -20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'earthResist', value: 20 }],
  },
  {
    id: 'mod_light_resist',
    name: '光耐性',
    description: '光属性被ダメ -20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'lightResist', value: 20 }],
  },
  {
    id: 'mod_dark_resist',
    name: '闇耐性',
    description: '闇属性被ダメ -20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'darkResist', value: 20 }],
  },
  {
    id: 'mod_ice_resist',
    name: '氷耐性',
    description: '氷属性被ダメ -20%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'iceResist', value: 20 }],
  },
  // 系統特攻（5種）
  {
    id: 'mod_humanoid_killer',
    name: '人型特攻',
    description: '人型へダメージ +25%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'speciesKiller_humanoid', value: 25 }],
  },
  {
    id: 'mod_beast_killer',
    name: '獣特攻',
    description: '獣へダメージ +25%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'speciesKiller_beast', value: 25 }],
  },
  {
    id: 'mod_undead_killer',
    name: '不死特攻',
    description: '不死へダメージ +25%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'speciesKiller_undead', value: 25 }],
  },
  {
    id: 'mod_demon_killer',
    name: '悪魔特攻',
    description: '悪魔へダメージ +25%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'speciesKiller_demon', value: 25 }],
  },
  {
    id: 'mod_dragon_killer',
    name: '竜特攻',
    description: '竜へダメージ +25%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'speciesKiller_dragon', value: 25 }],
  },
  // 系統耐性（5種）
  {
    id: 'mod_humanoid_resist',
    name: '人型耐性',
    description: '人型から被ダメ -15%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'speciesResist_humanoid', value: 15 }],
  },
  {
    id: 'mod_beast_resist',
    name: '獣耐性',
    description: '獣から被ダメ -15%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'speciesResist_beast', value: 15 }],
  },
  {
    id: 'mod_undead_resist',
    name: '不死耐性',
    description: '不死から被ダメ -15%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'speciesResist_undead', value: 15 }],
  },
  {
    id: 'mod_demon_resist',
    name: '悪魔耐性',
    description: '悪魔から被ダメ -15%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'speciesResist_demon', value: 15 }],
  },
  {
    id: 'mod_dragon_resist',
    name: '竜耐性',
    description: '竜から被ダメ -15%',
    category: 'element5',
    slotCost: 5,
    effects: [{ type: 'speciesResist_dragon', value: 15 }],
  },
];

// ============================================
// 10枠: 強力パッシブ（13種類）
// ============================================

const powerful10Modifications: ModificationData[] = [
  // 生存系
  {
    id: 'mod_survive_lethal',
    name: '不死身',
    description: '致死ダメージを1回だけHP1で耐える',
    category: 'powerful10',
    slotCost: 10,
    effects: [{ type: 'surviveLethal', value: 1 }],
  },
  {
    id: 'mod_auto_revive',
    name: '自動蘇生',
    description: '戦闘中1回、死亡時HP30%で復活',
    category: 'powerful10',
    slotCost: 10,
    effects: [{ type: 'revive', value: 30 }],
  },
  {
    id: 'mod_guts',
    name: '根性',
    description: 'HP50%以下で被ダメ -25%',
    category: 'powerful10',
    slotCost: 10,
    effects: [
      { type: 'lowHpDefense', value: 25 },
      { type: 'lowHpDefenseThreshold', value: 50 },
    ],
  },
  // 攻撃系
  {
    id: 'mod_double_action',
    name: '二回行動',
    description: '20%の確率で2回行動',
    category: 'powerful10',
    slotCost: 10,
    effects: [{ type: 'doubleAttack', value: 20 }],
  },
  {
    id: 'mod_follow_up',
    name: '追撃',
    description: '30%で追加攻撃',
    category: 'powerful10',
    slotCost: 10,
    effects: [{ type: 'followUp', value: 30 }],
  },
  {
    id: 'mod_crit_master',
    name: '会心の極み',
    description: 'クリティカルダメージ +50%',
    category: 'powerful10',
    slotCost: 10,
    effects: [{ type: 'critDamage', value: 50 }],
  },
  {
    id: 'mod_ignore_def',
    name: '防御無視',
    description: '敵DEFの20%を無視',
    category: 'powerful10',
    slotCost: 10,
    effects: [{ type: 'ignoreDefense', value: 20 }],
  },
  // 支援系
  {
    id: 'mod_guardian',
    name: '守護者',
    description: '味方が攻撃されたとき25%で庇う',
    category: 'powerful10',
    slotCost: 10,
    effects: [{ type: 'cover', value: 25 }],
  },
  {
    id: 'mod_intimidate',
    name: '威圧',
    description: '敵全体の攻撃力 -10%',
    category: 'powerful10',
    slotCost: 10,
    effects: [{ type: 'intimidate', value: 10 }],
  },
  {
    id: 'mod_inspire',
    name: '鼓舞',
    description: '味方全体の攻撃力 +10%',
    category: 'powerful10',
    slotCost: 10,
    effects: [{ type: 'allyAtkBonus', value: 10 }],
  },
  // 特殊系
  {
    id: 'mod_awakening',
    name: '覚醒',
    description: 'HP50%以下で全ステ +25%',
    category: 'powerful10',
    slotCost: 10,
    effects: [
      { type: 'lowHpDamageBonus', value: 25 },
      { type: 'lowHpThreshold', value: 50 },
    ],
  },
  {
    id: 'mod_counter_master',
    name: '反撃マスター',
    description: '反撃ダメージ +100%',
    category: 'powerful10',
    slotCost: 10,
    effects: [{ type: 'counterDamageBonus', value: 100 }],
  },
  {
    id: 'mod_all_element_resist',
    name: '全属性耐性',
    description: '全属性被ダメ -15%',
    category: 'powerful10',
    slotCost: 10,
    effects: [
      { type: 'fireResist', value: 15 },
      { type: 'waterResist', value: 15 },
      { type: 'windResist', value: 15 },
      { type: 'earthResist', value: 15 },
      { type: 'lightResist', value: 15 },
      { type: 'darkResist', value: 15 },
      { type: 'iceResist', value: 15 },
    ],
  },
];

// ============================================
// 全ボーナス統合
// ============================================

export const MODIFICATIONS: ModificationData[] = [
  ...stat1Modifications,
  ...passive3Modifications,
  ...element5Modifications,
  ...powerful10Modifications,
];

// IDから取得
export function getModificationById(id: string): ModificationData | undefined {
  return MODIFICATIONS.find(m => m.id === id);
}

// カテゴリ別取得
export function getModificationsByCategory(category: ModificationCategory): ModificationData[] {
  return MODIFICATIONS.filter(m => m.category === category);
}

// 枠コスト別取得
export function getModificationsBySlotCost(slotCost: 1 | 3 | 5 | 10): ModificationData[] {
  return MODIFICATIONS.filter(m => m.slotCost === slotCost);
}

// ============================================
// 改造枠の定数
// ============================================

export const MODIFICATION_CONSTANTS = {
  INITIAL_SLOTS: 0,           // 初期枠数
  MAX_SLOTS: 15,              // 最大枠数
  SLOTS_PER_UNLOCK: 3,        // 1回の解放で増える枠数
  UNLOCK_COST: 500,           // 解放コスト（コイン）
  MAX_UNLOCKS: 5,             // 最大解放回数
};

// 使用中の枠数を計算
export function calculateUsedSlots(modificationIds: string[]): number {
  return modificationIds.reduce((total, id) => {
    const mod = getModificationById(id);
    return total + (mod?.slotCost ?? 0);
  }, 0);
}

// 残り枠数を計算
export function calculateRemainingSlots(totalSlots: number, modificationIds: string[]): number {
  return totalSlots - calculateUsedSlots(modificationIds);
}

// ボーナスが選択可能か判定
export function canSelectModification(
  modificationId: string,
  currentModificationIds: string[],
  totalSlots: number
): { canSelect: boolean; reason?: string } {
  const mod = getModificationById(modificationId);
  if (!mod) {
    return { canSelect: false, reason: '無効なボーナスIDです' };
  }

  // 既に選択済み
  if (currentModificationIds.includes(modificationId)) {
    return { canSelect: false, reason: 'このボーナスは既に選択済みです' };
  }

  // 枠が足りない
  const remainingSlots = calculateRemainingSlots(totalSlots, currentModificationIds);
  if (mod.slotCost > remainingSlots) {
    return { canSelect: false, reason: `枠が足りません（必要: ${mod.slotCost}枠、残り: ${remainingSlots}枠）` };
  }

  return { canSelect: true };
}
