import { Monster } from '../types';

// ============================================
// 草原のモンスター（★）
// ============================================

export const grasslandMonsters: Monster[] = [
  {
    id: 'slime',
    name: 'スライム',
    stats: { hp: 30, maxHp: 30, atk: 5, def: 2, agi: 5, mag: 0 },
  },
  {
    id: 'goblin',
    name: 'ゴブリン',
    stats: { hp: 40, maxHp: 40, atk: 8, def: 3, agi: 8, mag: 0 },
  },
  {
    id: 'wild_dog',
    name: '野犬',
    stats: { hp: 35, maxHp: 35, atk: 10, def: 2, agi: 12, mag: 0 },
  },
];

// ============================================
// 森林のモンスター（★★）
// ============================================

export const forestMonsters: Monster[] = [
  {
    id: 'orc',
    name: 'オーク',
    stats: { hp: 80, maxHp: 80, atk: 15, def: 8, agi: 6, mag: 0 },
  },
  {
    id: 'wolf',
    name: 'ウルフ',
    stats: { hp: 50, maxHp: 50, atk: 12, def: 4, agi: 15, mag: 0 },
  },
  {
    id: 'treant',
    name: 'トレント',
    stats: { hp: 100, maxHp: 100, atk: 8, def: 15, agi: 3, mag: 0 },
  },
];

// ============================================
// 海のモンスター（★★★）
// ============================================

export const seaMonsters: Monster[] = [
  {
    id: 'merman',
    name: 'マーマン',
    stats: { hp: 100, maxHp: 100, atk: 20, def: 12, agi: 10, mag: 15 },
  },
  {
    id: 'kraken',
    name: 'クラーケン',
    stats: { hp: 200, maxHp: 200, atk: 30, def: 15, agi: 5, mag: 0 },
  },
  {
    id: 'siren',
    name: 'セイレーン',
    stats: { hp: 80, maxHp: 80, atk: 10, def: 8, agi: 12, mag: 25 },
  },
];

// ============================================
// 洞窟のモンスター（★★★★）
// ============================================

export const caveMonsters: Monster[] = [
  {
    id: 'golem',
    name: 'ゴーレム',
    stats: { hp: 300, maxHp: 300, atk: 25, def: 30, agi: 3, mag: 0 },
  },
  {
    id: 'dragon',
    name: 'ドラゴン',
    stats: { hp: 500, maxHp: 500, atk: 50, def: 20, agi: 12, mag: 30 },
  },
  {
    id: 'lich',
    name: 'リッチ',
    stats: { hp: 150, maxHp: 150, atk: 15, def: 10, agi: 8, mag: 40 },
  },
];

export const monstersByDungeon = {
  grassland: grasslandMonsters,
  forest: forestMonsters,
  sea: seaMonsters,
  cave: caveMonsters,
};
