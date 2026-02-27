import { Monster, SkillData } from '../types';

// ============================================
// 草原のモンスター（★）- 2人推奨・初心者向け
// ============================================

export const grasslandMonsters: Monster[] = [
  {
    id: 'slime',
    name: 'スライム',
    species: 'beast',
    element: 'water',
    stats: { hp: 20, maxHp: 20, mp: 0, maxMp: 0, atk: 3, def: 1, agi: 3, mag: 0 },
  },
  {
    id: 'goblin',
    name: 'ゴブリン',
    species: 'humanoid',
    stats: { hp: 25, maxHp: 25, mp: 0, maxMp: 0, atk: 5, def: 2, agi: 6, mag: 0 },
  },
  {
    id: 'wild_dog',
    name: '野犬',
    species: 'beast',
    stats: { hp: 22, maxHp: 22, mp: 0, maxMp: 0, atk: 6, def: 1, agi: 8, mag: 0 },
  },
];

export const grasslandBoss: Monster = {
  id: 'slime_king',
  name: 'スライムキング',
  species: 'beast',
  element: 'water',
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
    species: 'beast',
    stats: { hp: 50, maxHp: 50, mp: 0, maxMp: 0, atk: 14, def: 5, agi: 20, mag: 0 },
  },
  {
    id: 'fairy_forest',
    name: 'フォレストフェアリー',
    species: 'humanoid',
    element: 'wind',
    stats: { hp: 35, maxHp: 35, mp: 30, maxMp: 30, atk: 4, def: 3, agi: 22, mag: 18 },
  },
  {
    id: 'archer_goblin',
    name: 'ゴブリンアーチャー',
    species: 'humanoid',
    stats: { hp: 40, maxHp: 40, mp: 0, maxMp: 0, atk: 16, def: 4, agi: 18, mag: 0 },
  },
];

export const forestBoss: Monster = {
  id: 'treant',
  name: 'トレント',
  species: 'beast',
  element: 'earth',
  stats: { hp: 300, maxHp: 300, mp: 40, maxMp: 40, atk: 18, def: 25, agi: 3, mag: 12 },
  skills: [{
    id: 'root_bind',
    name: '根絡み',
    description: '全体を拘束',
    type: 'debuff',
    target: 'all',
    multiplier: 0,
    mpCost: 15,
    element: 'earth',
    effect: { type: 'agiDown' as any, value: 50, duration: 2 },
  }],
};

// ============================================
// 洞窟のモンスター（★★★）- 5人推奨・高防御
// ============================================

export const caveMonsters: Monster[] = [
  {
    id: 'bat_swarm',
    name: 'コウモリの群れ',
    species: 'beast',
    stats: { hp: 70, maxHp: 70, mp: 0, maxMp: 0, atk: 12, def: 4, agi: 22, mag: 0 },
  },
  {
    id: 'stone_golem',
    name: 'ストーンゴーレム',
    species: 'humanoid',
    element: 'earth',
    stats: { hp: 170, maxHp: 170, mp: 0, maxMp: 0, atk: 19, def: 30, agi: 2, mag: 0 },
  },
  {
    id: 'cave_troll',
    name: 'トロール',
    species: 'humanoid',
    stats: { hp: 210, maxHp: 210, mp: 0, maxMp: 0, atk: 24, def: 17, agi: 5, mag: 0 },
  },
];

export const caveBoss: Monster = {
  id: 'dark_dragon',
  name: 'ダークドラゴン',
  species: 'dragon',
  element: 'fire',
  stats: { hp: 500, maxHp: 500, mp: 50, maxMp: 50, atk: 30, def: 25, agi: 10, mag: 22 },
  skills: [{
    id: 'flame_breath',
    name: '炎のブレス',
    description: '全体に炎攻撃',
    type: 'magic',
    target: 'all',
    multiplier: 1.2,
    mpCost: 20,
    element: 'fire',
  }],
  speciesKiller: [{ species: 'humanoid', multiplier: 1.3 }],
};

// ============================================
// 海のモンスター（★★★★）- 6人推奨・高AGI
// ============================================

export const seaMonsters: Monster[] = [
  {
    id: 'merman',
    name: 'マーマン',
    species: 'humanoid',
    element: 'water',
    stats: { hp: 135, maxHp: 135, mp: 27, maxMp: 27, atk: 22, def: 13, agi: 20, mag: 18 },
  },
  {
    id: 'sea_serpent',
    name: 'シーサーペント',
    species: 'beast',
    element: 'water',
    stats: { hp: 160, maxHp: 160, mp: 0, maxMp: 0, atk: 27, def: 16, agi: 22, mag: 0 },
  },
  {
    id: 'ghost_ship',
    name: 'ゴーストシップ',
    species: 'undead',
    element: 'water',
    stats: { hp: 180, maxHp: 180, mp: 36, maxMp: 36, atk: 18, def: 22, agi: 9, mag: 27 },
  },
];

export const seaBoss: Monster = {
  id: 'kraken',
  name: 'クラーケン',
  species: 'beast',
  element: 'water',
  stats: { hp: 700, maxHp: 700, mp: 45, maxMp: 45, atk: 35, def: 22, agi: 16, mag: 27 },
  skills: [{
    id: 'tidal_wave',
    name: '大津波',
    description: '全体に水属性大ダメージ',
    type: 'magic',
    target: 'all',
    multiplier: 1.5,
    mpCost: 25,
    element: 'water',
  }],
};

// ============================================
// 砂漠のモンスター（★★★★★）- 6人推奨・スタン注意
// ============================================

export const desertMonsters: Monster[] = [
  {
    id: 'sand_worm',
    name: 'サンドワーム',
    species: 'beast',
    element: 'earth',
    stats: { hp: 210, maxHp: 210, mp: 0, maxMp: 0, atk: 32, def: 17, agi: 7, mag: 0 },
  },
  {
    id: 'mummy',
    name: 'マミー',
    species: 'undead',
    stats: { hp: 170, maxHp: 170, mp: 25, maxMp: 25, atk: 25, def: 25, agi: 4, mag: 21 },
  },
  {
    id: 'scorpion_king',
    name: 'スコーピオン',
    species: 'beast',
    stats: { hp: 185, maxHp: 185, mp: 0, maxMp: 0, atk: 30, def: 30, agi: 13, mag: 0 },
  },
];

export const desertBoss: Monster = {
  id: 'sphinx',
  name: 'スフィンクス',
  species: 'beast',
  element: 'earth',
  stats: { hp: 850, maxHp: 850, mp: 68, maxMp: 68, atk: 38, def: 34, agi: 17, mag: 34 },
  skills: [{
    id: 'riddle',
    name: '謎かけ',
    description: '全体をスタン',
    type: 'debuff',
    target: 'all',
    multiplier: 0,
    mpCost: 30,
    effect: { type: 'stun', chance: 50, duration: 1 },
  }],
  speciesKiller: [{ species: 'humanoid', multiplier: 1.4 }],
};

// ============================================
// 火山のモンスター（★★★★★★）- 6人推奨・高火力
// ============================================

export const volcanoMonsters: Monster[] = [
  {
    id: 'fire_elemental',
    name: 'ファイアエレメンタル',
    species: 'demon',
    element: 'fire',
    stats: { hp: 170, maxHp: 170, mp: 42, maxMp: 42, atk: 21, def: 13, agi: 17, mag: 38 },
  },
  {
    id: 'lava_golem',
    name: 'ラーヴァゴーレム',
    species: 'humanoid',
    element: 'fire',
    stats: { hp: 300, maxHp: 300, mp: 0, maxMp: 0, atk: 38, def: 38, agi: 3, mag: 0 },
  },
  {
    id: 'salamander',
    name: 'サラマンダー',
    species: 'beast',
    element: 'fire',
    stats: { hp: 240, maxHp: 240, mp: 34, maxMp: 34, atk: 34, def: 21, agi: 19, mag: 30 },
  },
];

export const volcanoBoss: Monster = {
  id: 'ifrit',
  name: 'イフリート',
  species: 'demon',
  element: 'fire',
  stats: { hp: 1000, maxHp: 1000, mp: 85, maxMp: 85, atk: 47, def: 30, agi: 21, mag: 47 },
  skills: [{
    id: 'hellfire',
    name: '地獄の業火',
    description: '全体に炎大ダメージ',
    type: 'magic',
    target: 'all',
    multiplier: 1.8,
    mpCost: 35,
    element: 'fire',
  }],
  speciesResist: [{ species: 'humanoid', multiplier: 0.7 }],
};

// ============================================
// 雪原のモンスター（★★★★★★★）- 6人推奨・AGIデバフ
// ============================================

export const snowfieldMonsters: Monster[] = [
  {
    id: 'ice_wolf',
    name: 'アイスウルフ',
    species: 'beast',
    element: 'water',
    stats: { hp: 255, maxHp: 255, mp: 0, maxMp: 0, atk: 38, def: 21, agi: 30, mag: 0 },
  },
  {
    id: 'frost_giant',
    name: 'フロストジャイアント',
    species: 'humanoid',
    element: 'water',
    stats: { hp: 380, maxHp: 380, mp: 25, maxMp: 25, atk: 47, def: 34, agi: 7, mag: 21 },
  },
  {
    id: 'ice_wraith',
    name: 'アイスレイス',
    species: 'undead',
    element: 'water',
    stats: { hp: 210, maxHp: 210, mp: 51, maxMp: 51, atk: 25, def: 17, agi: 25, mag: 43 },
  },
];

export const snowfieldBoss: Monster = {
  id: 'ice_queen',
  name: 'アイスクイーン',
  species: 'demon',
  element: 'water',
  stats: { hp: 1190, maxHp: 1190, mp: 100, maxMp: 100, atk: 42, def: 38, agi: 25, mag: 55 },
  skills: [{
    id: 'absolute_zero',
    name: '絶対零度',
    description: '全体に氷大ダメージ＋AGIダウン',
    type: 'magic',
    target: 'all',
    multiplier: 1.6,
    mpCost: 40,
    element: 'water',
    effect: { type: 'agiDown', value: 30, duration: 2 },
  }],
  speciesKiller: [{ species: 'beast', multiplier: 1.5 }],
};

// ============================================
// 神殿のモンスター（★★★★★★★★）- 6人推奨・最高難度
// ============================================

export const templeMonsters: Monster[] = [
  {
    id: 'fallen_angel',
    name: '堕天使',
    species: 'demon',
    element: 'wind',
    stats: { hp: 400, maxHp: 400, mp: 80, maxMp: 80, atk: 50, def: 35, agi: 40, mag: 55 },
  },
  {
    id: 'ancient_dragon',
    name: 'エンシェントドラゴン',
    species: 'dragon',
    element: 'fire',
    stats: { hp: 600, maxHp: 600, mp: 50, maxMp: 50, atk: 65, def: 50, agi: 25, mag: 40 },
  },
  {
    id: 'lich',
    name: 'リッチ',
    species: 'undead',
    stats: { hp: 350, maxHp: 350, mp: 100, maxMp: 100, atk: 35, def: 30, agi: 20, mag: 70 },
  },
];

export const templeBoss: Monster = {
  id: 'god_of_destruction',
  name: '破壊神',
  species: 'demon',
  element: 'fire',
  stats: { hp: 2000, maxHp: 2000, mp: 150, maxMp: 150, atk: 70, def: 50, agi: 35, mag: 70 },
  skills: [
    {
      id: 'apocalypse',
      name: 'アポカリプス',
      description: '全体に超大ダメージ',
      type: 'magic',
      target: 'all',
      multiplier: 2.0,
      mpCost: 50,
      element: 'fire',
    },
    {
      id: 'curse_of_god',
      name: '神の呪い',
      description: '全体の攻撃力と防御力を下げる',
      type: 'debuff',
      target: 'all',
      multiplier: 0,
      mpCost: 30,
      effect: { type: 'statDown', value: 25, duration: 3 },
    },
  ],
  speciesKiller: [
    { species: 'humanoid', multiplier: 1.5 },
    { species: 'beast', multiplier: 1.3 },
  ],
  speciesResist: [
    { species: 'dragon', multiplier: 0.5 },
  ],
};

// ============================================
// ダンジョン別モンスターマップ
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
