import { DungeonData } from '../types';
import { monstersByDungeon } from './monsters';

export const dungeons: Record<string, DungeonData> = {
  grassland: {
    id: 'grassland',
    name: '草原',
    description: '緑豊かな草原。冒険の始まり。【3人推奨】',
    difficulty: 1,
    durationSeconds: 30,
    encounterCount: 3,
    monsters: [
      { monster: monstersByDungeon.grassland.monsters[0], weight: 50 },
      { monster: monstersByDungeon.grassland.monsters[1], weight: 35 },
      { monster: monstersByDungeon.grassland.monsters[2], weight: 15 },
    ],
    boss: monstersByDungeon.grassland.boss,
  },
  forest: {
    id: 'forest',
    name: '森林',
    description: '深い森。回避の高い敵が多い。【6人推奨・先制重要】',
    difficulty: 2,
    durationSeconds: 600, // 10分
    encounterCount: 5,
    monsters: [
      { monster: monstersByDungeon.forest.monsters[0], weight: 40 },
      { monster: monstersByDungeon.forest.monsters[1], weight: 35 },
      { monster: monstersByDungeon.forest.monsters[2], weight: 25 },
    ],
    boss: monstersByDungeon.forest.boss,
  },
  cave: {
    id: 'cave',
    name: '洞窟',
    description: '暗い洞窟。高防御の敵が多い。【物理攻撃が有効】',
    difficulty: 3,
    durationSeconds: 3600, // 1時間
    encounterCount: 5,
    monsters: [
      { monster: monstersByDungeon.cave.monsters[0], weight: 35 },
      { monster: monstersByDungeon.cave.monsters[1], weight: 40 },
      { monster: monstersByDungeon.cave.monsters[2], weight: 25 },
    ],
    boss: monstersByDungeon.cave.boss,
  },
  sea: {
    id: 'sea',
    name: '海',
    description: '危険な海域。物理耐性の敵が多い。【魔法攻撃が有効】',
    difficulty: 4,
    durationSeconds: 7200, // 2時間
    encounterCount: 7,
    monsters: [
      { monster: monstersByDungeon.sea.monsters[0], weight: 40 },
      { monster: monstersByDungeon.sea.monsters[1], weight: 30 },
      { monster: monstersByDungeon.sea.monsters[2], weight: 30 },
    ],
    boss: monstersByDungeon.sea.boss,
  },
  desert: {
    id: 'desert',
    name: '砂漠',
    description: '灼熱の砂漠。分裂する敵が多い。【連続攻撃が有効】',
    difficulty: 5,
    durationSeconds: 7200, // 2時間
    encounterCount: 7,
    monsters: [
      { monster: monstersByDungeon.desert.monsters[0], weight: 35 },
      { monster: monstersByDungeon.desert.monsters[1], weight: 40 },
      { monster: monstersByDungeon.desert.monsters[2], weight: 25 },
    ],
    boss: monstersByDungeon.desert.boss,
  },
  volcano: {
    id: 'volcano',
    name: '火山',
    description: '煮えたぎる火山。再生する敵が多い。【必殺攻撃が有効】',
    difficulty: 6,
    durationSeconds: 7200, // 2時間
    encounterCount: 10,
    monsters: [
      { monster: monstersByDungeon.volcano.monsters[0], weight: 35 },
      { monster: monstersByDungeon.volcano.monsters[1], weight: 35 },
      { monster: monstersByDungeon.volcano.monsters[2], weight: 30 },
    ],
    boss: monstersByDungeon.volcano.boss,
  },
  snowfield: {
    id: 'snowfield',
    name: '雪原',
    description: '極寒の雪原。凍結攻撃に注意。【状態異常耐性が重要】',
    difficulty: 7,
    durationSeconds: 7200, // 2時間
    encounterCount: 10,
    monsters: [
      { monster: monstersByDungeon.snowfield.monsters[0], weight: 35 },
      { monster: monstersByDungeon.snowfield.monsters[1], weight: 35 },
      { monster: monstersByDungeon.snowfield.monsters[2], weight: 30 },
    ],
    boss: monstersByDungeon.snowfield.boss,
  },
  temple: {
    id: 'temple',
    name: '神殿',
    description: '古代の神殿。全てのギミックが待ち受ける。【最高難度】',
    difficulty: 8,
    durationSeconds: 7200, // 2時間
    encounterCount: 15,
    monsters: [
      { monster: monstersByDungeon.temple.monsters[0], weight: 35 },
      { monster: monstersByDungeon.temple.monsters[1], weight: 30 },
      { monster: monstersByDungeon.temple.monsters[2], weight: 35 },
    ],
    boss: monstersByDungeon.temple.boss,
  },
};

export const dungeonList = Object.values(dungeons);
