'use client';

import { Card as CardType } from '@/types/card';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  isSupport?: boolean;
}

const ELEMENT_COLORS = {
  fire: 'bg-red-500 border-red-700',
  water: 'bg-blue-500 border-blue-700',
  wind: 'bg-green-500 border-green-700',
};

const ELEMENT_EMOJI = {
  fire: '🔥',
  water: '💧',
  wind: '🌪️',
};

export default function Card({ 
  card, 
  onClick, 
  selected = false,
  disabled = false,
  isSupport = false,
}: CardProps) {
  const supportBonus = card.cost; // サポート効果 = コスト分
  
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        relative w-24 h-36 rounded-lg border-4 cursor-pointer
        transition-all duration-200 flex flex-col
        ${ELEMENT_COLORS[card.element]}
        ${selected ? 'ring-4 ring-yellow-400 scale-110' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${isSupport ? 'opacity-80 scale-90' : ''}
      `}
    >
      {/* コスト */}
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-black border-2 border-yellow-600">
        {card.cost}
      </div>
      
      {/* 属性アイコン */}
      <div className="text-3xl text-center mt-4">
        {ELEMENT_EMOJI[card.element]}
      </div>
      
      {/* カード名 */}
      <div className="text-center text-white text-xs font-bold mt-1 px-1">
        {card.name}
      </div>
      
      {/* パワー */}
      <div className="mt-auto mb-2 text-center">
        <span className="bg-white/30 px-2 py-1 rounded text-white font-bold">
          {isSupport ? `+${supportBonus}` : `💪 ${card.power}`}
        </span>
      </div>
    </div>
  );
}
