import { Card, Player, ELEMENT_ADVANTAGE } from '@/types/card';

// NPCのカード選択AI
export const selectNPCCards = (
  player: Player,
  maxCost: number,
  opponentLife: number
): Card[] => {
  const hand = [...player.hand];
  
  // コスト内で出せるカードの組み合わせを探す
  const validCombinations = getAllCombinations(hand, maxCost);
  
  if (validCombinations.length === 0) return [];
  
  // 最も強い組み合わせを選ぶ（パワー合計が高いもの）
  let bestCombo = validCombinations[0];
  let bestScore = evaluateCombo(bestCombo);
  
  for (const combo of validCombinations) {
    const score = evaluateCombo(combo);
    if (score > bestScore) {
      bestScore = score;
      bestCombo = combo;
    }
  }
  
  return bestCombo;
};

// コスト内の全組み合わせを取得
const getAllCombinations = (cards: Card[], maxCost: number): Card[][] => {
  const results: Card[][] = [[]]; // 空（パス）も含む
  
  const generate = (index: number, current: Card[], currentCost: number) => {
    if (index >= cards.length) return;
    
    for (let i = index; i < cards.length; i++) {
      const card = cards[i];
      const newCost = currentCost + card.cost;
      
      if (newCost <= maxCost) {
        const newCombo = [...current, card];
        results.push(newCombo);
        generate(i + 1, newCombo, newCost);
      }
    }
  };
  
  generate(0, [], 0);
  return results;
};

// 組み合わせの評価（高いほど良い）
const evaluateCombo = (cards: Card[]): number => {
  if (cards.length === 0) return -10; // パスは最低評価
  
  const mainCard = cards[0];
  let totalPower = mainCard.power;
  
  // サポート効果を計算
  for (let i = 1; i < cards.length; i++) {
    const support = cards[i];
    totalPower += support.cost;
    if (support.element === mainCard.element) {
      totalPower += 1; // 同属性ボーナス
    }
  }
  
  // 属性の多様性ボーナス（相手の弱点を突きやすい）
  const elements = new Set(cards.map(c => c.element));
  const diversityBonus = elements.size > 1 ? 1 : 0;
  
  return totalPower + diversityBonus;
};
