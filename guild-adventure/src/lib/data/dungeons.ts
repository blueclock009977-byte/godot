import { DungeonData } from '../types';
import { grasslandMonsters, forestMonsters, seaMonsters, caveMonsters } from './monsters';

export const dungeons: Record<string, DungeonData> = {
  grassland: {
    id: 'grassland',
    name: '草原',
    description: '緑豊かな草原。初心者向けのダンジョン。',
    difficulty: 1,
    durationSeconds: 30,
    encounterCount: 3,
    monsters: [
      { monster: grasslandMonsters[0], weight: 50 },  // スライム
      { monster: grasslandMonsters[1], weight: 35 },  // ゴブリン
      { monster: grasslandMonsters[2], weight: 15 },  // 野犬
    ],
  },
  forest: {
    id: 'forest',
    name: '森林',
    description: '深い森の中。中級者向け。',
    difficulty: 2,
    durationSeconds: 600,  // 10分
    encounterCount: 5,
    monsters: [
      { monster: forestMonsters[0], weight: 40 },  // オーク
      { monster: forestMonsters[1], weight: 40 },  // ウルフ
      { monster: forestMonsters[2], weight: 20 },  // トレント
    ],
  },
  sea: {
    id: 'sea',
    name: '海',
    description: '危険な海域。魔法使いが活躍。',
    difficulty: 3,
    durationSeconds: 3600,  // 1時間
    encounterCount: 10,
    monsters: [
      { monster: seaMonsters[0], weight: 45 },  // マーマン
      { monster: seaMonsters[1], weight: 30 },  // クラーケン
      { monster: seaMonsters[2], weight: 25 },  // セイレーン
    ],
  },
  cave: {
    id: 'cave',
    name: '洞窟',
    description: '最も危険なダンジョン。最強の敵が待つ。',
    difficulty: 4,
    durationSeconds: 7200,  // 2時間
    encounterCount: 15,
    monsters: [
      { monster: caveMonsters[0], weight: 40 },  // ゴーレム
      { monster: caveMonsters[1], weight: 25 },  // ドラゴン
      { monster: caveMonsters[2], weight: 35 },  // リッチ
    ],
  },
};

export const dungeonList = Object.values(dungeons);
