// アイテム定義
import { pickRandom, findById } from '../utils';

export interface ItemData {
  id: string;
  name: string;
  description: string;
  type: 'raceTicket' | 'jobBook';
  unlocks: string; // 解放する種族ID or 職業ID
}

// 種族チケット（全16種族）
export const raceTickets: ItemData[] = [
  { id: 'ticket_human', name: '人間の血統書', description: '人間を作成可能にする', type: 'raceTicket', unlocks: 'human' },
  { id: 'ticket_elf', name: 'エルフの血統書', description: 'エルフを作成可能にする', type: 'raceTicket', unlocks: 'elf' },
  { id: 'ticket_dwarf', name: 'ドワーフの血統書', description: 'ドワーフを作成可能にする', type: 'raceTicket', unlocks: 'dwarf' },
  { id: 'ticket_halfling', name: 'ハーフリングの血統書', description: 'ハーフリングを作成可能にする', type: 'raceTicket', unlocks: 'halfling' },
  { id: 'ticket_orc', name: 'オークの血統書', description: 'オークを作成可能にする', type: 'raceTicket', unlocks: 'orc' },
  { id: 'ticket_lizardman', name: 'リザードマンの血統書', description: 'リザードマンを作成可能にする', type: 'raceTicket', unlocks: 'lizardman' },
  { id: 'ticket_fairy', name: 'フェアリーの血統書', description: 'フェアリーを作成可能にする', type: 'raceTicket', unlocks: 'fairy' },
  { id: 'ticket_undead', name: 'アンデッドの血統書', description: 'アンデッドを作成可能にする', type: 'raceTicket', unlocks: 'undead' },
  { id: 'ticket_goblin', name: 'ゴブリンの血統書', description: 'ゴブリンを作成可能にする', type: 'raceTicket', unlocks: 'goblin' },
  { id: 'ticket_dragonewt', name: 'ドラゴニュートの血統書', description: 'ドラゴニュートを作成可能にする', type: 'raceTicket', unlocks: 'dragonewt' },
  { id: 'ticket_angel', name: 'エンジェルの血統書', description: 'エンジェルを作成可能にする', type: 'raceTicket', unlocks: 'angel' },
  { id: 'ticket_demon', name: 'デーモンの血統書', description: 'デーモンを作成可能にする', type: 'raceTicket', unlocks: 'demon' },
  { id: 'ticket_genasi', name: 'ジェナシの血統書', description: 'ジェナシを作成可能にする', type: 'raceTicket', unlocks: 'genasi' },
  { id: 'ticket_aasimar', name: 'アアシマールの血統書', description: 'アアシマールを作成可能にする', type: 'raceTicket', unlocks: 'aasimar' },
  { id: 'ticket_tiefling', name: 'ティーフリングの血統書', description: 'ティーフリングを作成可能にする', type: 'raceTicket', unlocks: 'tiefling' },
  { id: 'ticket_dhampir', name: 'ダンピールの血統書', description: 'ダンピールを作成可能にする', type: 'raceTicket', unlocks: 'dhampir' },
];

// 職業書（全20職業）
export const jobBooks: ItemData[] = [
  { id: 'book_warrior', name: '戦士の指南書', description: '戦士を作成可能にする', type: 'jobBook', unlocks: 'warrior' },
  { id: 'book_mage', name: '魔法使いの指南書', description: '魔法使いを作成可能にする', type: 'jobBook', unlocks: 'mage' },
  { id: 'book_priest', name: '司祭の指南書', description: '司祭を作成可能にする', type: 'jobBook', unlocks: 'priest' },
  { id: 'book_thief', name: '盗賊の指南書', description: '盗賊を作成可能にする', type: 'jobBook', unlocks: 'thief' },
  { id: 'book_knight', name: '騎士の指南書', description: '騎士を作成可能にする', type: 'jobBook', unlocks: 'knight' },
  { id: 'book_hunter', name: '狩人の指南書', description: '狩人を作成可能にする', type: 'jobBook', unlocks: 'hunter' },
  { id: 'book_ninja', name: '忍者の指南書', description: '忍者を作成可能にする', type: 'jobBook', unlocks: 'ninja' },
  { id: 'book_sage', name: '賢者の指南書', description: '賢者を作成可能にする', type: 'jobBook', unlocks: 'sage' },
  { id: 'book_berserker', name: 'バーサーカーの指南書', description: 'バーサーカーを作成可能にする', type: 'jobBook', unlocks: 'berserker' },
  { id: 'book_paladin', name: 'パラディンの指南書', description: 'パラディンを作成可能にする', type: 'jobBook', unlocks: 'paladin' },
  { id: 'book_necromancer', name: 'ネクロマンサーの指南書', description: 'ネクロマンサーを作成可能にする', type: 'jobBook', unlocks: 'necromancer' },
  { id: 'book_monk', name: 'モンクの指南書', description: 'モンクを作成可能にする', type: 'jobBook', unlocks: 'monk' },
  { id: 'book_ranger', name: 'レンジャーの指南書', description: 'レンジャーを作成可能にする', type: 'jobBook', unlocks: 'ranger' },
  { id: 'book_samurai', name: 'サムライの指南書', description: 'サムライを作成可能にする', type: 'jobBook', unlocks: 'samurai' },
  { id: 'book_witch', name: 'ウィッチの指南書', description: 'ウィッチを作成可能にする', type: 'jobBook', unlocks: 'witch' },
  { id: 'book_bard', name: 'バードの指南書', description: 'バードを作成可能にする', type: 'jobBook', unlocks: 'bard' },
  { id: 'book_spellblade', name: '魔法剣士の指南書', description: '魔法剣士を作成可能にする', type: 'jobBook', unlocks: 'spellblade' },
  { id: 'book_battlemage', name: '戦闘魔導士の指南書', description: '戦闘魔導士を作成可能にする', type: 'jobBook', unlocks: 'battlemage' },
  { id: 'book_runesmith', name: '符術士の指南書', description: '符術士を作成可能にする', type: 'jobBook', unlocks: 'runesmith' },
  { id: 'book_redmage', name: '赤魔道士の指南書', description: '赤魔道士を作成可能にする', type: 'jobBook', unlocks: 'redmage' },
];

// 全アイテム
export const allItems: ItemData[] = [...raceTickets, ...jobBooks];

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

// ランダムでアイテムを1つ取得
export function getRandomItem(): ItemData {
  return pickRandom(allItems);
}
