// アイテム定義
import { pickRandom, findById } from '../utils';

export type ItemRarity = 'normal' | 'rare';

export interface ItemData {
  id: string;
  name: string;
  description: string;
  type: 'raceTicket' | 'jobBook' | 'raceTreasure' | 'jobTreasure';
  rarity: ItemRarity;
  unlocks: string; // 解放する種族ID or 職業ID、秘宝の場合は対象種族/職業ID
}

// 種族チケット（全16種族）
export const raceTickets: ItemData[] = [
  { id: 'ticket_human', name: '人間の血統書', description: '人間を作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'human' },
  { id: 'ticket_elf', name: 'エルフの血統書', description: 'エルフを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'elf' },
  { id: 'ticket_dwarf', name: 'ドワーフの血統書', description: 'ドワーフを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'dwarf' },
  { id: 'ticket_halfling', name: 'ハーフリングの血統書', description: 'ハーフリングを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'halfling' },
  { id: 'ticket_orc', name: 'オークの血統書', description: 'オークを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'orc' },
  { id: 'ticket_lizardman', name: 'リザードマンの血統書', description: 'リザードマンを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'lizardman' },
  { id: 'ticket_fairy', name: 'フェアリーの血統書', description: 'フェアリーを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'fairy' },
  { id: 'ticket_undead', name: 'アンデッドの血統書', description: 'アンデッドを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'undead' },
  { id: 'ticket_goblin', name: 'ゴブリンの血統書', description: 'ゴブリンを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'goblin' },
  { id: 'ticket_dragonewt', name: 'ドラゴニュートの血統書', description: 'ドラゴニュートを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'dragonewt' },
  { id: 'ticket_angel', name: 'エンジェルの血統書', description: 'エンジェルを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'angel' },
  { id: 'ticket_demon', name: 'デーモンの血統書', description: 'デーモンを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'demon' },
  { id: 'ticket_genasi', name: 'ジェナシの血統書', description: 'ジェナシを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'genasi' },
  { id: 'ticket_aasimar', name: 'アアシマールの血統書', description: 'アアシマールを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'aasimar' },
  { id: 'ticket_tiefling', name: 'ティーフリングの血統書', description: 'ティーフリングを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'tiefling' },
  { id: 'ticket_dhampir', name: 'ダンピールの血統書', description: 'ダンピールを作成可能にする', type: 'raceTicket', rarity: 'normal', unlocks: 'dhampir' },
];

// 職業書（全20職業）
export const jobBooks: ItemData[] = [
  { id: 'book_warrior', name: '戦士の指南書', description: '戦士を作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'warrior' },
  { id: 'book_mage', name: '魔法使いの指南書', description: '魔法使いを作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'mage' },
  { id: 'book_priest', name: '司祭の指南書', description: '司祭を作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'priest' },
  { id: 'book_thief', name: '盗賊の指南書', description: '盗賊を作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'thief' },
  { id: 'book_knight', name: '騎士の指南書', description: '騎士を作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'knight' },
  { id: 'book_hunter', name: '狩人の指南書', description: '狩人を作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'hunter' },
  { id: 'book_ninja', name: '忍者の指南書', description: '忍者を作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'ninja' },
  { id: 'book_sage', name: '賢者の指南書', description: '賢者を作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'sage' },
  { id: 'book_berserker', name: 'バーサーカーの指南書', description: 'バーサーカーを作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'berserker' },
  { id: 'book_paladin', name: 'パラディンの指南書', description: 'パラディンを作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'paladin' },
  { id: 'book_necromancer', name: 'ネクロマンサーの指南書', description: 'ネクロマンサーを作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'necromancer' },
  { id: 'book_monk', name: 'モンクの指南書', description: 'モンクを作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'monk' },
  { id: 'book_ranger', name: 'レンジャーの指南書', description: 'レンジャーを作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'ranger' },
  { id: 'book_samurai', name: 'サムライの指南書', description: 'サムライを作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'samurai' },
  { id: 'book_witch', name: 'ウィッチの指南書', description: 'ウィッチを作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'witch' },
  { id: 'book_bard', name: 'バードの指南書', description: 'バードを作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'bard' },
  { id: 'book_spellblade', name: '魔法剣士の指南書', description: '魔法剣士を作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'spellblade' },
  { id: 'book_battlemage', name: '戦闘魔導士の指南書', description: '戦闘魔導士を作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'battlemage' },
  { id: 'book_runesmith', name: '符術士の指南書', description: '符術士を作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'runesmith' },
  { id: 'book_redmage', name: '赤魔道士の指南書', description: '赤魔道士を作成可能にする', type: 'jobBook', rarity: 'normal', unlocks: 'redmage' },
];

// ============================================
// 秘宝（レア枠）- 対象種族/職業のキャラに使うとステータス大幅UP
// ============================================

// 種族秘宝（全16種族）- HP+50,MP+20,他+10
export const raceTreasures: ItemData[] = [
  { id: 'treasure_human', name: '人間の秘宝', description: '人間のキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'human' },
  { id: 'treasure_elf', name: 'エルフの秘宝', description: 'エルフのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'elf' },
  { id: 'treasure_dwarf', name: 'ドワーフの秘宝', description: 'ドワーフのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'dwarf' },
  { id: 'treasure_halfling', name: 'ハーフリングの秘宝', description: 'ハーフリングのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'halfling' },
  { id: 'treasure_orc', name: 'オークの秘宝', description: 'オークのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'orc' },
  { id: 'treasure_lizardman', name: 'リザードマンの秘宝', description: 'リザードマンのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'lizardman' },
  { id: 'treasure_fairy', name: 'フェアリーの秘宝', description: 'フェアリーのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'fairy' },
  { id: 'treasure_undead', name: 'アンデッドの秘宝', description: 'アンデッドのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'undead' },
  { id: 'treasure_goblin', name: 'ゴブリンの秘宝', description: 'ゴブリンのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'goblin' },
  { id: 'treasure_dragonewt', name: 'ドラゴニュートの秘宝', description: 'ドラゴニュートのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'dragonewt' },
  { id: 'treasure_angel', name: 'エンジェルの秘宝', description: 'エンジェルのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'angel' },
  { id: 'treasure_demon', name: 'デーモンの秘宝', description: 'デーモンのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'demon' },
  { id: 'treasure_genasi', name: 'ジェナシの秘宝', description: 'ジェナシのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'genasi' },
  { id: 'treasure_aasimar', name: 'アアシマールの秘宝', description: 'アアシマールのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'aasimar' },
  { id: 'treasure_tiefling', name: 'ティーフリングの秘宝', description: 'ティーフリングのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'tiefling' },
  { id: 'treasure_dhampir', name: 'ダンピールの秘宝', description: 'ダンピールのキャラに使うとHP+50,MP+20,他+10', type: 'raceTreasure', rarity: 'rare', unlocks: 'dhampir' },
];

// 職業秘宝（全20職業）- HP+50,MP+20,他+10
export const jobTreasures: ItemData[] = [
  { id: 'treasure_warrior', name: '戦士の秘宝', description: '戦士のキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'warrior' },
  { id: 'treasure_mage', name: '魔法使いの秘宝', description: '魔法使いのキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'mage' },
  { id: 'treasure_priest', name: '司祭の秘宝', description: '司祭のキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'priest' },
  { id: 'treasure_thief', name: '盗賊の秘宝', description: '盗賊のキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'thief' },
  { id: 'treasure_knight', name: '騎士の秘宝', description: '騎士のキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'knight' },
  { id: 'treasure_hunter', name: '狩人の秘宝', description: '狩人のキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'hunter' },
  { id: 'treasure_ninja', name: '忍者の秘宝', description: '忍者のキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'ninja' },
  { id: 'treasure_sage', name: '賢者の秘宝', description: '賢者のキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'sage' },
  { id: 'treasure_berserker', name: 'バーサーカーの秘宝', description: 'バーサーカーのキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'berserker' },
  { id: 'treasure_paladin', name: 'パラディンの秘宝', description: 'パラディンのキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'paladin' },
  { id: 'treasure_necromancer', name: 'ネクロマンサーの秘宝', description: 'ネクロマンサーのキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'necromancer' },
  { id: 'treasure_monk', name: 'モンクの秘宝', description: 'モンクのキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'monk' },
  { id: 'treasure_ranger', name: 'レンジャーの秘宝', description: 'レンジャーのキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'ranger' },
  { id: 'treasure_samurai', name: 'サムライの秘宝', description: 'サムライのキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'samurai' },
  { id: 'treasure_witch', name: 'ウィッチの秘宝', description: 'ウィッチのキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'witch' },
  { id: 'treasure_bard', name: 'バードの秘宝', description: 'バードのキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'bard' },
  { id: 'treasure_spellblade', name: '魔法剣士の秘宝', description: '魔法剣士のキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'spellblade' },
  { id: 'treasure_battlemage', name: '戦闘魔導士の秘宝', description: '戦闘魔導士のキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'battlemage' },
  { id: 'treasure_runesmith', name: '符術士の秘宝', description: '符術士のキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'runesmith' },
  { id: 'treasure_redmage', name: '赤魔道士の秘宝', description: '赤魔道士のキャラに使うとHP+50,MP+20,他+10', type: 'jobTreasure', rarity: 'rare', unlocks: 'redmage' },
];

// 全秘宝
export const allTreasures: ItemData[] = [...raceTreasures, ...jobTreasures];

// 通常アイテム（書のみ）
export const normalItems: ItemData[] = [...raceTickets, ...jobBooks];

// 全アイテム（書+秘宝）
export const allItems: ItemData[] = [...normalItems, ...allTreasures];

// アイテムIDからアイテムデータを取得
export function getItemById(id: string): ItemData | undefined {
  return findById(allItems, id);
}

// 種族に必要なアイテムIDを取得
export function getRequiredItemForRace(raceId: string): string | null {
  const ticket = raceTickets.find(t => t.unlocks === raceId);
  return ticket?.id || null;
}

// 職業に必要なアイテムIDを取得
export function getRequiredItemForJob(jobId: string): string | null {
  const book = jobBooks.find(b => b.unlocks === jobId);
  return book?.id || null;
}

// 初期インベントリ
export const initialInventory: Record<string, number> = {
  'ticket_human': 3,
  'book_warrior': 1,
  'book_mage': 1,
  'book_priest': 1,
};

// ダンジョンのドロップ確率（%）
// ※基本4回抽選のため、確率は1/4に設定（期待値は同じ）
export function getDropRate(dungeonId: string): number {
  const rates: Record<string, number> = {
    grassland: 0.1,    // 0.4 / 4
    forest: 2,         // 8 / 4
    cave: 12.5,        // 50 / 4
    sea: 25,           // 100 / 4
    desert: 28,        // +3%
    volcano: 31,       // +6%
    snowfield: 34,     // +9%
    temple: 37,        // +12%
  };
  return rates[dungeonId] || 0;
}

// ランダムでアイテムを1つ取得（1%で秘宝、99%で通常書）
export function getRandomItem(): ItemData {
  // 1%でレア秘宝
  if (Math.random() * 100 < 1) {
    return pickRandom(allTreasures);
  }
  // 99%で通常書
  return pickRandom(normalItems);
}

// 秘宝かどうか判定
export function isTreasure(itemId: string): boolean {
  return itemId.startsWith('treasure_');
}

// 秘宝の対象種族/職業を取得
export function getTreasureTarget(itemId: string): { type: 'race' | 'job'; id: string } | null {
  const item = getItemById(itemId);
  if (!item) return null;
  if (item.type === 'raceTreasure') {
    return { type: 'race', id: item.unlocks };
  }
  if (item.type === 'jobTreasure') {
    return { type: 'job', id: item.unlocks };
  }
  return null;
}
