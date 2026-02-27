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
import { getDropRate, getRandomItem } from '../data/items';
import { random, pickRandom, cloneStats } from '../utils';

// ============================================
// パッシブ効果の集約
// ============================================

interface PassiveEffects {
  physicalBonus: number;
  magicBonus: number;
  damageBonus: number;
  critBonus: number;
  critDamage: number;
  evasionBonus: number;
  accuracyBonus: number;
  perfectEvasion: number;
  damageReduction: number;
  hpRegen: number;
  mpRegen: number;
  hpSteal: number;
  healBonus: number;
  healReceived: number;
  firstStrikeBonus: number;
  intimidate: number;
  cover: number;
  counterRate: number;
  lowHpBonus: number;
  allyCountBonus: number;
  allyAtkBonus: number;
  allyDefense: number;
  dropBonus: number;
  mpReduction: number;
  statusResist: number;
  debuffBonus: number;
  doublecast: number;
  attackStack: number;
  autoRevive: number;
  revive: number;
  followUp: number;
  allStats: number;
  // 系統特攻/耐性
  speciesKiller: Record<string, number>;
  speciesResist: Record<string, number>;
  // 連撃・劣化関連
  fixedHits: number;          // ヒット数固定（0=無効）
  bonusHits: number;          // 追加ヒット数
  noDecayHits: number;        // 最初のN回は減衰なし
  decayReduction: number;     // 減衰緩和（%）
  singleHitBonus: number;     // 単発時ダメージ+%
  degradationResist: number;  // 劣化耐性（%）
  degradationBonus: number;   // 劣化ボーナス（追加%）
}

function getEmptyPassiveEffects(): PassiveEffects {
  return {
    physicalBonus: 0, magicBonus: 0, damageBonus: 0, critBonus: 0, critDamage: 0,
    evasionBonus: 0, accuracyBonus: 0, perfectEvasion: 0, damageReduction: 0,
    hpRegen: 0, mpRegen: 0, hpSteal: 0, healBonus: 0, healReceived: 0,
    firstStrikeBonus: 0, intimidate: 0, cover: 0, counterRate: 0,
    lowHpBonus: 0, allyCountBonus: 0, allyAtkBonus: 0, allyDefense: 0,
    dropBonus: 0, mpReduction: 0, statusResist: 0, debuffBonus: 0,
    doublecast: 0, attackStack: 0, autoRevive: 0, revive: 0, followUp: 0, allStats: 0,
    speciesKiller: {}, speciesResist: {},
    // 連撃・劣化関連
    fixedHits: 0, bonusHits: 0, noDecayHits: 0, decayReduction: 0,
    singleHitBonus: 0, degradationResist: 0, degradationBonus: 0,
  };
}

// ユニットの全パッシブ効果を集約
function collectPassiveEffects(unit: BattleUnit): PassiveEffects {
  const effects = getEmptyPassiveEffects();
  
  if (!unit.isPlayer) {
    // モンスターの系統特攻/耐性
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
  
  // プレイヤーの種族パッシブ
  if (unit.race) {
    const raceData = races[unit.race];
    if (raceData?.passives) {
      for (const passive of raceData.passives) {
        for (const effect of passive.effects) {
          applyEffect(effects, effect.type, effect.value);
        }
      }
    }
    // 種族マスタリー（パッシブ）
    if (unit.raceMastery && raceData?.masterySkill?.type === 'passive' && raceData.masterySkill.effects) {
      for (const effect of raceData.masterySkill.effects) {
        applyEffect(effects, effect.type, effect.value);
      }
    }
  }
  
  // プレイヤーの職業パッシブ
  if (unit.job) {
    const jobData = jobs[unit.job];
    if (jobData?.passives) {
      for (const passive of jobData.passives) {
        for (const effect of passive.effects) {
          applyEffect(effects, effect.type, effect.value);
        }
      }
    }
    // 職業マスタリー（パッシブ）
    if (unit.jobMastery && jobData?.masterySkill?.type === 'passive' && jobData.masterySkill.effects) {
      for (const effect of jobData.masterySkill.effects) {
        applyEffect(effects, effect.type, effect.value);
      }
    }
  }
  
  return effects;
}

function applyEffect(effects: PassiveEffects, type: string, value: number) {
  // 系統特攻/耐性
  if (type.startsWith('speciesKiller_')) {
    const species = type.replace('speciesKiller_', '');
    effects.speciesKiller[species] = (effects.speciesKiller[species] || 0) + value;
    return;
  }
  if (type.startsWith('speciesResist_')) {
    const species = type.replace('speciesResist_', '');
    effects.speciesResist[species] = (effects.speciesResist[species] || 0) + value;
    return;
  }
  
  // その他のパッシブ
  if (type in effects) {
    (effects as any)[type] += value;
  }
}

// ============================================
// 属性・系統計算
// ============================================

function getElementMultiplier(attackElement: ElementType | undefined, defenderElement: ElementType | undefined): number {
  if (!attackElement || attackElement === 'none' || !defenderElement || defenderElement === 'none') {
    return 1.0;
  }
  if (ELEMENT_ADVANTAGE[attackElement] === defenderElement) {
    return ELEMENT_MULTIPLIER;
  }
  return 1.0;
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

// ============================================
// ユニット変換
// ============================================

interface ExtendedBattleUnit extends BattleUnit {
  passiveEffects: PassiveEffects;
  attackStackCount: number;
  autoReviveUsed: boolean;
  reviveUsed: boolean;
  raceMastery?: boolean;
  jobMastery?: boolean;
  degradation: number;  // 劣化%（被ダメ増加）
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
  
  const unit: ExtendedBattleUnit = {
    id: char.id,
    name: char.name,
    isPlayer: true,
    stats: cloneStats(char.stats),
    position,
    race: char.race,
    job: char.job,
    trait: char.trait,
    skills: allSkills,
    raceMastery: char.raceMastery,
    jobMastery: char.jobMastery,
    passiveEffects: getEmptyPassiveEffects(),
    attackStackCount: 0,
    autoReviveUsed: false,
    reviveUsed: false,
    degradation: 0,
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
    speciesKiller: monster.speciesKiller,
    speciesResist: monster.speciesResist,
    passiveEffects: getEmptyPassiveEffects(),
    attackStackCount: 0,
    autoReviveUsed: false,
    reviveUsed: false,
    degradation: 0,
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
    return { hit: false, perfectEvade: true };
  }
  
  // 基本命中率 90% + (攻撃者AGI - 防御者AGI) * 1%
  let hitRate = 90 + (attacker.stats.agi - defender.stats.agi);
  
  // パッシブ補正
  hitRate += atkEffects.accuracyBonus;
  hitRate -= defEffects.evasionBonus;
  
  // 隊列補正（後衛は回避+10%）
  if (defender.position === 'back') hitRate -= 10;
  
  // 範囲制限
  hitRate = Math.max(30, Math.min(99, hitRate));
  
  return { hit: Math.random() * 100 < hitRate, perfectEvade: false };
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
  
  const hitCount = getHitCount(attacker);
  let totalDamage = 0;
  let isCritical = false;
  let actualHits = 0;
  let degradationAdded = 0;
  
  // 基本命中率を計算
  let baseHitRate = 90 + (attacker.stats.agi - defender.stats.agi);
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
    let damage = (attacker.stats.atk * 0.8 * randA) - (defender.stats.def * randB * 0.5);
    
    // 連撃減衰（威力）
    damage *= decayFactor;
    
    // attackStack累積
    const stackBonus = 1 + (atkEffects.attackStack * attacker.attackStackCount) / 100;
    damage *= stackBonus;
    
    // physicalBonus
    damage *= (1 + atkEffects.physicalBonus / 100);
    
    // damageBonus
    damage *= (1 + atkEffects.damageBonus / 100);
    
    // lowHpBonus (HP30%以下で発動)
    if (atkEffects.lowHpBonus > 0 && attacker.stats.hp / attacker.stats.maxHp <= 0.3) {
      damage *= (1 + atkEffects.lowHpBonus / 100);
    }
    
    // allyCountBonus
    if (atkEffects.allyCountBonus > 0) {
      damage *= (1 + atkEffects.allyCountBonus * (allyCount - 1) / 100);
    }
    
    // 隊列補正
    const attackerMod = POSITION_MODIFIERS[attacker.position as Position]?.damage || 1.0;
    const defenderMod = POSITION_MODIFIERS[defender.position as Position]?.defense || 1.0;
    damage = damage * attackerMod / defenderMod;
    
    // 系統特攻
    damage *= getSpeciesKillerMultiplier(atkEffects, defender.species);
    
    // 系統耐性
    const attackerSpecies: SpeciesType = attacker.species || 'humanoid';
    damage *= getSpeciesResistMultiplier(defEffects, attackerSpecies);
    
    // damageReduction
    damage *= (1 - defEffects.damageReduction / 100);
    
    // 劣化による被ダメ増加
    damage *= (1 + defender.degradation / 100);
    
    // クリティカル判定
    let critRate = 10 + atkEffects.critBonus;
    if (attacker.trait === 'lucky') critRate += 20;
    
    if (Math.random() * 100 < critRate) {
      isCritical = true;
      const critMult = 1.5 + atkEffects.critDamage / 100;
      damage *= critMult;
    }
    
    // 個性補正
    if (attacker.trait === 'brave') damage *= 1.05;
    if (defender.trait === 'cautious') damage *= 0.85;
    
    // 単発ボーナス（ヒット数1の時のみ）
    if (singleHitBonus > 0) {
      damage *= (1 + singleHitBonus / 100);
    }
    
    totalDamage += Math.max(1, Math.floor(damage));
    
    // 劣化蓄積（ヒットごと）
    // degradationBonus: 与える劣化を増加
    // degradationResist: 受ける劣化を軽減
    let addedDeg = DEGRADATION_PER_HIT + atkEffects.degradationBonus;
    addedDeg *= (1 - defEffects.degradationResist / 100);
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
  
  const rand = random(0.9, 1.1);
  let damage = attacker.stats.mag * multiplier * rand;
  
  // magicBonus
  damage *= (1 + atkEffects.magicBonus / 100);
  
  // damageBonus
  damage *= (1 + atkEffects.damageBonus / 100);
  
  // lowHpBonus
  if (atkEffects.lowHpBonus > 0 && attacker.stats.hp / attacker.stats.maxHp <= 0.3) {
    damage *= (1 + atkEffects.lowHpBonus / 100);
  }
  
  // allyCountBonus
  if (atkEffects.allyCountBonus > 0) {
    damage *= (1 + atkEffects.allyCountBonus * (allyCount - 1) / 100);
  }
  
  // 属性相性
  damage *= getElementMultiplier(skillElement, defender.element);
  
  // 系統特攻
  damage *= getSpeciesKillerMultiplier(atkEffects, defender.species);
  
  // 系統耐性
  const attackerSpecies: SpeciesType = attacker.species || 'humanoid';
  damage *= getSpeciesResistMultiplier(defEffects, attackerSpecies);
  
  // damageReduction
  damage *= (1 - defEffects.damageReduction / 100);
  
  // 劣化による被ダメ増加
  damage *= (1 + defender.degradation / 100);
  
  // 魔法は単発なので劣化1回分蓄積
  let addedDeg = DEGRADATION_PER_HIT + atkEffects.degradationBonus;
  addedDeg *= (1 - defEffects.degradationResist / 100);
  defender.degradation += Math.max(0, addedDeg);
  
  return Math.max(1, Math.floor(damage));
}

function calculateHeal(healer: ExtendedBattleUnit, target: ExtendedBattleUnit, multiplier: number): number {
  const healerEffects = healer.passiveEffects;
  const targetEffects = target.passiveEffects;
  
  const rand = random(0.9, 1.1);
  let heal = healer.stats.mag * multiplier * rand;
  
  // healBonus (回復する側)
  heal *= (1 + healerEffects.healBonus / 100);
  
  // healReceived (回復される側)
  heal *= (1 + targetEffects.healReceived / 100);
  
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
  const aliveEnemies = enemies.filter(e => e.stats.hp > 0);
  const aliveAllies = allies.filter(a => a.stats.hp > 0);
  
  if (aliveEnemies.length === 0) {
    return { type: 'attack', target: enemies[0] };
  }
  
  if (unit.skills && unit.skills.length > 0) {
    const mpReduction = unit.passiveEffects.mpReduction;
    const usableSkills = unit.skills
      .map((skill, index) => ({ skill, index }))
      .filter(({ skill }) => {
        const actualCost = Math.max(1, Math.floor(skill.mpCost * (1 - mpReduction / 100)));
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
      
      if (Math.random() < 0.6) {
        const attackSkills = usableSkills.filter(({ skill }) => 
          skill.type === 'attack' || skill.type === 'magic'
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
  const allUnits = [...playerUnits, ...enemyUnits]
    .filter(u => u.stats.hp > 0)
    .sort((a, b) => {
      const aSpeed = a.stats.agi + a.passiveEffects.firstStrikeBonus + random(0, 10);
      const bSpeed = b.stats.agi + b.passiveEffects.firstStrikeBonus + random(0, 10);
      return bSpeed - aSpeed;
    });
  
  logs.push(`--- ターン ${turnNum} ---`);
  
  // ターン開始時HP/MP表示
  const alivePlayers = playerUnits.filter(u => u.stats.hp > 0);
  const aliveEnemies = enemyUnits.filter(u => u.stats.hp > 0);
  
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
  
  // intimidate適用（敵ATK低下）
  for (const unit of playerUnits) {
    if (unit.stats.hp > 0 && unit.passiveEffects.intimidate > 0) {
      for (const enemy of enemyUnits) {
        if (enemy.stats.hp > 0) {
          // 毎ターンではなく戦闘開始時に1回だけにすべきだが、簡易実装
        }
      }
    }
  }
  
  // allyAtkBonus適用
  for (const unit of playerUnits) {
    if (unit.stats.hp > 0 && unit.passiveEffects.allyAtkBonus > 0) {
      // これも戦闘開始時に1回だけ適用すべき
    }
  }
  
  for (const unit of allUnits) {
    if (unit.stats.hp <= 0) continue;
    
    const allies = unit.isPlayer ? playerUnits : enemyUnits;
    const enemies = unit.isPlayer ? enemyUnits : playerUnits;
    const aliveEnemiesNow = enemies.filter(e => e.stats.hp > 0);
    const aliveAlliesNow = allies.filter(a => a.stats.hp > 0);
    
    if (aliveEnemiesNow.length === 0) break;
    
    const action = decideAction(unit, allies, enemies);
    
    if (action.type === 'attack') {
      let target = action.target as ExtendedBattleUnit;
      
      // 庇う判定
      const cover = checkCover(enemies.filter(e => e.stats.hp > 0) as ExtendedBattleUnit[], target);
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
      
      // HP吸収
      if (unit.passiveEffects.hpSteal > 0) {
        const steal = Math.floor(damage * unit.passiveEffects.hpSteal / 100);
        unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + steal);
        if (steal > 0) logs.push(`${unit.name}はHP${steal}吸収！`);
      }
      
      // 反撃判定
      if (target.stats.hp > 0 && target.passiveEffects.counterRate > 0) {
        if (Math.random() * 100 < target.passiveEffects.counterRate) {
          const counterResult = calculatePhysicalDamage(target, unit, enemies.filter(e => e.stats.hp > 0).length);
          if (counterResult.actualHits > 0) {
            unit.stats.hp = Math.max(0, unit.stats.hp - counterResult.damage);
            logs.push(`${target.name}の反撃！ ${unit.name}に${counterResult.damage}ダメージ！`);
          }
        }
      }
      
      // 死亡判定と蘇生
      if (target.stats.hp <= 0) {
        logs.push(`${target.name}を倒した！`);
        // revive（自己蘇生）
        if (target.passiveEffects.revive > 0 && !target.reviveUsed) {
          target.stats.hp = Math.floor(target.stats.maxHp * target.passiveEffects.revive / 100);
          target.reviveUsed = true;
          logs.push(`${target.name}は不死の力で蘇った！`);
        }
      }
      
    } else if (action.type === 'skill' && unit.skills && action.skillIndex !== undefined) {
      const skill = unit.skills[action.skillIndex];
      const mpReduction = unit.passiveEffects.mpReduction;
      const actualCost = Math.max(1, Math.floor(skill.mpCost * (1 - mpReduction / 100)));
      unit.stats.mp = Math.max(0, unit.stats.mp - actualCost);
      
      // doublecast判定
      const castCount = (skill.type === 'magic' && skill.target === 'all' && unit.passiveEffects.doublecast > 0) ? 2 : 1;
      
      for (let cast = 0; cast < castCount; cast++) {
        if (skill.type === 'attack' || skill.type === 'magic') {
          const targets = Array.isArray(action.target) ? action.target : [action.target];
          const isMagic = skill.type === 'magic';
          
          for (const t of targets) {
            let target = t as ExtendedBattleUnit;
            if (target.stats.hp <= 0) continue;
            
            let damage: number;
            let actualHits = 1;
            if (isMagic) {
              damage = calculateMagicDamage(unit, target, skill.multiplier, skill.element, aliveAlliesNow.length);
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
            
            // HP吸収
            if (unit.passiveEffects.hpSteal > 0) {
              const steal = Math.floor(damage * unit.passiveEffects.hpSteal / 100);
              unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + steal);
            }
            
            if (target.stats.hp <= 0) {
              logs.push(`${target.name}を倒した！`);
              if (target.passiveEffects.revive > 0 && !target.reviveUsed) {
                target.stats.hp = Math.floor(target.stats.maxHp * target.passiveEffects.revive / 100);
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
        const reduction = Math.floor(enemy.stats.atk * unit.passiveEffects.intimidate / 100);
        enemy.stats.atk = Math.max(1, enemy.stats.atk - reduction);
      }
    }
  }
  
  // 戦闘開始時: allyAtkBonus適用
  for (const unit of playerUnits) {
    if (unit.stats.hp > 0 && unit.passiveEffects.allyAtkBonus > 0) {
      for (const ally of playerUnits) {
        if (ally.id !== unit.id && ally.stats.hp > 0) {
          const bonus = Math.floor(ally.stats.atk * unit.passiveEffects.allyAtkBonus / 100);
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

// ドロップボーナス計算
function calculateDropBonus(characters: Character[]): number {
  let bonus = 0;
  for (const char of characters) {
    if (char.race) {
      const raceData = races[char.race];
      for (const passive of raceData.passives) {
        for (const effect of passive.effects) {
          if (effect.type === 'dropBonus') {
            bonus += effect.value;
          }
        }
      }
    }
  }
  return bonus;
}

export function rollDrop(dungeon: DungeonType, characters: Character[] = []): string | undefined {
  const baseRate = getDropRate(dungeon);
  const dropBonus = calculateDropBonus(characters);
  const dropRate = baseRate * (1 + dropBonus / 100);
  if (Math.random() * 100 < dropRate) {
    const item = getRandomItem();
    return item.id;
  }
  return undefined;
}
