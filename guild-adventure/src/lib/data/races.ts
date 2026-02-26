import { RaceData } from '../types';

export const races: Record<string, RaceData> = {
  human: {
    id: 'human',
    name: '人間',
    description: `【基礎ステ】HP85 MP40 ATK8 DEF8 AGI9 MAG8
【パッシブ】
・適応力: クリ率+5%, 回避+5%
・不屈の精神: ダメージ+10%
・幸運: ドロップ率+40%
【スキル】
・鼓舞(MP15): 味方全体ATK+20%(3T)
【マスタリー】
・英雄の器: 味方全員の全ステ+10%`,
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
    description: `【基礎ステ】HP75 MP80 ATK7 DEF6 AGI16 MAG16
【パッシブ】
・魔力の血統: 魔法ダメ+25%
・風の加護: 回避+15%, 先制+20%
・MP自然回復: 毎ターンMP+3
・悪魔狩り: 悪魔系へのダメ+30%
【スキル】
・精霊の矢(MP10,風): 単体魔法1.4倍
【マスタリー】
・精霊契約: 味方の魔法攻撃後に追撃50%`,
    baseStats: { maxHp: 75, maxMp: 80, atk: 7, def: 6, agi: 16, mag: 16 },
    passives: [
      { name: '魔力の血統', description: '魔法攻撃の威力が上昇', effects: [{ type: 'magicBonus', value: 25 }] },
      { name: '風の加護', description: '回避率と先制率が上昇', effects: [{ type: 'evasionBonus', value: 15 }, { type: 'firstStrikeBonus', value: 20 }] },
      { name: 'MP自然回復', description: '毎ターンMPが回復', effects: [{ type: 'mpRegen', value: 3 }] },
      { name: '悪魔狩り', description: '悪魔系への与ダメージ+30%', effects: [{ type: 'speciesKiller_demon', value: 30 }] },
    ],
    skills: [
      { id: 'spirit_arrow', name: '精霊の矢', description: '精霊の力で敵を攻撃', type: 'magic', target: 'single', multiplier: 1.4, mpCost: 10, element: 'wind' },
    ],
    masterySkill: { name: '精霊契約', description: '味方の魔法攻撃後に追撃', type: 'passive', effects: [{ type: 'followUp', value: 50 }] },
  },
  dwarf: {
    id: 'dwarf',
    name: 'ドワーフ',
    description: `【基礎ステ】HP140 MP30 ATK14 DEF16 AGI5 MAG5
【パッシブ】
・鋼の肉体: 被ダメ-20%
・怪力: 物理ダメ+15%
・毒耐性: 毒耐性+50%
・竜殺し: 竜系からの被ダメ-20%
【スキル】
・鉄壁(MP12): 自身DEF+50%(3T)
【マスタリー】
・守護の盾: 50%で味方を庇う`,
    baseStats: { maxHp: 140, maxMp: 30, atk: 14, def: 16, agi: 5, mag: 5 },
    passives: [
      { name: '鋼の肉体', description: '被ダメージを軽減', effects: [{ type: 'damageReduction', value: 20 }] },
      { name: '怪力', description: '物理攻撃の威力が上昇', effects: [{ type: 'physicalBonus', value: 15 }] },
      { name: '毒耐性', description: '毒への高い耐性', effects: [{ type: 'poisonResist', value: 50 }] },
      { name: '竜殺し', description: '竜系からの被ダメージ-20%', effects: [{ type: 'speciesResist_dragon', value: 20 }] },
    ],
    skills: [
      { id: 'iron_wall', name: '鉄壁', description: '自身の防御力を大幅上昇', type: 'buff', target: 'self', multiplier: 0, mpCost: 12, effect: { type: 'defUp', value: 50, duration: 3 } },
    ],
    masterySkill: { name: '守護の盾', description: '50%の確率で味方を庇う', type: 'passive', effects: [{ type: 'cover', value: 50 }] },
  },
  halfling: {
    id: 'halfling',
    name: 'ハーフリング',
    description: `【基礎ステ】HP70 MP45 ATK8 DEF8 AGI14 MAG10
【パッシブ】
・幸運の星: クリ率+20%
・小さな体: 回避+25%, 被ダメ+10%
・先制の才: 先制率+20%
・急所知識: 人型系へのダメ+25%
【スキル】
・急所狙い(MP8): 単体物理1.5倍
【マスタリー】
・幸運の星: クリダメ+100%`,
    baseStats: { maxHp: 70, maxMp: 45, atk: 8, def: 8, agi: 14, mag: 10 },
    passives: [
      { name: '幸運の星', description: 'クリティカル率が上昇', effects: [{ type: 'critBonus', value: 20 }] },
      { name: '小さな体', description: '回避率上昇、被ダメージ増加', effects: [{ type: 'evasionBonus', value: 25 }, { type: 'damageReduction', value: -10 }] },
      { name: '先制の才', description: '先制率が上昇', effects: [{ type: 'firstStrikeBonus', value: 20 }] },
      { name: '急所知識', description: '人型系への与ダメージ+25%', effects: [{ type: 'speciesKiller_humanoid', value: 25 }] },
    ],
    skills: [
      { id: 'vital_strike', name: '急所狙い', description: 'クリティカル率の高い一撃', type: 'attack', target: 'single', multiplier: 1.5, mpCost: 8 },
    ],
    masterySkill: { name: '幸運の星', description: 'クリティカル時ダメージ2倍', type: 'passive', effects: [{ type: 'critDamage', value: 100 }] },
  },
  orc: {
    id: 'orc',
    name: 'オーク',
    description: `【基礎ステ】HP120 MP20 ATK18 DEF8 AGI7 MAG3
【パッシブ】
・狂戦士: 物理ダメ+30%
・血の渇望: クリ率+10%, 毎ターンHP+5
・無謀: 被ダメ+15%
・獣殺し: 獣系へのダメ+40%
【スキル】
・怒りの一撃(MP12): 単体物理2.2倍
【マスタリー】
・狂戦士の魂: HP30%以下でATK+100%`,
    baseStats: { maxHp: 120, maxMp: 20, atk: 18, def: 8, agi: 7, mag: 3 },
    passives: [
      { name: '狂戦士', description: '物理攻撃力が大幅上昇', effects: [{ type: 'physicalBonus', value: 30 }] },
      { name: '血の渇望', description: 'クリティカル時にHP回復', effects: [{ type: 'critBonus', value: 10 }, { type: 'hpRegen', value: 5 }] },
      { name: '無謀', description: '被ダメージが増加', effects: [{ type: 'damageReduction', value: -15 }] },
      { name: '獣殺し', description: '獣系への与ダメージ+40%', effects: [{ type: 'speciesKiller_beast', value: 40 }] },
    ],
    skills: [
      { id: 'fury_strike', name: '怒りの一撃', description: '渾身の大ダメージ攻撃', type: 'attack', target: 'single', multiplier: 2.2, mpCost: 12 },
    ],
    masterySkill: { name: '狂戦士の魂', description: 'HP30%以下で攻撃力2倍', type: 'passive', effects: [{ type: 'lowHpBonus', value: 100 }] },
  },
  lizardman: {
    id: 'lizardman',
    name: 'リザードマン',
    description: `【基礎ステ】HP110 MP40 ATK12 DEF14 AGI9 MAG8
【パッシブ】
・再生能力: 毎ターンHP+8
・硬い鱗: 被ダメ-10%
・両刀の才: 物理+10%, 魔法+10%
・獣耐性: 獣系からの被ダメ-15%
【スキル】
・再生(MP10): 自身HP回復1.5倍
【マスタリー】
・不死の再生: 戦闘中1回、瀕死から全回復`,
    baseStats: { maxHp: 110, maxMp: 40, atk: 12, def: 14, agi: 9, mag: 8 },
    passives: [
      { name: '再生能力', description: '毎ターンHP回復', effects: [{ type: 'hpRegen', value: 8 }] },
      { name: '硬い鱗', description: '物理防御が上昇', effects: [{ type: 'damageReduction', value: 10 }] },
      { name: '両刀の才', description: '物理と魔法の威力上昇', effects: [{ type: 'physicalBonus', value: 10 }, { type: 'magicBonus', value: 10 }] },
      { name: '獣耐性', description: '獣系からの被ダメージ-15%', effects: [{ type: 'speciesResist_beast', value: 15 }] },
    ],
    skills: [
      { id: 'regenerate', name: '再生', description: '自身のHPを回復', type: 'heal', target: 'self', multiplier: 1.5, mpCost: 10 },
    ],
    masterySkill: { name: '不死の再生', description: '戦闘中1回、瀕死から全回復', type: 'passive', effects: [{ type: 'revive', value: 100 }] },
  },
  fairy: {
    id: 'fairy',
    name: 'フェアリー',
    description: `【基礎ステ】HP45 MP100 ATK4 DEF3 AGI18 MAG22
【パッシブ】
・魔力の奔流: 魔法ダメ+35%
・妖精の翅: 回避+30%
・癒しの力: 回復量+30%
・聖光: 不死系へのダメ+50%
【スキル】
・癒しの光(MP12): 味方1人HP回復1.3倍
【マスタリー】
・妖精の祝福: 回復量+50%`,
    baseStats: { maxHp: 45, maxMp: 100, atk: 4, def: 3, agi: 18, mag: 22 },
    passives: [
      { name: '魔力の奔流', description: '魔法威力が大幅上昇', effects: [{ type: 'magicBonus', value: 35 }] },
      { name: '妖精の翅', description: '回避率が大幅上昇', effects: [{ type: 'evasionBonus', value: 30 }] },
      { name: '癒しの力', description: '回復量が上昇', effects: [{ type: 'healBonus', value: 30 }] },
      { name: '聖光', description: '不死系への与ダメージ+50%', effects: [{ type: 'speciesKiller_undead', value: 50 }] },
    ],
    skills: [
      { id: 'fairy_heal', name: '癒しの光', description: '味方一人のHPを回復', type: 'heal', target: 'ally', multiplier: 1.3, mpCost: 12 },
    ],
    masterySkill: { name: '妖精の祝福', description: '味方への回復量+50%', type: 'passive', effects: [{ type: 'healBonus', value: 50 }] },
  },
  undead: {
    id: 'undead',
    name: 'アンデッド',
    description: `【基礎ステ】HP90 MP50 ATK11 DEF12 AGI6 MAG14
【パッシブ】
・不死の呪い: 状態異常耐性+80%
・回復無効: 回復効果-50%
・HP吸収: 与ダメの20%HP回復
・不死耐性: 不死系からの被ダメ-50%
・人型狩り: 人型系へのダメ+30%
【スキル】
・生命吸収(MP14): 単体魔法1.2倍+HP吸収
【マスタリー】
・死の抱擁: 与ダメの30%HP吸収`,
    baseStats: { maxHp: 90, maxMp: 50, atk: 11, def: 12, agi: 6, mag: 14 },
    passives: [
      { name: '不死の呪い', description: '状態異常耐性上昇', effects: [{ type: 'statusResist', value: 80 }] },
      { name: '回復無効', description: '回復効果が半減', effects: [{ type: 'healReceived', value: -50 }] },
      { name: 'HP吸収', description: '与ダメージの一部をHP回復', effects: [{ type: 'hpSteal', value: 20 }] },
      { name: '不死耐性', description: '不死系からの被ダメージ-50%', effects: [{ type: 'speciesResist_undead', value: 50 }] },
      { name: '人型狩り', description: '人型系への与ダメージ+30%', effects: [{ type: 'speciesKiller_humanoid', value: 30 }] },
    ],
    skills: [
      { id: 'life_drain', name: '生命吸収', description: 'ダメージを与えHP吸収', type: 'magic', target: 'single', multiplier: 1.2, mpCost: 14 },
    ],
    masterySkill: { name: '死の抱擁', description: '与ダメージの30%HP吸収', type: 'passive', effects: [{ type: 'hpSteal', value: 30 }] },
  },
  goblin: {
    id: 'goblin',
    name: 'ゴブリン',
    description: `【基礎ステ】HP60 MP35 ATK9 DEF5 AGI18 MAG6
【パッシブ】
・狡猾: 先制率+35%
・弱者の知恵: HP低下時回避+20%
・急所狙い: クリ率+15%
・人型狩り: 人型系へのダメ+20%
【スキル】
・奇襲(MP10): 単体物理1.8倍
【マスタリー】
・群狼戦術: 味方1人につきダメ+10%`,
    baseStats: { maxHp: 60, maxMp: 35, atk: 9, def: 5, agi: 18, mag: 6 },
    passives: [
      { name: '狡猾', description: '先制率が大幅上昇', effects: [{ type: 'firstStrikeBonus', value: 35 }] },
      { name: '弱者の知恵', description: 'HP低下時に回避率上昇', effects: [{ type: 'evasionBonus', value: 20 }] },
      { name: '急所狙い', description: 'クリティカル率上昇', effects: [{ type: 'critBonus', value: 15 }] },
      { name: '人型狩り', description: '人型系への与ダメージ+20%', effects: [{ type: 'speciesKiller_humanoid', value: 20 }] },
    ],
    skills: [
      { id: 'ambush', name: '奇襲', description: '先制で高ダメージの一撃', type: 'attack', target: 'single', multiplier: 1.8, mpCost: 10 },
    ],
    masterySkill: { name: '群狼戦術', description: '味方が多いほどダメージ上昇', type: 'passive', effects: [{ type: 'allyCountBonus', value: 10 }] },
  },
  dragonewt: {
    id: 'dragonewt',
    name: 'ドラゴニュート',
    description: `【基礎ステ】HP115 MP55 ATK14 DEF12 AGI8 MAG14
【パッシブ】
・竜の血: 物理+15%, 魔法+15%
・竜鱗: 被ダメ-10%
・威圧: 敵ATK-10%
・竜殺し: 竜系へのダメ+80%
【スキル】
・ドラゴンブレス(MP20,火): 全体魔法1.3倍
【マスタリー】
・竜の咆哮(MP35,火): 全体防御無視2.0倍`,
    baseStats: { maxHp: 115, maxMp: 55, atk: 14, def: 12, agi: 8, mag: 14 },
    passives: [
      { name: '竜の血', description: '物理・魔法威力が上昇', effects: [{ type: 'physicalBonus', value: 15 }, { type: 'magicBonus', value: 15 }] },
      { name: '竜鱗', description: '炎耐性と被ダメージ軽減', effects: [{ type: 'damageReduction', value: 10 }] },
      { name: '威圧', description: '敵の攻撃力を下げる', effects: [{ type: 'intimidate', value: 10 }] },
      { name: '竜殺し', description: '竜系への与ダメージ+80%', effects: [{ type: 'speciesKiller_dragon', value: 80 }] },
    ],
    skills: [
      { id: 'dragon_breath', name: 'ドラゴンブレス', description: '全体に炎のブレス', type: 'magic', target: 'all', multiplier: 1.3, mpCost: 20, element: 'fire' },
    ],
    masterySkill: {
      name: '竜の咆哮',
      description: '全体に防御無視ダメージ',
      type: 'active',
      skill: { id: 'dragon_roar', name: '竜の咆哮', description: '防御無視の全体攻撃', type: 'magic', target: 'all', multiplier: 2.0, mpCost: 35, element: 'fire' },
    },
  },
  angel: {
    id: 'angel',
    name: 'エンジェル',
    description: `【基礎ステ】HP85 MP90 ATK6 DEF8 AGI12 MAG18
【パッシブ】
・聖なる光: 回復量+40%
・守護の翼: 味方被ダメ-10%
・浄化: 状態異常耐性+50%
・悪魔狩り: 悪魔系へのダメ+60%
【スキル】
・聖なる祝福(MP22): 味方全体HP回復0.9倍
【マスタリー】
・奇跡の復活: 味方死亡時、戦闘中1回蘇生`,
    baseStats: { maxHp: 85, maxMp: 90, atk: 6, def: 8, agi: 12, mag: 18 },
    passives: [
      { name: '聖なる光', description: '回復量が大幅上昇', effects: [{ type: 'healBonus', value: 40 }] },
      { name: '守護の翼', description: '味方の被ダメージを軽減', effects: [{ type: 'allyDefense', value: 10 }] },
      { name: '浄化', description: '状態異常耐性上昇', effects: [{ type: 'statusResist', value: 50 }] },
      { name: '悪魔狩り', description: '悪魔系への与ダメージ+60%', effects: [{ type: 'speciesKiller_demon', value: 60 }] },
    ],
    skills: [
      { id: 'divine_blessing', name: '聖なる祝福', description: '味方全体を回復', type: 'heal', target: 'allAllies', multiplier: 0.9, mpCost: 22 },
    ],
    masterySkill: { name: '奇跡の復活', description: '味方死亡時、戦闘中1回蘇生', type: 'passive', effects: [{ type: 'autoRevive', value: 1 }] },
  },
  demon: {
    id: 'demon',
    name: 'デーモン',
    description: `【基礎ステ】HP95 MP70 ATK10 DEF9 AGI10 MAG18
【パッシブ】
・闇の力: 魔法ダメ+25%
・生命吸収: 与ダメの15%HP回復
・恐怖のオーラ: 回避+15%
・竜耐性: 竜系からの被ダメ-30%
・人型狩り: 人型系へのダメ+40%
【スキル】
・呪いの眼(MP14): 敵ATK/DEF-25%(3T)
【マスタリー】
・魂の契約(MP30): HP20%消費、単体4.0倍`,
    baseStats: { maxHp: 95, maxMp: 70, atk: 10, def: 9, agi: 10, mag: 18 },
    passives: [
      { name: '闇の力', description: '魔法威力が上昇', effects: [{ type: 'magicBonus', value: 25 }] },
      { name: '生命吸収', description: '与ダメージの一部をHP回復', effects: [{ type: 'hpSteal', value: 15 }] },
      { name: '恐怖のオーラ', description: '敵の命中率を下げる', effects: [{ type: 'evasionBonus', value: 15 }] },
      { name: '竜耐性', description: '竜系からの被ダメージ-30%', effects: [{ type: 'speciesResist_dragon', value: 30 }] },
      { name: '人型狩り', description: '人型系への与ダメージ+40%', effects: [{ type: 'speciesKiller_humanoid', value: 40 }] },
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
