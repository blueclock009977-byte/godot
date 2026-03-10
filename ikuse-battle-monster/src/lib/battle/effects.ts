/**
 * 効果処理モジュール（状態異常、能力変化、天候など）
 */

import {
  BattleState,
  BattlePlayer,
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
  switchMonster,
} from './state';
import { getTypeEffectiveness } from '../data/types';

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

  // マジックミラー: 相手に向けた変化技を反射
  // （ダメージ技は対象外、反射は1回の技で1度だけ通知）
  const canMagicMirrorReflect =
    skill.category === 'status' &&
    defender.instance.ability === 'magic_mirror' &&
    !defender.abilityDisabled;
  let magicMirrorTriggered = false;
  
  for (const effect of skill.effects) {
    // 確率チェック
    if (Math.random() * 100 >= effect.chance) continue;

    let target = effect.target === 'self' ? attacker : defender;
    if (canMagicMirrorReflect && effect.target !== 'self') {
      target = attacker;
      if (!magicMirrorTriggered) {
        messages.push(`${defender.species.name}のマジックミラー！`);
        messages.push(`${skill.name}を跳ね返した！`);
        magicMirrorTriggered = true;
      }
    }
    
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
        // inner_focus（精神力）: ひるまない
        if (target.instance.ability === 'inner_focus') {
          messages.push(`${target.species.name}は精神力でひるまない！`);
        } else {
          target.flinched = true;
          messages.push(`${target.species.name}はひるんだ！`);
          
          // steadfast（不屈の心）: ひるむとSPD+1
          if (target.instance.ability === 'steadfast') {
            messages.push(...applyStatChange(target, 'spd', 1));
            messages.push(`${target.species.name}は不屈の心でひるみを力に変えた！`);
          }
        }
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
          // 朝の日差し / 光合成: 天候で回復量が変動
          let healPercent = effect.amount;
          if (skill.id === 'morning_sun' || skill.id === 'synthesis') {
            if (state.weather === 'sunny') {
              healPercent = 66; // 晴れ: 2/3回復
            } else if (state.weather === 'none') {
              healPercent = 50; // 通常: 1/2回復
            } else {
              healPercent = 25; // 雨/砂嵐/雪: 1/4回復
            }
          }
          const healAmount = Math.floor(target.maxHp * healPercent / 100);
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
        // 技IDから天候タイプを決定
        const weatherMap: Record<string, Weather> = {
          sandstorm: 'sandstorm',
          sunny_day: 'sunny',
          rain_dance: 'rain',
          drizzle: 'rain',
          hail: 'snow',
        };
        const weatherType = weatherMap[skill.id];
        if (weatherType) {
          const turns = effect.turns || 5;
          messages.push(...changeWeather(state, weatherType, turns));
        }
        break;
        
      case 'protect':
        attacker.protected = true;
        messages.push(`${attacker.species.name}は身を守っている！`);
        break;

      case 'trap': {
        if (!target.trapped) {
          target.trapped = true;
          target.trappedTurns = effect.turns ?? 4;
          messages.push(`${target.species.name}は拘束された！`);
        }
        break;
      }
        
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
      
      case 'recharge':
        // 次ターン行動不可（ギガインパクト、はかいこうせん等）
        attacker.mustRecharge = true;
        messages.push(`${attacker.species.name}は攻撃の反動で動けない！`);
        break;
        
      case 'switch': {
        // とんぼがえり/ボルトチェンジ: 攻撃後に交代
        // 控えモンスターがいるか確認
        const switchOptions = player.party
          .map((m, i) => ({ monster: m, index: i }))
          .filter(({ monster, index }) => index !== player.activeIndex && monster.currentHp > 0);
        
        if (switchOptions.length > 0) {
          // 最初の生存控えに交代
          const targetIndex = switchOptions[0].index;
          const newMonster = switchMonster(player, targetIndex);
          messages.push(`${attacker.species.name}は戻っていった！`);
          messages.push(`ゆけっ！${newMonster.species.name}！`);
          
          // 設置技ダメージを適用
          messages.push(...applyEntryHazards(state, playerIndex));
          
          // 登場時特性を発動
          messages.push(...processOnEnterAbility(state, playerIndex));
        }
        break;
      }
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

  // 光の加護（light_ward）: 状態異常にかかりにくい（50%で無効化）
  if (monster.instance.ability === 'light_ward' && Math.random() < 0.5) {
    messages.push(`${monster.species.name}は光の加護で状態異常を防いだ！`);
    return messages;
  }
  
  monster.status = status;

  // ねむりは1〜3ターン継続（BATTLE_SYSTEM仕様）
  if (status === 'sleep') {
    monster.statusTurns = Math.floor(Math.random() * 3) + 1;
  } else {
    monster.statusTurns = 0;
  }

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
  // 混乱は1〜4ターン継続（BATTLE_SYSTEM仕様）
  monster.confusionTurns = Math.floor(Math.random() * 4) + 1;
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
    
    // まけんき（defiant）: 能力が下げられるとATK+2
    // ※contraryで反転した後の実際の変化を見る
    if (result.actualChange < 0 && monster.instance.ability === 'defiant') {
      messages.push(`${monster.species.name}のまけんき！`);
      const defiantResult = applyStatStageChange(monster, 'atk', 2);
      if (defiantResult.actualChange > 0) {
        messages.push(getStatChangeMessage(monster, 'atk', defiantResult.actualChange));
      }
    }
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

    // 拘束ダメージ
    messages.push(...processTrapDamage(monster, state));
    
    // === ターン終了時の特性発動 ===
    
    // 加速（speed_boost）: 毎ターン終了時にSPD+1
    if (monster.instance.ability === 'speed_boost' && monster.currentHp > 0) {
      messages.push(`${monster.species.name}のかそく！`);
      messages.push(...applyStatChange(monster, 'spd', 1));
    }
    
    // アイスボディ（ice_body）: 雪時にHP1/16回復
    if (monster.instance.ability === 'ice_body' && state.weather === 'snow' && monster.currentHp > 0) {
      const healAmount = Math.max(1, Math.floor(monster.maxHp / 16));
      applyHpChange(monster, healAmount);
      messages.push(`${monster.species.name}のアイスボディ！`);
      messages.push(`${monster.species.name}のHPが回復した！`);
      addLog(state, `${monster.species.name}のHPが回復した！`, 'heal');
    }
    
    // うるおいボディ（hydration）: 雨時に状態異常回復
    if (monster.instance.ability === 'hydration' && state.weather === 'rain' && monster.currentHp > 0) {
      if (monster.status !== 'none') {
        messages.push(`${monster.species.name}のうるおいボディ！`);
        messages.push(...cureStatus(monster));
        addLog(state, `${monster.species.name}の状態異常が治った！`, 'status');
      }
    }

    // 発光（illuminate）: 毎ターン終了時に相手の命中率-1
    if (monster.instance.ability === 'illuminate' && monster.currentHp > 0) {
      const opponent = getActiveMonster(state.players[(1 - i) as 0 | 1]);
      if (opponent.currentHp > 0) {
        messages.push(`${monster.species.name}のはっこう！`);
        messages.push(...applyStatChange(opponent, 'accuracy', -1));
      }
    }

    // 癒しの心（healer）: ターン終了時に自分のHPを5%回復
    if (monster.instance.ability === 'healer' && monster.currentHp > 0) {
      const healAmount = Math.max(1, Math.floor(monster.maxHp * 5 / 100));
      const beforeHp = monster.currentHp;
      applyHpChange(monster, healAmount);
      if (monster.currentHp > beforeHp) {
        messages.push(`${monster.species.name}のいやしのこころ！`);
        messages.push(`${monster.species.name}のHPが少し回復した！`);
        addLog(state, `${monster.species.name}のHPが少し回復した！`, 'heal');
      }
    }
    
    // まもる解除
    monster.protected = false;
    
    // あくび: 眠りになる（次ターン終了時効果）
    if (monster.yawning && monster.status === 'none') {
      monster.yawning = false;
      messages.push(...applyStatusCondition(monster, 'sleep'));
      addLog(state, `${monster.species.name}は眠りについた！`, 'status');
    } else if (monster.yawning) {
      // すでに状態異常がある場合はあくび効果を消す
      monster.yawning = false;
    }
    
    // ナイトメア: 眠り中に毎ターンHP1/4ダメージ
    if (monster.nightmared) {
      if (monster.status === 'sleep') {
        // マジックガードなら無効
        if (monster.instance.ability !== 'magic_guard') {
          const nightmareDamage = Math.max(1, Math.floor(monster.maxHp / 4));
          applyHpChange(monster, -nightmareDamage);
          messages.push(`${monster.species.name}は悪夢に苦しんでいる！`);
          addLog(state, `${monster.species.name}は悪夢で${nightmareDamage}ダメージ！`, 'damage');
        }
      } else {
        // 眠りが解けたらナイトメアも解除
        monster.nightmared = false;
      }
    }
    
    // ねがいごと: HP50%回復（次ターン終了時効果）
    if (monster.wishPending) {
      monster.wishPending = false;
      const healAmount = Math.floor(monster.maxHp * 50 / 100);
      applyHpChange(monster, healAmount);
      messages.push(`ねがいごとが叶った！`);
      messages.push(`${monster.species.name}のHPが回復した！`);
      addLog(state, `${monster.species.name}のHPが回復した！`, 'heal');
    }
    
    // ちょうはつ: ターン経過
    if (monster.tauntTurns > 0) {
      monster.tauntTurns--;
      if (monster.tauntTurns === 0) {
        messages.push(`${monster.species.name}のちょうはつが解けた！`);
        addLog(state, `${monster.species.name}のちょうはつが解けた！`, 'info');
      }
    }
    
    // アンコール: ターン経過
    if (monster.encoreTurns > 0) {
      monster.encoreTurns--;
      if (monster.encoreTurns === 0) {
        monster.encoredSkillId = undefined;
        messages.push(`${monster.species.name}のアンコールが解けた！`);
        addLog(state, `${monster.species.name}のアンコールが解けた！`, 'info');
      }
    }
    
    // 金縛り: ターン経過
    if (monster.disableTurns > 0) {
      monster.disableTurns--;
      if (monster.disableTurns === 0) {
        const oldSkillId = monster.disabledSkillId;
        monster.disabledSkillId = undefined;
        messages.push(`${monster.species.name}の金縛りが解けた！`);
        addLog(state, `${monster.species.name}の金縛りが解けた！`, 'info');
      }
    }
  }
  
  // 天候ダメージ
  messages.push(...processWeatherDamage(state));
  
  // 天候ターン経過
  if (tickWeather(state)) {
    messages.push('天候が元に戻った！');
    addLog(state, '天候が元に戻った！', 'weather');
  }
  
  // 壁技のターン経過
  for (let i = 0; i < 2; i++) {
    const player = state.players[i as 0 | 1];
    
    // リフレクター
    if (player.reflectTurns > 0) {
      player.reflectTurns--;
      if (player.reflectTurns === 0) {
        messages.push(`${player.name}のリフレクターが消えた！`);
        addLog(state, `${player.name}のリフレクターが消えた！`, 'info');
      }
    }
    
    // 光の壁
    if (player.lightScreenTurns > 0) {
      player.lightScreenTurns--;
      if (player.lightScreenTurns === 0) {
        messages.push(`${player.name}の光の壁が消えた！`);
        addLog(state, `${player.name}の光の壁が消えた！`, 'info');
      }
    }
  }
  
  return messages;
}

/**
 * 状態異常ダメージを処理
 */
function processStatusDamage(monster: BattleMonster, state: BattleState): string[] {
  const messages: string[] = [];
  
  // マジックガード: 直接攻撃以外のダメージを受けない
  if (monster.instance.ability === 'magic_guard') {
    return messages;
  }
  
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

function processTrapDamage(monster: BattleMonster, state: BattleState): string[] {
  const messages: string[] = [];

  if (!monster.trapped || monster.currentHp <= 0) {
    return messages;
  }

  // マジックガード: 直接攻撃以外のダメージを受けない
  // ただし、拘束ターンは経過する
  if (monster.instance.ability === 'magic_guard') {
    monster.trappedTurns = Math.max(0, monster.trappedTurns - 1);
    if (monster.trappedTurns === 0) {
      monster.trapped = false;
      messages.push(`${monster.species.name}は拘束から解放された！`);
      addLog(state, messages[messages.length - 1], 'status');
    }
    return messages;
  }

  const damage = Math.max(1, Math.floor(monster.maxHp / 8));
  const result = applyHpChange(monster, -damage);
  messages.push(`${monster.species.name}は拘束ダメージを受けた！`);
  addLog(state, messages[messages.length - 1], 'status');

  monster.trappedTurns = Math.max(0, monster.trappedTurns - 1);
  if (monster.trappedTurns === 0) {
    monster.trapped = false;
    messages.push(`${monster.species.name}は拘束から解放された！`);
    addLog(state, messages[messages.length - 1], 'status');
  }

  // 不死鳥（phoenix）: 1回だけHP1で復活
  if (result.fainted && monster.instance.ability === 'phoenix' && !monster.abilityDisabled) {
    monster.currentHp = 1;
    monster.abilityDisabled = true;
    messages.push(`${monster.species.name}は不死鳥の力で復活した！`);
    addLog(state, messages[messages.length - 1], 'ability');
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
      
      // マジックガード: 直接攻撃以外のダメージを受けない
      if (monster.instance.ability === 'magic_guard') continue;
      
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
 * ダメージを受けた後の防御側特性を処理
 * 雪隠れなど、特定タイプの技を受けた時に発動する特性
 */
export function processDefenderAbilityAfterHit(
  state: BattleState,
  defenderIndex: 0 | 1,
  skillType: MonsterType,
  skillId: string,
  damage: number,
  skillCategory: 'physical' | 'special' | 'status' = 'physical'
): string[] {
  const messages: string[] = [];
  const defender = getActiveMonster(state.players[defenderIndex]);
  const attacker = getActiveMonster(state.players[(1 - defenderIndex) as 0 | 1]);
  const ability = defender.instance.ability;
  
  // ダメージを受けていない場合は何もしない
  if (damage <= 0) return messages;
  
  // 防御側が倒れていたら発動しない
  if (defender.currentHp <= 0) return messages;
  
  // 雪隠れ（snow_cloak）: 氷技を受けると回避率+1段階
  if (ability === 'snow_cloak' && skillType === 'ice') {
    messages.push(`${defender.species.name}のゆきがくれ！`);
    messages.push(...applyStatChange(defender, 'evasion', 1));
  }
  
  // 砕ける鎧（weak_armor）: 物理技被弾でDEF-1、SPD+2
  if (ability === 'weak_armor' && skillCategory === 'physical') {
    messages.push(`${defender.species.name}のくだけるよろい！`);
    messages.push(...applyStatChange(defender, 'def', -1));
    messages.push(...applyStatChange(defender, 'spd', 2));
  }

  // 呪われボディ（cursed_body）: 技を受けると30%で相手の直前技を封じる（4ターン）
  if (ability === 'cursed_body' && !attacker.abilityDisabled && skillId) {
    const canDisable = attacker.lastUsedSkill === skillId;
    const alreadyDisabled = attacker.disableTurns > 0 && attacker.disabledSkillId === skillId;
    if (canDisable && !alreadyDisabled && Math.random() < 0.3) {
      attacker.disableTurns = 4;
      attacker.disabledSkillId = skillId;
      messages.push(`${defender.species.name}ののろわれボディ！`);
      messages.push(`${attacker.species.name}の${skillId}は封じられた！`);
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
    case 'intimidate': {
      const opponent = state.players[1 - playerIndex as 0 | 1];
      const defender = getActiveMonster(opponent);
      messages.push(`${monster.species.name}のいかく！`);
      messages.push(...applyStatChange(defender, 'atk', -1));
      break;
    }
    case 'web_trap': {
      const opponent = state.players[(1 - playerIndex) as 0 | 1];
      const target = getActiveMonster(opponent);
      if (target.currentHp > 0) {
        target.trapped = true;
        target.trappedTurns = Math.max(target.trappedTurns, 4);
        messages.push(`${monster.species.name}のくものす！`);
        messages.push(`${target.species.name}は4ターンの間、逃げられない！`);
      }
      break;
    }
    case 'illusion': {
      const owner = state.players[playerIndex];
      const disguiseTarget = [...owner.party]
        .map((m, index) => ({ m, index }))
        .reverse()
        .find(({ m, index }) => index !== owner.activeIndex && m.currentHp > 0);

      if (disguiseTarget) {
        monster.illusionName = disguiseTarget.m.species.name;
        monster.illusionTypes = [...disguiseTarget.m.species.types];
        messages.push(`${monster.species.name}はイリュージョンで${monster.illusionName}に化けた！`);
      } else {
        monster.illusionName = undefined;
        monster.illusionTypes = undefined;
      }
      break;
    }
  }
  
  return messages;
}

// ============================================
// 設置技（ハザード）
// ============================================

/**
 * 設置技を設置
 */
export function setHazard(
  state: BattleState,
  playerIndex: 0 | 1,
  hazardType: 'stealth_rock' | 'spikes' | 'toxic_spikes'
): string[] {
  const messages: string[] = [];
  const opponentIndex = (1 - playerIndex) as 0 | 1;
  const opponent = state.players[opponentIndex];
  
  switch (hazardType) {
    case 'stealth_rock':
      if (opponent.hazards.stealthRock) {
        messages.push('すでにステルスロックが設置されている！');
      } else {
        opponent.hazards.stealthRock = true;
        messages.push('相手のフィールドにステルスロックが設置された！');
        addLog(state, messages[messages.length - 1], 'info');
      }
      break;
      
    case 'spikes':
      if (opponent.hazards.spikesLayers >= 3) {
        messages.push('まきびしはこれ以上設置できない！');
      } else {
        opponent.hazards.spikesLayers++;
        messages.push(`相手のフィールドにまきびしが設置された！（${opponent.hazards.spikesLayers}層）`);
        addLog(state, messages[messages.length - 1], 'info');
      }
      break;
      
    case 'toxic_spikes':
      if (opponent.hazards.toxicSpikesLayers >= 2) {
        messages.push('どくびしはこれ以上設置できない！');
      } else {
        opponent.hazards.toxicSpikesLayers++;
        messages.push(`相手のフィールドにどくびしが設置された！（${opponent.hazards.toxicSpikesLayers}層）`);
        addLog(state, messages[messages.length - 1], 'info');
      }
      break;
  }
  
  return messages;
}

/**
 * 交代時に設置技ダメージを適用
 */
export function applyEntryHazards(
  state: BattleState,
  playerIndex: 0 | 1
): string[] {
  const messages: string[] = [];
  const player = state.players[playerIndex];
  const monster = getActiveMonster(player);
  const hazards = player.hazards;
  const types = monster.species.types as MonsterType[];
  
  // 飛行タイプはまきびし・どくびしを踏まない（風タイプで代用）
  const isFlying = types.includes('wind');
  // マジックガード: 直接攻撃以外のダメージを受けない
  const hasMagicGuard = monster.instance.ability === 'magic_guard';
  // 毒タイプはどくびしを吸収
  const isPoisonType = types.includes('dark'); // ゲームには毒タイプがないので闇で代用しない
  // 実際にはこのゲームに毒タイプはないので、どくびしは飛行以外全員に効く
  
  // ステルスロック: 岩タイプ相性に応じたダメージ（最大HP × 相性 / 8）
  // マジックガード持ちはダメージを受けない
  if (hazards.stealthRock && monster.currentHp > 0 && !hasMagicGuard) {
    // 岩（土で代用）タイプに対する相性を計算
    const effectiveness = getTypeEffectiveness('earth', types);
    // 等倍: 1/8、2倍: 1/4、0.5倍: 1/16、4倍: 1/2、0.25倍: 1/32
    const damageRatio = effectiveness / 8;
    const damage = Math.max(1, Math.floor(monster.maxHp * damageRatio));
    const result = applyHpChange(monster, -damage);
    messages.push(`${monster.species.name}はステルスロックでダメージを受けた！`);
    addLog(state, messages[messages.length - 1], 'damage');
    
    // 不死鳥（phoenix）: 1回だけHP1で復活
    if (result.fainted && monster.instance.ability === 'phoenix' && !monster.abilityDisabled) {
      monster.currentHp = 1;
      monster.abilityDisabled = true;
      messages.push(`${monster.species.name}は不死鳥の力で復活した！`);
      addLog(state, messages[messages.length - 1], 'ability');
    }
  }
  
  // まきびし: 層数に応じたダメージ（飛行は無効、マジックガードも無効）
  if (hazards.spikesLayers > 0 && !isFlying && monster.currentHp > 0 && !hasMagicGuard) {
    // 1層: 1/8、2層: 1/6、3層: 1/4
    let damageRatio: number;
    switch (hazards.spikesLayers) {
      case 1: damageRatio = 1 / 8; break;
      case 2: damageRatio = 1 / 6; break;
      default: damageRatio = 1 / 4; break;
    }
    const damage = Math.max(1, Math.floor(monster.maxHp * damageRatio));
    const result = applyHpChange(monster, -damage);
    messages.push(`${monster.species.name}はまきびしのダメージを受けた！`);
    addLog(state, messages[messages.length - 1], 'damage');
    
    // 不死鳥（phoenix）: 1回だけHP1で復活
    if (result.fainted && monster.instance.ability === 'phoenix' && !monster.abilityDisabled) {
      monster.currentHp = 1;
      monster.abilityDisabled = true;
      messages.push(`${monster.species.name}は不死鳥の力で復活した！`);
      addLog(state, messages[messages.length - 1], 'ability');
    }
  }
  
  // どくびし: 毒/猛毒を付与（飛行は無効、毒タイプは吸収して解除）
  // ※このゲームには毒タイプがないので、吸収は実装しない
  if (hazards.toxicSpikesLayers > 0 && !isFlying && monster.currentHp > 0) {
    if (monster.status === 'none') {
      if (hazards.toxicSpikesLayers >= 2) {
        messages.push(...applyStatusCondition(monster, 'badly_poison'));
      } else {
        messages.push(...applyStatusCondition(monster, 'poison'));
      }
    }
  }
  
  return messages;
}
