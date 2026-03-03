import { Enemy } from '../types';

// 基本敵（階層×倍率でスケール）
const baseEnemies: Omit<Enemy, 'hp' | 'atk' | 'def' | 'spd' | 'exp'>[] = [
  { id: 'slime', name: 'スライム', emoji: '🟢' },
  { id: 'goblin', name: 'ゴブリン', emoji: '👺' },
  { id: 'skeleton', name: 'スケルトン', emoji: '💀' },
  { id: 'bat', name: 'バット', emoji: '🦇' },
  { id: 'wolf', name: 'ウルフ', emoji: '🐺' },
  { id: 'orc', name: 'オーク', emoji: '👹' },
  { id: 'ghost', name: 'ゴースト', emoji: '👻' },
  { id: 'golem', name: 'ゴーレム', emoji: '🗿' },
];

const bossEnemies: Omit<Enemy, 'hp' | 'atk' | 'def' | 'spd' | 'exp'>[] = [
  { id: 'king_slime', name: 'キングスライム', emoji: '👑', isBoss: true },
  { id: 'goblin_chief', name: 'ゴブリンチーフ', emoji: '🔥', isBoss: true },
  { id: 'lich', name: 'リッチ', emoji: '☠️', isBoss: true },
  { id: 'dragon', name: 'ドラゴン', emoji: '🐉', isBoss: true },
  { id: 'demon_lord', name: '魔王', emoji: '😈', isBoss: true },
];

// 階層に応じた敵を生成
export function getEnemyForFloor(floor: number): Enemy {
  const isBossFloor = floor % 5 === 0;
  
  // 基本ステータス計算（階層に応じてスケール）
  const baseHp = 20 + floor * 5;
  const baseAtk = 5 + floor * 2;
  const baseDef = 2 + floor;
  const baseSpd = 5 + Math.floor(floor / 10);
  const baseExp = 10 + floor * 3;
  
  if (isBossFloor) {
    // ボス（5階ごと）
    const bossIndex = Math.floor((floor / 5 - 1) % bossEnemies.length);
    const boss = bossEnemies[bossIndex];
    return {
      ...boss,
      hp: Math.floor(baseHp * 3),
      atk: Math.floor(baseAtk * 1.5),
      def: Math.floor(baseDef * 1.5),
      spd: baseSpd,
      exp: Math.floor(baseExp * 5),
    };
  } else {
    // 通常敵
    const enemyIndex = Math.floor(Math.random() * baseEnemies.length);
    const enemy = baseEnemies[enemyIndex];
    return {
      ...enemy,
      hp: baseHp,
      atk: baseAtk,
      def: baseDef,
      spd: baseSpd,
      exp: baseExp,
    };
  }
}

// 戦闘シミュレーション（1ターン分）
export interface BattleResult {
  playerDamage: number;
  enemyDamage: number;
  playerDodged: boolean;
  enemyDodged: boolean;
  playerCrit: boolean;
}

export function simulateBattleTurn(
  playerAtk: number,
  playerDef: number,
  playerCritRate: number,
  playerDodgeRate: number,
  enemyAtk: number,
  enemyDef: number,
): BattleResult {
  // プレイヤーの攻撃
  const playerCrit = Math.random() * 100 < playerCritRate;
  const playerBaseDamage = Math.max(1, playerAtk - enemyDef);
  const playerDamage = playerCrit ? Math.floor(playerBaseDamage * 1.5) : playerBaseDamage;
  const enemyDodged = Math.random() * 100 < 5; // 敵の回避率は固定5%
  
  // 敵の攻撃
  const enemyBaseDamage = Math.max(1, enemyAtk - playerDef);
  const enemyDamage = enemyBaseDamage;
  const playerDodged = Math.random() * 100 < playerDodgeRate;
  
  return {
    playerDamage: enemyDodged ? 0 : playerDamage,
    enemyDamage: playerDodged ? 0 : enemyDamage,
    playerDodged,
    enemyDodged,
    playerCrit,
  };
}
