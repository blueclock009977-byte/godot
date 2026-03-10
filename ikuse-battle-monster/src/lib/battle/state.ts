/**
 * バトル状態管理モジュール
 */

import {
  BattleState,
  BattlePlayer,
  BattleMonster,
  BattleLogEntry,
  BattlePhase,
  MonsterInstance,
  MonsterSpecies,
  Weather,
  StatStages,
  INITIAL_MANA,
  MAX_MANA,
  MANA_PER_TURN,
  PARTY_SIZE,
} from '../types';

// ============================================
// 初期化
// ============================================

/**
 * 初期ステータスステージを作成
 */
export function createInitialStatStages(): StatStages {
  return {
    atk: 0,
    def: 0,
    spd: 0,
    mag: 0,
    res: 0,
    accuracy: 0,
    evasion: 0,
  };
}

/**
 * バトルモンスターを作成
 */
export function createBattleMonster(
  instance: MonsterInstance,
  species: MonsterSpecies
): BattleMonster {
  const maxHp = calculateMaxHp(species.baseStats.hp);
  
  return {
    instance,
    species,
    currentHp: instance.currentHp ?? maxHp,
    maxHp,
    status: 'none',
    statusTurns: 0,
    statStages: createInitialStatStages(),
    isConfused: false,
    confusionTurns: 0,
    flinched: false,
    protected: false,
    protectConsecutive: 0,
    charging: false,
    diving: false,
    flying: false,
    trapped: false,
    trappedTurns: 0,
    mustRecharge: false,
    lastUsedSkill: undefined,
    abilityDisabled: false,
    flashFireBoosted: false,
    furyCutterStreak: 0,
    physicalDamageTakenThisTurn: 0,
    specialDamageTakenThisTurn: 0,
    enduring: false,
    yawning: false,
    nightmared: false,
    wishPending: false,
    tauntTurns: 0,
    substituteHp: 0,
    encoreTurns: 0,
    encoredSkillId: undefined,
    disableTurns: 0,
    disabledSkillId: undefined,
    illusionName: undefined,
    illusionTypes: undefined,
  };
}

/**
 * 最大HPを計算（レベル50固定）
 * HP = (種族値 × 2 × レベル / 100) + レベル + 10
 * レベル50: HP = 種族値 + 60
 */
export function calculateMaxHp(baseHp: number): number {
  return baseHp + 60;
}

/**
 * バトルプレイヤーを作成
 */
export function createBattlePlayer(
  id: string,
  name: string,
  party: { instance: MonsterInstance; species: MonsterSpecies }[]
): BattlePlayer {
  if (party.length !== PARTY_SIZE) {
    throw new Error(`Party must have exactly ${PARTY_SIZE} monsters`);
  }
  
  return {
    id,
    name,
    party: party.map(p => createBattleMonster(p.instance, p.species)),
    activeIndex: 0,
    mana: INITIAL_MANA,
    manaSealed: false,
    manaBoostTurns: 0,
    manaChargePending: false,
    manaReflectActive: false,
    manaSpentThisTurn: 0,
    hazards: {
      stealthRock: false,
      spikesLayers: 0,
      toxicSpikesLayers: 0,
    },
    healingWishPending: false,
    lunarDancePending: false,
    reflectTurns: 0,
    lightScreenTurns: 0,
  };
}

/**
 * バトル状態を初期化
 */
export function createBattleState(
  player1: BattlePlayer,
  player2: BattlePlayer
): BattleState {
  return {
    players: [player1, player2],
    weather: 'none',
    weatherTurns: 0,
    turn: 1,
    phase: 'selection',
    actionOrder: [0, 1],
    log: [],
  };
}

// ============================================
// 状態取得
// ============================================

/**
 * アクティブモンスターを取得
 */
export function getActiveMonster(player: BattlePlayer): BattleMonster {
  return player.party[player.activeIndex];
}

/**
 * 生存モンスター数を取得
 */
export function getAliveCount(player: BattlePlayer): number {
  return player.party.filter(m => m.currentHp > 0).length;
}

/**
 * 交代可能なモンスターを取得
 */
export function getAvailableSwitches(player: BattlePlayer): number[] {
  const indices: number[] = [];
  player.party.forEach((monster, index) => {
    if (index !== player.activeIndex && monster.currentHp > 0) {
      indices.push(index);
    }
  });
  return indices;
}

/**
 * 使用可能な技を取得（マナチェック含む）
 */
export function getUsableSkills(
  player: BattlePlayer,
  skills: Map<string, { manaCost: number }>
): string[] {
  const monster = getActiveMonster(player);
  return monster.instance.skills.filter(skillId => {
    const skill = skills.get(skillId);
    return skill && player.mana >= skill.manaCost;
  });
}

/**
 * 勝敗判定
 */
export function checkWinner(state: BattleState): 0 | 1 | null {
  const alive0 = getAliveCount(state.players[0]);
  const alive1 = getAliveCount(state.players[1]);
  
  if (alive0 === 0 && alive1 === 0) {
    // 両者全滅 → 後攻側（このターンで後に動いた側）の勝利
    return state.actionOrder[1];
  }
  if (alive0 === 0) return 1;
  if (alive1 === 0) return 0;
  return null;
}

// ============================================
// 状態変更
// ============================================

/**
 * HPを変更（ダメージ/回復）
 * sturdy（頑丈）: HP満タン時に致死ダメージでHP1で耐える
 */
export function applyHpChange(
  monster: BattleMonster,
  amount: number
): { newHp: number; fainted: boolean; sturdyActivated: boolean } {
  const oldHp = monster.currentHp;
  let sturdyActivated = false;
  
  // ダメージの場合のみsturdy（頑丈）チェック
  if (amount < 0) {
    const potentialHp = monster.currentHp + amount;
    // HP満タンから致死ダメージを受けた場合、sturdyが発動
    if (
      monster.instance.ability === 'sturdy' &&
      monster.currentHp === monster.maxHp &&
      potentialHp <= 0
    ) {
      monster.currentHp = 1;
      sturdyActivated = true;
      return {
        newHp: 1,
        fainted: false,
        sturdyActivated: true,
      };
    }
  }
  
  monster.currentHp = Math.max(0, Math.min(monster.maxHp, monster.currentHp + amount));
  
  return {
    newHp: monster.currentHp,
    fainted: oldHp > 0 && monster.currentHp === 0,
    sturdyActivated,
  };
}

/**
 * マナを変更
 */
export function applyManaChange(
  player: BattlePlayer,
  amount: number
): number {
  player.mana = Math.max(0, Math.min(MAX_MANA, player.mana + amount));
  return player.mana;
}

/**
 * ターン開始時のマナ回復
 * @returns 回復量（マナシール中は0）、マナブースト中は+2追加、マナチャージ待機中は+2追加（合計+5）
 */
export function regenerateMana(player: BattlePlayer): { recovered: number; wasSealed: boolean; boosted: boolean; charged: boolean } {
  // マナシール中は回復しない
  if (player.manaSealed) {
    player.manaSealed = false; // シールは1ターンのみ有効、解除
    player.manaChargePending = false; // シール優先: チャージ効果は不発
    return { recovered: 0, wasSealed: true, boosted: false, charged: false };
  }
  
  const before = player.mana;
  let recovery = MANA_PER_TURN;
  
  // マナブースト中は+2追加
  let boosted = false;
  if (player.manaBoostTurns > 0) {
    recovery += 2;
    player.manaBoostTurns--;
    boosted = true;
  }

  // マナチャージ待機中は次ターンのみ+2追加（通常+3と合わせて+5）
  let charged = false;
  if (player.manaChargePending) {
    recovery += 2;
    player.manaChargePending = false;
    charged = true;
  }
  
  applyManaChange(player, recovery);
  return { recovered: player.mana - before, wasSealed: false, boosted, charged };
}

/**
 * ステータスステージを変更
 */
export function applyStatStageChange(
  monster: BattleMonster,
  stat: keyof StatStages,
  change: number
): { newStage: number; actualChange: number } {
  // 天邪鬼（contrary）: 能力変化が逆転
  let effectiveChange = change;
  if (monster.instance.ability === 'contrary') {
    effectiveChange = -change;
  }
  
  const oldStage = monster.statStages[stat];
  const newStage = Math.max(-6, Math.min(6, oldStage + effectiveChange));
  monster.statStages[stat] = newStage;
  
  return {
    newStage,
    actualChange: newStage - oldStage,
  };
}

/**
 * ステータスステージをリセット（交代時）
 */
export function resetStatStages(monster: BattleMonster): void {
  monster.statStages = createInitialStatStages();
  monster.isConfused = false;
  monster.confusionTurns = 0;
  monster.flinched = false;
  monster.protected = false;
  monster.protectConsecutive = 0;
  monster.charging = false;
  monster.mustRecharge = false;  // 交代でリチャージ解除
  monster.lastUsedSkill = undefined;

  // 猛毒は交代でダメージカウントをリセット（1/16からやり直し）
  if (monster.status === 'badly_poison') {
    monster.statusTurns = 0;
  }
  
  // 連続切りストリークもリセット
  monster.furyCutterStreak = 0;
  
  // あくび状態もリセット（交代で解除）
  monster.yawning = false;
  monster.nightmared = false;
  
  // ちょうはつ状態もリセット（交代で解除）
  monster.tauntTurns = 0;
  
  // みがわりもリセット（交代で消える）
  monster.substituteHp = 0;
  
  // アンコール状態もリセット（交代で解除）
  monster.encoreTurns = 0;
  monster.encoredSkillId = undefined;
  
  // 金縛り状態もリセット（交代で解除）
  monster.disableTurns = 0;
  monster.disabledSkillId = undefined;

  // イリュージョンは交代で解除
  monster.illusionName = undefined;
  monster.illusionTypes = undefined;
}

/**
 * 能力変化をコピー（バトンタッチ用）
 */
export function copyStatStages(source: BattleMonster, target: BattleMonster): void {
  target.statStages = { ...source.statStages };
  // 混乱も引き継ぐ（ポケモン仕様）
  target.isConfused = source.isConfused;
  target.confusionTurns = source.confusionTurns;
}

/**
 * 交代処理
 * @param batonPass true の場合、能力変化を引き継ぐ（バトンタッチ）
 */
export function switchMonster(
  player: BattlePlayer,
  newIndex: number,
  batonPass: boolean = false
): BattleMonster {
  if (newIndex < 0 || newIndex >= player.party.length) {
    throw new Error(`Invalid switch index: ${newIndex}`);
  }
  
  const newMonster = player.party[newIndex];
  if (newMonster.currentHp <= 0) {
    throw new Error('Cannot switch to fainted monster');
  }
  
  // 現在のモンスター
  const currentMonster = getActiveMonster(player);
  
  // バトンタッチ: 能力変化を交代先に引き継ぐ
  if (batonPass) {
    copyStatStages(currentMonster, newMonster);
  }
  
  // 現在のモンスターのステージをリセット
  resetStatStages(currentMonster);
  
  // 交代
  player.activeIndex = newIndex;
  
  return newMonster;
}

/**
 * 天候を設定
 */
export function setWeather(
  state: BattleState,
  weather: Weather,
  turns: number = 5
): void {
  state.weather = weather;
  state.weatherTurns = turns;
}

/**
 * 天候ターン経過
 */
export function tickWeather(state: BattleState): boolean {
  if (state.weather === 'none') return false;
  
  state.weatherTurns--;
  if (state.weatherTurns <= 0) {
    state.weather = 'none';
    return true; // 天候が終了した
  }
  return false;
}

// ============================================
// フェーズ管理
// ============================================

/**
 * フェーズを進める
 */
export function advancePhase(state: BattleState): BattlePhase {
  switch (state.phase) {
    case 'selection':
      state.phase = 'resolution';
      break;
    case 'resolution':
      state.phase = 'turn_end';
      break;
    case 'turn_end':
      // 勝敗チェック
      const winner = checkWinner(state);
      if (winner !== null) {
        state.phase = 'ended';
      } else {
        state.turn++;
        state.phase = 'selection';
      }
      break;
  }
  return state.phase;
}

// ============================================
// ログ
// ============================================

/**
 * ログを追加
 */
export function addLog(
  state: BattleState,
  message: string,
  type: BattleLogEntry['type'] = 'info'
): void {
  state.log.push({
    turn: state.turn,
    message,
    type,
  });
}

/**
 * ダメージログを追加
 */
export function addDamageLog(
  state: BattleState,
  attackerName: string,
  defenderName: string,
  skillName: string,
  damage: number,
  isCritical: boolean,
  effectiveness: number
): void {
  let message = `${attackerName}の${skillName}！ ${defenderName}に${damage}ダメージ！`;
  
  if (isCritical) {
    message = `急所に当たった！ ` + message;
  }
  
  if (effectiveness > 1) {
    message += ' 効果は抜群だ！';
  } else if (effectiveness < 1) {
    message += ' 効果はいまひとつ...';
  }
  
  addLog(state, message, 'damage');
}
