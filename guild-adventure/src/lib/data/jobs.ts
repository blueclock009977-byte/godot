import { JobData } from '../types';

export const jobs: Record<string, JobData> = {
  warrior: {
    id: 'warrior',
    name: '戦士',
    description: `【ステ補正】HP+20 MP+5 ATK+5 DEF+3
【パッシブ】
・武器習熟: 物理ダメ+15%
・闘志: HP低下時クリ率+10%
【スキル】
・強撃(MP8): 単体物理1.8倍
・雄叫び(MP10): 自身ATK+30%(3T)
・薙ぎ払い(MP15): 全体物理1.0倍
【マスタリー】
・武神の構え: 物理ダメ+30%`,
    statModifiers: { maxHp: 20, maxMp: 5, atk: 5, def: 3 },
    passives: [
      { name: '武器習熟', description: '物理攻撃の威力が上昇', effects: [{ type: 'physicalBonus', value: 15 }] },
      { name: '闘志', description: 'HPが減るほどクリティカル率上昇', effects: [{ type: 'critBonus', value: 10 }] },
    ],
    skills: [
      { id: 'power_strike', name: '強撃', description: '渾身の一撃', type: 'attack', target: 'single', multiplier: 1.8, mpCost: 8 },
      { id: 'war_cry', name: '雄叫び', description: '自身の攻撃力を上昇', type: 'buff', target: 'self', multiplier: 0, mpCost: 10, effect: { type: 'atkUp', value: 30, duration: 3 } },
      { id: 'cleave', name: '薙ぎ払い', description: '全体に物理攻撃', type: 'attack', target: 'all', multiplier: 1.0, mpCost: 15 },
    ],
    masterySkill: { name: '武神の構え', description: '物理ダメージ+30%', type: 'passive', effects: [{ type: 'physicalBonus', value: 30 }] },
  },
  mage: {
    id: 'mage',
    name: '魔法使い',
    description: `【ステ補正】HP-10 MP+30 MAG+8 AGI+2
【パッシブ】
・魔力増幅: 魔法ダメ+25%
・詠唱効率: MP消費-15%
・魔力の泉: 毎ターンMP+5
【スキル】
・ファイアボール(MP18,火): 全体魔法1.2倍
・アイスランス(MP15,水): 単体魔法2.0倍
・サンダー(MP12,風): 単体魔法1.4倍
【マスタリー】
・魔力解放: 全体魔法が2回発動`,
    statModifiers: { maxHp: -10, maxMp: 30, mag: 8, agi: 2 },
    passives: [
      { name: '魔力増幅', description: '魔法攻撃の威力が大幅に上昇', effects: [{ type: 'magicBonus', value: 25 }] },
      { name: '詠唱効率', description: 'MP消費が軽減', effects: [{ type: 'mpReduction', value: 15 }] },
      { name: '魔力の泉', description: '毎ターンMP回復', effects: [{ type: 'mpRegen', value: 5 }] },
    ],
    skills: [
      { id: 'fireball', name: 'ファイアボール', description: '全体に炎の魔法攻撃', type: 'magic', target: 'all', multiplier: 1.2, mpCost: 18, element: 'fire' },
      { id: 'ice_lance', name: 'アイスランス', description: '単体に氷の魔法攻撃（高威力）', type: 'magic', target: 'single', multiplier: 2.0, mpCost: 15, element: 'water' },
      { id: 'thunder', name: 'サンダー', description: '単体に雷撃', type: 'magic', target: 'single', multiplier: 1.4, mpCost: 12, element: 'wind' },
    ],
    masterySkill: { name: '魔力解放', description: '全体魔法が2回発動', type: 'passive', effects: [{ type: 'doublecast', value: 100 }] },
  },
  priest: {
    id: 'priest',
    name: '司祭',
    description: `【ステ補正】HP+10 MP+25 DEF+2 MAG+5
【パッシブ】
・聖なる力: 回復量+30%
・神の加護: 状態異常耐性+30%
【スキル】
・ヒール(MP12): 味方1人HP回復1.5倍
・ヒールオール(MP25): 味方全体HP回復0.8倍
・ホーリーライト(MP14): 単体魔法1.4倍
【マスタリー】
・聖域: 味方全体の被ダメ-20%`,
    statModifiers: { maxHp: 10, maxMp: 25, def: 2, mag: 5 },
    passives: [
      { name: '聖なる力', description: '回復量が大幅に上昇', effects: [{ type: 'healBonus', value: 30 }] },
      { name: '神の加護', description: '状態異常耐性が上昇', effects: [{ type: 'statusResist', value: 30 }] },
    ],
    skills: [
      { id: 'heal', name: 'ヒール', description: '味方一人のHPを回復', type: 'heal', target: 'ally', multiplier: 1.5, mpCost: 12 },
      { id: 'group_heal', name: 'ヒールオール', description: '味方全体のHPを回復', type: 'heal', target: 'allAllies', multiplier: 0.8, mpCost: 25 },
      { id: 'holy_light', name: 'ホーリーライト', description: '聖なる光で敵を攻撃', type: 'magic', target: 'single', multiplier: 1.4, mpCost: 14 },
    ],
    masterySkill: { name: '聖域', description: '味方全体の被ダメージ-20%', type: 'passive', effects: [{ type: 'allyDefense', value: 20 }] },
  },
  thief: {
    id: 'thief',
    name: '盗賊',
    description: `【ステ補正】MP+15 ATK+3 AGI+8 DEF-2
【パッシブ】
・急所狙い: クリ率+25%
・クリティカル強化: クリダメ+30%
・影潜み: 先制率+20%
【スキル】
・バックスタブ(MP10): 単体物理1.6倍
・毒刃(MP12): 単体物理1.2倍+毒
・暗殺(MP25): 単体物理2.5倍
【マスタリー】
・暗殺術: HP低い敵に確定クリ`,
    statModifiers: { maxMp: 15, atk: 3, agi: 8, def: -2 },
    passives: [
      { name: '急所狙い', description: 'クリティカル率が大幅上昇', effects: [{ type: 'critBonus', value: 25 }] },
      { name: 'クリティカル強化', description: 'クリティカル時のダメージ上昇', effects: [{ type: 'critDamage', value: 30 }] },
      { name: '影潜み', description: '先制率が上昇', effects: [{ type: 'firstStrikeBonus', value: 20 }] },
    ],
    skills: [
      { id: 'backstab', name: 'バックスタブ', description: '急所を狙った一撃', type: 'attack', target: 'single', multiplier: 1.6, mpCost: 10 },
      { id: 'poison_blade', name: '毒刃', description: '毒を付与する攻撃', type: 'attack', target: 'single', multiplier: 1.2, mpCost: 12 },
      { id: 'assassinate', name: '暗殺', description: '超高威力の一撃', type: 'attack', target: 'single', multiplier: 2.5, mpCost: 25 },
    ],
    masterySkill: { name: '暗殺術', description: 'HP低い敵に確定クリティカル', type: 'passive', effects: [{ type: 'critBonus', value: 100 }] },
  },
  knight: {
    id: 'knight',
    name: '騎士',
    description: `【ステ補正】HP+40 MP+10 DEF+8 AGI-3
【パッシブ】
・鉄壁: 被ダメ-25%
・盾の心得: 物理ダメ+10%
【スキル】
・シールドバッシュ(MP10): 単体物理1.3倍
・鉄壁の構え(MP15): 自身DEF+50%(3T)
・聖なる一撃(MP18): 単体物理1.8倍
【マスタリー】
・鉄壁の守護: 50%で味方を庇う`,
    statModifiers: { maxHp: 40, maxMp: 10, def: 8, agi: -3 },
    passives: [
      { name: '鉄壁', description: '被ダメージを大幅軽減', effects: [{ type: 'damageReduction', value: 25 }] },
      { name: '盾の心得', description: '物理攻撃も強い', effects: [{ type: 'physicalBonus', value: 10 }] },
    ],
    skills: [
      { id: 'shield_bash', name: 'シールドバッシュ', description: '盾で殴りつける', type: 'attack', target: 'single', multiplier: 1.3, mpCost: 10 },
      { id: 'fortress', name: '鉄壁の構え', description: '自身の防御力を大幅上昇', type: 'buff', target: 'self', multiplier: 0, mpCost: 15, effect: { type: 'defUp', value: 50, duration: 3 } },
      { id: 'holy_strike', name: '聖なる一撃', description: '聖なる力を込めた攻撃', type: 'attack', target: 'single', multiplier: 1.8, mpCost: 18 },
    ],
    masterySkill: { name: '鉄壁の守護', description: '50%で味方を庇う', type: 'passive', effects: [{ type: 'cover', value: 50 }] },
  },
  hunter: {
    id: 'hunter',
    name: '狩人',
    description: `【ステ補正】MP+15 ATK+4 AGI+5 DEF+1
【パッシブ】
・鷹の目: 命中+20%, 先制+30%
・狩りの心得: クリ率+15%
【スキル】
・狙い撃ち(MP10): 単体物理1.7倍
・矢の雨(MP18): 全体物理0.9倍
・速射(MP12): 単体物理1.4倍
【マスタリー】
・必中の矢: 回避無視+クリ率+30%`,
    statModifiers: { maxMp: 15, atk: 4, agi: 5, def: 1 },
    passives: [
      { name: '鷹の目', description: '命中率と先制率が上昇', effects: [{ type: 'accuracyBonus', value: 20 }, { type: 'firstStrikeBonus', value: 30 }] },
      { name: '狩りの心得', description: 'クリティカル率が上昇', effects: [{ type: 'critBonus', value: 15 }] },
    ],
    skills: [
      { id: 'aimed_shot', name: '狙い撃ち', description: '必中の矢を放つ', type: 'attack', target: 'single', multiplier: 1.7, mpCost: 10 },
      { id: 'arrow_rain', name: '矢の雨', description: '全体に矢を降らせる', type: 'attack', target: 'all', multiplier: 0.9, mpCost: 18 },
      { id: 'rapid_fire', name: '速射', description: '素早く攻撃', type: 'attack', target: 'single', multiplier: 1.4, mpCost: 12 },
    ],
    masterySkill: { name: '必中の矢', description: '回避無視+クリティカル率+30%', type: 'passive', effects: [{ type: 'accuracyBonus', value: 100 }, { type: 'critBonus', value: 30 }] },
  },
  ninja: {
    id: 'ninja',
    name: '忍者',
    description: `【ステ補正】MP+20 ATK+2 AGI+10 MAG+2 DEF-3
【パッシブ】
・影分身: 回避+30%
・疾風: 先制+25%
・二刀流: 物理ダメ+15%
【スキル】
・影斬り(MP8): 単体物理1.4倍
・手裏剣(MP12): 全体物理0.8倍
・必殺(MP25): 単体物理2.2倍
【マスタリー】
・分身の術: 25%で完全回避`,
    statModifiers: { maxMp: 20, atk: 2, agi: 10, mag: 2, def: -3 },
    passives: [
      { name: '影分身', description: '回避率が大幅に上昇', effects: [{ type: 'evasionBonus', value: 30 }] },
      { name: '疾風', description: '先制率が大幅に上昇', effects: [{ type: 'firstStrikeBonus', value: 25 }] },
      { name: '二刀流', description: '物理攻撃力上昇', effects: [{ type: 'physicalBonus', value: 15 }] },
    ],
    skills: [
      { id: 'shadow_strike', name: '影斬り', description: '素早い攻撃', type: 'attack', target: 'single', multiplier: 1.4, mpCost: 8 },
      { id: 'shuriken', name: '手裏剣', description: '全体に手裏剣を投げる', type: 'attack', target: 'all', multiplier: 0.8, mpCost: 12 },
      { id: 'fatal_blow', name: '必殺', description: '高威力の一撃', type: 'attack', target: 'single', multiplier: 2.2, mpCost: 25 },
    ],
    masterySkill: { name: '分身の術', description: '25%で攻撃を完全回避', type: 'passive', effects: [{ type: 'perfectEvasion', value: 25 }] },
  },
  sage: {
    id: 'sage',
    name: '賢者',
    description: `【ステ補正】HP+5 MP+25 MAG+6 DEF+1
【パッシブ】
・叡智: 魔法ダメ+15%, 回復量+15%
・瞑想: 毎ターンMP+4
【スキル】
・賢者の炎(MP12,火): 単体魔法1.5倍
・癒しの光(MP14): 味方1人HP回復1.3倍
・メテオ(MP40,火): 全体魔法2.0倍
【マスタリー】
・叡智の結晶: MP消費-50%`,
    statModifiers: { maxHp: 5, maxMp: 25, mag: 6, def: 1 },
    passives: [
      { name: '叡智', description: '魔法威力と回復量が上昇', effects: [{ type: 'magicBonus', value: 15 }, { type: 'healBonus', value: 15 }] },
      { name: '瞑想', description: '毎ターンMP回復', effects: [{ type: 'mpRegen', value: 4 }] },
    ],
    skills: [
      { id: 'sage_fire', name: '賢者の炎', description: '単体に炎魔法', type: 'magic', target: 'single', multiplier: 1.5, mpCost: 12, element: 'fire' },
      { id: 'sage_heal', name: '癒しの光', description: '味方一人を回復', type: 'heal', target: 'ally', multiplier: 1.3, mpCost: 14 },
      { id: 'meteor', name: 'メテオ', description: '全体に超高威力魔法', type: 'magic', target: 'all', multiplier: 2.0, mpCost: 40, element: 'fire' },
    ],
    masterySkill: { name: '叡智の結晶', description: 'MP消費-50%', type: 'passive', effects: [{ type: 'mpReduction', value: 50 }] },
  },
  berserker: {
    id: 'berserker',
    name: 'バーサーカー',
    description: `【ステ補正】HP+30 MP+5 ATK+10 DEF-5 AGI+3
【パッシブ】
・狂乱: 物理ダメ+40%
・捨て身: 被ダメ+20%
・血の狂気: クリダメ+50%
【スキル】
・狂乱撃(MP15): 単体物理3.0倍
・暴走(MP20): 全体物理1.5倍
・血の咆哮(MP12): 自身ATK+50%(3T)
【マスタリー】
・血の狂宴: 攻撃ごとにATK+5%累積`,
    statModifiers: { maxHp: 30, maxMp: 5, atk: 10, def: -5, agi: 3 },
    passives: [
      { name: '狂乱', description: '物理攻撃力が大幅上昇', effects: [{ type: 'physicalBonus', value: 40 }] },
      { name: '捨て身', description: '被ダメージが増加', effects: [{ type: 'damageReduction', value: -20 }] },
      { name: '血の狂気', description: 'クリティカルダメージ上昇', effects: [{ type: 'critDamage', value: 50 }] },
    ],
    skills: [
      { id: 'frenzy', name: '狂乱撃', description: '自傷しながら超ダメージ', type: 'attack', target: 'single', multiplier: 3.0, mpCost: 15 },
      { id: 'rampage', name: '暴走', description: '全体に暴れまわる', type: 'attack', target: 'all', multiplier: 1.5, mpCost: 20 },
      { id: 'blood_rage', name: '血の咆哮', description: '攻撃力を大幅上昇', type: 'buff', target: 'self', multiplier: 0, mpCost: 12, effect: { type: 'atkUp', value: 50, duration: 3 } },
    ],
    masterySkill: { name: '血の狂宴', description: '攻撃ごとにATK+5%（累積）', type: 'passive', effects: [{ type: 'attackStack', value: 5 }] },
  },
  paladin: {
    id: 'paladin',
    name: 'パラディン',
    description: `【ステ補正】HP+25 MP+20 ATK+4 DEF+5 MAG+4
【パッシブ】
・聖騎士の誓い: 物理+15%, 回復量+20%
・神の盾: 被ダメ-15%
【スキル】
・聖剣(MP12): 単体物理1.7倍
・癒しの手(MP18): 味方1人HP回復1.8倍
・聖なる盾(MP20): 味方全体DEF+30%(3T)
【マスタリー】
・聖騎士の誓約: 味方死亡時1回自動蘇生`,
    statModifiers: { maxHp: 25, maxMp: 20, atk: 4, def: 5, mag: 4 },
    passives: [
      { name: '聖騎士の誓い', description: '物理攻撃と回復量が上昇', effects: [{ type: 'physicalBonus', value: 15 }, { type: 'healBonus', value: 20 }] },
      { name: '神の盾', description: '被ダメージ軽減', effects: [{ type: 'damageReduction', value: 15 }] },
    ],
    skills: [
      { id: 'holy_blade', name: '聖剣', description: '聖なる力で斬りつける', type: 'attack', target: 'single', multiplier: 1.7, mpCost: 12 },
      { id: 'lay_on_hands', name: '癒しの手', description: '味方一人を大回復', type: 'heal', target: 'ally', multiplier: 1.8, mpCost: 18 },
      { id: 'divine_shield', name: '聖なる盾', description: '味方全体の防御上昇', type: 'buff', target: 'allAllies', multiplier: 0, mpCost: 20, effect: { type: 'defUp', value: 30, duration: 3 } },
    ],
    masterySkill: { name: '聖騎士の誓約', description: '味方死亡時、自動で1回蘇生', type: 'passive', effects: [{ type: 'autoRevive', value: 1 }] },
  },
  necromancer: {
    id: 'necromancer',
    name: 'ネクロマンサー',
    description: `【ステ補正】HP-5 MP+30 MAG+8 DEF-2 AGI+2
【パッシブ】
・死の契約: 魔法ダメ+25%, HP吸収+25%
・冥界との繋がり: 毎ターンMP+4
【スキル】
・ダークボルト(MP12): 単体魔法1.6倍
・吸魂(MP15): 単体魔法1.2倍+HP吸収
・死の波動(MP28): 全体魔法1.4倍
【マスタリー】
・死霊召喚: 50%で倒した敵を味方に`,
    statModifiers: { maxHp: -5, maxMp: 30, mag: 8, def: -2, agi: 2 },
    passives: [
      { name: '死の契約', description: '魔法攻撃力と吸収量が上昇', effects: [{ type: 'magicBonus', value: 25 }, { type: 'hpSteal', value: 25 }] },
      { name: '冥界との繋がり', description: 'MPリジェネ', effects: [{ type: 'mpRegen', value: 4 }] },
    ],
    skills: [
      { id: 'dark_bolt', name: 'ダークボルト', description: '闇の魔法で攻撃', type: 'magic', target: 'single', multiplier: 1.6, mpCost: 12 },
      { id: 'soul_drain', name: '吸魂', description: 'HPを吸収する魔法', type: 'magic', target: 'single', multiplier: 1.2, mpCost: 15 },
      { id: 'death_wave', name: '死の波動', description: '全体に闇魔法', type: 'magic', target: 'all', multiplier: 1.4, mpCost: 28 },
    ],
    masterySkill: { name: '死霊召喚', description: '倒した敵を味方として召喚', type: 'passive', effects: [{ type: 'summonUndead', value: 50 }] },
  },
  monk: {
    id: 'monk',
    name: 'モンク',
    description: `【ステ補正】HP+15 MP+15 ATK+6 DEF+2 AGI+6
【パッシブ】
・練気: 物理ダメ+20%, 回避+15%
・心眼: クリ率+15%
【スキル】
・百裂拳(MP12): 単体物理1.8倍
・気功波(MP18): 全体魔法1.0倍
・精神統一(MP15): 自身HP回復1.5倍
【マスタリー】
・無我の境地: 50%で反撃`,
    statModifiers: { maxHp: 15, maxMp: 15, atk: 6, def: 2, agi: 6 },
    passives: [
      { name: '練気', description: '物理攻撃力と回避率が上昇', effects: [{ type: 'physicalBonus', value: 20 }, { type: 'evasionBonus', value: 15 }] },
      { name: '心眼', description: 'クリティカル率上昇', effects: [{ type: 'critBonus', value: 15 }] },
    ],
    skills: [
      { id: 'hundred_fists', name: '百裂拳', description: '連続攻撃', type: 'attack', target: 'single', multiplier: 1.8, mpCost: 12 },
      { id: 'chi_blast', name: '気功波', description: '全体に気を放つ', type: 'magic', target: 'all', multiplier: 1.0, mpCost: 18 },
      { id: 'inner_peace', name: '精神統一', description: '自身のHP回復', type: 'heal', target: 'self', multiplier: 1.5, mpCost: 15 },
    ],
    masterySkill: { name: '無我の境地', description: '全攻撃を50%で反撃', type: 'passive', effects: [{ type: 'counterRate', value: 50 }] },
  },
  ranger: {
    id: 'ranger',
    name: 'レンジャー',
    description: `【ステ補正】HP+10 MP+15 ATK+4 DEF+2 AGI+6 MAG+2
【パッシブ】
・野生の勘: 先制+25%, 回避+15%
・自然治癒: 毎ターンHP+5
【スキル】
・狙撃(MP14): 単体物理2.0倍
・罠設置(MP12): 敵全体ATK-20%(3T)
・自然の恵み(MP18): 味方全体HP回復0.6倍
【マスタリー】
・自然の化身: 毎ターンHP+15, MP+10`,
    statModifiers: { maxHp: 10, maxMp: 15, atk: 4, def: 2, agi: 6, mag: 2 },
    passives: [
      { name: '野生の勘', description: '先制率と回避率が上昇', effects: [{ type: 'firstStrikeBonus', value: 25 }, { type: 'evasionBonus', value: 15 }] },
      { name: '自然治癒', description: '毎ターンHP回復', effects: [{ type: 'hpRegen', value: 5 }] },
    ],
    skills: [
      { id: 'snipe', name: '狙撃', description: '高威力の一撃', type: 'attack', target: 'single', multiplier: 2.0, mpCost: 14 },
      { id: 'trap', name: '罠設置', description: '敵の攻撃力を下げる', type: 'debuff', target: 'all', multiplier: 0, mpCost: 12, effect: { type: 'atkDown', value: 20, duration: 3 } },
      { id: 'natures_blessing', name: '自然の恵み', description: '味方全体を少し回復', type: 'heal', target: 'allAllies', multiplier: 0.6, mpCost: 18 },
    ],
    masterySkill: { name: '自然の化身', description: '毎ターンHP/MP大幅回復', type: 'passive', effects: [{ type: 'hpRegen', value: 15 }, { type: 'mpRegen', value: 10 }] },
  },
  samurai: {
    id: 'samurai',
    name: 'サムライ',
    description: `【ステ補正】HP+15 MP+10 ATK+7 DEF+3 AGI+4
【パッシブ】
・居合の構え: クリ率+25%, クリダメ+40%
・武士道: 物理ダメ+15%
【スキル】
・居合斬り(MP12): 単体物理2.0倍
・心眼(MP10): 自身AGI+40%(3T)
・必殺剣(MP30): 単体物理3.0倍
【マスタリー】
・一閃(MP40): 全体防御無視2.5倍`,
    statModifiers: { maxHp: 15, maxMp: 10, atk: 7, def: 3, agi: 4 },
    passives: [
      { name: '居合の構え', description: 'クリティカル率とダメージが上昇', effects: [{ type: 'critBonus', value: 25 }, { type: 'critDamage', value: 40 }] },
      { name: '武士道', description: '物理攻撃力上昇', effects: [{ type: 'physicalBonus', value: 15 }] },
    ],
    skills: [
      { id: 'iai_slash', name: '居合斬り', description: '一瞬で斬りつける', type: 'attack', target: 'single', multiplier: 2.0, mpCost: 12 },
      { id: 'mind_eye', name: '心眼', description: '回避率を上昇', type: 'buff', target: 'self', multiplier: 0, mpCost: 10, effect: { type: 'agiUp', value: 40, duration: 3 } },
      { id: 'fatal_draw', name: '必殺剣', description: '超高威力の一撃', type: 'attack', target: 'single', multiplier: 3.0, mpCost: 30 },
    ],
    masterySkill: {
      name: '一閃',
      description: '敵全体に防御無視大ダメージ',
      type: 'active',
      skill: { id: 'issen', name: '一閃', description: '防御無視の全体攻撃', type: 'attack', target: 'all', multiplier: 2.5, mpCost: 40 },
    },
  },
  witch: {
    id: 'witch',
    name: 'ウィッチ',
    description: `【ステ補正】HP-5 MP+28 MAG+7 AGI+3 DEF-1
【パッシブ】
・呪術: 魔法ダメ+20%, デバフ成功+20%
・魔女の知恵: MP消費-15%
【スキル】
・呪詛(MP10): 敵ステ-30%(3T)
・毒霧(MP16): 全体魔法1.0倍+毒
・邪眼(MP18): 単体魔法1.8倍
【マスタリー】
・大呪術(MP35): 敵全体ステ-30%(3T)`,
    statModifiers: { maxHp: -5, maxMp: 28, mag: 7, agi: 3, def: -1 },
    passives: [
      { name: '呪術', description: '魔法威力と状態異常成功率が上昇', effects: [{ type: 'magicBonus', value: 20 }, { type: 'debuffBonus', value: 20 }] },
      { name: '魔女の知恵', description: 'MP消費軽減', effects: [{ type: 'mpReduction', value: 15 }] },
    ],
    skills: [
      { id: 'curse', name: '呪詛', description: '敵のステータスを下げる', type: 'debuff', target: 'single', multiplier: 0, mpCost: 10, effect: { type: 'statDown', value: 30, duration: 3 } },
      { id: 'poison_mist', name: '毒霧', description: '全体に毒魔法', type: 'magic', target: 'all', multiplier: 1.0, mpCost: 16 },
      { id: 'hex', name: '邪眼', description: '単体に高威力呪い', type: 'magic', target: 'single', multiplier: 1.8, mpCost: 18 },
    ],
    masterySkill: {
      name: '大呪術',
      description: '敵全体のステータス-30%',
      type: 'active',
      skill: { id: 'grand_curse', name: '大呪術', description: '敵全体を呪う', type: 'debuff', target: 'all', multiplier: 0, mpCost: 35, effect: { type: 'statDown', value: 30, duration: 3 } },
    },
  },
  bard: {
    id: 'bard',
    name: 'バード',
    description: `【ステ補正】HP+5 MP+25 ATK+2 DEF+1 AGI+5 MAG+4
【パッシブ】
・歌声: 味方ATK+10%
・魔力の旋律: 毎ターンMP+4
【スキル】
・勇気の歌(MP15): 味方全体ATK+25%(3T)
・子守唄(MP18): 敵全体AGI-30%(2T)
・癒しの旋律(MP20): 味方全体HP回復0.7倍
【マスタリー】
・英雄譚(MP30): 味方全体ATK/DEF+25%(5T)`,
    statModifiers: { maxHp: 5, maxMp: 25, atk: 2, def: 1, agi: 5, mag: 4 },
    passives: [
      { name: '歌声', description: '味方の攻撃力が上昇', effects: [{ type: 'allyAtkBonus', value: 10 }] },
      { name: '魔力の旋律', description: 'MPリジェネ', effects: [{ type: 'mpRegen', value: 4 }] },
    ],
    skills: [
      { id: 'battle_hymn', name: '勇気の歌', description: '味方全体の攻撃力上昇', type: 'buff', target: 'allAllies', multiplier: 0, mpCost: 15, effect: { type: 'atkUp', value: 25, duration: 3 } },
      { id: 'lullaby', name: '子守唄', description: '敵全体の行動速度を下げる', type: 'debuff', target: 'all', multiplier: 0, mpCost: 18, effect: { type: 'agiDown', value: 30, duration: 2 } },
      { id: 'healing_melody', name: '癒しの旋律', description: '味方全体を少し回復', type: 'heal', target: 'allAllies', multiplier: 0.7, mpCost: 20 },
    ],
    masterySkill: {
      name: '英雄譚',
      description: '味方全員のATK/DEF+25%',
      type: 'active',
      skill: { id: 'heroic_tale', name: '英雄譚', description: '味方全体を大幅強化', type: 'buff', target: 'allAllies', multiplier: 0, mpCost: 30, effect: { type: 'atkUp', value: 25, duration: 5 } },
    },
  },
};

export type JobType = keyof typeof jobs;
export const jobList = Object.values(jobs);
