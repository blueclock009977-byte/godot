import { 
  Party, 
  DungeonType, 
  BattleResult, 
  BattleLog, 
  BattleUnit,
  Character,
  Monster,
  Stats,
  POSITION_MODIFIERS,
  Position,
  ElementType,
  SpeciesType,
  ELEMENT_ADVANTAGE,
  ELEMENT_MULTIPLIER,
} from '../types';
import { dungeons } from '../data/dungeons';
import { jobs } from '../data/jobs';
import { races } from '../data/races';
import { 
  PassiveEffects, 
  getEmptyPassiveEffects, 
  calculateCharacterBonuses,
  calculateTotalStats,
} from '../character/bonuses';
import { getDropRate, getRandomItem } from '../data/items';
// getLvBonusは遅延ロード（モジュール読み込みエラー対策）
function getLvBonusSafe(id: string): { statModifiers?: Record<string, number> } | undefined {
  try {
    const { getLvBonus } = require('../data/lvStatBonuses');
    return getLvBonus(id);
  } catch (e) {
    console.error('[engine] getLvBonus error:', e);
    return undefined;
  }
}

function getEquipmentSafe(id: string): { statModifiers?: Record<string, number>; effects?: { type: string; value: number }[] } | undefined {
  try {
    const { getEquipmentById } = require('../data/equipments');
    return getEquipmentById(id);
  } catch (e) {
    console.error('[engine] getEquipment error:', e);
    return undefined;
  }
}
import { getLvSkill } from '../data/lvSkills';
import { random, pickRandom, cloneStats, percentBonus, percentReduce, getAliveUnits, calculateActualMpCost, applyPercent, clamp } from '../utils';

// ============================================
// バフ/デバフ効果
// ============================================

interface BuffEffect {
  type: 'atkUp' | 'defUp' | 'agiUp' | 'atkDown' | 'agiDown' | 'statDown';
  value: number;
  duration: number;
  source: string;
}

// PassiveEffects は bonuses.ts からインポート


// バフ/デバフをユニットに適用
function applyBuff(unit: ExtendedBattleUnit, effect: { type: string; value?: number; duration?: number }, source: string): void {
  // 同じソースからの効果は上書き
  unit.buffs = unit.buffs.filter(b => b.source !== source);
  unit.buffs.push({
    type: effect.type as BuffEffect['type'],
    value: effect.value || 20,       // デフォルト20%
    duration: effect.duration || 3,  // デフォルト3ターン
    source,
  });
}

// バフ/デバフの効果を計算（ステータス倍率）
function getBuffMultiplier(unit: ExtendedBattleUnit, statType: 'atk' | 'def' | 'agi'): number {
  let mult = 1.0;
  for (const buff of unit.buffs) {
    if (buff.type === 'atkUp' && statType === 'atk') mult *= (1 + buff.value / 100);
    if (buff.type === 'defUp' && statType === 'def') mult *= (1 + buff.value / 100);
    if (buff.type === 'agiUp' && statType === 'agi') mult *= (1 + buff.value / 100);
    if (buff.type === 'atkDown' && statType === 'atk') mult *= (1 - buff.value / 100);
    if (buff.type === 'agiDown' && statType === 'agi') mult *= (1 - buff.value / 100);
    if (buff.type === 'statDown') mult *= (1 - buff.value / 100);  // 全ステ低下
  }
  return Math.max(0.1, mult);  // 最低10%
}

// ターン終了時にバフのdurationを減らす
function tickBuffDurations(units: ExtendedBattleUnit[], logs: string[]): void {
  for (const unit of units) {
    if (unit.stats.hp <= 0) continue;
    const expiredBuffs: string[] = [];
    unit.buffs = unit.buffs.filter(buff => {
      buff.duration--;
      if (buff.duration <= 0) {
        expiredBuffs.push(buff.source);
        return false;
      }
      return true;
    });
    if (expiredBuffs.length > 0) {
      logs.push(`${unit.name}の${expiredBuffs.join('、')}の効果が切れた`);
    }
  }
}

// getEmptyPassiveEffects は bonuses.ts からインポート

// ユニットの全パッシブ効果を集約（bonuses.tsを使用）
function collectPassiveEffects(unit: BattleUnit): PassiveEffects {
  if (!unit.isPlayer) {
    // モンスターは独自の処理
    const effects = getEmptyPassiveEffects();
    if (unit.speciesKiller) {
      for (const k of unit.speciesKiller) {
        effects.speciesKiller[k.species] = (effects.speciesKiller[k.species] || 0) + k.multiplier;
      }
    }
    if (unit.speciesResist) {
      for (const r of unit.speciesResist) {
        effects.speciesResist[r.species] = (effects.speciesResist[r.species] || 0) + r.multiplier;
      }
    }
    return effects;
  }
  
  // プレイヤーはbonuses.tsの統一関数を使用
  const bonuses = calculateCharacterBonuses({
    race: unit.race,
    job: unit.job,
    raceMastery: unit.raceMastery,
    jobMastery: unit.jobMastery,
    lv3Skill: unit.lv3Skill,
    lv5Skill: unit.lv5Skill,
    equipmentId: unit.equipmentId,
  });
  
  // rawEffectsは不要なので削除
  const { rawEffects, ...passiveEffects } = bonuses;
  return passiveEffects as PassiveEffects;
}

// ============================================
// 属性・系統計算
// ============================================

function getElementMultiplier(
  attackElement: ElementType | undefined,
  defenderElementModifier?: Partial<Record<ElementType, number>>
): number {
  // 攻撃属性がnoneまたは未設定の場合は1.0
  if (!attackElement || attackElement === 'none') {
    return 1.0;
  }
  // 防御側の属性耐性/弱点を取得
  const modifier = defenderElementModifier?.[attackElement] || 0;
  // 正の値=耐性（ダメージ減）、負の値=弱点（ダメージ増）
  // 例: 50 → 0.5倍、-50 → 1.5倍
  return 1 - modifier / 100;
}

function getSpeciesKillerMultiplier(attackerEffects: PassiveEffects, defenderSpecies?: SpeciesType): number {
  if (!defenderSpecies) return 1.0;
  const bonus = attackerEffects.speciesKiller[defenderSpecies] || 0;
  return 1 + bonus / 100;
}

function getSpeciesResistMultiplier(defenderEffects: PassiveEffects, attackerSpecies?: SpeciesType): number {
  if (!attackerSpecies) return 1.0;
  const resist = defenderEffects.speciesResist[attackerSpecies] || 0;
  return 1 - resist / 100;
}

/**
 * 物理・魔法共通のダメージ係数を適用
 * damageBonus, lowHpBonus, allyCountBonus, 系統特攻/耐性, damageReduction, 劣化
 */
function applyDamageModifiers(
  damage: number,
  attacker: ExtendedBattleUnit,
  defender: ExtendedBattleUnit,
  allyCount: number
): number {
  const atkEffects = attacker.passiveEffects;
  const defEffects = defender.passiveEffects;

  // damageBonus
  damage *= percentBonus(atkEffects.damageBonus);
  
  // lowHpBonus (HP30%以下で発動)
  if (atkEffects.lowHpBonus > 0 && attacker.stats.hp / attacker.stats.maxHp <= 0.3) {
    damage *= percentBonus(atkEffects.lowHpBonus);
  }
  
  // lowHpDamageBonus (指定閾値以下で発動、デーモンLv5等)
  if (atkEffects.lowHpDamageBonus > 0 && atkEffects.lowHpThreshold > 0) {
    const hpPercent = attacker.stats.hp / attacker.stats.maxHp * 100;
    if (hpPercent <= atkEffects.lowHpThreshold) {
      damage *= percentBonus(atkEffects.lowHpDamageBonus);
    }
  }
  
  // allyCountBonus
  if (atkEffects.allyCountBonus > 0) {
    damage *= percentBonus(atkEffects.allyCountBonus * (allyCount - 1));
  }
  
  // 系統特攻
  damage *= getSpeciesKillerMultiplier(atkEffects, defender.species);
  
  // 系統耐性
  const attackerSpecies: SpeciesType = attacker.species || 'humanoid';
  damage *= getSpeciesResistMultiplier(defEffects, attackerSpecies);
  
  // damageReduction
  damage *= percentReduce(defEffects.damageReduction);
  
  // lowHpDefense: HP低下時被ダメ軽減
  if (defEffects.lowHpDefense > 0 && defEffects.lowHpDefenseThreshold > 0) {
    const hpPercent = defender.stats.hp / defender.stats.maxHp * 100;
    if (hpPercent <= defEffects.lowHpDefenseThreshold) {
      damage *= percentReduce(defEffects.lowHpDefense);
    }
  }
  
  // 劣化による被ダメ増加
  damage *= percentBonus(defender.degradation);

  return damage;
}

// ============================================
// ユニット変換
// ============================================

interface ExtendedBattleUnit extends BattleUnit {
  passiveEffects: PassiveEffects;
  buffs: BuffEffect[];  // 現在かかっているバフ/デバフ
  attackStackCount: number;
  autoReviveUsed: boolean;
  reviveUsed: boolean;
  surviveLethalUsed: boolean;  // 致死HP1耐え使用済み
  raceMastery?: boolean;
  jobMastery?: boolean;
  degradation: number;  // 劣化%（被ダメ増加）
  // v0.8.70追加: 条件付き効果用フラグ
  nextCritGuaranteed: boolean;  // 次の攻撃クリ確定
  firstAttackDone: boolean;     // 最初の攻撃済み
  wasFirstStrike: boolean;      // 先制成功フラグ
}

function characterToUnit(char: Character, position: 'front' | 'back'): ExtendedBattleUnit {
  const jobSkills = char.job ? jobs[char.job].skills : [];
  const raceData = char.race ? races[char.race] : null;
  const raceSkills = raceData?.skills ?? [];
  const allSkills = [...jobSkills, ...raceSkills];
  
  const jobData = char.job ? jobs[char.job] : null;
  if (char.raceMastery && raceData?.masterySkill?.type === 'active' && raceData.masterySkill.skill) {
    allSkills.push(raceData.masterySkill.skill);
  }
  if (char.jobMastery && jobData?.masterySkill?.type === 'active' && jobData.masterySkill.skill) {
    allSkills.push(jobData.masterySkill.skill);
  }
  
  // bonuses.tsで総合ステータスを計算（Single Source of Truth）
  const totalStats = calculateTotalStats(char);
  
  const unit: ExtendedBattleUnit = {
    id: char.id,
    name: char.name,
    isPlayer: true,
    stats: {
      hp: totalStats.maxHp,  // バトル開始時はHP満タン
      maxHp: totalStats.maxHp,
      mp: totalStats.maxMp,  // バトル開始時はMP満タン
      maxMp: totalStats.maxMp,
      atk: totalStats.atk,
      def: totalStats.def,
      agi: totalStats.agi,
      mag: totalStats.mag,
    },
    position,
    race: char.race,
    job: char.job,
    trait: char.trait,
    skills: allSkills,
    raceMastery: char.raceMastery,
    jobMastery: char.jobMastery,
    lv3Skill: char.lv3Skill,
    lv5Skill: char.lv5Skill,
    equipmentId: char.equipmentId,
    passiveEffects: getEmptyPassiveEffects(),
    buffs: [],
    attackStackCount: 0,
    autoReviveUsed: false,
    reviveUsed: false,
    surviveLethalUsed: false,
    degradation: 0,
    nextCritGuaranteed: false,
    firstAttackDone: false,
    wasFirstStrike: false,
  };
  unit.passiveEffects = collectPassiveEffects(unit);
  
  // allStats適用
  if (unit.passiveEffects.allStats > 0) {
    const mult = 1 + unit.passiveEffects.allStats / 100;
    unit.stats.maxHp = Math.floor(unit.stats.maxHp * mult);
    unit.stats.hp = unit.stats.maxHp;
    unit.stats.maxMp = Math.floor(unit.stats.maxMp * mult);
    unit.stats.mp = unit.stats.maxMp;
    unit.stats.atk = Math.floor(unit.stats.atk * mult);
    unit.stats.def = Math.floor(unit.stats.def * mult);
    unit.stats.agi = Math.floor(unit.stats.agi * mult);
    unit.stats.mag = Math.floor(unit.stats.mag * mult);
  }
  
  return unit;
}

function monsterToUnit(monster: Monster): ExtendedBattleUnit {
  const unit: ExtendedBattleUnit = {
    id: monster.id + '_' + Math.random().toString(36).slice(2),
    name: monster.name,
    isPlayer: false,
    stats: cloneStats(monster.stats),
    position: 'front',
    skills: monster.skills,
    species: monster.species,
    element: monster.element || 'none',
    elementModifier: monster.elementModifier,
    physicalResist: monster.physicalResist,
    magicResist: monster.magicResist,
    speciesKiller: monster.speciesKiller,
    speciesResist: monster.speciesResist,
    passiveEffects: getEmptyPassiveEffects(),
    buffs: [],
    attackStackCount: 0,
    autoReviveUsed: false,
    reviveUsed: false,
    surviveLethalUsed: false,
    degradation: 0,
    nextCritGuaranteed: false,
    firstAttackDone: false,
    wasFirstStrike: false,
  };
  unit.passiveEffects = collectPassiveEffects(unit);
  
  return unit;
}

// ============================================
// 命中/回避判定
// ============================================

function checkHit(attacker: ExtendedBattleUnit, defender: ExtendedBattleUnit): { hit: boolean; perfectEvade: boolean } {
  const atkEffects = attacker.passiveEffects;
  const defEffects = defender.passiveEffects;
  
  // 完全回避判定
  if (defEffects.perfectEvasion > 0 && Math.random() * 100 < defEffects.perfectEvasion) {
    // critAfterEvade: 回避成功→次クリ確定
    if (defEffects.critAfterEvade > 0) {
      defender.nextCritGuaranteed = true;
    }
    return { hit: false, perfectEvade: true };
  }
  
  // 基本命中率 90% + (攻撃者AGI - 防御者AGI) * 1%
  let hitRate = 90 + (attacker.stats.agi - defender.stats.agi);
  
  // パッシブ補正
  hitRate += atkEffects.accuracyBonus;
  hitRate -= defEffects.evasionBonus;
  
  // 後衛時回避ボーナス
  if (defender.position === 'back') {
    hitRate -= 10; // 基本の後衛回避
    hitRate -= defEffects.backlineEvasion; // 追加の後衛回避ボーナス
  }
  
  // 範囲制限（30%〜99%）
  hitRate = clamp(hitRate, 30, 99);
  
  const hit = Math.random() * 100 < hitRate;
  
  // 回避成功時のcritAfterEvade処理
  if (!hit && defEffects.critAfterEvade > 0) {
    defender.nextCritGuaranteed = true;
  }
  
  return { hit, perfectEvade: false };
}

// ============================================
// 連続攻撃回数（HIT数）
// ============================================

function getHitCount(attacker: ExtendedBattleUnit): number {
  const effects = attacker.passiveEffects;
  
  // fixedHits: ヒット数固定（AGI無視）
  if (effects.fixedHits > 0) {
    return effects.fixedHits + effects.bonusHits;
  }
  
  // AGI依存: 1 + floor(AGI/5)、上限なし
  // AGI 5: 2ヒット、AGI 15: 4ヒット、AGI 25: 6ヒット
  const agi = attacker.stats.agi;
  let hits = Math.max(1, 1 + Math.floor(agi / 5));
  
  // bonusHits: 追加ヒット
  hits += effects.bonusHits;
  
  // lowHpBonusHits: HP低下時追加攻撃
  if (effects.lowHpBonusHits > 0 && effects.lowHpHitsThreshold > 0) {
    const hpPercent = attacker.stats.hp / attacker.stats.maxHp * 100;
    if (hpPercent <= effects.lowHpHitsThreshold) {
      hits += effects.lowHpBonusHits;
    }
  }
  
  return Math.max(1, hits);
}

// ============================================
// ダメージ計算
// ============================================

interface DamageResult {
  damage: number;
  isCritical: boolean;
  hitCount: number;      // 最大ヒット数
  actualHits: number;    // 実際に当たったヒット数
  degradationAdded: number;  // 付与した劣化%
}

// 連撃減衰定数
const MULTI_HIT_DECAY = 0.8;  // 各ヒットで80%に減衰
const DEGRADATION_PER_HIT = 2;  // 1ヒットで劣化+2%（上限なし）

function calculatePhysicalDamage(
  attacker: ExtendedBattleUnit, 
  defender: ExtendedBattleUnit,
  allyCount: number
): DamageResult {
  const atkEffects = attacker.passiveEffects;
  const defEffects = defender.passiveEffects;
  
  // バフ/デバフ補正
  const atkMult = getBuffMultiplier(attacker, 'atk');
  const defMult = getBuffMultiplier(defender, 'def');
  const atkAgiMult = getBuffMultiplier(attacker, 'agi');
  const defAgiMult = getBuffMultiplier(defender, 'agi');
  
  const hitCount = getHitCount(attacker);
  let totalDamage = 0;
  let isCritical = false;
  let actualHits = 0;
  let degradationAdded = 0;
  
  // 基本命中率を計算
  let baseHitRate = 90 + (attacker.stats.agi * atkAgiMult - defender.stats.agi * defAgiMult);
  baseHitRate += atkEffects.accuracyBonus;
  baseHitRate -= defEffects.evasionBonus;
  if (defender.position === 'back') baseHitRate -= 10;
  // 上限は撤廃（100%超えを許可）、下限のみ30%
  baseHitRate = Math.max(30, baseHitRate);
  
  // 単発ボーナス（ヒット数1の時のみ）
  const singleHitBonus = hitCount === 1 ? atkEffects.singleHitBonus : 0;
  
  // 減衰緩和（decayReduction%分、減衰を弱める）
  // 例: 減衰80%でdecayReduction=10なら、80 + (100-80)*10/100 = 82%
  const actualDecay = MULTI_HIT_DECAY + (1 - MULTI_HIT_DECAY) * (atkEffects.decayReduction / 100);
  
  for (let i = 0; i < hitCount; i++) {
    // noDecayHits: 最初のN回は減衰なし
    let decayFactor: number;
    if (i < atkEffects.noDecayHits) {
      decayFactor = 1.0;
    } else {
      const decayHits = i - atkEffects.noDecayHits;
      decayFactor = Math.pow(actualDecay, decayHits);
    }
    
    // 命中判定（減衰適用、100%でキャップ）
    const hitRate = Math.min(100, baseHitRate * decayFactor);
    if (Math.random() * 100 >= hitRate) {
      continue; // ミス
    }
    
    // 完全回避判定
    if (defEffects.perfectEvasion > 0 && Math.random() * 100 < defEffects.perfectEvasion) {
      continue; // 完全回避
    }
    
    actualHits++;
    
    const randA = random(0.85, 1.15);
    const randB = random(0.85, 1.15);
    
    // バランス調整: ATK*0.8 - DEF*0.5 (物理火力を約20%ナーフ)
    let damage = (attacker.stats.atk * atkMult * 0.8 * randA) - (defender.stats.def * defMult * randB * 0.5);
    
    // 連撃減衰（威力）
    damage *= decayFactor;
    
    // attackStack累積
    const stackBonus = 1 + (atkEffects.attackStack * attacker.attackStackCount) / 100;
    damage *= stackBonus;
    
    // physicalBonus
    damage *= percentBonus(atkEffects.physicalBonus);
    
    // HP満タン時ATKボーナス
    if (atkEffects.fullHpAtkBonus > 0 && attacker.stats.hp >= attacker.stats.maxHp) {
      damage *= percentBonus(atkEffects.fullHpAtkBonus);
    }
    
    // 隊列補正
    const attackerMod = POSITION_MODIFIERS[attacker.position as Position]?.damage || 1.0;
    const defenderMod = POSITION_MODIFIERS[defender.position as Position]?.defense || 1.0;
    damage = damage * attackerMod / defenderMod;
    
    // 物理耐性（モンスター + プレイヤーパッシブ）
    const totalPhysResist = (defender.physicalResist || 0) + defEffects.physicalResist;
    if (totalPhysResist !== 0) {
      damage *= percentReduce(totalPhysResist);
    }

    // 共通ダメージ係数（damageBonus, lowHpBonus, allyCountBonus, 系統特攻/耐性, damageReduction, 劣化）
    damage = applyDamageModifiers(damage, attacker, defender, allyCount);
    
    // クリティカル判定
    let critRate = 10 + atkEffects.critBonus;
    if (attacker.trait === 'lucky') critRate += 20;
    
    // 条件付きクリ確定
    let guaranteedCrit = false;
    // firstHitCrit: 最初の攻撃確定クリ
    if (atkEffects.firstHitCrit > 0 && !(attacker as ExtendedBattleUnit).firstAttackDone) {
      guaranteedCrit = true;
    }
    // critOnFirstStrike: 先制成功→クリ確定
    if (atkEffects.critOnFirstStrike > 0 && (attacker as ExtendedBattleUnit).wasFirstStrike) {
      guaranteedCrit = true;
    }
    // critAfterEvade: 回避成功→次クリ確定（フラグがONの場合）
    if ((attacker as ExtendedBattleUnit).nextCritGuaranteed) {
      guaranteedCrit = true;
      (attacker as ExtendedBattleUnit).nextCritGuaranteed = false; // 使用後リセット
    }
    
    if (guaranteedCrit || Math.random() * 100 < critRate) {
      isCritical = true;
      const critMult = 1.5 + atkEffects.critDamage / 100;
      damage *= critMult;
      // critFollowUp（クリティカル時追撃ダメージ）
      if (atkEffects.critFollowUp > 0) {
        const followUpDamage = Math.floor(damage * atkEffects.critFollowUp / 100);
        damage += followUpDamage;
      }
    }
    
    // 個性補正
    if (attacker.trait === 'brave') damage *= 1.05;
    if (defender.trait === 'cautious') damage *= 0.85;
    
    // 単発ボーナス（ヒット数1の時のみ）
    if (singleHitBonus > 0) {
      damage *= percentBonus(singleHitBonus);
    }
    
    totalDamage += Math.max(1, Math.floor(damage));
    
    // 劣化蓄積（ヒットごと）
    // degradationBonus: 与える劣化を増加
    // degradationResist: 受ける劣化を軽減
    let addedDeg = DEGRADATION_PER_HIT + atkEffects.degradationBonus;
    addedDeg *= percentReduce(defEffects.degradationResist);
    addedDeg = Math.max(0, addedDeg);
    defender.degradation += addedDeg;
    degradationAdded += addedDeg;
  }
  
  return { damage: totalDamage, isCritical, hitCount, actualHits, degradationAdded };
}

function calculateMagicDamage(
  attacker: ExtendedBattleUnit, 
  defender: ExtendedBattleUnit, 
  multiplier: number, 
  skillElement?: ElementType,
  allyCount: number = 1
): number {
  const atkEffects = attacker.passiveEffects;
  const defEffects = defender.passiveEffects;
  
  // バフ/デバフ補正（魔法はATKバフで魔力も上がる扱い）
  const atkMult = getBuffMultiplier(attacker, 'atk');
  
  const rand = random(0.9, 1.1);
  let damage = attacker.stats.mag * atkMult * multiplier * rand;
  
  // magicBonus
  damage *= percentBonus(atkEffects.magicBonus);
  
  // 属性相性
  damage *= getElementMultiplier(skillElement, defender.elementModifier);
  
  // 魔法耐性（モンスター + プレイヤーパッシブ）
  const totalMagResist = (defender.magicResist || 0) + defEffects.magicResist;
  if (totalMagResist !== 0) {
    damage *= percentReduce(totalMagResist);
  }
  
  // 共通ダメージ係数（damageBonus, lowHpBonus, allyCountBonus, 系統特攻/耐性, damageReduction, 劣化）
  damage = applyDamageModifiers(damage, attacker, defender, allyCount);
  
  // 魔法は単発なので劣化1回分蓄積
  let addedDeg = DEGRADATION_PER_HIT + atkEffects.degradationBonus;
  addedDeg *= percentReduce(defEffects.degradationResist);
  defender.degradation += Math.max(0, addedDeg);
  
  return Math.max(1, Math.floor(damage));
}

// ハイブリッドダメージ（ATK+MAG両方参照）
function calculateHybridDamage(
  attacker: ExtendedBattleUnit, 
  defender: ExtendedBattleUnit, 
  multiplier: number,
  skillElement?: ElementType,
  allyCount: number = 1
): number {
  const atkEffects = attacker.passiveEffects;
  const defEffects = defender.passiveEffects;
  
  // ATKとMAGの平均をベースに
  const hybridStat = (attacker.stats.atk + attacker.stats.mag) / 2;
  
  const atkMult = getBuffMultiplier(attacker, 'atk');
  const rand = random(0.9, 1.1);
  let damage = hybridStat * atkMult * multiplier * rand;
  
  // physicalBonusとmagicBonusの平均を適用
  const avgBonus = (atkEffects.physicalBonus + atkEffects.magicBonus) / 2;
  damage *= percentBonus(avgBonus);
  
  // 属性相性
  damage *= getElementMultiplier(skillElement, defender.elementModifier);
  
  // 防御（物理と魔法の平均耐性）
  const physResist = defEffects.physicalResist;
  const magResist = (defender.magicResist || 0) + defEffects.magicResist;
  const avgResist = (physResist + magResist) / 2;
  if (avgResist !== 0) {
    damage *= percentReduce(avgResist);
  }
  
  // 共通ダメージ係数
  damage = applyDamageModifiers(damage, attacker, defender, allyCount);
  
  // 劣化1回分蓄積
  let addedDeg = DEGRADATION_PER_HIT + atkEffects.degradationBonus;
  addedDeg *= percentReduce(defEffects.degradationResist);
  defender.degradation += Math.max(0, addedDeg);
  
  return Math.max(1, Math.floor(damage));
}

function calculateHeal(healer: ExtendedBattleUnit, target: ExtendedBattleUnit, multiplier: number): number {
  const healerEffects = healer.passiveEffects;
  const targetEffects = target.passiveEffects;
  
  const rand = random(0.9, 1.1);
  let heal = healer.stats.mag * multiplier * rand;
  
  // healBonus (回復する側)
  heal *= percentBonus(healerEffects.healBonus);
  
  // healReceived (回復される側)
  heal *= percentBonus(targetEffects.healReceived);
  
  return Math.max(1, Math.floor(heal));
}

// ============================================
// 庇う（cover）判定
// ============================================

function checkCover(allies: ExtendedBattleUnit[], target: ExtendedBattleUnit): ExtendedBattleUnit | null {
  for (const ally of allies) {
    if (ally.id === target.id || ally.stats.hp <= 0) continue;
    if (ally.passiveEffects.cover > 0 && Math.random() * 100 < ally.passiveEffects.cover) {
      return ally;
    }
  }
  return null;
}

// ============================================
// 行動決定
// ============================================

function decideAction(
  unit: ExtendedBattleUnit, 
  allies: ExtendedBattleUnit[], 
  enemies: ExtendedBattleUnit[]
): { type: 'attack' | 'skill'; skillIndex?: number; target: ExtendedBattleUnit | ExtendedBattleUnit[] } {
  const aliveEnemies = getAliveUnits(enemies);
  const aliveAllies = getAliveUnits(allies);
  
  if (aliveEnemies.length === 0) {
    return { type: 'attack', target: enemies[0] };
  }
  
  if (unit.skills && unit.skills.length > 0) {
    const mpReduction = unit.passiveEffects.mpReduction;
    const usableSkills = unit.skills
      .map((skill, index) => ({ skill, index }))
      .filter(({ skill }) => {
        const actualCost = calculateActualMpCost(skill.mpCost, mpReduction);
        return unit.stats.mp >= actualCost;
      });
    
    if (usableSkills.length > 0) {
      // 回復スキル優先
      const healSkills = usableSkills.filter(({ skill }) => skill.type === 'heal');
      if (healSkills.length > 0) {
        const lowHpAlly = aliveAllies.find(a => (a.stats.hp / a.stats.maxHp) < 0.5);
        if (lowHpAlly) {
          const { skill, index } = healSkills[0];
          const target = skill.target === 'allAllies' ? aliveAllies : lowHpAlly;
          return { type: 'skill', skillIndex: index, target };
        }
      }
      
      // バフスキル（30%の確率で使用、まだバフがかかってなければ）
      const buffSkills = usableSkills.filter(({ skill }) => skill.type === 'buff');
      if (buffSkills.length > 0 && Math.random() < 0.3) {
        const hasBuffAlready = unit.buffs.some(b => b.type === 'atkUp' || b.type === 'defUp' || b.type === 'agiUp');
        if (!hasBuffAlready) {
          const { skill, index } = pickRandom(buffSkills);
          let target: ExtendedBattleUnit | ExtendedBattleUnit[];
          if (skill.target === 'self') target = unit;
          else if (skill.target === 'allAllies') target = aliveAllies;
          else target = pickRandom(aliveAllies);
          return { type: 'skill', skillIndex: index, target };
        }
      }
      
      // デバフスキル（25%の確率で使用）
      const debuffSkills = usableSkills.filter(({ skill }) => skill.type === 'debuff');
      if (debuffSkills.length > 0 && Math.random() < 0.25) {
        const { skill, index } = pickRandom(debuffSkills);
        const target = skill.target === 'all' ? aliveEnemies : pickRandom(aliveEnemies);
        return { type: 'skill', skillIndex: index, target };
      }
      
      if (Math.random() < 0.6) {
        const attackSkills = usableSkills.filter(({ skill }) => 
          skill.type === 'attack' || skill.type === 'magic' || skill.type === 'hybrid'
        );
        
        if (attackSkills.length > 0) {
          const { skill, index } = pickRandom(attackSkills);
          const target = skill.target === 'all' ? aliveEnemies : pickRandom(aliveEnemies);
          return { type: 'skill', skillIndex: index, target };
        }
      }
    }
  }
  
  return { type: 'attack', target: pickRandom(aliveEnemies) };
}

// ============================================
// 1ターンの処理
// ============================================

function formatUnitStatus(unit: ExtendedBattleUnit): string {
  const hpPercent = Math.floor((unit.stats.hp / unit.stats.maxHp) * 100);
  const hpIcon = hpPercent > 50 ? '🟢' : hpPercent > 25 ? '🟡' : '🔴';
  return `${unit.name}: HP${unit.stats.hp}/${unit.stats.maxHp}${hpIcon} MP${unit.stats.mp}/${unit.stats.maxMp}`;
}

function processTurn(
  playerUnits: ExtendedBattleUnit[],
  enemyUnits: ExtendedBattleUnit[],
  turnNum: number
): { logs: string[]; playerWin: boolean | null } {
  const logs: string[] = [];
  
  // 全ユニットをAGI+firstStrikeBonus順にソート
  const allUnits = getAliveUnits([...playerUnits, ...enemyUnits])
    .sort((a, b) => {
      const aSpeed = a.stats.agi + a.passiveEffects.firstStrikeBonus + random(0, 10);
      const bSpeed = b.stats.agi + b.passiveEffects.firstStrikeBonus + random(0, 10);
      return bSpeed - aSpeed;
    });
  
  // ターン1で先制成功フラグをセット（最初に行動するユニット）
  if (turnNum === 1 && allUnits.length > 0) {
    allUnits[0].wasFirstStrike = true;
  }
  
  logs.push(`--- ターン ${turnNum} ---`);
  
  // ターン開始時HP/MP表示
  const alivePlayers = getAliveUnits(playerUnits);
  const aliveEnemies = getAliveUnits(enemyUnits);
  
  logs.push(`【味方】`);
  alivePlayers.forEach(u => logs.push(`  ${formatUnitStatus(u)}`));
  logs.push(`【敵】`);
  aliveEnemies.forEach(u => logs.push(`  ${formatUnitStatus(u)}`));
  
  // ターン開始時: hpRegen / mpRegen
  for (const unit of allUnits) {
    const effects = unit.passiveEffects;
    if (effects.hpRegen > 0 && unit.stats.hp > 0) {
      const regen = effects.hpRegen;
      unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + regen);
      logs.push(`${unit.name}はHP${regen}回復（リジェネ）`);
    }
    if (effects.mpRegen > 0 && unit.stats.hp > 0) {
      const regen = effects.mpRegen;
      unit.stats.mp = Math.min(unit.stats.maxMp, unit.stats.mp + regen);
    }
  }
  
  // allyHpRegen（味方全員の毎ターンHP回復）
  const totalAllyHpRegen = playerUnits.reduce((sum, u) => sum + (u.stats.hp > 0 ? u.passiveEffects.allyHpRegen : 0), 0);
  if (totalAllyHpRegen > 0) {
    for (const unit of playerUnits) {
      if (unit.stats.hp > 0) {
        unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + totalAllyHpRegen);
        logs.push(`${unit.name}は祝福によりHP${totalAllyHpRegen}回復`);
      }
    }
  }
  
  for (const unit of allUnits) {
    if (unit.stats.hp <= 0) continue;
    
    const allies = unit.isPlayer ? playerUnits : enemyUnits;
    const enemies = unit.isPlayer ? enemyUnits : playerUnits;
    const aliveEnemiesNow = getAliveUnits(enemies);
    const aliveAlliesNow = getAliveUnits(allies);
    
    if (aliveEnemiesNow.length === 0) break;
    
    const action = decideAction(unit, allies, enemies);
    
    if (action.type === 'attack') {
      let target = action.target as ExtendedBattleUnit;
      
      // 庇う判定
      const cover = checkCover(getAliveUnits(enemies) as ExtendedBattleUnit[], target);
      if (cover) {
        logs.push(`${cover.name}が${target.name}を庇った！`);
        target = cover;
      }
      
      // ダメージ計算（命中判定は内部で行う）
      const { damage, isCritical, hitCount, actualHits, degradationAdded } = calculatePhysicalDamage(unit, target, aliveAlliesNow.length);
      unit.attackStackCount++;
      
      if (actualHits === 0) {
        // 全弾ミス
        logs.push(`${unit.name}の攻撃！ ${target.name}に外れた！MISS!`);
        continue;
      }
      
      target.stats.hp = Math.max(0, target.stats.hp - damage);
      
      const critText = isCritical ? '【会心】' : '';
      const hitText = actualHits > 1 ? `${actualHits}HIT! ` : (hitCount > 1 ? `${actualHits}/${hitCount}HIT ` : '');
      const degText = degradationAdded > 0 ? ` [劣化+${degradationAdded}%]` : '';
      logs.push(`${unit.name}の攻撃！ ${hitText}${target.name}に${damage}ダメージ！${critText}${degText}`);
      
      // allyHitHeal（味方被弾時にパーティ全体から回復）
      if (target.isPlayer && target.stats.hp > 0) {
        const totalHeal = playerUnits.reduce((sum, u) => sum + (u.stats.hp > 0 ? u.passiveEffects.allyHitHeal : 0), 0);
        if (totalHeal > 0) {
          target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + totalHeal);
          logs.push(`聖なる加護が${target.name}をHP${totalHeal}回復！`);
        }
      }
      
      // HP吸収
      if (unit.passiveEffects.hpSteal > 0) {
        const steal = applyPercent(damage, unit.passiveEffects.hpSteal);
        unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + steal);
        if (steal > 0) logs.push(`${unit.name}はHP${steal}吸収！`);
      }
      
      // 反撃判定
      if (target.stats.hp > 0 && target.passiveEffects.counterRate > 0) {
        if (Math.random() * 100 < target.passiveEffects.counterRate) {
          const counterResult = calculatePhysicalDamage(target, unit, getAliveUnits(enemies).length);
          if (counterResult.actualHits > 0) {
            // 反撃ダメージボーナス
            let counterDamage = counterResult.damage;
            if (target.passiveEffects.counterDamageBonus > 0) {
              counterDamage = Math.floor(counterDamage * (1 + target.passiveEffects.counterDamageBonus / 100));
            }
            unit.stats.hp = Math.max(0, unit.stats.hp - counterDamage);
            logs.push(`${target.name}の反撃！ ${unit.name}に${counterDamage}ダメージ！`);
          }
        }
      }
      
      // 死亡判定と蘇生
      if (target.stats.hp <= 0) {
        // surviveLethal（致死をHP1で耐える）
        if (target.passiveEffects.surviveLethal > 0 && !(target as ExtendedBattleUnit).surviveLethalUsed) {
          target.stats.hp = 1;
          (target as ExtendedBattleUnit).surviveLethalUsed = true;
          logs.push(`${target.name}は不屈の精神でHP1で耐えた！`);
        } else if (target.passiveEffects.deathResist > 0 && Math.random() * 100 < target.passiveEffects.deathResist) {
          target.stats.hp = 1;
          logs.push(`${target.name}は死に抗いHP1で耐えた！`);
        } else {
          logs.push(`${target.name}を倒した！`);
          // mpOnKill（敵を倒すとMP回復）
          if (unit.passiveEffects.mpOnKill > 0) {
            unit.stats.mp = Math.min(unit.stats.maxMp, unit.stats.mp + unit.passiveEffects.mpOnKill);
            logs.push(`${unit.name}は魂を吸収しMP${unit.passiveEffects.mpOnKill}回復！`);
          }
          // hpOnKill（敵を倒すとHP回復）
          if (unit.passiveEffects.hpOnKill > 0) {
            unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + unit.passiveEffects.hpOnKill);
            logs.push(`${unit.name}は命を吸収しHP${unit.passiveEffects.hpOnKill}回復！`);
          }
          // atkStackOnKill（敵を倒すとATK累積上昇）
          if (unit.passiveEffects.atkStackOnKill > 0) {
            const atkGain = Math.floor(unit.stats.atk * unit.passiveEffects.atkStackOnKill / 100);
            unit.stats.atk += atkGain;
            logs.push(`${unit.name}の殺意が高まりATK+${atkGain}！`);
          }
          // revive（自己蘇生）
          if (target.passiveEffects.revive > 0 && !target.reviveUsed) {
            target.stats.hp = applyPercent(target.stats.maxHp, target.passiveEffects.revive);
            target.reviveUsed = true;
            logs.push(`${target.name}は不死の力で蘇った！`);
          }
        }
      }
      
      // physicalFollowUp（味方物理攻撃後に追撃）
      if (unit.isPlayer && target.stats.hp > 0) {
        for (const ally of playerUnits) {
          if (ally.id !== unit.id && ally.stats.hp > 0 && ally.passiveEffects.physicalFollowUp > 0) {
            if (Math.random() * 100 < ally.passiveEffects.physicalFollowUp) {
              const followUpDamage = Math.floor(ally.stats.atk * 0.5);
              target.stats.hp = Math.max(0, target.stats.hp - followUpDamage);
              logs.push(`${ally.name}が連携追撃！${target.name}に${followUpDamage}ダメージ！`);
              if (target.stats.hp <= 0) {
                logs.push(`${target.name}を倒した！`);
                break;
              }
            }
          }
        }
      }
      
    } else if (action.type === 'skill' && unit.skills && action.skillIndex !== undefined) {
      const skill = unit.skills[action.skillIndex];
      const mpReduction = unit.passiveEffects.mpReduction;
      const actualCost = calculateActualMpCost(skill.mpCost, mpReduction);
      unit.stats.mp = Math.max(0, unit.stats.mp - actualCost);
      
      // doublecast判定
      const castCount = (skill.type === 'magic' && skill.target === 'all' && unit.passiveEffects.doublecast > 0) ? 2 : 1;
      
      for (let cast = 0; cast < castCount; cast++) {
        if (skill.type === 'attack' || skill.type === 'magic' || skill.type === 'hybrid') {
          const targets = Array.isArray(action.target) ? action.target : [action.target];
          const isMagic = skill.type === 'magic';
          const isHybrid = skill.type === 'hybrid';
          
          for (const t of targets) {
            let target = t as ExtendedBattleUnit;
            if (target.stats.hp <= 0) continue;
            
            let damage: number;
            let actualHits = 1;
            if (isMagic) {
              damage = calculateMagicDamage(unit, target, skill.multiplier, skill.element, aliveAlliesNow.length);
            } else if (isHybrid) {
              // ハイブリッドスキル: ATK+MAG両方参照
              damage = calculateHybridDamage(unit, target, skill.multiplier, skill.element, aliveAlliesNow.length);
            } else {
              // 物理スキル: 命中判定は内部で行う
              const result = calculatePhysicalDamage(unit, target, aliveAlliesNow.length);
              if (result.actualHits === 0) {
                logs.push(`${unit.name}の${skill.name}！ ${target.name}に外れた！MISS!`);
                continue;
              }
              damage = Math.floor(result.damage * skill.multiplier);
              actualHits = result.actualHits;
            }
            target.stats.hp = Math.max(0, target.stats.hp - damage);
            
            const mpText = cast === 0 ? `(MP-${actualCost})` : '';
            logs.push(`${unit.name}の${skill.name}！ ${target.name}に${damage}ダメージ！${mpText}`);
            
            // allyHitHeal（味方被弾時回復）
            if (target.isPlayer && target.stats.hp > 0) {
              const totalHeal = playerUnits.reduce((sum, u) => sum + (u.stats.hp > 0 ? u.passiveEffects.allyHitHeal : 0), 0);
              if (totalHeal > 0) {
                target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + totalHeal);
                logs.push(`聖なる加護が${target.name}をHP${totalHeal}回復！`);
              }
            }
            // allyMagicHitMp（味方魔法被弾時MP回復）
            if (isMagic && target.isPlayer && target.stats.hp > 0) {
              const totalMpRegen = playerUnits.reduce((sum, u) => sum + (u.stats.hp > 0 ? u.passiveEffects.allyMagicHitMp : 0), 0);
              if (totalMpRegen > 0) {
                target.stats.mp = Math.min(target.stats.maxMp, target.stats.mp + totalMpRegen);
                logs.push(`精霊の加護が${target.name}のMP${totalMpRegen}回復！`);
              }
            }
            
            // HP吸収
            if (unit.passiveEffects.hpSteal > 0) {
              const steal = applyPercent(damage, unit.passiveEffects.hpSteal);
              unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + steal);
            }
            
            if (target.stats.hp <= 0) {
              logs.push(`${target.name}を倒した！`);
              // mpOnKill（敵を倒すとMP回復）
              if (unit.passiveEffects.mpOnKill > 0) {
                unit.stats.mp = Math.min(unit.stats.maxMp, unit.stats.mp + unit.passiveEffects.mpOnKill);
                logs.push(`${unit.name}は魂を吸収しMP${unit.passiveEffects.mpOnKill}回復！`);
              }
              // hpOnKill（敵を倒すとHP回復）
              if (unit.passiveEffects.hpOnKill > 0) {
                unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + unit.passiveEffects.hpOnKill);
                logs.push(`${unit.name}は命を吸収しHP${unit.passiveEffects.hpOnKill}回復！`);
              }
              // atkStackOnKill（敵を倒すとATK累積上昇）
              if (unit.passiveEffects.atkStackOnKill > 0) {
                const atkGain = Math.floor(unit.stats.atk * unit.passiveEffects.atkStackOnKill / 100);
                unit.stats.atk += atkGain;
                logs.push(`${unit.name}の殺意が高まりATK+${atkGain}！`);
              }
              if (target.passiveEffects.revive > 0 && !target.reviveUsed) {
                target.stats.hp = applyPercent(target.stats.maxHp, target.passiveEffects.revive);
                target.reviveUsed = true;
                logs.push(`${target.name}は不死の力で蘇った！`);
              }
            }
          }
        } else if (skill.type === 'heal') {
          const targets = Array.isArray(action.target) ? action.target : [action.target as ExtendedBattleUnit];
          for (const target of targets) {
            if (target.stats.hp <= 0) continue;
            const heal = calculateHeal(unit, target, skill.multiplier);
            target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + heal);
            logs.push(`${unit.name}の${skill.name}！ ${target.name}のHPが${heal}回復！(MP-${actualCost})`);
          }
        } else if (skill.type === 'buff' && skill.effect) {
          // バフスキル
          const targets = Array.isArray(action.target) ? action.target : [action.target as ExtendedBattleUnit];
          for (const target of targets) {
            if (target.stats.hp <= 0) continue;
            applyBuff(target, skill.effect, skill.name);
          }
          const effectText = skill.effect.type === 'atkUp' ? 'ATK' : skill.effect.type === 'defUp' ? 'DEF' : skill.effect.type === 'agiUp' ? 'AGI' : 'ステータス';
          logs.push(`${unit.name}の${skill.name}！ ${effectText}+${skill.effect.value}%（${skill.effect.duration}ターン）(MP-${actualCost})`);
        } else if (skill.type === 'debuff' && skill.effect) {
          // デバフスキル
          const targets = Array.isArray(action.target) ? action.target : [action.target as ExtendedBattleUnit];
          for (const target of targets) {
            if (target.stats.hp <= 0) continue;
            // statusResistで抵抗判定
            const resistChance = target.passiveEffects?.statusResist || 0;
            if (Math.random() * 100 < resistChance) {
              logs.push(`${target.name}は${skill.name}を抵抗した！`);
              continue;
            }
            // debuffDuration（デバフ持続延長）を適用
            const durationBonus = unit.passiveEffects.debuffDuration || 0;
            const extendedEffect = durationBonus > 0 
              ? { ...skill.effect, duration: (skill.effect.duration || 1) + durationBonus }
              : skill.effect;
            applyBuff(target, extendedEffect, skill.name);
            // debuffFollowUp（デバフ成功時追撃）
            if (unit.passiveEffects.debuffFollowUp > 0 && target.stats.hp > 0) {
              const followUpDamage = Math.floor(unit.stats.atk * unit.passiveEffects.debuffFollowUp / 100);
              target.stats.hp = Math.max(0, target.stats.hp - followUpDamage);
              logs.push(`${unit.name}の追撃！${target.name}に${followUpDamage}ダメージ！`);
              if (target.stats.hp <= 0) logs.push(`${target.name}を倒した！`);
            }
          }
          const effectText = skill.effect.type === 'atkDown' ? 'ATK' : skill.effect.type === 'agiDown' ? 'AGI' : 'ステータス';
          logs.push(`${unit.name}の${skill.name}！ ${effectText}-${skill.effect.value}%（${skill.effect.duration}ターン）(MP-${actualCost})`);
        }
      }
      
      if (castCount > 1) {
        logs.push(`（2回詠唱発動！）`);
      }
    }
  }
  
  // autoRevive判定（味方が死んだ時）
  for (const unit of playerUnits) {
    if (unit.stats.hp > 0 && unit.passiveEffects.autoRevive > 0 && !unit.autoReviveUsed) {
      const deadAlly = playerUnits.find(u => u.stats.hp <= 0 && u.id !== unit.id);
      if (deadAlly) {
        deadAlly.stats.hp = Math.floor(deadAlly.stats.maxHp * 0.3);
        unit.autoReviveUsed = true;
        logs.push(`${unit.name}の奇跡の力で${deadAlly.name}が蘇生！`);
      }
    }
  }
  
  // バフ/デバフのduration減少
  tickBuffDurations([...playerUnits, ...enemyUnits], logs);
  
  // 勝敗判定
  const alivePlayer = playerUnits.some(u => u.stats.hp > 0);
  const aliveEnemy = enemyUnits.some(u => u.stats.hp > 0);
  
  if (!aliveEnemy) return { logs, playerWin: true };
  if (!alivePlayer) return { logs, playerWin: false };
  
  return { logs, playerWin: null };
}

// ============================================
// 1エンカウントの処理
// ============================================

function processEncounter(
  playerUnits: ExtendedBattleUnit[],
  dungeon: DungeonType,
  encounterNum: number,
  isBossEncounter: boolean
): { logs: string[]; victory: boolean } {
  const dungeonData = dungeons[dungeon];
  const allLogs: string[] = [];
  const enemyUnits: ExtendedBattleUnit[] = [];
  
  if (isBossEncounter && dungeonData.boss) {
    enemyUnits.push(monsterToUnit(dungeonData.boss));
    allLogs.push(`\n【遭遇 ${encounterNum}】`);
    allLogs.push(`🔴BOSS: ${dungeonData.boss.name}が現れた！`);
  } else {
    const monsterCount = Math.floor(random(1, 4));
    
    for (let i = 0; i < monsterCount; i++) {
      const totalWeight = dungeonData.monsters.reduce((sum, m) => sum + m.weight, 0);
      let rand = Math.random() * totalWeight;
      for (const spawn of dungeonData.monsters) {
        rand -= spawn.weight;
        if (rand <= 0) {
          enemyUnits.push(monsterToUnit(spawn.monster));
          break;
        }
      }
    }
    
    const monsterNames = enemyUnits.map(e => e.name).join('、');
    allLogs.push(`\n【遭遇 ${encounterNum}】`);
    allLogs.push(`${monsterNames}が現れた！`);
  }
  
  // 戦闘開始時: intimidate適用
  for (const unit of playerUnits) {
    if (unit.stats.hp > 0 && unit.passiveEffects.intimidate > 0) {
      for (const enemy of enemyUnits) {
        const reduction = applyPercent(enemy.stats.atk, unit.passiveEffects.intimidate);
        enemy.stats.atk = Math.max(1, enemy.stats.atk - reduction);
      }
    }
  }
  
  // 戦闘開始時: allyAtkBonus適用
  for (const unit of playerUnits) {
    if (unit.stats.hp > 0 && unit.passiveEffects.allyAtkBonus > 0) {
      for (const ally of playerUnits) {
        if (ally.id !== unit.id && ally.stats.hp > 0) {
          const bonus = applyPercent(ally.stats.atk, unit.passiveEffects.allyAtkBonus);
          ally.stats.atk += bonus;
        }
      }
    }
  }
  
  // 戦闘開始時: allyDefense適用
  for (const unit of playerUnits) {
    if (unit.stats.hp > 0 && unit.passiveEffects.allyDefense > 0) {
      for (const ally of playerUnits) {
        if (ally.stats.hp > 0) {
          ally.passiveEffects.damageReduction += unit.passiveEffects.allyDefense;
        }
      }
    }
  }
  
  // プレイヤーHP回復（遭遇ごと10%）
  for (const unit of playerUnits) {
    if (unit.stats.hp > 0) {
      unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + Math.floor(unit.stats.maxHp * 0.1));
    }
  }
  
  // 戦闘ループ
  for (let turn = 1; turn <= 20; turn++) {
    const result = processTurn(playerUnits, enemyUnits, turn);
    allLogs.push(...result.logs);
    
    if (result.playerWin !== null) {
      if (result.playerWin) {
        allLogs.push(`勝利！`);
      } else {
        allLogs.push(`パーティは全滅した...`);
      }
      return { logs: allLogs, victory: result.playerWin };
    }
  }
  
  allLogs.push(`時間切れ...撤退した`);
  return { logs: allLogs, victory: false };
}

// ============================================
// メイン：バトル実行
// ============================================

export function runBattle(party: Party, dungeon: DungeonType): BattleResult {
  const dungeonData = dungeons[dungeon];
  const allLogs: BattleLog[] = [];
  let encountersCleared = 0;
  
  const playerUnits: ExtendedBattleUnit[] = [];
  (party.front || []).forEach((char) => {
    if (char) playerUnits.push(characterToUnit(char, 'front'));
  });
  (party.back || []).forEach((char) => {
    if (char) playerUnits.push(characterToUnit(char, 'back'));
  });
  
  // frontlineBonus（前衛3人以上でATK+）
  const frontCount = playerUnits.filter(u => u.position === "front").length;
  if (frontCount >= 3) {
    for (const unit of playerUnits) {
      if (unit.passiveEffects.frontlineBonus > 0) {
        const bonus = Math.floor(unit.stats.atk * unit.passiveEffects.frontlineBonus / 100);
        unit.stats.atk += bonus;
      }
    }
  }

  // allyMagBonus（味方全体のMAG+%）
  const totalAllyMagBonus = playerUnits.reduce((sum, u) => sum + u.passiveEffects.allyMagBonus, 0);
  if (totalAllyMagBonus > 0) {
    for (const unit of playerUnits) {
      const bonus = Math.floor(unit.stats.mag * totalAllyMagBonus / 100);
      unit.stats.mag += bonus;
    }
  }

  // allyMpReduction（味方全体のMP消費軽減）
  const totalAllyMpReduction = playerUnits.reduce((sum, u) => sum + u.passiveEffects.allyMpReduction, 0);
  if (totalAllyMpReduction > 0) {
    for (const unit of playerUnits) {
      unit.passiveEffects.mpReduction += totalAllyMpReduction;
    }
  }
  
  if (playerUnits.length === 0) {
    return {
      victory: false,
      logs: [{ turn: 0, actions: [], message: 'パーティがいません' }],
      encountersCleared: 0,
      totalEncounters: dungeonData.encounterCount,
    };
  }
  
  for (let i = 1; i <= dungeonData.encounterCount; i++) {
    const isBossEncounter = (i === dungeonData.encounterCount);
    const { logs, victory } = processEncounter(playerUnits, dungeon, i, isBossEncounter);
    
    allLogs.push({
      turn: i,
      actions: [],
      message: logs.join('\n'),
    });
    
    if (victory) {
      encountersCleared++;
    } else {
      return {
        victory: false,
        logs: allLogs,
        encountersCleared,
        totalEncounters: dungeonData.encounterCount,
      };
    }
  }
  
  allLogs.push({
    turn: dungeonData.encounterCount + 1,
    actions: [],
    message: `\n🎉 ${dungeonData.name}を踏破した！`,
  });
  
  return {
    victory: true,
    logs: allLogs,
    encountersCleared,
    totalEncounters: dungeonData.encounterCount,
  };
}

import { applyDropBonus, getDropRollCount } from '../drop/dropBonus';

// 複数ドロップ対応（成功した数だけドロップ）
export function rollDrops(dungeon: DungeonType, characters: Character[] = []): string[] {
  const baseRate = getDropRate(dungeon);
  const dropRate = applyDropBonus(baseRate, characters);
  const rolls = getDropRollCount(characters);
  
  const drops: string[] = [];
  for (let i = 0; i < rolls; i++) {
    if (Math.random() * 100 < dropRate) {
      const item = getRandomItem();
      drops.push(item.id);
    }
  }
  return drops;
}

// 後方互換（1つだけ返す）
export function rollDrop(dungeon: DungeonType, characters: Character[] = []): string | undefined {
  const drops = rollDrops(dungeon, characters);
  return drops[0];
}
