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
// 難易度カーブ: 洞窟100%クリアで25F目安
export function getStatMultiplierForFloor(floor: number): number {
  // 1-3F: 草原レベル (×0.4〜0.55)
  if (floor <= 3) {
    return 0.4 + (floor - 1) * 0.075;  // 0.4, 0.475, 0.55
  }
  // 4-10F: 森レベル (×0.75〜2.2)
  if (floor <= 10) {
    return 0.55 + (floor - 3) * 0.24;  // 0.79〜2.2
  }
  // 11-25F: 洞窟〜海レベル (×2.5〜6.5)
  if (floor <= 25) {
    return 2.2 + (floor - 10) * 0.29;  // 2.5〜6.5
  }
  // 26-40F: 海〜砂漠レベル (×6.8〜11.0)
  if (floor <= 40) {
    return 6.5 + (floor - 25) * 0.3;  // 6.8〜11.0
  }
  // 41-60F: 火山〜雪原レベル (×11.3〜18.0)
  if (floor <= 60) {
    return 11.0 + (floor - 40) * 0.35;  // 11.35〜18.0
  }
  // 61-80F: 神殿レベル (×18.5〜28.0)
  if (floor <= 80) {
    return 18.0 + (floor - 60) * 0.5;  // 18.5〜28.0
  }
  // 81-100F: 限界突破 (×28.5〜45.0)
  return 28.0 + (floor - 80) * 0.85;  // 28.85〜45.0
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
// 基準: 1F(×0.4)で草原スライムレベル(HP20,ATK3)
const balancedMonsters: BaseMonsterData[] = [
  {
    name: '聖騎士',
    species: 'humanoid',
    element: 'light',
    stats: { hp: 50, maxHp: 50, mp: 10, maxMp: 10, atk: 8, def: 5, agi: 6, mag: 3 },
  },
  {
    name: 'ウォーリア',
    species: 'humanoid',
    stats: { hp: 55, maxHp: 55, mp: 0, maxMp: 0, atk: 7, def: 4, agi: 8, mag: 0 },
  },
];

// 物理耐性（1体）- 物理50%軽減 + 防御系スキル
// 基準: 2F(×0.5)で草原レベル、耐性で難易度UP
const physResistMonsters: BaseMonsterData[] = [
  {
    name: 'アイアンゴーレム',
    species: 'beast',
    element: 'earth',
    stats: { hp: 80, maxHp: 80, mp: 20, maxMp: 20, atk: 6, def: 15, agi: 3, mag: 5 },
    physicalResist: 50,
    skills: [{
      id: 'earth_slam',
      name: '大地の一撃',
      description: '土属性の重い一撃',
      type: 'attack',
      element: 'earth',
      target: 'single',
      multiplier: 1.3,
      mpCost: 10,
    }],
  },
];

// 魔法耐性（1体）- 魔法50%軽減 + 魔法攻撃
// 基準: 3F(×0.6)で草原ボスレベル、耐性で難易度UP
const magResistMonsters: BaseMonsterData[] = [
  {
    name: 'スペルイーター',
    species: 'demon',
    element: 'dark',
    stats: { hp: 70, maxHp: 70, mp: 40, maxMp: 40, atk: 5, def: 6, agi: 8, mag: 12 },
    magicResist: 50,
    skills: [{
      id: 'dark_bolt',
      name: '闇の矢',
      description: '闇属性魔法攻撃',
      type: 'magic',
      element: 'dark',
      target: 'single',
      multiplier: 1.2,
      mpCost: 10,
    }],
  },
];

// 高AGI・回避（3体）- 素早い + 速攻スキル
// 基準: 4F(×0.8)で森レベル、高AGIで回避
const highAgiMonsters: BaseMonsterData[] = [
  {
    name: 'シャドウ',
    species: 'undead',
    element: 'dark',
    stats: { hp: 30, maxHp: 30, mp: 15, maxMp: 15, atk: 6, def: 2, agi: 25, mag: 5 },
    skills: [{
      id: 'shadow_strike',
      name: '影撃ち',
      description: '闇属性の素早い一撃',
      type: 'hybrid',
      element: 'dark',
      target: 'single',
      multiplier: 1.0,
      mpCost: 8,
    }],
  },
  {
    name: 'ウィンドスプライト',
    species: 'beast',
    element: 'wind',
    stats: { hp: 25, maxHp: 25, mp: 20, maxMp: 20, atk: 5, def: 2, agi: 30, mag: 10 },
    skills: [{
      id: 'gust',
      name: '突風',
      description: '風属性魔法攻撃',
      type: 'magic',
      element: 'wind',
      target: 'single',
      multiplier: 1.0,
      mpCost: 8,
    }],
  },
  {
    name: 'ファントム',
    species: 'undead',
    element: 'dark',
    stats: { hp: 28, maxHp: 28, mp: 10, maxMp: 10, atk: 5, def: 2, agi: 28, mag: 3 },
    skills: [{
      id: 'life_drain',
      name: '生命吸収',
      description: 'HP吸収攻撃',
      type: 'attack',
      target: 'single',
      multiplier: 0.8,
      mpCost: 10,
      // 吸収効果はengine側で処理
    }],
  },
];

// 高火力（2体）- 高ATK + 属性スキル
// 基準: 5F(×1.0)で森レベル、高ATKで圧力
const highAtkMonsters: BaseMonsterData[] = [
  {
    name: 'バーサーカー',
    species: 'humanoid',
    element: 'fire',
    stats: { hp: 40, maxHp: 40, mp: 15, maxMp: 15, atk: 14, def: 3, agi: 10, mag: 5 },
    skills: [{
      id: 'rage_strike',
      name: '怒りの一撃',
      description: '高威力物理攻撃',
      type: 'attack',
      target: 'single',
      multiplier: 1.5,
      mpCost: 10,
    }],
  },
  {
    name: 'フレイムドラゴン',
    species: 'dragon',
    element: 'fire',
    stats: { hp: 45, maxHp: 45, mp: 25, maxMp: 25, atk: 12, def: 5, agi: 8, mag: 12 },
    skills: [{
      id: 'fire_breath',
      name: '火炎ブレス',
      description: '全体火属性攻撃',
      type: 'magic',
      element: 'fire',
      target: 'all',
      multiplier: 0.8,
      mpCost: 12,
    }],
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
    stats: { hp: 24, maxHp: 24, mp: 25, maxMp: 25, atk: 8, def: 2, agi: 14, mag: 12 },
    skills: [{
      id: 'dark_fire',
      name: '暗黒の炎',
      description: '闇属性魔法攻撃',
      type: 'magic',
      element: 'dark',
      target: 'single',
      multiplier: 1.0,
      mpCost: 8,
    }],
  },
];

// 再生型（1体）- 毎ターンHP回復 + 回復スキル
// 基準: 7F(×1.4)で森レベル、再生で持久戦
const regenMonsters: BaseMonsterData[] = [
  {
    name: 'トロール',
    species: 'humanoid',
    stats: { hp: 80, maxHp: 80, mp: 20, maxMp: 20, atk: 8, def: 6, agi: 4, mag: 3 },
    regenPerTurn: 10,  // 毎ターン最大HPの10%回復
    skills: [{
      id: 'rage_howl',
      name: '咆哮',
      description: '自身のATKを上げる',
      type: 'buff',
      multiplier: 0,
      target: 'self',
      mpCost: 10,
      effect: { type: 'atkUp' as any, value: 30, duration: 3 },
    }],
  },
];

// 複合耐性（2体）- 物理+魔法両方軽減 + 属性スキル
// 基準: 8F(×1.6)で森〜洞窟レベル、両耐性で難敵
const mixedResistMonsters: BaseMonsterData[] = [
  {
    name: 'エンシェントガーディアン',
    species: 'beast',
    element: 'earth',
    stats: { hp: 60, maxHp: 60, mp: 25, maxMp: 25, atk: 7, def: 10, agi: 5, mag: 8 },
    physicalResist: 30,
    magicResist: 30,
    skills: [{
      id: 'ancient_curse',
      name: '古代の呪い',
      description: 'DEFを下げる',
      type: 'debuff',
      target: 'single',
      multiplier: 0,
      mpCost: 10,
      effect: { type: 'defDown' as any, value: 25, duration: 3 },
    }],
  },
  {
    name: 'ルーンナイト',
    species: 'humanoid',
    stats: { hp: 55, maxHp: 55, mp: 30, maxMp: 30, atk: 6, def: 8, agi: 6, mag: 10 },
    physicalResist: 25,
    magicResist: 25,
    skills: [{
      id: 'rune_blast',
      name: 'ルーンブラスト',
      description: '魔法攻撃',
      type: 'magic',
      target: 'single',
      multiplier: 1.2,
      mpCost: 12,
    }],
  },
];

// 高HP壁（1体）- 超耐久、低火力 + 防御スキル
// 基準: 9F(×1.8)で洞窟手前、高HPで持久戦
const hpWallMonsters: BaseMonsterData[] = [
  {
    name: 'コロッサス',
    species: 'beast',
    element: 'earth',
    stats: { hp: 150, maxHp: 150, mp: 20, maxMp: 20, atk: 5, def: 15, agi: 2, mag: 3 },
    physicalResist: 20,
    skills: [{
      id: 'stone_skin',
      name: '石化の皮膚',
      description: '自身のDEFを上げる',
      type: 'buff',
      multiplier: 0,
      target: 'self',
      mpCost: 10,
      effect: { type: 'defUp' as any, value: 50, duration: 3 },
    }],
  },
];

// ボス（1体）- 複合能力、高ステ、複数スキル
// 基準: 10F(×2.0)で森ボス相当(HP300,ATK18)
const bossMonsters: BaseMonsterData[] = [
  {
    name: 'フロアガーディアン',
    species: 'demon',
    element: 'dark',
    stats: { hp: 150, maxHp: 150, mp: 50, maxMp: 50, atk: 9, def: 12, agi: 5, mag: 12 },
    physicalResist: 15,
    magicResist: 15,
    skills: [
      {
        id: 'boss_smash',
        name: '破壊の一撃',
        description: '全体物理攻撃',
        type: 'attack',
        target: 'all',
        multiplier: 0.7,
        mpCost: 12,
      },
      {
        id: 'dark_wave',
        name: '闇の波動',
        description: '全体闇属性魔法攻撃',
        type: 'magic',
        element: 'dark',
        target: 'all',
        multiplier: 0.8,
        mpCost: 15,
      },
      {
        id: 'boss_roar',
        name: '威圧の咆哮',
        description: '全体のATKを下げる',
        type: 'debuff',
        target: 'all',
        multiplier: 0,
        mpCost: 10,
        effect: { type: 'atkDown' as any, value: 20, duration: 2 },
      },
    ],
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
      regenPerTurn: base.regenPerTurn,  // 再生型用
    };
    
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
