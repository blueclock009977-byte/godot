import { Equipment } from '../types';

export const equipments: Equipment[] = [
  // Common武器
  { id: 'wooden_sword', name: '木の剣', type: 'weapon', rarity: 'common', atk: 5 },
  { id: 'iron_sword', name: '鉄の剣', type: 'weapon', rarity: 'common', atk: 10 },
  { id: 'steel_sword', name: '鋼の剣', type: 'weapon', rarity: 'common', atk: 15 },
  
  // Rare武器
  { id: 'flame_sword', name: '炎の剣', type: 'weapon', rarity: 'rare', atk: 25, effect: '火属性ダメージ' },
  { id: 'ice_blade', name: '氷の刃', type: 'weapon', rarity: 'rare', atk: 25, effect: '氷属性ダメージ' },
  
  // Epic武器
  { id: 'dragon_slayer', name: 'ドラゴンスレイヤー', type: 'weapon', rarity: 'epic', atk: 50, effect: 'ボスに+20%' },
  
  // Legendary武器
  { id: 'excalibur', name: 'エクスカリバー', type: 'weapon', rarity: 'legendary', atk: 100, effect: '全ステ+10%' },
  
  // Common防具
  { id: 'cloth_armor', name: '布の服', type: 'armor', rarity: 'common', def: 5 },
  { id: 'leather_armor', name: '革の鎧', type: 'armor', rarity: 'common', def: 10 },
  { id: 'iron_armor', name: '鉄の鎧', type: 'armor', rarity: 'common', def: 15 },
  
  // Rare防具
  { id: 'knight_armor', name: '騎士の鎧', type: 'armor', rarity: 'rare', def: 25, hp: 50 },
  { id: 'mage_robe', name: '魔術師のローブ', type: 'armor', rarity: 'rare', def: 15, effect: 'MP消費-10%' },
  
  // Epic防具
  { id: 'dragon_scale', name: 'ドラゴンスケイル', type: 'armor', rarity: 'epic', def: 50, hp: 100 },
  
  // Common アクセサリ
  { id: 'leather_ring', name: '革のリング', type: 'accessory', rarity: 'common', atk: 3, def: 3 },
  { id: 'silver_ring', name: '銀のリング', type: 'accessory', rarity: 'common', hp: 20 },
  
  // Rare アクセサリ
  { id: 'power_amulet', name: '力のアミュレット', type: 'accessory', rarity: 'rare', atk: 15, effect: 'ATK+10%' },
  { id: 'guard_amulet', name: '守りのアミュレット', type: 'accessory', rarity: 'rare', def: 15, hp: 30 },
  
  // Epic アクセサリ
  { id: 'vampiric_ring', name: '吸血のリング', type: 'accessory', rarity: 'epic', atk: 20, effect: 'HP吸収5%' },
  
  // 放置効率ボーナス装備（Legendary）
  { id: 'idle_crown', name: '放置王の冠', type: 'accessory', rarity: 'legendary', hp: 50, effect: '放置コイン+25%' },
  { id: 'fortune_pendant', name: '幸運のペンダント', type: 'accessory', rarity: 'epic', hp: 30, effect: '放置ドロップ+15%' },
  { id: 'exp_crystal', name: '経験の結晶', type: 'accessory', rarity: 'rare', hp: 20, effect: '放置経験値+20%' },
];

export function getEquipmentById(id: string): Equipment | undefined {
  return equipments.find(e => e.id === id);
}

export function getEquipmentsByRarity(rarity: Equipment['rarity']): Equipment[] {
  return equipments.filter(e => e.rarity === rarity);
}

export function getEquipmentsByType(type: Equipment['type']): Equipment[] {
  return equipments.filter(e => e.type === type);
}

// ドロップテーブル（階層に応じたレアリティ確率）
export function getDropRarity(floor: number): Equipment['rarity'] {
  const rand = Math.random() * 100;
  
  if (floor >= 50) {
    if (rand < 5) return 'legendary';
    if (rand < 20) return 'epic';
    if (rand < 50) return 'rare';
    return 'common';
  } else if (floor >= 30) {
    if (rand < 2) return 'legendary';
    if (rand < 15) return 'epic';
    if (rand < 40) return 'rare';
    return 'common';
  } else if (floor >= 10) {
    if (rand < 10) return 'epic';
    if (rand < 30) return 'rare';
    return 'common';
  } else {
    if (rand < 20) return 'rare';
    return 'common';
  }
}

export function getRandomEquipment(floor: number): Equipment {
  const rarity = getDropRarity(floor);
  const pool = getEquipmentsByRarity(rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

// レアリティカラー
export function getRarityColor(rarity: Equipment['rarity']): string {
  switch (rarity) {
    case 'common': return 'text-slate-300';
    case 'rare': return 'text-blue-400';
    case 'epic': return 'text-purple-400';
    case 'legendary': return 'text-yellow-400';
  }
}

export function getRarityBgColor(rarity: Equipment['rarity']): string {
  switch (rarity) {
    case 'common': return 'bg-slate-700';
    case 'rare': return 'bg-blue-900/50 border-blue-500';
    case 'epic': return 'bg-purple-900/50 border-purple-500';
    case 'legendary': return 'bg-yellow-900/50 border-yellow-500 animate-pulse';
  }
}
