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

// フロアに応じて出現可能な敵を取得
export function getAvailableEnemies(floor: number): EnemyType[] {
  return ENEMY_TYPES.filter(enemy => floor >= enemy.minFloor);
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
