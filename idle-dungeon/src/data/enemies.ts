// 敵タイプの定義
export interface EnemyType {
  id: string;
  name: string;
  emoji: string;
  color: string;        // メインカラー
  secondaryColor: string; // 目や模様
  baseHp: number;
  baseAtk: number;
  baseSpeed: number;
  size: number;
  minFloor: number;     // 出現開始フロア
  weight: number;       // 出現確率の重み
  description: string;
  isBoss?: boolean;     // ボスフラグ
}

export const ENEMY_TYPES: EnemyType[] = [
  {
    id: 'slime',
    name: 'スライム',
    emoji: '🟢',
    color: '#22c55e',       // 緑
    secondaryColor: '#166534',
    baseHp: 15,
    baseAtk: 3,
    baseSpeed: 0.3,
    size: 18,
    minFloor: 1,
    weight: 40,
    description: '弱くて遅いが、どこにでもいる',
  },
  {
    id: 'goblin',
    name: 'ゴブリン',
    emoji: '👺',
    color: '#dc2626',       // 赤
    secondaryColor: '#450a0a',
    baseHp: 25,
    baseAtk: 6,
    baseSpeed: 0.6,
    size: 22,
    minFloor: 1,
    weight: 30,
    description: 'バランスの取れた雑魚敵',
  },
  {
    id: 'skeleton',
    name: 'スケルトン',
    emoji: '💀',
    color: '#e5e5e5',       // 白
    secondaryColor: '#404040',
    baseHp: 18,
    baseAtk: 10,
    baseSpeed: 0.5,
    size: 24,
    minFloor: 3,
    weight: 20,
    description: '高ATK低HP、ガラスキャノン',
  },
  {
    id: 'orc',
    name: 'オーク',
    emoji: '🐗',
    color: '#78350f',       // 茶
    secondaryColor: '#451a03',
    baseHp: 50,
    baseAtk: 5,
    baseSpeed: 0.25,
    size: 30,
    minFloor: 5,
    weight: 10,
    description: '高HP低速、タンク型',
  },
];

// ボス敵の定義
export const BOSS_TYPES: EnemyType[] = [
  {
    id: 'king_slime',
    name: 'キングスライム',
    emoji: '👑🟢',
    color: '#16a34a',       // 濃い緑
    secondaryColor: '#14532d',
    baseHp: 150,
    baseAtk: 12,
    baseSpeed: 0.2,
    size: 45,
    minFloor: 5,
    weight: 100,
    description: 'スライムの王。巨体でHPが高い',
    isBoss: true,
  },
  {
    id: 'goblin_chief',
    name: 'ゴブリンチーフ',
    emoji: '👑👺',
    color: '#b91c1c',       // 濃い赤
    secondaryColor: '#7f1d1d',
    baseHp: 120,
    baseAtk: 20,
    baseSpeed: 0.5,
    size: 40,
    minFloor: 10,
    weight: 100,
    description: 'ゴブリンの長。攻撃力が高い',
    isBoss: true,
  },
  {
    id: 'lich',
    name: 'リッチ',
    emoji: '👑💀',
    color: '#6b21a8',       // 紫
    secondaryColor: '#3b0764',
    baseHp: 100,
    baseAtk: 25,
    baseSpeed: 0.35,
    size: 42,
    minFloor: 15,
    weight: 100,
    description: '死霊術師。強力な魔法攻撃',
    isBoss: true,
  },
  {
    id: 'orc_warlord',
    name: 'オークウォーロード',
    emoji: '👑🐗',
    color: '#92400e',       // 濃い茶
    secondaryColor: '#78350f',
    baseHp: 250,
    baseAtk: 18,
    baseSpeed: 0.2,
    size: 50,
    minFloor: 20,
    weight: 100,
    description: 'オークの戦士長。圧倒的なHPを誇る',
    isBoss: true,
  },
  {
    id: 'dragon',
    name: 'ドラゴン',
    emoji: '🐉',
    color: '#dc2626',       // 赤
    secondaryColor: '#fbbf24',  // 金の模様
    baseHp: 300,
    baseAtk: 30,
    baseSpeed: 0.4,
    size: 55,
    minFloor: 25,
    weight: 100,
    description: '伝説の竜。全ステータスが高い',
    isBoss: true,
  },
];

// フロアがボスフロアかどうか判定（5の倍数フロア）
export function isBossFloor(floor: number): boolean {
  return floor > 0 && floor % 5 === 0;
}

// フロアに応じて出現可能な敵を取得
export function getAvailableEnemies(floor: number): EnemyType[] {
  return ENEMY_TYPES.filter(enemy => floor >= enemy.minFloor);
}

// フロアに応じて出現可能なボスを取得
export function getAvailableBosses(floor: number): EnemyType[] {
  return BOSS_TYPES.filter(boss => floor >= boss.minFloor);
}

// ボスを選択（フロアに応じた最強のボス）
export function selectBoss(floor: number): EnemyType {
  const available = getAvailableBosses(floor);
  
  if (available.length === 0) {
    return BOSS_TYPES[0]; // フォールバック: キングスライム
  }
  
  // 最も高いminFloorのボスを選択（そのフロア帯の「ボス」）
  return available[available.length - 1];
}

// 重み付きランダムで敵を選択
export function selectRandomEnemy(floor: number): EnemyType {
  const available = getAvailableEnemies(floor);
  
  if (available.length === 0) {
    return ENEMY_TYPES[0]; // フォールバック：スライム
  }
  
  const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const enemy of available) {
    random -= enemy.weight;
    if (random <= 0) {
      return enemy;
    }
  }
  
  return available[available.length - 1];
}

// フロアスケーリングでステータスを計算
export function calculateEnemyStats(enemyType: EnemyType, floor: number) {
  const floorMultiplier = 1 + (floor - 1) * 0.15;
  
  return {
    hp: Math.floor(enemyType.baseHp * floorMultiplier),
    atk: Math.floor(enemyType.baseAtk * floorMultiplier),
    speed: enemyType.baseSpeed * (1 + (floor - 1) * 0.05),
    size: enemyType.size,
  };
}
