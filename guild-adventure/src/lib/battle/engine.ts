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
} from '../types';
import { dungeons } from '../data/dungeons';
import { jobs } from '../data/jobs';
import { races } from '../data/races';
import { getDropRate, getRandomItem } from '../data/items';

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
  // 職業スキル + 種族スキルを結合
  const jobSkills = char.job ? jobs[char.job].skills : [];
  const raceData = char.race ? races[char.race] : null;
  const raceSkills = raceData?.skills ?? [];
  const allSkills = [...jobSkills, ...raceSkills];
  
  // マスタリースキル（アクティブ）を追加
  const jobData = char.job ? jobs[char.job] : null;
  if (char.raceMastery && raceData?.masterySkill?.type === 'active' && raceData.masterySkill.skill) {
    allSkills.push(raceData.masterySkill.skill);
  }
  if (char.jobMastery && jobData?.masterySkill?.type === 'active' && jobData.masterySkill.skill) {
    allSkills.push(jobData.masterySkill.skill);
  }
  
  return {
    id: char.id,
    name: char.name,
    isPlayer: true,
    stats: cloneStats(char.stats),
    position,
    race: char.race,
    job: char.job,
    trait: char.trait,
    skills: allSkills,
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
  // 攻撃者: 前衛+20%, 後衛-20%
  const attackerMod = POSITION_MODIFIERS[attacker.position as Position]?.damage || 1.0;
  // 防御者: 前衛は被ダメ+20%(defense=0.8で割る), 後衛は被ダメ-20%(defense=1.2で割る)
  const defenderMod = POSITION_MODIFIERS[defender.position as Position]?.defense || 1.0;
  damage = damage * attackerMod / defenderMod;
  
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
): { type: 'attack' | 'skill'; skillIndex?: number; target: BattleUnit | BattleUnit[] } {
  const aliveEnemies = enemies.filter(e => e.stats.hp > 0);
  const aliveAllies = allies.filter(a => a.stats.hp > 0);
  
  if (aliveEnemies.length === 0) {
    return { type: 'attack', target: enemies[0] };
  }
  
  // スキル使用判定
  if (unit.skills && unit.skills.length > 0) {
    // 使用可能なスキルをフィルタ（MP足りるもの）
    const usableSkills = unit.skills
      .map((skill, index) => ({ skill, index }))
      .filter(({ skill }) => unit.stats.mp >= skill.mpCost);
    
    if (usableSkills.length > 0) {
      // 回復スキルの優先判定（味方HPが50%以下なら）
      const healSkills = usableSkills.filter(({ skill }) => skill.type === 'heal');
      if (healSkills.length > 0) {
        const lowHpAlly = aliveAllies.find(a => (a.stats.hp / a.stats.maxHp) < 0.5);
        if (lowHpAlly) {
          const { skill, index } = healSkills[0];
          const target = skill.target === 'allAllies' ? aliveAllies : lowHpAlly;
          return { type: 'skill', skillIndex: index, target };
        }
      }
      
      // 60%の確率でスキル使用
      if (Math.random() < 0.6) {
        // 攻撃/魔法スキルをランダム選択
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
  
  // 通常攻撃
  return { type: 'attack', target: pickRandom(aliveEnemies) };
}

// ============================================
// 1ターンの処理
// ============================================

// HP/MP状態を生成
function formatUnitStatus(unit: BattleUnit): string {
  const hpPercent = Math.floor((unit.stats.hp / unit.stats.maxHp) * 100);
  const hpIcon = hpPercent > 50 ? '🟢' : hpPercent > 25 ? '🟡' : '🔴';
  return `${unit.name}: HP${unit.stats.hp}/${unit.stats.maxHp}${hpIcon} MP${unit.stats.mp}/${unit.stats.maxMp}`;
}

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
  
  // ターン開始時のHP状態を表示
  const alivePlayers = playerUnits.filter(u => u.stats.hp > 0);
  const aliveEnemies = enemyUnits.filter(u => u.stats.hp > 0);
  
  logs.push(`【味方】`);
  alivePlayers.forEach(u => logs.push(`  ${formatUnitStatus(u)}`));
  logs.push(`【敵】`);
  aliveEnemies.forEach(u => logs.push(`  ${formatUnitStatus(u)}`));
  
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
    } else if (action.type === 'skill' && unit.skills && action.skillIndex !== undefined) {
      const skill = unit.skills[action.skillIndex];
      
      // MP消費
      unit.stats.mp = Math.max(0, unit.stats.mp - skill.mpCost);
      
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
          logs.push(`${unit.name}の${skill.name}！ ${target.name}に${damage}ダメージ！(MP-${skill.mpCost})`);
          
          if (target.stats.hp <= 0) {
            logs.push(`${target.name}を倒した！`);
          }
        }
      } else if (skill.type === 'heal') {
        const targets = Array.isArray(action.target) ? action.target : [action.target as BattleUnit];
        for (const target of targets) {
          const heal = calculateHeal(unit, skill.multiplier);
          target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + heal);
          logs.push(`${unit.name}の${skill.name}！ ${target.name}のHPが${heal}回復！(MP-${skill.mpCost})`);
        }
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
  encounterNum: number,
  isBossEncounter: boolean
): { logs: string[]; victory: boolean } {
  const dungeonData = dungeons[dungeon];
  const allLogs: string[] = [];
  const enemyUnits: BattleUnit[] = [];
  
  if (isBossEncounter && dungeonData.boss) {
    // ボス戦（開始のみ赤表示用マーカー）
    enemyUnits.push(monsterToUnit(dungeonData.boss));
    allLogs.push(`\n【遭遇 ${encounterNum}】`);
    allLogs.push(`🔴BOSS: ${dungeonData.boss.name}が現れた！`);
  } else {
    // 通常エンカウント（1-3体）
    const monsterCount = Math.floor(random(1, 4));
    
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
  }
  
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
      // 敗北したら終了
      return {
        victory: false,
        logs: allLogs,
        encountersCleared,
        totalEncounters: dungeonData.encounterCount,
      };
    }
  }
  
  // 踏破ログ（ドロップは呼び出し側で処理）
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

// ドロップ抽選（呼び出し側で個別に実行）
export function rollDrop(dungeon: DungeonType): string | undefined {
  const dropRate = getDropRate(dungeon);
  if (Math.random() * 100 < dropRate) {
    const item = getRandomItem();
    return item.id;
  }
  return undefined;
}
