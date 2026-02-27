import { getLogClassName } from '@/lib/utils';

interface BattleLogDisplayProps {
  logs: string[];
  emptyMessage?: string;
}

export default function BattleLogDisplay({ logs, emptyMessage = "探索中..." }: BattleLogDisplayProps) {
  if (logs.length === 0) {
    return <div className="text-slate-500 text-sm animate-pulse">{emptyMessage}</div>;
  }
  
  return (
    <div className="space-y-1 text-sm font-mono">
      {logs.map((log, i) => (
        <div key={i} className={getLogClassName(log)}>{log}</div>
      ))}
    </div>
  );
}
