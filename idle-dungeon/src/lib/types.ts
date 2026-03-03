// キャラクターステータス
export interface CharacterStats {
  level: number;
  exp: number;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

// 装備レアリティ
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

// 装備タイプ
export type EquipmentType = 'weapon' | 'armor' | 'accessory';

// 装備データ
export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  rarity: Rarity;
  atk?: number;
  def?: number;
  hp?: number;
  effect?: string;
}

// スキルデータ
export interface Skill {
  id: string;
  name: string;
  description: string;
  effect: SkillEffect;
}

export interface SkillEffect {
  critRate?: number;      // クリティカル率+
  critDamage?: number;    // クリティカルダメージ+
  hpRegen?: number;       // HP自動回復
  atkPercent?: number;    // ATK%上昇
  defPercent?: number;    // DEF%上昇
  dodgeRate?: number;     // 回避率
}

// ユーザーデータ（Firebase保存）
export interface UserData {
  username: string;
  character: CharacterStats;
  currentFloor: number;
  highestFloor: number;
  equippedWeapon: string | null;
  equippedArmor: string | null;
  equippedAccessory: string | null;
  inventory: string[];      // 装備ID配列
  equippedSkills: string[]; // 装備中スキル（最大4）
  skillInventory: string[]; // 所持スキル
  lastActiveAt: number;     // 最終アクティブ時刻
  coins: number;
}

// 敵データ
export interface Enemy {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  exp: number;
  isBoss?: boolean;
}

// 放置結果
export interface IdleResult {
  startFloor: number;
  endFloor: number;
  defeatedAt?: number;  // 敗北した階（undefinedなら進行中）
  droppedEquipment: string[];
  droppedSkills: string[];
  earnedExp: number;
  earnedCoins: number;
  elapsedSeconds: number;
}
