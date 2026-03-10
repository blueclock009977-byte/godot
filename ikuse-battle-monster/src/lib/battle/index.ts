/**
 * バトルシステム - エクスポート
 */

// ダメージ計算
export {
  getStatMultiplier,
  getAccuracyMultiplier,
  getEffectiveAtk,
  getEffectiveDef,
  getEffectiveMag,
  getEffectiveRes,
  getEffectiveSpd,
  checkAccuracy,
  checkCritical,
  calculateDamage,
  calculateFixedDamage,
  calculateConfusionDamage,
  type DamageResult,
} from './damage';

// 状態管理
export {
  createInitialStatStages,
  createBattleMonster,
  calculateMaxHp,
  createBattlePlayer,
  createBattleState,
  getActiveMonster,
  getAliveCount,
  getAvailableSwitches,
  getUsableSkills,
  checkWinner,
  applyHpChange,
  applyManaChange,
  regenerateMana,
  applyStatStageChange,
  resetStatStages,
  switchMonster,
  setWeather,
  tickWeather,
  advancePhase,
  addLog,
  addDamageLog,
} from './state';

// 行動処理
export {
  resolveActionOrder,
  executeAction,
  needsForcedSwitch,
  getForcedSwitchOptions,
  type ResolvedAction,
  type ActionResult,
} from './actions';

// 効果処理
export {
  applySkillEffects,
  applyStatusCondition,
  applyConfusion,
  cureStatus,
  applyStatChange,
  processTurnEndEffects,
  changeWeather,
  processOnEnterAbility,
} from './effects';

// ターン処理
export {
  processTurnStart,
  resolveActions,
  executeForcedSwitch,
  processTurnEnd,
  executeFullTurn,
  type TurnStartResult,
  type ActionResolutionResult,
  type ForcedSwitchResult,
  type TurnEndResult,
  type FullTurnResult,
} from './turn';

// ゲームループ
export {
  createGameState,
  startBattle,
  submitAction,
  executeTurn,
  submitForcedSwitch,
  getAvailableActions,
  selectAIAction,
  selectAIForcedSwitch,
  getBattleResult,
  type GameState,
  type BattleStartResult,
  type ActionSubmitResult,
  type TurnExecutionResult,
  type ForcedSwitchSubmitResult,
  type AvailableActions,
  type BattleResult,
} from './gameLoop';
