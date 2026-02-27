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
        <div>
          <div className="text-xs text-slate-400">HP</div>
          <div className="text-lg font-bold text-red-400">{stats.maxHp}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">MP</div>
          <div className="text-lg font-bold text-blue-300">{stats.maxMp}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">ATK</div>
          <div className="text-lg font-bold text-orange-400">{stats.atk}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">DEF</div>
          <div className="text-lg font-bold text-blue-400">{stats.def}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">AGI</div>
          <div className="text-lg font-bold text-green-400">{stats.agi}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">MAG</div>
          <div className="text-lg font-bold text-purple-400">{stats.mag}</div>
        </div>
      </div>
    </div>
  );
}
