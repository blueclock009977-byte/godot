import { Monster, Stats } from '../types';

// ============================================
// チャレンジダンジョン用モンスター定義
// ============================================
// 10Fサイクル: 9コンセプト + ボス
// 階層に応じてステータス倍率を適用

// コンセプト別基本ステータス（1-10F基準）
// 階層によって倍率がかかる

export type ChallengeConceptType = 
  | 'balanced'      // 1F: バランス型（2体）
  | 'physResist'    // 2F: 物理耐性（1体）
  | 'magResist'     // 3F: 魔法耐性（1体）
  | 'highAgi'       // 4F: 高AGI・回避（3体）
  | 'highAtk'       // 5F: 高火力（2体）
  | 'debuff'        // 6F: デバフ型（4体）
  | 'regen'         // 7F: 再生型（1体）
  | 'mixedResist'   // 8F: 複合耐性（2体）
  | 'hpWall'        // 9F: 高HP壁（1体）
  | 'boss';         // 10F: ボス（1体）

// コンセプト別敵の数
export const CONCEPT_ENEMY_COUNT: Record<ChallengeConceptType, number> = {
  balanced: 2,
  physResist: 1,
  magResist: 1,
  highAgi: 3,
  highAtk: 2,
  debuff: 4,
  regen: 1,
  mixedResist: 2,
  hpWall: 1,
  boss: 1,
};

// 階層からコンセプトを取得（10Fサイクル）
export function getConceptForFloor(floor: number): ChallengeConceptType {
  const mod = floor % 10;
  switch (mod) {
    case 1: return 'balanced';
    case 2: return 'physResist';
    case 3: return 'magResist';
    case 4: return 'highAgi';
    case 5: return 'highAtk';
    case 6: return 'debuff';
    case 7: return 'regen';
    case 8: return 'mixedResist';
    case 9: return 'hpWall';
    case 0: return 'boss';  // 10, 20, 30...
    default: return 'balanced';
  }
}

// 階層からステータス倍率を取得
export function getStatMultiplierForFloor(floor: number): number {
  const tier = Math.floor((floor - 1) / 10);  // 0-9 → tier 0, 10-19 → tier 1, ...
  const multipliers = [1.0, 1.5, 2.2, 3.0, 3.8, 4.6, 5.4, 6.2, 7.5, 9.0];
  return multipliers[Math.min(tier, 9)];
}

// コンセプト別基本モンスターデータ（1-10F基準）
interface BaseMonsterData {
  name: string;
  species: 'beast' | 'humanoid' | 'undead' | 'demon' | 'dragon';
  element?: string;
  stats: Stats;
  physicalResist?: number;
  magicResist?: number;
  skills?: Monster['skills'];
  regenPerTurn?: number;  // 再生型用：毎ターンHP回復率（%）
}

// バランス型（2体）- 標準的な敵
const balancedMonsters: BaseMonsterData[] = [
  {
    name: 'ガーディアン',
    species: 'humanoid',
    stats: { hp: 60, maxHp: 60, mp: 0, maxMp: 0, atk: 12, def: 8, agi: 10, mag: 0 },
  },
  {
    name: 'ウォーリア',
    species: 'humanoid',
    stats: { hp: 55, maxHp: 55, mp: 0, maxMp: 0, atk: 14, def: 6, agi: 12, mag: 0 },
  },
];

// 物理耐性（1体）- 物理50%軽減
const physResistMonsters: BaseMonsterData[] = [
  {
    name: 'アイアンゴーレム',
    species: 'beast',
    element: 'earth',
    stats: { hp: 100, maxHp: 100, mp: 0, maxMp: 0, atk: 15, def: 20, agi: 5, mag: 0 },
    physicalResist: 50,
  },
];

// 魔法耐性（1体）- 魔法50%軽減
const magResistMonsters: BaseMonsterData[] = [
  {
    name: 'スペルイーター',
    species: 'demon',
    element: 'dark',
    stats: { hp: 80, maxHp: 80, mp: 50, maxMp: 50, atk: 10, def: 8, agi: 12, mag: 20 },
    magicResist: 50,
  },
];

// 高AGI・回避（3体）- 素早い
const highAgiMonsters: BaseMonsterData[] = [
  {
    name: 'シャドウ',
    species: 'undead',
    element: 'dark',
    stats: { hp: 35, maxHp: 35, mp: 0, maxMp: 0, atk: 10, def: 3, agi: 30, mag: 0 },
  },
  {
    name: 'ウィンドスプライト',
    species: 'beast',
    element: 'wind',
    stats: { hp: 30, maxHp: 30, mp: 20, maxMp: 20, atk: 8, def: 2, agi: 35, mag: 12 },
  },
  {
    name: 'ファントム',
    species: 'undead',
    element: 'dark',
    stats: { hp: 32, maxHp: 32, mp: 0, maxMp: 0, atk: 9, def: 2, agi: 32, mag: 0 },
  },
];

// 高火力（2体）- 高ATK
const highAtkMonsters: BaseMonsterData[] = [
  {
    name: 'バーサーカー',
    species: 'humanoid',
    element: 'fire',
    stats: { hp: 50, maxHp: 50, mp: 0, maxMp: 0, atk: 25, def: 5, agi: 15, mag: 0 },
  },
  {
    name: 'フレイムドラゴン',
    species: 'dragon',
    element: 'fire',
    stats: { hp: 55, maxHp: 55, mp: 30, maxMp: 30, atk: 22, def: 8, agi: 12, mag: 18 },
  },
];

// デバフ型（4体）- 状態異常攻撃
const debuffMonsters: BaseMonsterData[] = [
  {
    name: 'ポイズンスライム',
    species: 'beast',
    element: 'water',
    stats: { hp: 25, maxHp: 25, mp: 20, maxMp: 20, atk: 6, def: 3, agi: 8, mag: 10 },
    skills: [{
      id: 'poison_touch',
      name: '毒の触手',
      description: '毒を与える',
      type: 'debuff',
      target: 'single',
      multiplier: 0.5,
      mpCost: 5,
      effect: { type: 'poison' as any, value: 10, duration: 3 },
    }],
  },
  {
    name: 'カースウィッチ',
    species: 'humanoid',
    element: 'dark',
    stats: { hp: 28, maxHp: 28, mp: 30, maxMp: 30, atk: 5, def: 4, agi: 10, mag: 15 },
    skills: [{
      id: 'curse',
      name: '呪い',
      description: 'ATKを下げる',
      type: 'debuff',
      target: 'single',
      multiplier: 0,
      mpCost: 8,
      effect: { type: 'atkDown' as any, value: 30, duration: 3 },
    }],
  },
  {
    name: 'フロストスピリット',
    species: 'beast',
    element: 'ice',
    stats: { hp: 26, maxHp: 26, mp: 25, maxMp: 25, atk: 7, def: 3, agi: 12, mag: 12 },
    skills: [{
      id: 'freeze',
      name: '凍結',
      description: 'AGIを下げる',
      type: 'debuff',
      target: 'single',
      multiplier: 0,
      mpCost: 6,
      effect: { type: 'agiDown' as any, value: 40, duration: 2 },
    }],
  },
  {
    name: 'ダークインプ',
    species: 'demon',
    element: 'dark',
    stats: { hp: 24, maxHp: 24, mp: 20, maxMp: 20, atk: 8, def: 2, agi: 14, mag: 10 },
  },
];

// 再生型（1体）- 毎ターンHP回復
const regenMonsters: BaseMonsterData[] = [
  {
    name: 'トロール',
    species: 'humanoid',
    stats: { hp: 120, maxHp: 120, mp: 0, maxMp: 0, atk: 16, def: 10, agi: 6, mag: 0 },
    regenPerTurn: 10,  // 毎ターン最大HPの10%回復
  },
];

// 複合耐性（2体）- 物理+魔法両方軽減
const mixedResistMonsters: BaseMonsterData[] = [
  {
    name: 'エンシェントガーディアン',
    species: 'beast',
    element: 'earth',
    stats: { hp: 90, maxHp: 90, mp: 20, maxMp: 20, atk: 14, def: 15, agi: 8, mag: 10 },
    physicalResist: 30,
    magicResist: 30,
  },
  {
    name: 'ルーンナイト',
    species: 'humanoid',
    stats: { hp: 85, maxHp: 85, mp: 30, maxMp: 30, atk: 12, def: 12, agi: 10, mag: 12 },
    physicalResist: 25,
    magicResist: 25,
  },
];

// 高HP壁（1体）- 超耐久、低火力
const hpWallMonsters: BaseMonsterData[] = [
  {
    name: 'コロッサス',
    species: 'beast',
    element: 'earth',
    stats: { hp: 250, maxHp: 250, mp: 0, maxMp: 0, atk: 8, def: 25, agi: 3, mag: 0 },
    physicalResist: 20,
  },
];

// ボス（1体）- 複合能力、高ステ
const bossMonsters: BaseMonsterData[] = [
  {
    name: 'フロアガーディアン',
    species: 'demon',
    stats: { hp: 150, maxHp: 150, mp: 50, maxMp: 50, atk: 20, def: 15, agi: 15, mag: 15 },
    physicalResist: 15,
    magicResist: 15,
    skills: [{
      id: 'boss_smash',
      name: '破壊の一撃',
      description: '全体攻撃',
      type: 'attack',
      target: 'all',
      multiplier: 0.8,
      mpCost: 20,
    }],
  },
];

// コンセプト別モンスターマップ
const CONCEPT_MONSTERS: Record<ChallengeConceptType, BaseMonsterData[]> = {
  balanced: balancedMonsters,
  physResist: physResistMonsters,
  magResist: magResistMonsters,
  highAgi: highAgiMonsters,
  highAtk: highAtkMonsters,
  debuff: debuffMonsters,
  regen: regenMonsters,
  mixedResist: mixedResistMonsters,
  hpWall: hpWallMonsters,
  boss: bossMonsters,
};

// 階層用のモンスターを生成
export function generateChallengeMonsters(floor: number): Monster[] {
  const concept = getConceptForFloor(floor);
  const multiplier = getStatMultiplierForFloor(floor);
  const count = CONCEPT_ENEMY_COUNT[concept];
  const baseMonsters = CONCEPT_MONSTERS[concept];
  
  const result: Monster[] = [];
  
  for (let i = 0; i < count; i++) {
    // 基本モンスターからランダムに選択（ボス以外は複数体の場合あり）
    const baseIndex = i % baseMonsters.length;
    const base = baseMonsters[baseIndex];
    
    // ステータスに倍率を適用
    const scaledStats: Stats = {
      hp: Math.floor(base.stats.hp * multiplier),
      maxHp: Math.floor(base.stats.maxHp * multiplier),
      mp: Math.floor(base.stats.mp * multiplier),
      maxMp: Math.floor(base.stats.maxMp * multiplier),
      atk: Math.floor(base.stats.atk * multiplier),
      def: Math.floor(base.stats.def * multiplier),
      agi: Math.floor(base.stats.agi * multiplier),
      mag: Math.floor(base.stats.mag * multiplier),
    };
    
    // 階層に応じた名前（例: "アイアンゴーレム Lv3"）
    const tier = Math.floor((floor - 1) / 10) + 1;
    const name = tier > 1 ? `${base.name} Lv${tier}` : base.name;
    
    const monster: Monster = {
      id: `challenge_${concept}_${floor}_${i}`,
      name,
      species: base.species,
      element: base.element as any,
      stats: scaledStats,
      physicalResist: base.physicalResist,
      magicResist: base.magicResist,
      skills: base.skills,
    };
    
    // 再生型の場合は特殊フラグを付ける（バトルエンジンで処理）
    if (base.regenPerTurn) {
      (monster as any).regenPerTurn = base.regenPerTurn;
    }
    
    result.push(monster);
  }
  
  return result;
}

// 100Fの最終ボス（特別仕様）
export function getFinalBoss(): Monster {
  return {
    id: 'challenge_final_boss',
    name: 'ダンジョンの支配者',
    species: 'dragon',
    element: 'dark',
    stats: {
      hp: 2000,
      maxHp: 2000,
      mp: 200,
      maxMp: 200,
      atk: 180,
      def: 120,
      agi: 100,
      mag: 150,
    },
    physicalResist: 30,
    magicResist: 30,
    elementModifier: {
      fire: 20,
      water: 20,
      wind: 20,
      earth: 20,
      light: -20,  // 光弱点
      dark: 50,    // 闘耐性
    },
    skills: [
      {
        id: 'ultimate_destruction',
        name: '終焉の業火',
        description: '全体に大ダメージ',
        type: 'magic',
        target: 'all',
        multiplier: 1.5,
        mpCost: 50,
        element: 'fire',
      },
      {
        id: 'dark_aura',
        name: '闇のオーラ',
        description: '全体のステータスを下げる',
        type: 'debuff',
        target: 'all',
        multiplier: 0,
        mpCost: 30,
        effect: { type: 'statDown' as any, value: 20, duration: 3 },
      },
    ],
  };
}

// 階層情報を取得
export interface FloorInfo {
  floor: number;
  concept: ChallengeConceptType;
  conceptName: string;
  enemyCount: number;
  statMultiplier: number;
}

const CONCEPT_NAMES: Record<ChallengeConceptType, string> = {
  balanced: 'バランス型',
  physResist: '物理耐性',
  magResist: '魔法耐性',
  highAgi: '高AGI・回避',
  highAtk: '高火力',
  debuff: 'デバフ型',
  regen: '再生型',
  mixedResist: '複合耐性',
  hpWall: '高HP壁',
  boss: 'ボス',
};

export function getFloorInfo(floor: number): FloorInfo {
  const concept = getConceptForFloor(floor);
  return {
    floor,
    concept,
    conceptName: CONCEPT_NAMES[concept],
    enemyCount: CONCEPT_ENEMY_COUNT[concept],
    statMultiplier: getStatMultiplierForFloor(floor),
  };
}
