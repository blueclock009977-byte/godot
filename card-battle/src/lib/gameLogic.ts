import { Card, Element, ELEMENT_ADVANTAGE, ADVANTAGE_BONUS, Player } from '@/types/card';

// 属性相性チェック
export const hasAdvantage = (attacker: Element, defender: Element): boolean => {
  return ELEMENT_ADVANTAGE[attacker] === defender;
};

// パワー計算（メイン + サポート効果）
export const calculateTotalPower = (cards: Card[]): { power: number; element: Element } => {
  if (cards.length === 0) return { power: 0, element: 'fire' };
  
  const mainCard = cards[0];
  let totalPower = mainCard.power;
  
  // サポートカードの効果を加算
  for (let i = 1; i < cards.length; i++) {
    const supportCard = cards[i];
    const supportBonus = supportCard.cost;
    const sameElementBonus = supportCard.element === mainCard.element ? 1 : 0;
    totalPower += supportBonus + sameElementBonus;
  }
  
  return { power: totalPower, element: mainCard.element };
};

// バトル結果を計算
export const resolveBattle = (
  p1Cards: Card[],
  p2Cards: Card[]
): { p1Damage: number; p2Damage: number; description: string } => {
  if (p1Cards.length === 0 && p2Cards.length === 0) {
    return { p1Damage: 0, p2Damage: 0, description: '両者パス' };
  }
  
  if (p1Cards.length === 0) {
    const p2Total = calculateTotalPower(p2Cards);
    return { p1Damage: p2Total.power, p2Damage: 0, description: `P1パス、P2の${p2Total.power}ダメージ` };
  }
  
  if (p2Cards.length === 0) {
    const p1Total = calculateTotalPower(p1Cards);
    return { p1Damage: 0, p2Damage: p1Total.power, description: `P2パス、P1の${p1Total.power}ダメージ` };
  }
  
  const p1Total = calculateTotalPower(p1Cards);
  const p2Total = calculateTotalPower(p2Cards);
  
  let p1Power = p1Total.power;
  let p2Power = p2Total.power;
  let bonusDesc = '';
  
  if (hasAdvantage(p1Total.element, p2Total.element)) {
    p1Power += ADVANTAGE_BONUS;
    bonusDesc = `${getElementEmoji(p1Total.element)}有利+${ADVANTAGE_BONUS}`;
  } else if (hasAdvantage(p2Total.element, p1Total.element)) {
    p2Power += ADVANTAGE_BONUS;
    bonusDesc = `${getElementEmoji(p2Total.element)}有利+${ADVANTAGE_BONUS}`;
  }
  
  const diff = p1Power - p2Power;
  
  if (diff > 0) {
    return { p1Damage: 0, p2Damage: diff, description: `P1勝利！ ${p1Power} vs ${p2Power} → ${diff}ダメージ ${bonusDesc}` };
  } else if (diff < 0) {
    return { p1Damage: -diff, p2Damage: 0, description: `P2勝利！ ${p1Power} vs ${p2Power} → ${-diff}ダメージ ${bonusDesc}` };
  } else {
    return { p1Damage: 0, p2Damage: 0, description: `引き分け！ ${p1Power} vs ${p2Power} ${bonusDesc}` };
  }
};

const getElementEmoji = (element: Element): string => {
  switch (element) {
    case 'fire': return '🔥';
    case 'water': return '💧';
    case 'wind': return '🌪️';
  }
};

const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const createPlayer = (id: string, name: string, deckCards: Card[]): Player => {
  const shuffledDeck = shuffleArray([...deckCards]);
  const hand = shuffledDeck.splice(0, 3);
  return { id, name, life: 10, deck: shuffledDeck, hand, discardPile: [] };
};

export const refreshHand = (player: Player, usedCards: Card[]): Player => {
  let newDiscardPile = [...player.discardPile, ...usedCards];
  const usedIds = new Set(usedCards.map(c => c.id));
  let newHand = player.hand.filter(c => !usedIds.has(c.id));
  let newDeck = [...player.deck];
  
  while (newHand.length < 3 && (newDeck.length > 0 || newDiscardPile.length > 0)) {
    if (newDeck.length === 0) {
      newDeck = shuffleArray(newDiscardPile);
      newDiscardPile = [];
    }
    if (newDeck.length > 0) newHand.push(newDeck.pop()!);
  }
  
  return { ...player, hand: newHand, deck: newDeck, discardPile: newDiscardPile };
};
