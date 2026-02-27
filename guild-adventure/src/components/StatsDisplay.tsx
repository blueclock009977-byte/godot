import { StatItem, statColors } from './StatItem';

interface Stats {
  maxHp: number;
  maxMp: number;
  atk: number;
  def: number;
  agi: number;
  mag: number;
}

interface StatsDisplayProps {
  stats: Stats;
  /** タイトル（省略可能） */
  title?: string;
}

/**
 * キャラクターステータス表示コンポーネント
 * HP/MP/ATK/DEF/AGI/MAGの6ステータスをグリッド表示
 */
export function StatsDisplay({ stats, title }: StatsDisplayProps) {
  return (
    <div>
      {title && <h3 className="text-sm text-slate-400 mb-3">{title}</h3>}
      <div className="grid grid-cols-3 gap-2 text-center">
        <StatItem label="HP" value={stats.maxHp} colorClass={statColors.hp} />
        <StatItem label="MP" value={stats.maxMp} colorClass={statColors.mp} />
        <StatItem label="ATK" value={stats.atk} colorClass={statColors.atk} />
        <StatItem label="DEF" value={stats.def} colorClass={statColors.def} />
        <StatItem label="AGI" value={stats.agi} colorClass={statColors.agi} />
        <StatItem label="MAG" value={stats.mag} colorClass={statColors.mag} />
      </div>
    </div>
  );
}
