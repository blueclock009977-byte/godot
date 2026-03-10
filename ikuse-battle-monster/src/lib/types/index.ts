/**
 * 育成バトルモンスター - 型定義
 */

// ============================================
// タイプシステム
// ============================================

/** モンスタータイプ（8種 + 無属性） */
export type MonsterType = 
  | 'fire'   // 🔥 炎
  | 'water'  // 💧 水
  | 'earth'  // 🪨 土
  | 'wind'   // 🌪️ 風
  | 'light'  // ✨ 光
  | 'dark'   // 🌑 闇
  | 'thunder'// ⚡ 雷
  | 'ice'    // ❄️ 氷
  | 'none';  // 無属性

/** タイプのメタデータ */
export interface TypeInfo {
  id: MonsterType;
  name: string;
  emoji: string;
}

// ============================================
// ステータス
// ============================================

/** 基本ステータス */
export interface BaseStats {
  hp: number;   // 体力
  atk: number;  // こうげき
  def: number;  // ぼうぎょ
  spd: number;  // すばやさ
  mag: number;  // とくこう
  res: number;  // とくぼう
}

/** ステータス変化ランク（-6〜+6） */
export interface StatStages {
  atk: number;
  def: number;
  spd: number;
  mag: number;
  res: number;
  accuracy: number;  // 命中
  evasion: number;   // 回避
}

// ============================================
// 技
// ============================================

/** 技のカテゴリ */
export type SkillCategory = 'physical' | 'special' | 'status';

/** 技の追加効果タイプ */
export type EffectType = 
  | 'none'
  | 'burn'           // 火傷
  | 'paralyze'       // 麻痺
  | 'freeze'         // 凍り
  | 'poison'         // 毒
  | 'badly_poison'   // 猛毒
  | 'sleep'          // 眠り
  | 'confuse'        // 混乱
  | 'flinch'         // ひるみ
  | 'stat_up'        // ステータス上昇
  | 'stat_down'      // ステータス下降
  | 'heal'           // 回復
  | 'recoil'         // 反動
  | 'charge'         // 溜め技
  | 'multi_hit'      // 連続攻撃
  | 'priority'       // 先制技
  | 'switch'         // 交代技
  | 'ohko'           // 一撃必殺
  | 'weather'        // 天候変化
  | 'protect'        // 守り
  | 'trap'           // 拘束
  | 'drain'          // 吸収
  | 'mana';          // マナ操作

/** ステータス変化対象 */
export type StatTarget = 'atk' | 'def' | 'spd' | 'mag' | 'res' | 'accuracy' | 'evasion' | 'all';

/** 技の追加効果 */
export interface SkillEffect {
  type: EffectType;
  chance: number;      // 発動確率（0-100）
  target?: 'self' | 'enemy';
  stat?: StatTarget;   // stat_up/stat_downの場合
  stages?: number;     // ステータス変化量
  amount?: number;     // 回復量やダメージ量（%）
  turns?: number;      // 持続ターン
}

/** 技データ */
export interface Skill {
  id: string;
  name: string;
  type: MonsterType;
  category: SkillCategory;
  power: number;       // 威力（0 = ダメージなし）
  accuracy: number;    // 命中率（0-100、0 = 必中）
  manaCost: number;    // マナコスト
  priority: number;    // 優先度（通常は0）
  critBonus: number;   // 急所ボーナス（通常は0）
  effects: SkillEffect[];
  description: string;
  // 特殊フラグ
  makesContact?: boolean;     // 接触技かどうか
  ignoresProtect?: boolean;   // 守りを貫通
  ignoresStatChanges?: boolean; // 能力変化を無視
}

// ============================================
// 特性
// ============================================

/** 特性の効果タイプ */
export type AbilityTrigger = 
  | 'on_enter'       // 登場時
  | 'on_hit'         // 攻撃を受けた時
  | 'on_attack'      // 攻撃する時
  | 'on_turn_end'    // ターン終了時
  | 'on_low_hp'      // HP50%以下時
  | 'passive'        // 常時発動
  | 'on_switch'      // 交代時
  | 'on_weather';    // 天候時

/** 特性データ */
export interface Ability {
  id: string;
  name: string;
  description: string;
  trigger: AbilityTrigger;
  // 特性の効果はバトルロジックで実装
}

// ============================================
// モンスター
// ============================================

/** 種族値カテゴリ */
export type StatTier = 'starter' | 'early' | 'normal' | 'late';
// starter: 490族（御三家）
// early: 450族（早熟）
// normal: 490族（普通）
// late: 530族（晩成）

/** モンスター種族データ（マスターデータ） */
export interface MonsterSpecies {
  id: string;
  name: string;
  types: [MonsterType] | [MonsterType, MonsterType]; // 1つまたは2つ
  baseStats: BaseStats;
  statTier: StatTier;
  abilities: [string, string] | [string]; // 特性候補（1-2個）
  skillPool: string[];  // 習得可能技（8個、うち4個をランダム習得）
  description: string;
  // 御三家フラグ
  isStarter?: boolean;
  // 固定構成（御三家用）
  fixedAbility?: string;
  fixedSkills?: string[];
}

/** 個体データ（プレイヤーが所持するモンスター） */
export interface MonsterInstance {
  id: string;           // ユニークID
  speciesId: string;    // 種族ID
  nickname?: string;    // ニックネーム
  ability: string;      // 選ばれた特性
  skills: string[];     // 習得した技（4個）
  // バトル用
  currentHp: number;
  maxHp: number;
}

// ============================================
// バトル
// ============================================

/** 状態異常 */
export type StatusCondition = 
  | 'none'
  | 'burn'        // 火傷
  | 'paralyze'    // 麻痺
  | 'freeze'      // 凍り
  | 'poison'      // 毒
  | 'badly_poison'// 猛毒
  | 'sleep';      // 眠り

/** バトル中のモンスター状態 */
export interface BattleMonster {
  instance: MonsterInstance;
  species: MonsterSpecies;
  currentHp: number;
  maxHp: number;
  status: StatusCondition;
  statusTurns: number;      // 状態異常の経過ターン
  statStages: StatStages;
  isConfused: boolean;      // 混乱（主要状態異常と併存可能）
  confusionTurns: number;
  // フラグ
  protected: boolean;       // まもる中
  charging: boolean;        // 溜め中
  diving: boolean;          // 潜り中
  flying: boolean;          // 飛び中
  trapped: boolean;         // 拘束中
  trappedTurns: number;
  lastUsedSkill?: string;   // 最後に使った技
  // 能力変化用
  abilityDisabled: boolean;
}

/** プレイヤー情報 */
export interface BattlePlayer {
  id: string;
  name: string;
  party: BattleMonster[];   // 3体
  activeIndex: number;      // 現在出ているモンスターのindex
  mana: number;             // 共有マナ
}

/** 天候 */
export type Weather = 'none' | 'sunny' | 'rain' | 'sandstorm' | 'snow';

/** バトル状態 */
export interface BattleState {
  players: [BattlePlayer, BattlePlayer];
  weather: Weather;
  weatherTurns: number;
  turn: number;
  phase: BattlePhase;
  // ログ
  log: BattleLogEntry[];
}

/** バトルフェーズ */
export type BattlePhase = 
  | 'selection'    // 行動選択中
  | 'resolution'   // 行動解決中
  | 'turn_end'     // ターン終了処理
  | 'ended';       // バトル終了

/** 行動タイプ */
export type ActionType = 'skill' | 'switch' | 'wait';

/** 行動コマンド */
export interface BattleAction {
  type: ActionType;
  skillId?: string;     // 技を使う場合
  switchTo?: number;    // 交代先のindex
}

/** バトルログエントリ */
export interface BattleLogEntry {
  turn: number;
  message: string;
  type: 'info' | 'damage' | 'heal' | 'status' | 'switch' | 'weather' | 'ability' | 'ko';
}

// ============================================
// ユーティリティ型
// ============================================

/** タイプ相性倍率 */
export type TypeEffectiveness = 0.5 | 1 | 2;

/** タイプ相性表 */
export type TypeChart = Record<MonsterType, Record<MonsterType, TypeEffectiveness>>;

// ============================================
// 定数
// ============================================

export const MAX_MANA = 20;
export const INITIAL_MANA = 10;
export const MANA_PER_TURN = 3;
export const PARTY_SIZE = 3;
export const SKILL_SLOT_SIZE = 4;
export const SKILL_POOL_SIZE = 8;
export const STAT_STAGE_MIN = -6;
export const STAT_STAGE_MAX = 6;
export const CRIT_DAMAGE_MULTIPLIER = 1.5;
export const STAB_MULTIPLIER = 1.5;
