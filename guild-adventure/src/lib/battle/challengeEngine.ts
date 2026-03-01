import { Party, BattleResult, BattleLog, Character, Monster, Stats } from '../types';
import { generateChallengeMonsters, getFinalBoss, getFloorInfo } from '../data/challengeMonsters';
import { jobs } from '../data/jobs';
import { races } from '../data/races';
import { 
  calculateCharacterBonuses,
  calculateTotalStats,
  getEmptyPassiveEffects,
  PassiveEffects,
} from '../character/bonuses';
import { random, pickRandom, cloneStats, getAliveUnits, calculateActualMpCost, applyPercent, clamp } from '../utils';

// ============================================
// チャレンジダンジョン用バトルエンジン
// 100階層を即時計算
// ============================================

interface ExtendedBattleUnit {
  id: string;
  name: string;
  isPlayer: boolean;
  position: 'front' | 'back';
  stats: Stats;
  originalStats: Stats;
  baseStats: Stats;
  passiveEffects: PassiveEffects;
  skills: any[];
  buffs: any[];
  character?: Character;
  monster?: Monster;
  regenPerTurn?: number;  // 再生型用
}

// キャラクターをバトルユニットに変換（engine.tsから流用）
function characterToUnit(char: Character, pos: 'front' | 'back'): ExtendedBattleUnit {
  const raceData = races[char.race];
  const jobData = jobs[char.job];
  
  const bonuses = calculateCharacterBonuses(char);
  const stats = calculateTotalStats(char);
  
  return {
    id: char.id,
    name: char.name,
    isPlayer: true,
    position: pos,
    stats: cloneStats(stats),
    originalStats: cloneStats(stats),
    baseStats: cloneStats(stats),
    passiveEffects: bonuses,
    skills: [...(raceData.skills || []), ...(jobData.skills || [])],
    buffs: [],
    character: char,
  };
}

// モンスターをバトルユニットに変換
function monsterToUnit(monster: Monster): ExtendedBattleUnit {
  return {
    id: monster.id,
    name: monster.name,
    isPlayer: false,
    position: 'front',
    stats: cloneStats(monster.stats),
    originalStats: cloneStats(monster.stats),
    baseStats: cloneStats(monster.stats),
    passiveEffects: getEmptyPassiveEffects(),
    skills: monster.skills || [],
    buffs: [],
    monster,
    regenPerTurn: (monster as any).regenPerTurn,
  };
}

// 1フロアの戦闘を処理
function processFloor(
  playerUnits: ExtendedBattleUnit[],
  enemies: Monster[],
  floor: number
): { victory: boolean; logs: string[] } {
  const logs: string[] = [];
  const floorInfo = getFloorInfo(floor);
  
  logs.push(`\n=== ${floor}F: ${floorInfo.conceptName} ===`);
  
  // プレイヤーのHPを全回復（チャレンジダンジョンルール）
  for (const unit of playerUnits) {
    unit.stats.hp = unit.stats.maxHp;
    unit.stats.mp = unit.stats.maxMp;
    unit.buffs = [];  // バフもリセット
  }
  
  // 敵ユニットを作成
  const enemyUnits = enemies.map(m => monsterToUnit(m));
  
  const maxTurns = 30;  // 1フロア最大30ターン
  
  for (let turn = 1; turn <= maxTurns; turn++) {
    const aliveEnemies = getAliveUnits(enemyUnits);
    const alivePlayers = getAliveUnits(playerUnits);
    
    if (aliveEnemies.length === 0) {
      logs.push(`${floor}Fクリア！`);
      return { victory: true, logs };
    }
    
    if (alivePlayers.length === 0) {
      logs.push(`${floor}Fで全滅...`);
      return { victory: false, logs };
    }
    
    // 行動順を決定（AGI順）
    const allUnits = [...alivePlayers, ...aliveEnemies];
    allUnits.sort((a, b) => b.stats.agi - a.stats.agi);
    
    for (const unit of allUnits) {
      if (unit.stats.hp <= 0) continue;
      
      const aliveEnemiesNow = getAliveUnits(enemyUnits);
      const alivePlayersNow = getAliveUnits(playerUnits);
      
      if (aliveEnemiesNow.length === 0 || alivePlayersNow.length === 0) break;
      
      if (unit.isPlayer) {
        // プレイヤーの攻撃
        const target = pickRandom(aliveEnemiesNow);
        if (target) {
          const damage = calculateDamage(unit, target);
          target.stats.hp -= damage;
          if (target.stats.hp <= 0) {
            logs.push(`${unit.name}が${target.name}を倒した！`);
          }
        }
      } else {
        // 敵の攻撃
        // 前衛優先
        const frontPlayers = alivePlayersNow.filter(u => u.position === 'front');
        const targetPool = frontPlayers.length > 0 ? frontPlayers : alivePlayersNow;
        const target = pickRandom(targetPool);
        if (target) {
          const damage = calculateDamage(unit, target);
          target.stats.hp -= damage;
          if (target.stats.hp <= 0) {
            logs.push(`${target.name}が倒れた...`);
          }
        }
        
        // 再生型の回復処理
        if (unit.regenPerTurn && unit.regenPerTurn > 0) {
          const healAmount = Math.floor(unit.originalStats.maxHp * unit.regenPerTurn / 100);
          unit.stats.hp = Math.min(unit.stats.hp + healAmount, unit.originalStats.maxHp);
        }
      }
    }
  }
  
  // 時間切れ
  logs.push(`${floor}Fで時間切れ...`);
  return { victory: false, logs };
}

// ダメージ計算（簡易版）
function calculateDamage(attacker: ExtendedBattleUnit, defender: ExtendedBattleUnit): number {
  const atk = attacker.stats.atk + (attacker.stats.mag || 0);
  const def = defender.stats.def;
  
  // 物理/魔法耐性を適用
  let resistance = 0;
  if (defender.monster) {
    const physRes = defender.monster.physicalResist || 0;
    const magRes = defender.monster.magicResist || 0;
    resistance = Math.max(physRes, magRes);
  }
  
  const baseDamage = Math.max(1, atk - def / 2);
  const finalDamage = Math.floor(baseDamage * (100 - resistance) / 100);
  
  // 乱数幅（90-110%）
  return Math.max(1, Math.floor(finalDamage * (90 + random(0, 20)) / 100));
}

// ============================================
// メイン：チャレンジバトル実行
// ============================================

export interface ChallengeResult {
  reachedFloor: number;       // 最終到達階層（敗北階層または100）
  defeatedAtFloor: number;    // 敗北した階層（100クリアなら0）
  victory: boolean;           // 100Fクリアしたか
  logs: BattleLog[];          // 戦闘ログ
  earnedCoins: number;        // 獲得コイン（3 × クリア階層数）
  earnedBooks: number;        // 獲得した書の数（5Fごと）
  earnedEquipments: number;   // 獲得した装備の数（20Fごと）
}

export function runChallengeBattle(party: Party): ChallengeResult {
  const allLogs: BattleLog[] = [];
  
  // プレイヤーユニットを作成
  const playerUnits: ExtendedBattleUnit[] = [];
  (party.front || []).forEach((char) => {
    if (char) playerUnits.push(characterToUnit(char, 'front'));
  });
  (party.back || []).forEach((char) => {
    if (char) playerUnits.push(characterToUnit(char, 'back'));
  });
  
  if (playerUnits.length === 0) {
    return {
      reachedFloor: 0,
      defeatedAtFloor: 0,
      victory: false,
      logs: [{ turn: 0, actions: [], message: 'パーティがいません' }],
      earnedCoins: 0,
      earnedBooks: 0,
      earnedEquipments: 0,
    };
  }
  
  // パッシブ効果の適用（前衛ボーナス等）
  const frontCount = playerUnits.filter(u => u.position === 'front').length;
  if (frontCount >= 3) {
    for (const unit of playerUnits) {
      if (unit.passiveEffects.frontlineBonus > 0) {
        const bonus = Math.floor(unit.stats.atk * unit.passiveEffects.frontlineBonus / 100);
        unit.stats.atk += bonus;
        unit.originalStats.atk += bonus;
      }
    }
  }
  
  let lastClearedFloor = 0;
  
  // 100階層を順番に戦う
  for (let floor = 1; floor <= 100; floor++) {
    // 敵を生成
    const enemies = floor === 100 
      ? [getFinalBoss()] 
      : generateChallengeMonsters(floor);
    
    const { victory, logs } = processFloor(playerUnits, enemies, floor);
    
    allLogs.push({
      turn: floor,
      actions: [],
      message: logs.join('\n'),
    });
    
    if (victory) {
      lastClearedFloor = floor;
    } else {
      // 敗北
      const clearedFloors = lastClearedFloor;  // 実際にクリアした階層数
      return {
        reachedFloor: clearedFloors,
        defeatedAtFloor: floor,
        victory: false,
        logs: allLogs,
        earnedCoins: clearedFloors * 3,
        earnedBooks: Math.floor(clearedFloors / 5),
        earnedEquipments: Math.floor(clearedFloors / 20),
      };
    }
  }
  
  // 100Fクリア！
  allLogs.push({
    turn: 101,
    actions: [],
    message: '\n🎉🎉🎉 チャレンジダンジョン完全制覇！ 🎉🎉🎉',
  });
  
  return {
    reachedFloor: 100,
    defeatedAtFloor: 0,
    victory: true,
    logs: allLogs,
    earnedCoins: 300,
    earnedBooks: 20,
    earnedEquipments: 5,
  };
}
