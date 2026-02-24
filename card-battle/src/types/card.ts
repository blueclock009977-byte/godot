// カードの属性
export type Element = 'fire' | 'water' | 'wind';

// カードの型定義
export interface Card {
  id: string;
  name: string;
  element: Element;
  cost: number;
  power: number;
}

// プレイヤーの状態
export interface Player {
  id: string;
  name: string;
  life: number;
  deck: Card[];
  hand: Card[];
  discardPile: Card[];
}

// ゲームの状態
export interface GameState {
  turn: number;
  maxCost: number;
  players: [Player, Player];
  currentPhase: 'select' | 'reveal' | 'resolve' | 'end';
  selectedCards: [Card[] | null, Card[] | null];
  winner: string | null;
}

// 属性相性
export const ELEMENT_ADVANTAGE: Record<Element, Element> = {
  fire: 'wind',   // 火 → 風に有利
  wind: 'water',  // 風 → 水に有利
  water: 'fire',  // 水 → 火に有利
};

// 有利ボーナス
export const ADVANTAGE_BONUS = 2;
