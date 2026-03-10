'use client';

import { MAX_MANA } from '@/lib/types';

interface ManaBarProps {
  current: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * マナバー表示コンポーネント
 * 共有マナの残量を視覚的に表示
 */
export function ManaBar({ 
  current, 
  max = MAX_MANA, 
  showLabel = true,
  size = 'md'
}: ManaBarProps) {
  const percentage = Math.min(100, (current / max) * 100);
  
  const heights = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6'
  };
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // マナ量に応じて色を変える
  const getBarColor = () => {
    if (percentage > 60) return 'bg-blue-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className={`flex justify-between mb-1 ${textSizes[size]}`}>
          <span className="font-medium text-blue-400">💎 マナ</span>
          <span className="text-gray-300">{current} / {max}</span>
        </div>
      )}
      <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} ${getBarColor()} transition-all duration-300 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
