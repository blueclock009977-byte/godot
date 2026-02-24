import { Card, Element } from '@/types/card';

// カードを生成するヘルパー
const createCard = (
  element: Element,
  cost: number,
  nameSuffix: string
): Card => ({
  id: `${element}-${cost}`,
  name: `${getElementName(element)}の${nameSuffix}`,
  element,
  cost,
  power: cost, // パワー = コスト
});

const getElementName = (element: Element): string => {
  switch (element) {
    case 'fire': return '火';
    case 'water': return '水';
    case 'wind': return '風';
  }
};

const RANK_NAMES = ['子', '兵', '戦士', '騎士', '王'];

// 全カードプール（15枚）
export const ALL_CARDS: Card[] = [
  // 火属性
  ...Array.from({ length: 5 }, (_, i) => 
    createCard('fire', i + 1, RANK_NAMES[i])
  ),
  // 水属性
  ...Array.from({ length: 5 }, (_, i) => 
    createCard('water', i + 1, RANK_NAMES[i])
  ),
  // 風属性
  ...Array.from({ length: 5 }, (_, i) => 
    createCard('wind', i + 1, RANK_NAMES[i])
  ),
];

// IDでカードを取得
export const getCardById = (id: string): Card | undefined => {
  return ALL_CARDS.find(card => card.id === id);
};

// サンプルデッキ（6枚）
export const SAMPLE_DECK_IDS = [
  'fire-1', 'fire-2', 'fire-3',
  'water-2', 'water-3',
  'wind-2'
];
