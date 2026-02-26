import { Monster, SkillData } from '../types';

// ============================================
// 草原のモンスター（★）- 2人推奨・初心者向け
// ============================================

export const grasslandMonsters: Monster[] = [
  {
    id: 'slime',
    name: 'スライム',
    stats: { hp: 20, maxHp: 20, mp: 0, maxMp: 0, atk: 3, def: 1, agi: 3, mag: 0 },
  },
  {
    id: 'goblin',
    name: 'ゴブリン',
    stats: { hp: 25, maxHp: 25, mp: 0, maxMp: 0, atk: 5, def: 2, agi: 6, mag: 0 },
  },
  {
    id: 'wild_dog',
    name: '野犬',
    stats: { hp: 22, maxHp: 22, mp: 0, maxMp: 0, atk: 6, def: 1, agi: 8, mag: 0 },
  },
];

export const grasslandBoss: Monster = {
  id: 'slime_king',
  name: 'スライムキング',
  stats: { hp: 80, maxHp: 80, mp: 20, maxMp: 20, atk: 8, def: 5, agi: 3, mag: 3 },
  skills: [{
    id: 'split',
    name: '分裂',
    description: '分裂して回復',
    type: 'heal',
    target: 'self',
    multiplier: 0.3,
    mpCost: 10,
  }],
};

// ============================================
// 森林のモンスター（★★）- 4人推奨・回避型
// ============================================

export const forestMonsters: Monster[] = [
  {
    id: 'wolf',
    name: 'ウルフ',
    stats: { hp: 50, maxHp: 50, mp: 0, maxMp: 0, atk: 14, def: 5, agi: 20, mag: 0 },
  },
  {
    id: 'fairy_forest',
    name: 'フォレストフェアリー',
    stats: { hp: 35, maxHp: 35, mp: 30, maxMp: 30, atk: 4, def: 3, agi: 22, mag: 18 },
  },
  {
    id: 'archer_goblin',
    name: 'ゴブリンアーチャー',
    stats: { hp: 40, maxHp: 40, mp: 0, maxMp: 0, atk: 16, def: 4, agi: 18, mag: 0 },
  },
];

export const forestBoss: Monster = {
  id: 'treant',
  name: 'トレント',
  stats: { hp: 300, maxHp: 300, mp: 40, maxMp: 40, atk: 18, def: 25, agi: 3, mag: 12 },
  skills: [{
    id: 'root_bind',
    name: '根絡み',
    description: '全体を拘束',
    type: 'debuff',
    target: 'all',
    multiplier: 0,
    mpCost: 15,
    effect: { type: 'agiDown' as any, value: 50, duration: 2 },
  }],
};

// ============================================
// 洞窟のモンスター（★★★）- 6人推奨・高防御
// ============================================

export const caveMonsters: Monster[] = [
  {
    id: 'bat_swarm',
    name: 'コウモリの群れ',
    stats: { hp: 80, maxHp: 80, mp: 0, maxMp: 0, atk: 14, def: 5, agi: 25, mag: 0 },
  },
  {
    id: 'stone_golem',
    name: 'ストーンゴーレム',
    stats: { hp: 200, maxHp: 200, mp: 0, maxMp: 0, atk: 22, def: 35, agi: 2, mag: 0 },
  },
  {
    id: 'cave_troll',
    name: 'トロール',
    stats: { hp: 250, maxHp: 250, mp: 0, maxMp: 0, atk: 28, def: 20, agi: 5, mag: 0 },
  },
];

export const caveBoss: Monster = {
  id: 'golem_king',
  name: 'ゴーレムキング',
  stats: { hp: 700, maxHp: 700, mp: 0, maxMp: 0, atk: 35, def: 50, agi: 2, mag: 0 },
};

// ============================================
// 海のモンスター（★★★★）- 6人推奨・魔法が有効
// ============================================

export const seaMonsters: Monster[] = [
  {
    id: 'merman',
    name: 'マーマン',
    stats: { hp: 120, maxHp: 120, mp: 30, maxMp: 30, atk: 16, def: 25, agi: 14, mag: 18 },
  },
  {
    id: 'jellyfish',
    name: 'クラゲ',
    stats: { hp: 70, maxHp: 70, mp: 20, maxMp: 20, atk: 8, def: 35, agi: 10, mag: 25 },
    skills: [{
      id: 'paralyze',
      name: '麻痺毒',
      description: 'スタン付与',
      type: 'debuff',
      target: 'single',
      multiplier: 0,
      mpCost: 10,
      effect: { type: 'stun', chance: 50, duration: 1 },
    }],
  },
  {
    id: 'siren',
    name: 'セイレーン',
    stats: { hp: 100, maxHp: 100, mp: 50, maxMp: 50, atk: 12, def: 20, agi: 16, mag: 30 },
  },
];

export const seaBoss: Monster = {
  id: 'kraken',
  name: 'クラーケン',
  stats: { hp: 900, maxHp: 900, mp: 60, maxMp: 60, atk: 32, def: 40, agi: 6, mag: 25 },
  skills: [{
    id: 'tentacle_storm',
    name: '触手嵐',
    description: '全体攻撃',
    type: 'attack',
    target: 'all',
    multiplier: 1.2,
    mpCost: 20,
  }],
};

// ============================================
// 砂漠のモンスター（★★★★★）- 6人推奨・連続攻撃が有効
// ============================================

export const desertMonsters: Monster[] = [
  {
    id: 'scorpion',
    name: '大サソリ',
    stats: { hp: 150, maxHp: 150, mp: 0, maxMp: 0, atk: 28, def: 25, agi: 16, mag: 0 },
    skills: [{
      id: 'poison_sting',
      name: '毒針',
      description: '毒付与',
      type: 'attack',
      target: 'single',
      multiplier: 1.0,
      mpCost: 0,
      effect: { type: 'poison', chance: 60, duration: 3 },
    }],
  },
  {
    id: 'sand_elemental',
    name: 'サンドエレメンタル',
    stats: { hp: 120, maxHp: 120, mp: 0, maxMp: 0, atk: 22, def: 15, agi: 18, mag: 15 },
  },
  {
    id: 'mummy',
    name: 'マミー',
    stats: { hp: 180, maxHp: 180, mp: 20, maxMp: 20, atk: 25, def: 18, agi: 6, mag: 20 },
  },
];

export const desertBoss: Monster = {
  id: 'sandworm',
  name: 'サンドワーム',
  stats: { hp: 1200, maxHp: 1200, mp: 0, maxMp: 0, atk: 45, def: 30, agi: 8, mag: 0 },
  skills: [{
    id: 'devour',
    name: '丸呑み',
    description: '即死級ダメージ',
    type: 'attack',
    target: 'single',
    multiplier: 3.0,
    mpCost: 0,
  }],
};

// ============================================
// 火山のモンスター（★★★★★★）- 6人推奨・再生する敵
// ============================================

export const volcanoMonsters: Monster[] = [
  {
    id: 'fire_elemental',
    name: 'ファイアエレメンタル',
    stats: { hp: 180, maxHp: 180, mp: 40, maxMp: 40, atk: 30, def: 15, agi: 14, mag: 35 },
  },
  {
    id: 'lava_golem',
    name: 'ラーヴァゴーレム',
    stats: { hp: 300, maxHp: 300, mp: 0, maxMp: 0, atk: 35, def: 40, agi: 3, mag: 0 },
  },
  {
    id: 'salamander',
    name: 'サラマンダー',
    stats: { hp: 200, maxHp: 200, mp: 30, maxMp: 30, atk: 32, def: 20, agi: 18, mag: 25 },
  },
];

export const volcanoBoss: Monster = {
  id: 'ifrit',
  name: 'イフリート',
  stats: { hp: 1500, maxHp: 1500, mp: 80, maxMp: 80, atk: 50, def: 35, agi: 12, mag: 40 },
  skills: [{
    id: 'hellfire',
    name: '獄炎',
    description: '全体に大ダメージ',
    type: 'magic',
    target: 'all',
    multiplier: 1.8,
    mpCost: 30,
  }],
};

// ============================================
// 雪原のモンスター（★★★★★★★）- 6人推奨・凍結
// ============================================

export const snowfieldMonsters: Monster[] = [
  {
    id: 'ice_wolf',
    name: 'アイスウルフ',
    stats: { hp: 200, maxHp: 200, mp: 0, maxMp: 0, atk: 35, def: 20, agi: 25, mag: 0 },
  },
  {
    id: 'frost_giant',
    name: 'フロストジャイアント',
    stats: { hp: 400, maxHp: 400, mp: 0, maxMp: 0, atk: 45, def: 35, agi: 5, mag: 0 },
  },
  {
    id: 'ice_elemental',
    name: 'アイスエレメンタル',
    stats: { hp: 180, maxHp: 180, mp: 50, maxMp: 50, atk: 20, def: 25, agi: 16, mag: 40 },
    skills: [{
      id: 'freeze',
      name: '凍結',
      description: '行動不能にする',
      type: 'debuff',
      target: 'single',
      multiplier: 0,
      mpCost: 15,
      effect: { type: 'stun', chance: 70, duration: 1 },
    }],
  },
];

export const snowfieldBoss: Monster = {
  id: 'ice_dragon',
  name: 'アイスドラゴン',
  stats: { hp: 1800, maxHp: 1800, mp: 100, maxMp: 100, atk: 55, def: 45, agi: 15, mag: 45 },
  skills: [{
    id: 'blizzard',
    name: 'ブリザード',
    description: '全体に氷属性大ダメージ',
    type: 'magic',
    target: 'all',
    multiplier: 2.0,
    mpCost: 35,
  }],
};

// ============================================
// 神殿のモンスター（★★★★★★★★）- 6人推奨・最高難度
// ============================================

export const templeMonsters: Monster[] = [
  {
    id: 'guardian',
    name: 'ガーディアン',
    stats: { hp: 350, maxHp: 350, mp: 0, maxMp: 0, atk: 45, def: 50, agi: 10, mag: 0 },
  },
  {
    id: 'dark_priest',
    name: 'ダークプリースト',
    stats: { hp: 200, maxHp: 200, mp: 80, maxMp: 80, atk: 20, def: 25, agi: 12, mag: 50 },
    skills: [{
      id: 'dark_heal',
      name: '暗黒回復',
      description: '味方を回復',
      type: 'heal',
      target: 'ally',
      multiplier: 0.5,
      mpCost: 20,
    }],
  },
  {
    id: 'ancient_golem',
    name: 'エンシェントゴーレム',
    stats: { hp: 500, maxHp: 500, mp: 0, maxMp: 0, atk: 50, def: 60, agi: 2, mag: 0 },
  },
];

export const templeBoss: Monster = {
  id: 'demon_lord',
  name: '魔王',
  stats: { hp: 2500, maxHp: 2500, mp: 150, maxMp: 150, atk: 60, def: 50, agi: 18, mag: 55 },
  skills: [
    {
      id: 'dark_wave',
      name: '暗黒波',
      description: '全体に闇属性大ダメージ',
      type: 'magic',
      target: 'all',
      multiplier: 2.2,
      mpCost: 40,
    },
    {
      id: 'death_grip',
      name: '死の握撃',
      description: '単体に即死級ダメージ',
      type: 'attack',
      target: 'single',
      multiplier: 4.0,
      mpCost: 50,
    },
  ],
};

// ============================================
// エクスポート
// ============================================

export const monstersByDungeon = {
  grassland: { monsters: grasslandMonsters, boss: grasslandBoss },
  forest: { monsters: forestMonsters, boss: forestBoss },
  cave: { monsters: caveMonsters, boss: caveBoss },
  sea: { monsters: seaMonsters, boss: seaBoss },
  desert: { monsters: desertMonsters, boss: desertBoss },
  volcano: { monsters: volcanoMonsters, boss: volcanoBoss },
  snowfield: { monsters: snowfieldMonsters, boss: snowfieldBoss },
  temple: { monsters: templeMonsters, boss: templeBoss },
};
