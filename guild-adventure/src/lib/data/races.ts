import { RaceData } from '../types';

export const races: Record<string, RaceData> = {
  human: {
    id: 'human',
    name: '人間',
    description: 'ステータスは控えめだが、ドロップ率+40%の幸運が最大の武器。ファーム周回に最適な種族。',
    baseStats: { maxHp: 95, maxMp: 40, atk: 9, def: 8, agi: 9, mag: 8 },  // HP+10, ATK+1 バフ
    passives: [
      { name: '適応力', description: 'クリティカル率と回避率が上昇', effects: [{ type: 'critBonus', value: 5 }, { type: 'evasionBonus', value: 5 }] },
      { name: '不屈の精神', description: 'HPが低いほど攻撃力が上がる', effects: [{ type: 'damageBonus', value: 10 }] },
      { name: '幸運', description: 'アイテムのドロップ率が上昇', effects: [{ type: 'dropBonus', value: 40 }] },
    ],
    skills: [
      { id: 'inspire', name: '鼓舞', description: '味方全体の攻撃力を上昇', type: 'buff', target: 'allAllies', multiplier: 0, mpCost: 15, effect: { type: 'atkUp', value: 20, duration: 3 } },
    ],
    masterySkill: { name: '英雄の器', description: '味方全員の全ステータス+10%', type: 'passive', effects: [{ type: 'allStats', value: 10 }] },
    masterySkill2: { name: '人類の結束', description: '前衛3人以上でATK+25%', type: 'passive', effects: [{ type: 'frontlineBonus', value: 25 }] },
  },
  elf: {
    id: 'elf',
    name: 'エルフ',
    description: '魔法と素早さに特化した種族。HPは低いがMAGとAGIが高く、魔法攻撃が強力。レア発見+20%！',
    baseStats: { maxHp: 75, maxMp: 80, atk: 7, def: 6, agi: 16, mag: 16 },
    passives: [
      { name: '魔力の血統', description: '魔法攻撃の威力が上昇', effects: [{ type: 'magicBonus', value: 25 }] },
      { name: '風の加護', description: '回避率と先制率が上昇', effects: [{ type: 'evasionBonus', value: 15 }, { type: 'firstStrikeBonus', value: 20 }] },
      { name: 'MP自然回復', description: '毎ターンMPが回復', effects: [{ type: 'mpRegen', value: 3 }] },
      { name: '悪魔狩り', description: '悪魔系への与ダメージ+30%', effects: [{ type: 'speciesKiller_demon', value: 30 }] },
      { name: '鷹の目', description: 'レア装備発見率+20%', effects: [{ type: 'rareDropBonus', value: 20 }] },
    ],
    skills: [
      { id: 'spirit_arrow', name: '精霊の矢', description: '精霊の力で敵を攻撃', type: 'magic', target: 'single', multiplier: 1.4, mpCost: 10, element: 'wind' },
    ],
    masterySkill: { name: '精霊契約', description: '味方の魔法攻撃後に追撃', type: 'passive', effects: [{ type: 'followUp', value: 50 }] },
    masterySkill2: { name: '精霊の守護', description: '味方が魔法ダメージを受けるとMP3回復', type: 'passive', effects: [{ type: 'allyMagicHitMp', value: 3 }] },
  },
  dwarf: {
    id: 'dwarf',
    name: 'ドワーフ',
    description: '最高のHPとDEF、高いATKを持つ重装タンク。AGIとMAGは低いが、生存力抜群。騎士やパラディンと相性◎',
    baseStats: { maxHp: 140, maxMp: 30, atk: 14, def: 16, agi: 5, mag: 5 },
    passives: [
      { name: '鋼の肉体', description: '被ダメージを軽減', effects: [{ type: 'damageReduction', value: 20 }] },
      { name: '怪力', description: '物理攻撃の威力が上昇', effects: [{ type: 'physicalBonus', value: 15 }] },
      { name: '頑強', description: '劣化耐性+50%', effects: [{ type: 'degradationResist', value: 50 }] },
      { name: '竜殺し', description: '竜系からの被ダメージ軽減', effects: [{ type: 'speciesResist_dragon', value: 20 }] },
    ],
    skills: [
      { id: 'iron_wall', name: '鉄壁', description: '自身の防御力を大幅上昇', type: 'buff', target: 'self', multiplier: 0, mpCost: 12, effect: { type: 'defUp', value: 50, duration: 3 } },
    ],
    masterySkill: { name: '守護の盾', description: '50%の確率で味方を庇う', type: 'passive', effects: [{ type: 'cover', value: 50 }] },
    masterySkill2: { name: '秘宝の鼻', description: 'レア装備ドロップ+40%', type: 'passive', effects: [{ type: 'rareDropBonus', value: 40 }] },
  },
  halfling: {
    id: 'halfling',
    name: 'ハーフリング',
    description: '小柄で幸運な種族。クリティカルと回避に特化。盗賊やサムライで一撃必殺を狙え！',
    baseStats: { maxHp: 85, maxMp: 45, atk: 9, def: 9, agi: 14, mag: 10 },  // HP+15, ATK+1, DEF+1 バフ
    passives: [
      { name: '幸運の星', description: 'クリティカル率が上昇', effects: [{ type: 'critBonus', value: 20 }] },
      { name: '小さな体', description: '回避率上昇、被ダメージ増加', effects: [{ type: 'evasionBonus', value: 25 }, { type: 'damageReduction', value: -10 }] },
      { name: '先制の才', description: '先制率が上昇', effects: [{ type: 'firstStrikeBonus', value: 20 }] },
      { name: '急所知識', description: '人型系への与ダメージ上昇', effects: [{ type: 'speciesKiller_humanoid', value: 25 }] },
      { name: 'お宝嗅覚', description: 'コイン獲得が上昇', effects: [{ type: 'coinBonus', value: 25 }] },
    ],
    skills: [
      { id: 'vital_strike', name: '急所狙い', description: 'クリティカル率の高い一撃', type: 'attack', target: 'single', multiplier: 1.5, mpCost: 8 },
    ],
    masterySkill: { name: '幸運の星', description: 'クリティカル時ダメージ2倍', type: 'passive', effects: [{ type: 'critDamage', value: 100 }] },
    masterySkill2: { name: '幸運の風', description: '追加抽選+2', type: 'passive', effects: [{ type: 'doubleDropRoll', value: 2 }] },
  },
  orc: {
    id: 'orc',
    name: 'オーク',
    description: '最高クラスのATKを持つ脳筋種族。被ダメ増加のデメリットあり。バーサーカーで最強火力！',
    baseStats: { maxHp: 120, maxMp: 20, atk: 18, def: 8, agi: 7, mag: 3 },
    passives: [
      { name: '狂戦士', description: '物理攻撃力が大幅上昇', effects: [{ type: 'physicalBonus', value: 30 }] },
      { name: '一撃必殺', description: '攻撃回数1固定、威力+50%', effects: [{ type: 'fixedHits', value: 1 }, { type: 'singleHitBonus', value: 50 }] },
      { name: '無謀', description: '被ダメージが増加', effects: [{ type: 'damageReduction', value: -15 }] },
      { name: '獣殺し', description: '獣系への与ダメージ上昇', effects: [{ type: 'speciesKiller_beast', value: 40 }] },
    ],
    skills: [
      { id: 'fury_strike', name: '怒りの一撃', description: '渾身の大ダメージ攻撃', type: 'attack', target: 'single', multiplier: 2.2, mpCost: 12 },
    ],
    masterySkill: { name: '狂戦士の魂', description: 'HP30%以下で攻撃力2倍', type: 'passive', effects: [{ type: 'lowHpBonus', value: 100 }] },
    masterySkill2: { name: '戦士の絆', description: '味方の物理攻撃後30%で追撃', type: 'passive', effects: [{ type: 'physicalFollowUp', value: 30 }] },
  },
  lizardman: {
    id: 'lizardman',
    name: 'リザードマン',
    description: '毎ターンHP回復+物理魔法両方に適性を持つバランス型。戦士やパラディンと好相性。',
    baseStats: { maxHp: 110, maxMp: 40, atk: 12, def: 14, agi: 9, mag: 8 },
    passives: [
      { name: '再生能力', description: '毎ターンHP回復', effects: [{ type: 'hpRegen', value: 8 }] },
      { name: '硬い鱗', description: '被ダメ軽減+劣化耐性30%', effects: [{ type: 'damageReduction', value: 10 }, { type: 'degradationResist', value: 30 }] },
      { name: '両刀の才', description: '物理と魔法の威力上昇', effects: [{ type: 'physicalBonus', value: 10 }, { type: 'magicBonus', value: 10 }] },
      { name: '獣耐性', description: '獣系からの被ダメージ軽減', effects: [{ type: 'speciesResist_beast', value: 15 }] },
    ],
    skills: [
      { id: 'regenerate', name: '再生', description: '自身のHPを回復', type: 'heal', target: 'self', multiplier: 1.5, mpCost: 10 },
    ],
    masterySkill: { name: '不死の再生', description: '戦闘中1回、瀕死から全回復', type: 'passive', effects: [{ type: 'revive', value: 100 }] },
    masterySkill2: { name: '生命の循環', description: '敵を倒すとHP25回復', type: 'passive', effects: [{ type: 'hpOnKill', value: 25 }] },
  },
  fairy: {
    id: 'fairy',
    name: 'フェアリー',
    description: '最高のMAGとMP、高回避を持つ魔法特化種族。HPとDEFは最低クラス。司祭で最強ヒーラー！',
    baseStats: { maxHp: 45, maxMp: 100, atk: 4, def: 3, agi: 18, mag: 22 },
    passives: [
      { name: '魔力の奔流', description: '魔法威力が大幅上昇', effects: [{ type: 'magicBonus', value: 35 }] },
      { name: '妖精の翅', description: '回避率が大幅上昇', effects: [{ type: 'evasionBonus', value: 30 }] },
      { name: '癒しの力', description: '回復量が上昇', effects: [{ type: 'healBonus', value: 30 }] },
      { name: '聖光', description: '不死系への与ダメージ上昇', effects: [{ type: 'speciesKiller_undead', value: 50 }] },
      { name: '宝石眼', description: 'コイン獲得が上昇', effects: [{ type: 'coinBonus', value: 20 }] },
    ],
    skills: [
      { id: 'fairy_heal', name: '癒しの光', description: '味方一人のHPを回復', type: 'heal', target: 'ally', multiplier: 1.3, mpCost: 12 },
    ],
    masterySkill: { name: '妖精の祝福', description: '味方への回復量+50%', type: 'passive', effects: [{ type: 'healBonus', value: 50 }] },
    masterySkill2: { name: '妖精の導き', description: '探索時間-40%', type: 'passive', effects: [{ type: 'explorationSpeedBonus', value: 40 }] },
  },
  undead: {
    id: 'undead',
    name: 'アンデッド',
    description: '状態異常耐性+HP吸収を持つ不死種族。回復効果半減のデメリットあり。ネクロマンサーで自己完結！',
    baseStats: { maxHp: 90, maxMp: 50, atk: 11, def: 12, agi: 6, mag: 14 },
    passives: [
      { name: '不死の呪い', description: '状態異常耐性上昇', effects: [{ type: 'statusResist', value: 80 }] },
      { name: '腐食攻撃', description: '与える劣化+3%', effects: [{ type: 'degradationBonus', value: 3 }] },
      { name: 'HP吸収', description: '与ダメージの一部をHP回復', effects: [{ type: 'hpSteal', value: 20 }] },
      { name: '不死耐性', description: '不死系からの被ダメージ軽減', effects: [{ type: 'speciesResist_undead', value: 50 }] },
      { name: '人型狩り', description: '人型系への与ダメージ上昇', effects: [{ type: 'speciesKiller_humanoid', value: 30 }] },
    ],
    skills: [
      { id: 'life_drain', name: '生命吸収', description: 'ダメージを与えHP吸収', type: 'magic', target: 'single', multiplier: 1.2, mpCost: 14 },
    ],
    masterySkill: { name: '死の抱擁', description: '与ダメージの30%HP吸収', type: 'passive', effects: [{ type: 'hpSteal', value: 30 }] },
    masterySkill2: { name: '死者の執念', description: 'HP0で50%の確率で耐える', type: 'passive', effects: [{ type: 'deathResist', value: 50 }] },
  },
  goblin: {
    id: 'goblin',
    name: 'ゴブリン',
    description: '先制率+35%で確実に先手を取れる小鬼。近道で探索時間-15%！',
    baseStats: { maxHp: 80, maxMp: 40, atk: 10, def: 7, agi: 18, mag: 7 },  // 大幅バフ
    passives: [
      { name: '狡猾', description: '先制率が大幅上昇', effects: [{ type: 'firstStrikeBonus', value: 35 }] },
      { name: '追撃', description: '攻撃回数+1', effects: [{ type: 'bonusHits', value: 1 }] },
      { name: '急所狙い', description: 'クリティカル率上昇', effects: [{ type: 'critBonus', value: 15 }] },
      { name: '人型狩り', description: '人型系への与ダメージ上昇', effects: [{ type: 'speciesKiller_humanoid', value: 20 }] },
      { name: '近道発見', description: '探索時間が短縮', effects: [{ type: 'explorationSpeedBonus', value: 15 }] },
    ],
    skills: [
      { id: 'ambush', name: '奇襲', description: '先制で高ダメージの一撃', type: 'attack', target: 'single', multiplier: 1.8, mpCost: 10 },
    ],
    masterySkill: { name: '群狼戦術', description: '味方が多いほどダメージ上昇', type: 'passive', effects: [{ type: 'allyCountBonus', value: 10 }] },
    masterySkill2: { name: '略奪者', description: 'コインボーナス+50%', type: 'passive', effects: [{ type: 'coinBonus', value: 50 }] },
  },
  dragonewt: {
    id: 'dragonewt',
    name: 'ドラゴニュート',
    description: 'ATK・MAG両方が高い万能アタッカー。竜への特攻が最強クラス。賢者やパラディンで強力！',
    baseStats: { maxHp: 105, maxMp: 50, atk: 13, def: 11, agi: 8, mag: 13 },  // HP-10, MP-5, ATK-1, DEF-1, MAG-1 ナーフ
    passives: [
      { name: '竜の血', description: '物理・魔法威力が上昇', effects: [{ type: 'physicalBonus', value: 15 }, { type: 'magicBonus', value: 15 }] },
      { name: '竜鱗', description: '炎耐性と被ダメージ軽減', effects: [{ type: 'damageReduction', value: 10 }] },
      { name: '威圧', description: '敵の攻撃力を下げる', effects: [{ type: 'intimidate', value: 10 }] },
      { name: '竜殺し', description: '竜系への与ダメージ大幅上昇', effects: [{ type: 'speciesKiller_dragon', value: 80 }] },
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
    masterySkill2: { name: '龍の怒り', description: 'クリティカル時に追撃+50%ダメージ', type: 'passive', effects: [{ type: 'critFollowUp', value: 50 }] },
  },
  angel: {
    id: 'angel',
    name: 'エンジェル',
    description: '回復量+40%、状態異常耐性を持つサポート特化種族。司祭やパラディンで最高のヒーラーに。',
    baseStats: { maxHp: 75, maxMp: 85, atk: 6, def: 7, agi: 12, mag: 17 },  // HP-10, MP-5, DEF-1, MAG-1 ナーフ
    passives: [
      { name: '聖なる光', description: '回復量が大幅上昇', effects: [{ type: 'healBonus', value: 40 }] },
      { name: '守護の翼', description: '味方の被ダメージを軽減', effects: [{ type: 'allyDefense', value: 10 }] },
      { name: '浄化', description: '状態異常耐性上昇', effects: [{ type: 'statusResist', value: 50 }] },
      { name: '悪魔狩り', description: '悪魔系への与ダメージ上昇', effects: [{ type: 'speciesKiller_demon', value: 60 }] },
    ],
    skills: [
      { id: 'divine_blessing', name: '聖なる祝福', description: '味方全体を回復', type: 'heal', target: 'allAllies', multiplier: 0.9, mpCost: 22 },
    ],
    masterySkill: { name: '奇跡の復活', description: '味方死亡時、戦闘中1回蘇生', type: 'passive', effects: [{ type: 'autoRevive', value: 1 }] },
    masterySkill2: { name: '天使の祝福', description: '味方全体HP+8/ターン', type: 'passive', effects: [{ type: 'allyHpRegen', value: 8 }] },
  },
  demon: {
    id: 'demon',
    name: 'デーモン',
    description: '高いMAGとHP吸収を持つ闇の魔法使い。レア嗅覚+20%！',
    baseStats: { maxHp: 90, maxMp: 65, atk: 9, def: 8, agi: 10, mag: 17 },
    passives: [
      { name: '闇の力', description: '魔法威力が上昇', effects: [{ type: 'magicBonus', value: 25 }] },
      { name: '生命吸収', description: '与ダメージの一部をHP回復', effects: [{ type: 'hpSteal', value: 15 }] },
      { name: '恐怖のオーラ', description: '敵の命中率を下げる', effects: [{ type: 'evasionBonus', value: 15 }] },
      { name: '竜耐性', description: '竜系からの被ダメージ軽減', effects: [{ type: 'speciesResist_dragon', value: 30 }] },
      { name: '人型狩り', description: '人型系への与ダメージ上昇', effects: [{ type: 'speciesKiller_humanoid', value: 40 }] },
      { name: '欲望の嗅覚', description: 'レア装備発見率+20%', effects: [{ type: 'rareDropBonus', value: 20 }] },
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
    masterySkill2: { name: '地獄の契約', description: '与ダメ+30%、被ダメ+15%', type: 'passive', effects: [{ type: 'damageBonus', value: 30 }, { type: 'damageReduction', value: -15 }] },
  },
};

export type RaceType = keyof typeof races;
export const raceList = Object.values(races);
