import { 
  Party, 
  DungeonType, 
  BattleResult, 
  BattleLog, 
  BattleUnit,
  Character,
  Monster,
  Stats,
} from '../types';
import { dungeons } from '../data/dungeons';
import { jobs } from '../data/jobs';

// ============================================
// ユーティリティ
// ============================================

function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function cloneStats(stats: Stats): Stats {
  return { ...stats };
}

// ============================================
// ユニット変換
// ============================================

function characterToUnit(char: Character, position: 'front' | 'back'): BattleUnit {
  return {
    id: char.id,
    name: char.name,
    isPlayer: true,
    stats: cloneStats(char.stats),
    position,
    job: char.job,
    trait: char.trait,
    skills: char.job ? jobs[char.job].skills : [],
  };
}

function monsterToUnit(monster: Monster): BattleUnit {
  return {
    id: monster.id + '_' + Math.random().toString(36).slice(2),
    name: monster.name,
    isPlayer: false,
    stats: cloneStats(monster.stats),
    position: 'front',
    skills: monster.skills,
  };
}

// ============================================
// ダメージ計算
// ============================================

function calculatePhysicalDamage(attacker: BattleUnit, defender: BattleUnit): { damage: number; isCritical: boolean } {
  const randA = random(0.85, 1.15);
  const randB = random(0.85, 1.15);
  
  let damage = (attacker.stats.atk * randA) - (defender.stats.def * randB * 0.5);
  
  // 隊列補正
  const positionMod = attacker.position === 'front' ? 1.1 : 0.9;
  damage *= positionMod;
  
  // クリティカル判定（10%基本）
  let critRate = 0.1;
  if (attacker.trait === 'lucky') critRate += 0.2;
  const isCritical = Math.random() < critRate;
  if (isCritical) damage *= 1.5;
  
  // 個性補正
  if (attacker.trait === 'brave') damage *= 1.05;
  if (defender.trait === 'cautious') damage *= 0.85;
  
  return { damage: Math.max(1, Math.floor(damage)), isCritical };
}

function calculateMagicDamage(attacker: BattleUnit, multiplier: number): number {
  const rand = random(0.9, 1.1);
  let damage = attacker.stats.mag * multiplier * rand;
  return Math.max(1, Math.floor(damage));
}

function calculateHeal(healer: BattleUnit, multiplier: number): number {
  const rand = random(0.9, 1.1);
  return Math.max(1, Math.floor(healer.stats.mag * multiplier * rand));
}

// ============================================
// 行動決定
// ============================================

function decideAction(
  unit: BattleUnit, 
  allies: BattleUnit[], 
  enemies: BattleUnit[]
): { type: 'attack' | 'skill'; target: BattleUnit | BattleUnit[] } {
  const aliveEnemies = enemies.filter(e => e.stats.hp > 0);
  const aliveAllies = allies.filter(a => a.stats.hp > 0);
  
  if (aliveEnemies.length === 0) {
    return { type: 'attack', target: enemies[0] };
  }
  
  // スキル使用判定
  if (unit.skills && unit.skills.length > 0) {
    const skill = unit.skills[0];
    
    if (skill.condition) {
      const { type, value, target } = skill.condition;
      
      if (type === 'hpAbove' && target === 'self') {
        const hpPercent = (unit.stats.hp / unit.stats.maxHp) * 100;
        if (hpPercent >= value) {
          return { 
            type: 'skill', 
            target: skill.target === 'all' ? aliveEnemies : pickRandom(aliveEnemies)
          };
        }
      }
      
      if (type === 'hpBelow' && target === 'ally') {
        const lowHpAlly = aliveAllies.find(a => 
          (a.stats.hp / a.stats.maxHp) * 100 < value
        );
        if (lowHpAlly && skill.type === 'heal') {
          return { type: 'skill', target: lowHpAlly };
        }
      }
      
      if (type === 'enemyCount' && target === 'enemy') {
        if (aliveEnemies.length >= value) {
          return { 
            type: 'skill', 
            target: skill.target === 'all' ? aliveEnemies : pickRandom(aliveEnemies)
          };
        }
      }
    }
  }
  
  // 通常攻撃
  return { type: 'attack', target: pickRandom(aliveEnemies) };
}

// ============================================
// 1ターンの処理
// ============================================

function processTurn(
  playerUnits: BattleUnit[],
  enemyUnits: BattleUnit[],
  turnNum: number
): { logs: string[]; playerWin: boolean | null } {
  const logs: string[] = [];
  
  // 全ユニットをAGI順にソート
  const allUnits = [...playerUnits, ...enemyUnits]
    .filter(u => u.stats.hp > 0)
    .sort((a, b) => (b.stats.agi + random(0, 10)) - (a.stats.agi + random(0, 10)));
  
  logs.push(`--- ターン ${turnNum} ---`);
  
  for (const unit of allUnits) {
    if (unit.stats.hp <= 0) continue;
    
    const allies = unit.isPlayer ? playerUnits : enemyUnits;
    const enemies = unit.isPlayer ? enemyUnits : playerUnits;
    const aliveEnemies = enemies.filter(e => e.stats.hp > 0);
    
    if (aliveEnemies.length === 0) break;
    
    const action = decideAction(unit, allies, enemies);
    
    if (action.type === 'attack') {
      const target = action.target as BattleUnit;
      const { damage, isCritical } = calculatePhysicalDamage(unit, target);
      target.stats.hp = Math.max(0, target.stats.hp - damage);
      
      const critText = isCritical ? '【会心】' : '';
      logs.push(`${unit.name}の攻撃！ ${target.name}に${damage}ダメージ！${critText}`);
      
      if (target.stats.hp <= 0) {
        logs.push(`${target.name}を倒した！`);
      }
    } else if (action.type === 'skill' && unit.skills) {
      const skill = unit.skills[0];
      
      if (skill.type === 'attack' || skill.type === 'magic') {
        const targets = Array.isArray(action.target) ? action.target : [action.target];
        const isMagic = skill.type === 'magic';
        
        for (const target of targets) {
          let damage: number;
          if (isMagic) {
            damage = calculateMagicDamage(unit, skill.multiplier);
          } else {
            const result = calculatePhysicalDamage(unit, target);
            damage = Math.floor(result.damage * skill.multiplier);
          }
          target.stats.hp = Math.max(0, target.stats.hp - damage);
          logs.push(`${unit.name}の${skill.name}！ ${target.name}に${damage}ダメージ！`);
          
          if (target.stats.hp <= 0) {
            logs.push(`${target.name}を倒した！`);
          }
        }
      } else if (skill.type === 'heal') {
        const target = action.target as BattleUnit;
        const heal = calculateHeal(unit, skill.multiplier);
        target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + heal);
        logs.push(`${unit.name}の${skill.name}！ ${target.name}のHPが${heal}回復！`);
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
  playerUnits: BattleUnit[],
  dungeon: DungeonType,
  encounterNum: number
): { logs: string[]; victory: boolean } {
  const dungeonData = dungeons[dungeon];
  const allLogs: string[] = [];
  
  // モンスター生成（1-3体）
  const monsterCount = Math.floor(random(1, 4));
  const enemyUnits: BattleUnit[] = [];
  
  for (let i = 0; i < monsterCount; i++) {
    // 重み付きランダム選択
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
  
  // プレイヤーユニットのHP回復（遭遇ごとに少し回復）
  for (const unit of playerUnits) {
    if (unit.stats.hp > 0) {
      unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + Math.floor(unit.stats.maxHp * 0.1));
    }
  }
  
  // 戦闘ループ（最大20ターン）
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
  
  // 20ターン経過は敗北扱い
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
  
  // パーティをユニットに変換
  const playerUnits: BattleUnit[] = [];
  party.front.forEach((char) => {
    if (char) playerUnits.push(characterToUnit(char, 'front'));
  });
  party.back.forEach((char) => {
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
  
  // 各エンカウントを処理
  for (let i = 1; i <= dungeonData.encounterCount; i++) {
    const { logs, victory } = processEncounter(playerUnits, dungeon, i);
    
    allLogs.push({
      turn: i,
      actions: [],
      message: logs.join('\n'),
    });
    
    if (victory) {
      encountersCleared++;
    } else {
      // 敗北したら終了
      return {
        victory: false,
        logs: allLogs,
        encountersCleared,
        totalEncounters: dungeonData.encounterCount,
      };
    }
  }
  
  // 全エンカウントクリア
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
