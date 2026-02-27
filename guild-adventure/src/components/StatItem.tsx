interface StatItemProps {
  label: string;
  value: number;
  colorClass: string;
}

/**
 * ステータス項目表示コンポーネント
 * ラベルと値を縦に並べて表示
 */
export function StatItem({ label, value, colorClass }: StatItemProps) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}

/** ステータス種別ごとの色クラス定義 */
export const statColors = {
  hp: 'text-red-400',
  mp: 'text-blue-300',
  atk: 'text-orange-400',
  def: 'text-blue-400',
  agi: 'text-green-400',
  mag: 'text-purple-400',
} as const;
