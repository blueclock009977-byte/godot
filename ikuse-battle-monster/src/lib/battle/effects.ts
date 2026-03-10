/**
 * 効果処理モジュール（状態異常、能力変化、天候など）
 */

import {
  BattleState,
  BattleMonster,
  Skill,
  StatusCondition,
  StatStages,
  Weather,
  MonsterType,
} from '../types';
import {
  getActiveMonster,
  applyHpChange,
  applyManaChange,
  applyStatStageChange,
  setWeather,
  tickWeather,
  addLog,
} from './state';

// ============================================
// 技の追加効果
// ============================================

/**
 * 技の追加効果を適用
 */
export function applySkillEffects(
  state: BattleState,
  playerIndex: 0 | 1,
  skill: Skill,
  damage: number
): string[] {
  const messages: string[] = [];
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex as 0 | 1];
  const attacker = getActiveMonster(player);
  const defender = getActiveMonster(opponent);
  
  for (const effect of skill.effects) {
    // 確率チェック
    if (Math.random() * 100 >= effect.chance) continue;
    
    const target = effect.target === 'self' ? attacker : defender;
    
    switch (effect.type) {
      case 'burn':
        messages.push(...applyStatusCondition(target, 'burn'));
        break;
        
      case 'paralyze':
        messages.push(...applyStatusCondition(target, 'paralyze'));
        break;
        
      case 'freeze':
        messages.push(...applyStatusCondition(target, 'freeze'));
        break;
        
      case 'poison':
        messages.push(...applyStatusCondition(target, 'poison'));
        break;
        
      case 'badly_poison':
        messages.push(...applyStatusCondition(target, 'badly_poison'));
        break;
        
      case 'sleep':
        messages.push(...applyStatusCondition(target, 'sleep'));
        break;
        
      case 'confuse':
        messages.push(...applyConfusion(target));
        break;
        
      case 'flinch':
        // ひるみ付与（後続の行動時にactions.tsで行動不能判定）
        target.flinched = true;
        messages.push(`${target.species.name}はひるんだ！`);
        break;
        
      case 'stat_up':
      case 'stat_down':
        if (effect.stat && effect.stages) {
          const change = effect.type === 'stat_up' ? effect.stages : -effect.stages;
          messages.push(...applyStatChange(target, effect.stat, change));
        }
        break;
        
      case 'heal':
        if (effect.amount) {
          const healAmount = Math.floor(target.maxHp * effect.amount / 100);
          applyHpChange(target, healAmount);
          messages.push(`${target.species.name}は体力を回復した！`);
        }
        break;
        
      case 'recoil':
        if (effect.amount && damage > 0) {
          const recoilDamage = Math.floor(damage * effect.amount / 100);
          const recoilResult = applyHpChange(attacker, -recoilDamage);
          messages.push(`${attacker.species.name}は反動を受けた！`);
          
          // 不死鳥（phoenix）: 1回だけHP1で復活
          if (recoilResult.fainted && attacker.instance.ability === 'phoenix' && !attacker.abilityDisabled) {
            attacker.currentHp = 1;
            attacker.abilityDisabled = true;
            messages.push(`${attacker.species.name}は不死鳥の力で復活した！`);
          }
        }
        break;
        
      case 'drain':
        if (effect.amount && damage > 0) {
          const drainAmount = Math.floor(damage * effect.amount / 100);
          applyHpChange(attacker, drainAmount);
          messages.push(`${attacker.species.name}は体力を吸い取った！`);
        }
        break;
        
      case 'weather':
        // 天候変化（技のデータに応じて実装）
        break;
        
      case 'protect':
        attacker.protected = true;
        messages.push(`${attacker.species.name}は身を守っている！`);
        break;
        
      case 'mana':
        if (effect.amount) {
          if (effect.target === 'self') {
            applyManaChange(player, effect.amount);
            messages.push(`${player.name}のマナが${effect.amount > 0 ? '増えた' : '減った'}！`);
          } else {
            applyManaChange(opponent, -Math.abs(effect.amount));
            messages.push(`${opponent.name}のマナを奪った！`);
          }
        }
        break;
    }
  }
  
  return messages;
}

// ============================================
// 状態異常
// ============================================

const STATUS_NAMES: Record<StatusCondition, string> = {
  none: '',
  burn: 'やけど',
  paralyze: 'まひ',
  freeze: 'こおり',
  poison: 'どく',
  badly_poison: 'もうどく',
  sleep: 'ねむり',
};

/**
 * 状態異常を付与
 */
export function applyStatusCondition(
  monster: BattleMonster,
  status: StatusCondition
): string[] {
  const messages: string[] = [];
  
  // すでに状態異常がある場合は上書きしない
  if (monster.status !== 'none') {
    messages.push(`${monster.species.name}はすでに${STATUS_NAMES[monster.status]}状態だ！`);
    return messages;
  }
  
  // タイプ免疫チェック
  const types = monster.species.types as MonsterType[];
  
  // 炎タイプはやけどにならない
  if (status === 'burn' && types.includes('fire')) {
    messages.push(`${monster.species.name}はやけどにならない！`);
    return messages;
  }
  
  // 氷タイプは凍らない
  if (status === 'freeze' && types.includes('ice')) {
    messages.push(`${monster.species.name}は凍らない！`);
    return messages;
  }
  
  // 雷タイプはまひにならない
  if (status === 'paralyze' && types.includes('thunder')) {
    messages.push(`${monster.species.name}はまひにならない！`);
    return messages;
  }
  
  // TODO: 毒タイプは毒にならない、など
  
  monster.status = status;
  monster.statusTurns = 0;
  messages.push(`${monster.species.name}は${STATUS_NAMES[status]}状態になった！`);
  
  return messages;
}

/**
 * 混乱を付与
 */
export function applyConfusion(monster: BattleMonster): string[] {
  const messages: string[] = [];
  
  if (monster.isConfused) {
    messages.push(`${monster.species.name}はすでに混乱している！`);
    return messages;
  }
  
  monster.isConfused = true;
  monster.confusionTurns = 0;
  messages.push(`${monster.species.name}は混乱した！`);
  
  return messages;
}

/**
 * 状態異常を回復
 */
export function cureStatus(monster: BattleMonster): string[] {
  const messages: string[] = [];
  
  if (monster.status !== 'none') {
    messages.push(`${monster.species.name}の${STATUS_NAMES[monster.status]}が治った！`);
    monster.status = 'none';
    monster.statusTurns = 0;
  }
  
  return messages;
}

// ============================================
// 能力変化
// ============================================

const STAT_NAMES: Record<keyof StatStages, string> = {
  atk: 'こうげき',
  def: 'ぼうぎょ',
  spd: 'すばやさ',
  mag: 'とくこう',
  res: 'とくぼう',
  accuracy: 'めいちゅう',
  evasion: 'かいひ',
};

/**
 * ステータス変化を適用
 */
export function applyStatChange(
  monster: BattleMonster,
  stat: string,
  change: number
): string[] {
  const messages: string[] = [];
  
  // 'all'の場合は全ステータスに適用
  if (stat === 'all') {
    const stats: (keyof StatStages)[] = ['atk', 'def', 'spd', 'mag', 'res'];
    for (const s of stats) {
      const result = applyStatStageChange(monster, s, change);
      if (result.actualChange !== 0) {
        messages.push(getStatChangeMessage(monster, s, result.actualChange));
      }
    }
    return messages;
  }
  
  const statKey = stat as keyof StatStages;
  if (!(statKey in monster.statStages)) {
    return messages;
  }
  
  const result = applyStatStageChange(monster, statKey, change);
  
  if (result.actualChange === 0) {
    if (change > 0) {
      messages.push(`${monster.species.name}の${STAT_NAMES[statKey]}はもう上がらない！`);
    } else {
      messages.push(`${monster.species.name}の${STAT_NAMES[statKey]}はもう下がらない！`);
    }
  } else {
    messages.push(getStatChangeMessage(monster, statKey, result.actualChange));
  }
  
  return messages;
}

/**
 * ステータス変化メッセージを生成
 */
function getStatChangeMessage(
  monster: BattleMonster,
  stat: keyof StatStages,
  change: number
): string {
  const statName = STAT_NAMES[stat];
  
  if (change >= 3) {
    return `${monster.species.name}の${statName}がぐーんと上がった！`;
  } else if (change === 2) {
    return `${monster.species.name}の${statName}がぐんと上がった！`;
  } else if (change === 1) {
    return `${monster.species.name}の${statName}が上がった！`;
  } else if (change === -1) {
    return `${monster.species.name}の${statName}が下がった！`;
  } else if (change === -2) {
    return `${monster.species.name}の${statName}ががくっと下がった！`;
  } else {
    return `${monster.species.name}の${statName}ががくーんと下がった！`;
  }
}

// ============================================
// ターン終了時処理
// ============================================

/**
 * ターン終了時の効果を処理
 */
export function processTurnEndEffects(state: BattleState): string[] {
  const messages: string[] = [];
  
  // 両プレイヤーのアクティブモンスターに対して処理
  for (let i = 0; i < 2; i++) {
    const player = state.players[i as 0 | 1];
    const monster = getActiveMonster(player);
    
    if (monster.currentHp <= 0) continue;
    
    // 状態異常ダメージ
    messages.push(...processStatusDamage(monster, state));
    
    // まもる解除
    monster.protected = false;
  }
  
  // 天候ダメージ
  messages.push(...processWeatherDamage(state));
  
  // 天候ターン経過
  if (tickWeather(state)) {
    messages.push('天候が元に戻った！');
    addLog(state, '天候が元に戻った！', 'weather');
  }
  
  return messages;
}

/**
 * 状態異常ダメージを処理
 */
function processStatusDamage(monster: BattleMonster, state: BattleState): string[] {
  const messages: string[] = [];
  
  switch (monster.status) {
    case 'burn': {
      const damage = Math.floor(monster.maxHp / 16);
      const result = applyHpChange(monster, -damage);
      messages.push(`${monster.species.name}はやけどのダメージを受けた！`);
      addLog(state, messages[messages.length - 1], 'status');
      
      // 不死鳥（phoenix）: 1回だけHP1で復活
      if (result.fainted && monster.instance.ability === 'phoenix' && !monster.abilityDisabled) {
        monster.currentHp = 1;
        monster.abilityDisabled = true;
        messages.push(`${monster.species.name}は不死鳥の力で復活した！`);
        addLog(state, messages[messages.length - 1], 'ability');
      }
      break;
    }
    
    case 'poison': {
      const damage = Math.floor(monster.maxHp / 8);
      const result = applyHpChange(monster, -damage);
      messages.push(`${monster.species.name}は毒のダメージを受けた！`);
      addLog(state, messages[messages.length - 1], 'status');
      
      // 不死鳥（phoenix）: 1回だけHP1で復活
      if (result.fainted && monster.instance.ability === 'phoenix' && !monster.abilityDisabled) {
        monster.currentHp = 1;
        monster.abilityDisabled = true;
        messages.push(`${monster.species.name}は不死鳥の力で復活した！`);
        addLog(state, messages[messages.length - 1], 'ability');
      }
      break;
    }
    
    case 'badly_poison': {
      monster.statusTurns++;
      const damage = Math.floor(monster.maxHp * monster.statusTurns / 16);
      const result = applyHpChange(monster, -damage);
      messages.push(`${monster.species.name}は猛毒のダメージを受けた！`);
      addLog(state, messages[messages.length - 1], 'status');
      
      // 不死鳥（phoenix）: 1回だけHP1で復活
      if (result.fainted && monster.instance.ability === 'phoenix' && !monster.abilityDisabled) {
        monster.currentHp = 1;
        monster.abilityDisabled = true;
        messages.push(`${monster.species.name}は不死鳥の力で復活した！`);
        addLog(state, messages[messages.length - 1], 'ability');
      }
      break;
    }
  }
  
  return messages;
}

/**
 * 天候ダメージを処理
 */
function processWeatherDamage(state: BattleState): string[] {
  const messages: string[] = [];
  
  if (state.weather === 'sandstorm') {
    for (let i = 0; i < 2; i++) {
      const monster = getActiveMonster(state.players[i as 0 | 1]);
      if (monster.currentHp <= 0) continue;
      
      const types = monster.species.types as MonsterType[];
      // 岩、土、鋼（鋼はないので土で代用）タイプはダメージを受けない
      if (types.includes('earth')) continue;
      
      const damage = Math.floor(monster.maxHp / 16);
      const result = applyHpChange(monster, -damage);
      messages.push(`${monster.species.name}は砂嵐でダメージを受けた！`);
      
      // 不死鳥（phoenix）: 1回だけHP1で復活
      if (result.fainted && monster.instance.ability === 'phoenix' && !monster.abilityDisabled) {
        monster.currentHp = 1;
        monster.abilityDisabled = true;
        messages.push(`${monster.species.name}は不死鳥の力で復活した！`);
      }
    }
    
    if (messages.length > 0) {
      addLog(state, '砂嵐が吹き荒れている！', 'weather');
    }
  }
  
  return messages;
}

// ============================================
// 天候効果
// ============================================

/**
 * 天候を変更
 */
export function changeWeather(
  state: BattleState,
  weather: Weather,
  turns: number = 5
): string[] {
  const messages: string[] = [];
  
  if (state.weather === weather) {
    messages.push('しかし、何も起こらなかった！');
    return messages;
  }
  
  setWeather(state, weather, turns);
  
  switch (weather) {
    case 'sunny':
      messages.push('日差しが強くなった！');
      break;
    case 'rain':
      messages.push('雨が降り始めた！');
      break;
    case 'sandstorm':
      messages.push('砂嵐が吹き始めた！');
      break;
    case 'snow':
      messages.push('雪が降り始めた！');
      break;
  }
  
  addLog(state, messages[messages.length - 1], 'weather');
  return messages;
}

// ============================================
// 接触技時の特性発動
// ============================================

/**
 * 接触技を受けた時の防御側特性を処理
 */
export function processContactAbility(
  state: BattleState,
  attackerIndex: 0 | 1,
  defenderIndex: 0 | 1,
  damage: number
): string[] {
  const messages: string[] = [];
  const attacker = getActiveMonster(state.players[attackerIndex]);
  const defender = getActiveMonster(state.players[defenderIndex]);
  const defenderAbility = defender.instance.ability;
  const attackerAbility = attacker.instance.ability;
  
  // 防御側が倒れていたら発動しない
  if (defender.currentHp <= 0) return messages;
  
  // === 防御側の接触時特性 ===
  
  // 静電気: 接触技を受けると30%で麻痺
  if (defenderAbility === 'static') {
    if (Math.random() < 0.3) {
      messages.push(`${defender.species.name}のせいでんき！`);
      messages.push(...applyStatusCondition(attacker, 'paralyze'));
    }
  }
  
  // 炎の体: 接触技を受けると30%で火傷
  if (defenderAbility === 'flame_body') {
    if (Math.random() < 0.3) {
      messages.push(`${defender.species.name}のほのおのからだ！`);
      messages.push(...applyStatusCondition(attacker, 'burn'));
    }
  }
  
  // 鮫肌: 接触技で攻撃側に1/8ダメージ
  if (defenderAbility === 'rough_skin') {
    const recoilDamage = Math.max(1, Math.floor(attacker.maxHp / 8));
    const result = applyHpChange(attacker, -recoilDamage);
    messages.push(`${defender.species.name}のさめはだで${attacker.species.name}は傷ついた！`);
    addLog(state, messages[messages.length - 1], 'damage');
    
    // 不死鳥（phoenix）: 1回だけHP1で復活
    if (result.fainted && attacker.instance.ability === 'phoenix' && !attacker.abilityDisabled) {
      attacker.currentHp = 1;
      attacker.abilityDisabled = true;
      messages.push(`${attacker.species.name}は不死鳥の力で復活した！`);
      addLog(state, messages[messages.length - 1], 'ability');
    }
  }
  
  // 呪われボディ: 技を受けると30%で封印（TODO: 技封印の実装）
  // if (defenderAbility === 'cursed_body') {
  //   if (Math.random() < 0.3) {
  //     messages.push(`${defender.species.name}ののろわれボディ！`);
  //     // 技封印処理
  //   }
  // }
  
  // === 攻撃側の接触時特性 ===
  
  // 毒手: 接触技で30%毒
  if (attackerAbility === 'poison_touch') {
    if (Math.random() < 0.3) {
      messages.push(`${attacker.species.name}のどくしゅ！`);
      messages.push(...applyStatusCondition(defender, 'poison'));
    }
  }
  
  return messages;
}

/**
 * 吸収系特性を処理（攻撃を受ける前にチェック）
 * @returns nullなら通常ダメージ、数値なら吸収してその分回復
 */
export function checkAbsorbAbility(
  defender: BattleMonster,
  skillType: MonsterType
): { absorbed: boolean; healAmount?: number; message?: string } {
  const ability = defender.instance.ability;
  
  // 貯水: 水技を受けるとHP回復
  if (ability === 'water_absorb' && skillType === 'water') {
    const healAmount = Math.floor(defender.maxHp / 4);
    return {
      absorbed: true,
      healAmount,
      message: `${defender.species.name}のちょすいでHPが回復した！`,
    };
  }
  
  // 蓄電: 雷技を受けるとHP回復
  if (ability === 'volt_absorb' && skillType === 'thunder') {
    const healAmount = Math.floor(defender.maxHp / 4);
    return {
      absorbed: true,
      healAmount,
      message: `${defender.species.name}のちくでんでHPが回復した！`,
    };
  }
  
  // 避雷針: 雷技を吸収しMAG+1
  if (ability === 'lightning_rod' && skillType === 'thunder') {
    return {
      absorbed: true,
      message: `${defender.species.name}のひらいしん！とくこうが上がった！`,
    };
  }
  
  // 電気エンジン: 雷技を受けるとSPD上昇
  if (ability === 'motor_drive' && skillType === 'thunder') {
    return {
      absorbed: true,
      message: `${defender.species.name}のでんきエンジン！すばやさが上がった！`,
    };
  }
  
  // もらいび: 炎技を受けると無効化し炎技威力1.5倍（フラグ管理が必要なので簡易版）
  if (ability === 'flash_fire' && skillType === 'fire') {
    return {
      absorbed: true,
      message: `${defender.species.name}のもらいび！ほのお技が強くなった！`,
    };
  }
  
  return { absorbed: false };
}

// ============================================
// 特性効果（プレースホルダー）
// ============================================

/**
 * 登場時特性を処理
 */
export function processOnEnterAbility(
  state: BattleState,
  playerIndex: 0 | 1
): string[] {
  const messages: string[] = [];
  const monster = getActiveMonster(state.players[playerIndex]);
  const abilityId = monster.instance.ability;
  
  // TODO: 特性ごとの処理を実装
  // 例: ひでり → 天候を晴れにする
  // 例: いかく → 相手のATKを1段階下げる
  
  switch (abilityId) {
    case 'drought':
      messages.push(`${monster.species.name}のひでり！`);
      messages.push(...changeWeather(state, 'sunny'));
      break;
    case 'drizzle':
      messages.push(`${monster.species.name}のあめふらし！`);
      messages.push(...changeWeather(state, 'rain'));
      break;
    case 'sand_stream':
      messages.push(`${monster.species.name}のすなおこし！`);
      messages.push(...changeWeather(state, 'sandstorm'));
      break;
    case 'snow_warning':
      messages.push(`${monster.species.name}のゆきふらし！`);
      messages.push(...changeWeather(state, 'snow'));
      break;
    case 'intimidate':
      const opponent = state.players[1 - playerIndex as 0 | 1];
      const defender = getActiveMonster(opponent);
      messages.push(`${monster.species.name}のいかく！`);
      messages.push(...applyStatChange(defender, 'atk', -1));
      break;
  }
  
  return messages;
}
