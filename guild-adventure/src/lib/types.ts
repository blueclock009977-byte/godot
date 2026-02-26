// ============================================
// 基本型定義
// ============================================

export type RaceType = 
  | 'human' | 'elf' | 'dwarf' | 'halfling' | 'orc' | 'lizardman' | 'fairy' | 'undead'
  | 'goblin' | 'dragonewt' | 'angel' | 'demon';

export type JobType = 
  | 'warrior' | 'mage' | 'priest' | 'thief' | 'knight' | 'hunter' | 'ninja' | 'sage'
  | 'berserker' | 'paladin' | 'necromancer' | 'monk' | 'ranger' | 'samurai' | 'witch' | 'bard';

export type TraitType = 'brave' | 'cautious' | 'lucky' | 'genius' | 'stubborn';
export type EnvironmentType = 'grassland' | 'forest' | 'sea' | 'mountain' | 'city';
export type DungeonType = 'grassland' | 'forest' | 'cave' | 'sea' | 'desert' | 'volcano' | 'snowfield' | 'temple';
export type Position = 1 | 2 | 3 | 4 | 5 | 6;

// 各列の被弾確率（%）
export const POSITION_HIT_RATE: Record<Position, number> = {
  1: 30,
  2: 20,
  3: 15,
  4: 15,
  5: 10,
  6: 10,
};

// ============================================
// ステータス
// ============================================

export interface Stats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  agi: number;
  mag: number;
}

// ============================================
// 効果タイプ
// ============================================

export type EffectType = 
  | 'damageBonus'       // 与ダメージ+%
  | 'damageReduction'   // 被ダメージ-%
  | 'critBonus'         // クリティカル率+%
  | 'critDamage'        // クリティカルダメージ+%
  | 'evasionBonus'      // 回避率+%
  | 'accuracyBonus'     // 命中率+%
  | 'firstStrikeBonus'  // 先制率+%
  | 'magicBonus'        // 魔法威力+%
  | 'physicalBonus'     // 物理攻撃+%
  | 'healBonus'         // 回復量+%（与える）
  | 'healReceived'      // 回復量+%（受ける）
  | 'mpReduction'       // MP消費-%
  | 'mpRegen'           // 毎ターンMP回復
  | 'hpRegen'           // 毎ターンHP回復
  | 'hpSteal'           // HP吸収+%
  | 'statusResist'      // 状態異常耐性+%
  | 'poisonResist'      // 毒耐性+%
  | 'stunResist'        // スタン耐性+%
  | 'counterRate'       // 反撃率+%
  | 'doubleAttack'      // 2回攻撃率+%
  | 'allyDefense'       // 味方防御+%
  | 'allyAtkBonus'      // 味方攻撃+%
  | 'intimidate'        // 威圧（敵攻撃-%）
  | 'debuffBonus'       // デバフ成功率+%
  // マスタリー用
  | 'allStats'          // 全ステータス+%
  | 'followUp'          // 追撃率+%
  | 'cover'             // 庇う率+%
  | 'revive'            // 蘇生（戦闘中1回）
  | 'lowHpBonus'        // 低HP時ダメージ+%
  | 'allyCountBonus'    // 味方数でダメージ+%
  | 'ignoreDefense'     // 防御無視+%
  | 'doublecast'        // 魔法2回発動率+%
  | 'perfectEvasion'    // 完全回避率+%
  | 'attackStack'       // 攻撃ごとにATK上昇
  | 'autoRevive'        // 味方死亡時自動蘇生
  | 'summonUndead'      // 死霊召喚
  | 'fullRegen'         // 毎ターン全回復
  ;

export interface Effect {
  type: EffectType;
  value: number;
}

// ============================================
// 種族・職業・個性・環境
// ============================================

export interface MasterySkill {
  name: string;
  description: string;
  type: 'passive' | 'active';  // パッシブ効果 or アクティブスキル
  effects?: Effect[];          // パッシブ効果
  skill?: SkillData;           // アクティブスキル
}

export interface RaceData {
  id: RaceType;
  name: string;
  description: string;
  baseStats: Omit<Stats, 'hp' | 'mp'> & { maxHp: number; maxMp: number };
  passives: PassiveSkill[];
  skills?: SkillData[];  // 種族固有スキル
  masterySkill?: MasterySkill;  // マスタリースキル
}

export interface JobData {
  id: JobType;
  name: string;
  description: string;
  statModifiers: Partial<Stats>;
  passives: PassiveSkill[];
  skills: SkillData[];
  masterySkill?: MasterySkill;  // マスタリースキル
}

export interface PassiveSkill {
  name: string;
  description: string;
  effects: Effect[];
}

export interface TraitData {
  id: TraitType;
  name: string;
  description: string;
  statModifiers?: Partial<Stats>;
  effects: Effect[];
}

export interface EnvironmentData {
  id: EnvironmentType;
  name: string;
  description: string;
  statModifiers?: Partial<Stats>;
  effects?: Effect[];
}

// 後方互換のため
export type TraitEffect = Effect;

// ============================================
// スキル
// ============================================

export interface SkillData {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'magic' | 'heal' | 'buff' | 'debuff';
  target: 'single' | 'all' | 'ally' | 'self' | 'allAllies';
  multiplier: number;
  mpCost: number;
  condition?: SkillCondition;
  effect?: SkillEffect;
}

export interface SkillEffect {
  type: 'poison' | 'stun' | 'atkUp' | 'defUp' | 'agiUp' | 'atkDown' | 'defDown' | 'statDown' | 'agiDown';
  chance?: number;  // 発動確率（%）
  duration?: number; // 持続ターン
  value?: number;    // 効果量（%）
}

export interface SkillCondition {
  type: 'hpAbove' | 'hpBelow' | 'enemyCount';
  value: number;
  target: 'self' | 'ally' | 'enemy';
}

// ============================================
// キャラクター
// ============================================

export interface Character {
  id: string;
  name: string;
  race: RaceType;
  job: JobType;
  trait: TraitType;
  environment: EnvironmentType;
  stats: Stats;
  position?: Position;
  raceMastery?: boolean;  // 種族マスタリー解放済み
  jobMastery?: boolean;   // 職業マスタリー解放済み
}

// ============================================
// パーティ
// ============================================

export interface Party {
  members: (Character | null)[];  // 6列（インデックス0-5 = 1-6列目）
}

// ============================================
// モンスター
// ============================================

export interface Monster {
  id: string;
  name: string;
  stats: Stats;
  skills?: SkillData[];
  dropRate?: number;
}

export interface MonsterSpawn {
  monster: Monster;
  weight: number;  // 出現確率の重み
}

// ============================================
// ダンジョン
// ============================================

export interface DungeonData {
  id: DungeonType;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  durationSeconds: number;
  encounterCount: number;
  monsters: MonsterSpawn[];
  boss?: Monster;
}

// ============================================
// バトル
// ============================================

export interface BattleUnit {
  id: string;
  name: string;
  isPlayer: boolean;
  stats: Stats;
  position: Position;  // 1-6列目
  race?: RaceType;
  job?: JobType;
  trait?: TraitType;
  skills?: SkillData[];
}

export interface BattleAction {
  actor: BattleUnit;
  target: BattleUnit | BattleUnit[];
  actionType: 'attack' | 'skill' | 'heal';
  skill?: SkillData;
  damage?: number;
  heal?: number;
  isCritical?: boolean;
  isMiss?: boolean;
}

export interface BattleLog {
  turn: number;
  actions: BattleAction[];
  message: string;
}

export interface BattleResult {
  victory: boolean;
  logs: BattleLog[];
  encountersCleared: number;
  totalEncounters: number;
  droppedItemId?: string; // ボス撃破時にドロップしたアイテムID
}

// ============================================
// 冒険
// ============================================

export interface Adventure {
  dungeon: DungeonType;
  party: Party;
  startTime: number;
  duration: number;
  status: 'preparing' | 'inProgress' | 'completed';
  result?: BattleResult;
}

// ============================================
// ゲーム状態
// ============================================

// インベントリ（アイテムIDと個数）
export type Inventory = Record<string, number>;

export interface GameState {
  characters: Character[];
  party: Party;
  currentAdventure: Adventure | null;
  inventory: Inventory;
}
