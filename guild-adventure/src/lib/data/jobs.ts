import { JobData } from '../types';

export const jobs: Record<string, JobData> = {
  warrior: {
    id: 'warrior',
    name: '戦士',
    description: 'HP+20、ATK+5、DEF+3。物理ダメ+15%のバランス型前衛。単体の強撃、自己バフの雄叫び、全体攻撃の薙ぎ払いと万能。初心者におすすめ。',
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
    description: 'HP-10、MP+30、MAG+8。魔法ダメ+25%、MP消費-15%、毎ターンMP回復。全体炎魔法、単体高火力氷魔法を使う。マスタリーで全体魔法が2回発動！フェアリーやエルフで火力特化。',
    statModifiers: { maxHp: -10, maxMp: 30, mag: 8, agi: 2 },
    passives: [
      { name: '魔力増幅', description: '魔法攻撃の威力が大幅に上昇', effects: [{ type: 'magicBonus', value: 25 }] },
      { name: '詠唱効率', description: 'MP消費が軽減', effects: [{ type: 'mpReduction', value: 15 }] },
      { name: '魔力の泉', description: '毎ターンMP回復', effects: [{ type: 'mpRegen', value: 5 }] },
    ],
    skills: [
      { id: 'fireball', name: 'ファイアボール', description: '全体に炎の魔法攻撃', type: 'magic', target: 'all', multiplier: 1.2, mpCost: 18 },
      { id: 'ice_lance', name: 'アイスランス', description: '単体に氷の魔法攻撃（高威力）', type: 'magic', target: 'single', multiplier: 2.0, mpCost: 15 },
      { id: 'thunder', name: 'サンダー', description: '単体に雷撃', type: 'magic', target: 'single', multiplier: 1.4, mpCost: 12 },
    ],
    masterySkill: { name: '魔力解放', description: '全体魔法が2回発動', type: 'passive', effects: [{ type: 'doublecast', value: 100 }] },
  },
  priest: {
    id: 'priest',
    name: '司祭',
    description: 'HP+10、MP+25、MAG+5。回復量+30%、状態異常耐性+30%。単体回復・全体回復・聖なる攻撃魔法を習得。マスタリーで味方全体の被ダメ-20%！パーティに必須のヒーラー。',
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
    description: 'AGI+8、ATK+3、DEF-2。クリ率+25%、クリダメ+30%、先制+20%。バックスタブで急所を突き、暗殺で2.5倍の一撃必殺。マスタリーでHP低い敵に確定クリティカル！',
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
    description: 'HP+40、DEF+8、AGI-3。被ダメ-25%の最強タンク。鉄壁の構えでDEF+50%、聖なる一撃で攻撃も可能。マスタリーで50%で味方を庇う！ドワーフで最硬の壁役に。',
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
    description: 'AGI+5、ATK+4。命中+20%、先制+30%、クリ率+15%。必中の狙い撃ち、全体の矢の雨。マスタリーで回避無視+クリ率+30%！後衛から確実にダメージを出せるアタッカー。',
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
    description: 'AGI+10、DEF-3。回避+30%、先制+25%、物理+15%。影斬り・手裏剣・必殺と多彩な攻撃。マスタリーで25%完全回避！ゴブリンで先制特化、ハーフリングで回避特化。',
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
    description: 'MP+25、MAG+6。魔法+15%、回復+15%、毎ターンMP回復。攻撃魔法と回復を両立でき、メテオで全体2.0倍。マスタリーでMP消費-50%！ドラゴニュートで物理魔法両刀に。',
    statModifiers: { maxHp: 5, maxMp: 25, mag: 6, def: 1 },
    passives: [
      { name: '叡智', description: '魔法威力と回復量が上昇', effects: [{ type: 'magicBonus', value: 15 }, { type: 'healBonus', value: 15 }] },
      { name: '瞑想', description: '毎ターンMP回復', effects: [{ type: 'mpRegen', value: 4 }] },
    ],
    skills: [
      { id: 'sage_fire', name: '賢者の炎', description: '単体に炎魔法', type: 'magic', target: 'single', multiplier: 1.5, mpCost: 12 },
      { id: 'sage_heal', name: '癒しの光', description: '味方一人を回復', type: 'heal', target: 'ally', multiplier: 1.3, mpCost: 14 },
      { id: 'meteor', name: 'メテオ', description: '全体に超高威力魔法', type: 'magic', target: 'all', multiplier: 2.0, mpCost: 40 },
    ],
    masterySkill: { name: '叡智の結晶', description: 'MP消費-50%', type: 'passive', effects: [{ type: 'mpReduction', value: 50 }] },
  },
  berserker: {
    id: 'berserker',
    name: 'バーサーカー',
    description: 'HP+30、ATK+10、DEF-5。物理+40%だが被ダメ+20%。狂乱撃で3.0倍ダメージ、血の咆哮でATK+50%。マスタリーで攻撃ごとにATK累積上昇！オークで最高火力のロマン砲。',
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
    description: 'HP+25、DEF+5、ATK+4、MAG+4。物理+15%、回復+20%、被ダメ-15%。聖剣で攻撃、癒しの手で大回復。マスタリーで味方自動蘇生！エンジェルで最強の聖騎士に。',
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
    description: 'HP-5、MP+30、MAG+8。魔法+25%、HP吸収+25%、毎ターンMP回復。吸魂でHP吸収しながら攻撃、死の波動で全体闘。マスタリーで倒した敵を味方に！アンデッドで自己完結型に。',
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
    description: 'HP+15、ATK+6、AGI+6。物理+20%、回避+15%、クリ率+15%。百裂拳で連続攻撃、精神統一で自己回復。マスタリーで全攻撃を50%で反撃！リザードマンで再生タンクに。',
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
    description: 'バランス型ステ。先制+25%、回避+15%、毎ターンHP回復。狙撃で高火力、罠で敵弱体化、自然の恵みで味方回復。マスタリーで毎ターンHP/MP大幅回復！持久戦に強い万能職。',
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
    description: 'HP+15、ATK+7。クリ率+25%、クリダメ+40%、物理+15%。居合斬りで2.0倍、必殺剣で3.0倍の一撃必殺。マスタリー一閃は防御無視全体攻撃！ハーフリングで超クリティカル特化。',
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
    description: 'HP-5、MP+28、MAG+7。魔法+20%、デバフ成功+20%、MP消費-15%。呪詛で敵ステ低下、邪眼で高火力。マスタリー大呪術で敵全体ステ-30%！デーモンで呪い特化に。',
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
    description: 'MP+25、AGI+5。味方ATK+10%、毎ターンMP回復。勇気の歌で味方全体ATK+25%、子守唄で敵全体速度低下、癒しの旋律で全体回復。マスタリー英雄譚で味方全体大幅強化！',
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
