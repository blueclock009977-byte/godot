'use client';

import Image from 'next/image';

interface MonsterIconProps {
  monsterId: string;
  size?: number;
  className?: string;
  isBoss?: boolean;
}

export function MonsterIcon({ monsterId, size = 48, className = '', isBoss = false }: MonsterIconProps) {
  const iconPath = `/icons/monsters/${monsterId}.svg`;
  
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={iconPath}
        alt={monsterId}
        width={size}
        height={size}
        className={`${isBoss ? 'drop-shadow-[0_0_4px_rgba(255,215,0,0.8)]' : ''}`}
      />
      {isBoss && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black">
          ★
        </div>
      )}
    </div>
  );
}
