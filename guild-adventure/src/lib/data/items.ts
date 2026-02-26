// アイテム定義

export interface ItemData {
  id: string;
  name: string;
  description: string;
  type: 'raceTicket' | 'jobBook';
  unlocks: string; // 解放する種族ID or 職業ID
}

// 種族チケット（人間以外）
export const raceTickets: ItemData[] = [
  { id: 'ticket_elf', name: 'エルフの血統書', description: 'エルフを作成可能にする', type: 'raceTicket', unlocks: 'elf' },
  { id: 'ticket_dwarf', name: 'ドワーフの血統書', description: 'ドワーフを作成可能にする', type: 'raceTicket', unlocks: 'dwarf' },
  { id: 'ticket_halfling', name: 'ハーフリングの血統書', description: 'ハーフリングを作成可能にする', type: 'raceTicket', unlocks: 'halfling' },
  { id: 'ticket_orc', name: 'オークの血統書', description: 'オークを作成可能にする', type: 'raceTicket', unlocks: 'orc' },
  { id: 'ticket_lizardman', name: 'リザードマンの血統書', description: 'リザードマンを作成可能にする', type: 'raceTicket', unlocks: 'lizardman' },
  { id: 'ticket_fairy', name: 'フェアリーの血統書', description: 'フェアリーを作成可能にする', type: 'raceTicket', unlocks: 'fairy' },
  { id: 'ticket_undead', name: 'アンデッドの血統書', description: 'アンデッドを作成可能にする', type: 'raceTicket', unlocks: 'undead' },
];

// 職業書（戦士/魔法使い/司祭以外）
export const jobBooks: ItemData[] = [
  { id: 'book_thief', name: '盗賊の指南書', description: '盗賊を作成可能にする', type: 'jobBook', unlocks: 'thief' },
  { id: 'book_knight', name: '騎士の指南書', description: '騎士を作成可能にする', type: 'jobBook', unlocks: 'knight' },
  { id: 'book_hunter', name: '狩人の指南書', description: '狩人を作成可能にする', type: 'jobBook', unlocks: 'hunter' },
  { id: 'book_ninja', name: '忍者の指南書', description: '忍者を作成可能にする', type: 'jobBook', unlocks: 'ninja' },
  { id: 'book_sage', name: '賢者の指南書', description: '賢者を作成可能にする', type: 'jobBook', unlocks: 'sage' },
];

// 全アイテム
export const allItems: ItemData[] = [...raceTickets, ...jobBooks];

// アイテムIDからアイテムデータを取得
export function getItemById(id: string): ItemData | undefined {
  return allItems.find(item => item.id === id);
}

// 種族に必要なアイテムIDを取得（人間はnull）
export function getRequiredItemForRace(raceId: string): string | null {
  if (raceId === 'human') return null;
  const ticket = raceTickets.find(t => t.unlocks === raceId);
  return ticket?.id || null;
}

// 職業に必要なアイテムIDを取得（戦士/魔法使い/司祭はnull）
export function getRequiredItemForJob(jobId: string): string | null {
  if (['warrior', 'mage', 'priest'].includes(jobId)) return null;
  const book = jobBooks.find(b => b.unlocks === jobId);
  return book?.id || null;
}

// ダンジョンのドロップ確率（%）
export function getDropRate(dungeonId: string): number {
  const rates: Record<string, number> = {
    grassland: 0.4,
    forest: 8,
    cave: 50,
    sea: 100,
    desert: 100,
    volcano: 100,
    snowfield: 100,
    temple: 100,
  };
  return rates[dungeonId] || 0;
}

// ランダムでアイテムを1つ取得
export function getRandomItem(): ItemData {
  return allItems[Math.floor(Math.random() * allItems.length)];
}
