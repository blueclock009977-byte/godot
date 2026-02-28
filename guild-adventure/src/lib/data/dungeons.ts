import { DungeonData } from '../types';
import { monstersByDungeon } from './monsters';

export const dungeons: Record<string, DungeonData> = {
  grassland: {
    id: 'grassland',
    name: '草原',
    description: '緑豊かな草原。冒険の始まり。',
    difficulty: 1,
    recommendedPlayers: 2,
    durationSeconds: 30,
    encounterCount: 3,
    monsters: [
      { monster: monstersByDungeon.grassland.monsters[0], weight: 50 },
      { monster: monstersByDungeon.grassland.monsters[1], weight: 35 },
      { monster: monstersByDungeon.grassland.monsters[2], weight: 15 },
    ],
    boss: monstersByDungeon.grassland.boss,
    coinReward: 1,
  },
  forest: {
    id: 'forest',
    name: '森林',
    description: '深い森。回避の高い敵が多い。先制重要。',
    difficulty: 2,
    recommendedPlayers: 4,
    durationSeconds: 600, // 10分
    encounterCount: 5,
    monsters: [
      { monster: monstersByDungeon.forest.monsters[0], weight: 40 },
      { monster: monstersByDungeon.forest.monsters[1], weight: 35 },
      { monster: monstersByDungeon.forest.monsters[2], weight: 25 },
    ],
    boss: monstersByDungeon.forest.boss,
    coinReward: 3,
  },
  cave: {
    id: 'cave',
    name: '洞窟',
    description: '暗い洞窟。ゴーレム系は物理耐性高＆魔法弱点。魔法で攻めよう！',
    difficulty: 3,
    recommendedPlayers: 5,
    durationSeconds: 1800, // 30分
    encounterCount: 5,
    monsters: [
      { monster: monstersByDungeon.cave.monsters[0], weight: 35 },
      { monster: monstersByDungeon.cave.monsters[1], weight: 40 },
      { monster: monstersByDungeon.cave.monsters[2], weight: 25 },
    ],
    boss: monstersByDungeon.cave.boss,
    coinReward: 5,
  },
  sea: {
    id: 'sea',
    name: '海',
    description: '危険な海域。水属性敵多数。火魔法が有効！',
    difficulty: 4,
    recommendedPlayers: 6,
    durationSeconds: 3600, // 60分
    encounterCount: 7,
    monsters: [
      { monster: monstersByDungeon.sea.monsters[0], weight: 40 },
      { monster: monstersByDungeon.sea.monsters[1], weight: 30 },
      { monster: monstersByDungeon.sea.monsters[2], weight: 30 },
    ],
    boss: monstersByDungeon.sea.boss,
    coinReward: 8,
  },
  desert: {
    id: 'desert',
    name: '砂漠',
    description: '灼熱の砂漠。土属性敵多数。水魔法が有効！',
    difficulty: 5,
    recommendedPlayers: 6,
    durationSeconds: 3600, // 1時間
    encounterCount: 7,
    monsters: [
      { monster: monstersByDungeon.desert.monsters[0], weight: 35 },
      { monster: monstersByDungeon.desert.monsters[1], weight: 40 },
      { monster: monstersByDungeon.desert.monsters[2], weight: 25 },
    ],
    boss: monstersByDungeon.desert.boss,
    coinReward: 10,
  },
  volcano: {
    id: 'volcano',
    name: '火山',
    description: '煮えたぎる火山。火属性敵は火耐性極高。水魔法必須！',
    difficulty: 6,
    recommendedPlayers: 6,
    durationSeconds: 3600, // 1時間
    encounterCount: 10,
    monsters: [
      { monster: monstersByDungeon.volcano.monsters[0], weight: 35 },
      { monster: monstersByDungeon.volcano.monsters[1], weight: 35 },
      { monster: monstersByDungeon.volcano.monsters[2], weight: 30 },
    ],
    boss: monstersByDungeon.volcano.boss,
    coinReward: 13,
  },
  snowfield: {
    id: 'snowfield',
    name: '雪原',
    description: '極寒の雪原。水属性敵多数、魔法耐性あり。火魔法が有効！',
    difficulty: 7,
    recommendedPlayers: 6,
    durationSeconds: 3600, // 1時間
    encounterCount: 10,
    monsters: [
      { monster: monstersByDungeon.snowfield.monsters[0], weight: 35 },
      { monster: monstersByDungeon.snowfield.monsters[1], weight: 35 },
      { monster: monstersByDungeon.snowfield.monsters[2], weight: 30 },
    ],
    boss: monstersByDungeon.snowfield.boss,
    coinReward: 16,
  },
  temple: {
    id: 'temple',
    name: '神殿',
    description: '古代の神殿。全てのギミックが待ち受ける。最高難度。',
    difficulty: 8,
    recommendedPlayers: 6,
    durationSeconds: 3600, // 1時間
    encounterCount: 15,
    monsters: [
      { monster: monstersByDungeon.temple.monsters[0], weight: 35 },
      { monster: monstersByDungeon.temple.monsters[1], weight: 30 },
      { monster: monstersByDungeon.temple.monsters[2], weight: 35 },
    ],
    boss: monstersByDungeon.temple.boss,
    coinReward: 20,
  },
};

export const dungeonList = Object.values(dungeons);
