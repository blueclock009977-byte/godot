import { RaceType } from '@/lib/types';
import Image from 'next/image';

interface RaceIconProps {
  race: RaceType;
  size?: number;
  className?: string;
}

export function RaceIcon({ race, size = 32, className = '' }: RaceIconProps) {
  return (
    <Image
      src={`/icons/races/${race}.svg`}
      alt={race}
      width={size}
      height={size}
      className={className}
    />
  );
}
