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

// ポーションタイプ
export interface PotionType {
  id: string;
  name: string;
  description: string;
  healPercent: number;  // HP回復量（最大HPの%）
  price: number;        // 購入価格
  emoji: string;
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
  potions: number;          // 所持ポーション数
  statistics: Statistics;   // 累計統計
  battleHistory: BattleHistoryEntry[]; // 戦闘履歴（直近50件）
  achievements: Record<string, AchievementProgress>; // 実績進捗
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

// 累計統計
export interface Statistics {
  totalKills: number;           // 累計撃破数
  totalBossKills: number;       // 累計ボス撃破数
  totalCoinsEarned: number;     // 累計獲得コイン
  totalFloorsCleared: number;   // 累計クリアフロア数
  totalDeaths: number;          // 累計死亡回数
  totalPotionsUsed: number;     // 累計ポーション使用数
  totalPlayTimeSeconds: number; // 累計プレイ時間（秒）
  totalExpEarned: number;       // 累計獲得経験値
}

// 戦闘履歴エントリー
export interface BattleHistoryEntry {
  id: string;
  timestamp: number;
  type: 'floor_clear' | 'boss_kill' | 'death' | 'level_up' | 'drop' | 'achievement';
  floor?: number;
  message: string;
  details?: {
    itemId?: string;
    itemName?: string;
    level?: number;
    achievementId?: string;
  };
}

// 実績
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: Statistics, userData: UserData) => boolean;
  reward?: {
    coins?: number;
    exp?: number;
  };
}

// 実績解除状態
export interface AchievementProgress {
  unlockedAt: number;  // 解除時刻（0なら未解除）
  claimed: boolean;    // 報酬受け取り済み
}
