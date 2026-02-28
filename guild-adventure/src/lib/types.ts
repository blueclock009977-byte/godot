// ============================================
// 基本型定義
// ============================================

export type RaceType = 
  | 'human' | 'elf' | 'dwarf' | 'halfling' | 'orc' | 'lizardman' | 'fairy' | 'undead'
  | 'goblin' | 'dragonewt' | 'angel' | 'demon'
  | 'genasi' | 'aasimar' | 'tiefling' | 'dhampir';  // 両刀種族

export type JobType = 
  | 'warrior' | 'mage' | 'priest' | 'thief' | 'knight' | 'hunter' | 'ninja' | 'sage'
  | 'berserker' | 'paladin' | 'necromancer' | 'monk' | 'ranger' | 'samurai' | 'witch' | 'bard'
  | 'spellblade' | 'battlemage' | 'runesmith' | 'redmage';  // 両刀職業

export type TraitType = 'brave' | 'cautious' | 'lucky' | 'genius' | 'stubborn';
export type EnvironmentType = 'grassland' | 'forest' | 'sea' | 'mountain' | 'city';
export type DungeonType = 'grassland' | 'forest' | 'cave' | 'sea' | 'desert' | 'volcano' | 'snowfield' | 'temple';
export type Position = 'front' | 'back';

// 系統（モンスター分類）
export type SpeciesType = 'humanoid' | 'beast' | 'undead' | 'demon' | 'dragon';

// 属性
export type ElementType = 'none' | 'fire' | 'water' | 'wind' | 'earth';

// 属性相性（1.3倍ダメージ）
export const ELEMENT_ADVANTAGE: Record<ElementType, ElementType | null> = {
  none: null,
  fire: 'wind',    // 火 → 風に強い
  water: 'fire',   // 水 → 火に強い
  wind: 'earth',   // 風 → 地に強い
  earth: 'water',  // 地 → 水に強い
};

export const ELEMENT_MULTIPLIER = 1.3;

// 前衛/後衛の補正
export const POSITION_MODIFIERS: Record<Position, { damage: number; defense: number }> = {
  front: { damage: 1.2, defense: 0.8 },  // 火力+20%, 被ダメ+20%
  back: { damage: 0.8, defense: 1.2 },   // 火力-20%, 被ダメ-20%
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
  | 'physicalResist'    // 物理被ダメージ-%
  | 'magicResist'       // 魔法被ダメージ-%
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
  // 系統特攻（1.2〜1.8倍）
  | 'speciesKiller_humanoid'  // 人型特攻
  | 'speciesKiller_beast'     // 獣特攻
  | 'speciesKiller_undead'    // 不死特攻
  | 'speciesKiller_demon'     // 悪魔特攻
  | 'speciesKiller_dragon'    // 竜特攻
  // 系統耐性（被ダメ軽減）
  | 'speciesResist_humanoid'  // 人型耐性
  | 'speciesResist_beast'     // 獣耐性
  | 'speciesResist_undead'    // 不死耐性
  | 'speciesResist_demon'     // 悪魔耐性
  | 'speciesResist_dragon'    // 竜耐性
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
  // v0.8.68追加: 強力なLvスキル用
  | 'surviveLethal'     // 致死ダメをHP1で1回耐える
  | 'lowHpDamageBonus'  // HP一定以下で全ダメ+%
  | 'lowHpThreshold'    // lowHpDamageBonusの発動閾値（%）
  | 'bonusHits'         // 追加攻撃回数
  // v0.8.70追加: 条件付き効果
  | 'fullHpAtkBonus'    // HP満タン時ATK+%
  | 'critAfterEvade'    // 回避成功→次クリ確定
  | 'critOnFirstStrike' // 先制成功→クリ確定
  | 'lowHpBonusHits'    // HP低下時追加攻撃回数
  | 'lowHpHitsThreshold'// lowHpBonusHitsの発動閾値（%）
  | 'extraAttackOnCrit' // クリ時追加攻撃
  | 'firstHitCrit'      // 最初の攻撃確定クリ
  | 'backlineEvasion'   // 後衛時回避+%
  | 'lowHpDefense'      // HP低下時被ダメ-%
  | 'lowHpDefenseThreshold' // lowHpDefenseの発動閾値（%）
  | 'counterDamageBonus'// 反撃ダメ+%
  | 'coinBonus'         // コイン獲得+%
  | 'doubleDropRoll'    // ドロップ2回抽選
  | 'dropBonus'         // ドロップ率+%
  | 'rareDropBonus'     // レア装備確率+%
  | 'explorationSpeedBonus' // 探索時間-%
  // 連撃・劣化関連
  | 'fixedHits'         // ヒット数固定（AGI無視）
  | 'bonusHits'         // 追加ヒット数
  | 'noDecayHits'       // 最初のN回は減衰なし
  | 'decayReduction'    // 減衰緩和（%、80%→90%など）
  | 'singleHitBonus'    // 単発時ダメージ+%
  | 'degradationResist' // 劣化耐性（受ける劣化-%）
  | 'degradationBonus'  // 劣化ボーナス（与える劣化+%）
  | 'mpOnKill'          // 敵を倒した時MP回復
  // v0.9.78追加: マスタリー2用エフェクト
  | 'physicalFollowUp'  // 味方物理攻撃後に追撃（%確率）
  | 'allyMagBonus'      // 味方の魔法ダメージ+%
  | 'debuffFollowUp'    // デバフ成功時追撃（%確率）
  | 'allyMpReduction'   // 味方のMP消費-%
  | 'hpOnKill'          // 敵撃破時HP回復
  | 'atkStackOnKill'    // 敵撃破時ATKスタック（%）
  | 'allyHitHeal'       // 味方がヒット時HP回復
  | 'critFollowUp'      // クリティカル時追撃（+%ダメージ）
  | 'debuffDuration'    // デバフ持続ターン+N
  | 'frontlineBonus'    // 前衛3人以上でATK+%
  | 'allyMagicHitMp'    // 味方魔法被弾時MP回復
  | 'deathResist'       // HP0時に耐える確率（%）
  | 'allyHpRegen'       // 味方全員の毎ターンHP回復
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
  masterySkill2?: MasterySkill;  // マスタリー2スキル
}

export interface JobData {
  id: JobType;
  name: string;
  description: string;
  statModifiers: Partial<Stats>;
  passives: PassiveSkill[];
  skills: SkillData[];
  masterySkill?: MasterySkill;  // マスタリースキル
  masterySkill2?: MasterySkill;  // マスタリー2スキル
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
  element?: ElementType;  // スキル属性（省略時はnone）
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
  raceMastery2?: boolean; // 種族マスタリー2解放済み
  jobMastery2?: boolean;  // 職業マスタリー2解放済み
  level?: number;          // キャラレベル（1-5）
  lv2Bonus?: string;       // Lv2で獲得したステータスボーナスID
  lv4Bonus?: string;       // Lv4で獲得したステータスボーナスID
  lv3Skill?: string;       // Lv3で獲得したスキルID
  lv5Skill?: string;       // Lv5で獲得したスキルID
  equipmentId?: string;    // 装備中のアイテムID
}

// ============================================
// パーティ
// ============================================

export interface Party {
  front: (Character | null)[];  // 前衛4人
  back: (Character | null)[];   // 後衛4人
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
  species: SpeciesType;           // 系統
  element?: ElementType;
  elementModifier?: Partial<Record<ElementType, number>>;  // 属性耐性/弱点（正=耐性%, 負=弱点%）
  physicalResist?: number;  // 物理ダメージ耐性%
  magicResist?: number;     // 魔法ダメージ耐性%
  speciesKiller?: { species: SpeciesType; multiplier: number }[];  // 系統特攻
  speciesResist?: { species: SpeciesType; multiplier: number }[];  // 系統耐性
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
  recommendedPlayers: number;
  durationSeconds: number;
  encounterCount: number;
  monsters: MonsterSpawn[];
  boss?: Monster;
  coinReward: number;      // 勝利時のコイン報酬
}

// ============================================
// バトル
// ============================================

export interface BattleUnit {
  id: string;
  name: string;
  isPlayer: boolean;
  stats: Stats;
  position: Position;  // 前衛/後衛
  race?: RaceType;
  job?: JobType;
  trait?: TraitType;
  skills?: SkillData[];
  raceMastery?: boolean;
  jobMastery?: boolean;
  raceMastery2?: boolean;
  jobMastery2?: boolean;
  lv3Skill?: string;
  lv5Skill?: string;
  equipmentId?: string;  // 装備中のアイテムID
  // モンスター用
  species?: SpeciesType;
  element?: ElementType;
  elementModifier?: Partial<Record<ElementType, number>>;  // 属性耐性/弱点
  physicalResist?: number;  // 物理ダメージ耐性%
  magicResist?: number;     // 魔法ダメージ耐性%
  speciesKiller?: { species: SpeciesType; multiplier: number }[];
  speciesResist?: { species: SpeciesType; multiplier: number }[];
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
  droppedItemId?: string;       // ボス撃破時にドロップしたアイテムID（後方互換）
  droppedEquipmentId?: string;  // 装備アイテムドロップID（後方互換）
  droppedItemIds?: string[];    // 複数ドロップ対応
  droppedEquipmentIds?: string[]; // 複数装備ドロップ対応
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
