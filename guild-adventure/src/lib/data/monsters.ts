import { Monster, SkillData } from '../types';

// ============================================
// 草原のモンスター（★）- バランス型
// ============================================

export const grasslandMonsters: Monster[] = [
  {
    id: 'slime',
    name: 'スライム',
    stats: { hp: 25, maxHp: 25, mp: 0, maxMp: 0, atk: 4, def: 2, agi: 4, mag: 0 },
  },
  {
    id: 'goblin',
    name: 'ゴブリン',
    stats: { hp: 30, maxHp: 30, mp: 0, maxMp: 0, atk: 6, def: 3, agi: 7, mag: 0 },
  },
  {
    id: 'wild_dog',
    name: '野犬',
    stats: { hp: 28, maxHp: 28, mp: 0, maxMp: 0, atk: 8, def: 2, agi: 10, mag: 0 },
  },
];

export const grasslandBoss: Monster = {
  id: 'slime_king',
  name: '【BOSS】スライムキング',
  stats: { hp: 120, maxHp: 120, mp: 20, maxMp: 20, atk: 10, def: 8, agi: 3, mag: 5 },
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
// 森林のモンスター（★★）- 回避型・先制重要
// ============================================

export const forestMonsters: Monster[] = [
  {
    id: 'wolf',
    name: 'ウルフ',
    stats: { hp: 45, maxHp: 45, mp: 0, maxMp: 0, atk: 12, def: 4, agi: 18, mag: 0 },
  },
  {
    id: 'fairy_forest',
    name: 'フォレストフェアリー',
    stats: { hp: 30, maxHp: 30, mp: 30, maxMp: 30, atk: 3, def: 2, agi: 20, mag: 15 },
  },
  {
    id: 'archer_goblin',
    name: 'ゴブリンアーチャー',
    stats: { hp: 35, maxHp: 35, mp: 0, maxMp: 0, atk: 14, def: 3, agi: 16, mag: 0 },
  },
];

export const forestBoss: Monster = {
  id: 'treant',
  name: '【BOSS】トレント',
  stats: { hp: 250, maxHp: 250, mp: 40, maxMp: 40, atk: 15, def: 20, agi: 3, mag: 10 },
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
// 洞窟のモンスター（★★★）- 高防御・物理が通る
// ============================================

export const caveMonsters: Monster[] = [
  {
    id: 'bat_swarm',
    name: 'コウモリの群れ',
    stats: { hp: 60, maxHp: 60, mp: 0, maxMp: 0, atk: 10, def: 3, agi: 22, mag: 0 },
  },
  {
    id: 'stone_golem',
    name: 'ストーンゴーレム',
    stats: { hp: 150, maxHp: 150, mp: 0, maxMp: 0, atk: 18, def: 25, agi: 2, mag: 0 },
  },
  {
    id: 'cave_troll',
    name: 'トロール',
    stats: { hp: 180, maxHp: 180, mp: 0, maxMp: 0, atk: 22, def: 15, agi: 5, mag: 0 },
  },
];

export const caveBoss: Monster = {
  id: 'golem_king',
  name: '【BOSS】ゴーレムキング',
  stats: { hp: 500, maxHp: 500, mp: 0, maxMp: 0, atk: 30, def: 40, agi: 2, mag: 0 },
  // 物理攻撃が有効（魔法耐性が高い設定をバトルで実装）
};

// ============================================
// 海のモンスター（★★★）- 魔法が通る・物理耐性
// ============================================

export const seaMonsters: Monster[] = [
  {
    id: 'merman',
    name: 'マーマン',
    stats: { hp: 80, maxHp: 80, mp: 30, maxMp: 30, atk: 12, def: 18, agi: 12, mag: 15 },
  },
  {
    id: 'jellyfish',
    name: 'クラゲ',
    stats: { hp: 50, maxHp: 50, mp: 20, maxMp: 20, atk: 5, def: 25, agi: 8, mag: 20 },
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
    stats: { hp: 70, maxHp: 70, mp: 50, maxMp: 50, atk: 8, def: 15, agi: 14, mag: 25 },
  },
];

export const seaBoss: Monster = {
  id: 'kraken',
  name: '【BOSS】クラーケン',
  stats: { hp: 600, maxHp: 600, mp: 60, maxMp: 60, atk: 25, def: 30, agi: 6, mag: 20 },
  skills: [{
    id: 'tentacle_storm',
    name: '触手嵐',
    description: '全体攻撃',
    type: 'attack',
    target: 'all',
    multiplier: 1.2,
    mpCost: 20,
  }],
  // 物理耐性高い（魔法で攻めるべき）
};

// ============================================
// 砂漠のモンスター（★★★★）- 連続攻撃が有効・分裂
// ============================================

export const desertMonsters: Monster[] = [
  {
    id: 'scorpion',
    name: '大サソリ',
    stats: { hp: 100, maxHp: 100, mp: 0, maxMp: 0, atk: 20, def: 18, agi: 14, mag: 0 },
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
    stats: { hp: 80, maxHp: 80, mp: 0, maxMp: 0, atk: 15, def: 10, agi: 16, mag: 10 },
    // 分裂するので連続攻撃で倒しきる必要がある
  },
  {
    id: 'mummy',
    name: 'マミー',
    stats: { hp: 120, maxHp: 120, mp: 20, maxMp: 20, atk: 18, def: 12, agi: 6, mag: 15 },
  },
];

export const desertBoss: Monster = {
  id: 'sandworm',
  name: '【BOSS】サンドワーム',
  stats: { hp: 800, maxHp: 800, mp: 0, maxMp: 0, atk: 35, def: 20, agi: 8, mag: 0 },
  skills: [{
    id: 'devour',
    name: '丸呑み',
    description: '即死級ダメージ',
    type: 'attack',
    target: 'single',
    multiplier: 3.0,
    mpCost: 0,
  }],
  // 連続攻撃で怯ませないと丸呑みが来る
};

// ============================================
// 火山のモンスター（★★★★★）- 必殺攻撃が有効・高HP再生
// ============================================

export const volcanoMonsters: Monster[] = [
  {
    id: 'fire_elemental',
    name: 'ファイアエレメンタル',
    stats: { hp: 150, maxHp: 150, mp: 40, maxMp: 40, atk: 20, def: 15, agi: 12, mag: 25 },
  },
  {
    id: 'salamander',
    name: 'サラマンダー',
    stats: { hp: 180, maxHp: 180, mp: 30, maxMp: 30, atk: 28, def: 18, agi: 10, mag: 20 },
    // 毎ターンHP回復するので必殺で一気に削る必要がある
  },
  {
    id: 'lava_golem',
    name: 'ラーバゴーレム',
    stats: { hp: 250, maxHp: 250, mp: 0, maxMp: 0, atk: 32, def: 28, agi: 4, mag: 0 },
  },
];

export const volcanoBoss: Monster = {
  id: 'dragon',
  name: '【BOSS】ファイアドラゴン',
  stats: { hp: 1200, maxHp: 1200, mp: 100, maxMp: 100, atk: 45, def: 35, agi: 15, mag: 40 },
  skills: [
    {
      id: 'fire_breath',
      name: 'ファイアブレス',
      description: '全体炎攻撃',
      type: 'magic',
      target: 'all',
      multiplier: 1.5,
      mpCost: 25,
    },
    {
      id: 'regeneration',
      name: '再生',
      description: 'HP大回復',
      type: 'heal',
      target: 'self',
      multiplier: 0.15,
      mpCost: 20,
    },
  ],
  // 必殺技で一気に削らないと再生で回復される
};

// ============================================
// 雪原のモンスター（★★★★★）- 状態異常・凍結ギミック
// ============================================

export const snowfieldMonsters: Monster[] = [
  {
    id: 'ice_wolf',
    name: 'アイスウルフ',
    stats: { hp: 140, maxHp: 140, mp: 20, maxMp: 20, atk: 25, def: 15, agi: 20, mag: 15 },
  },
  {
    id: 'yeti',
    name: 'イエティ',
    stats: { hp: 220, maxHp: 220, mp: 0, maxMp: 0, atk: 35, def: 25, agi: 8, mag: 0 },
  },
  {
    id: 'ice_witch',
    name: 'アイスウィッチ',
    stats: { hp: 100, maxHp: 100, mp: 60, maxMp: 60, atk: 10, def: 12, agi: 14, mag: 30 },
    skills: [{
      id: 'freeze',
      name: '凍結',
      description: 'スタン付与',
      type: 'debuff',
      target: 'single',
      multiplier: 0,
      mpCost: 15,
      effect: { type: 'stun', chance: 70, duration: 2 },
    }],
  },
];

export const snowfieldBoss: Monster = {
  id: 'frost_giant',
  name: '【BOSS】フロストジャイアント',
  stats: { hp: 1500, maxHp: 1500, mp: 80, maxMp: 80, atk: 50, def: 40, agi: 6, mag: 35 },
  skills: [{
    id: 'blizzard',
    name: 'ブリザード',
    description: '全体凍結攻撃',
    type: 'magic',
    target: 'all',
    multiplier: 1.3,
    mpCost: 30,
    effect: { type: 'stun', chance: 40, duration: 1 },
  }],
};

// ============================================
// 神殿のモンスター（★★★★★★）- 全ギミック・超高難度
// ============================================

export const templeMonsters: Monster[] = [
  {
    id: 'dark_knight',
    name: 'ダークナイト',
    stats: { hp: 200, maxHp: 200, mp: 30, maxMp: 30, atk: 40, def: 35, agi: 12, mag: 15 },
  },
  {
    id: 'arch_mage',
    name: 'アークメイジ',
    stats: { hp: 120, maxHp: 120, mp: 100, maxMp: 100, atk: 12, def: 15, agi: 14, mag: 45 },
    skills: [{
      id: 'meteor',
      name: 'メテオ',
      description: '全体魔法',
      type: 'magic',
      target: 'all',
      multiplier: 2.0,
      mpCost: 40,
    }],
  },
  {
    id: 'death_knight',
    name: 'デスナイト',
    stats: { hp: 280, maxHp: 280, mp: 40, maxMp: 40, atk: 45, def: 30, agi: 10, mag: 20 },
  },
];

export const templeBoss: Monster = {
  id: 'lich_lord',
  name: '【BOSS】リッチロード',
  stats: { hp: 2000, maxHp: 2000, mp: 200, maxMp: 200, atk: 35, def: 30, agi: 12, mag: 55 },
  skills: [
    {
      id: 'dark_ritual',
      name: '暗黒儀式',
      description: 'HP吸収全体攻撃',
      type: 'magic',
      target: 'all',
      multiplier: 1.8,
      mpCost: 35,
    },
    {
      id: 'summon_undead',
      name: 'アンデッド召喚',
      description: '仲間を呼ぶ',
      type: 'buff',
      target: 'self',
      multiplier: 0,
      mpCost: 50,
    },
    {
      id: 'death_curse',
      name: '死の呪い',
      description: '即死攻撃',
      type: 'debuff',
      target: 'single',
      multiplier: 0,
      mpCost: 40,
      effect: { type: 'stun', chance: 30, duration: 99 }, // 即死代わり
    },
  ],
};

// エクスポート
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
