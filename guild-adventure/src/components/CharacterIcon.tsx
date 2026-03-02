import { RaceType, JobType } from '@/lib/types';
import { RaceIcon } from './RaceIcon';
import { JobIcon } from './JobIcon';

interface CharacterIconProps {
  race: RaceType;
  job: JobType;
  size?: number;
  className?: string;
}

/**
 * 種族アイコン（大）+ 職業バッジ（右下小）の組み合わせアイコン
 * デフォルトサイズ: 48x48（種族40x40 + 職業24x24バッジ）
 */
export function CharacterIcon({ race, job, size = 48, className = '' }: CharacterIconProps) {
  // サイズ比率: 種族は83%, 職業バッジは50%
  const raceSize = Math.round(size * 0.83);
  const jobSize = Math.round(size * 0.5);
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      {/* ベース: 種族アイコン */}
      <div className="absolute top-0 left-0">
        <RaceIcon race={race} size={raceSize} />
      </div>
      
      {/* バッジ: 職業アイコン（右下） */}
      <div 
        className="absolute bottom-0 right-0 rounded-full bg-slate-900/80 p-0.5"
        style={{ 
          width: jobSize + 4, 
          height: jobSize + 4,
        }}
      >
        <JobIcon job={job} size={jobSize} />
      </div>
    </div>
  );
}
