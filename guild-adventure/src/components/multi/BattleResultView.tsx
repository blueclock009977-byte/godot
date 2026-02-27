'use client';

import { getItemById } from '@/lib/data/items';
import { getLogClassName } from '@/lib/utils';
import { BattleLog } from '@/lib/types';

interface BattleResultViewProps {
  victory: boolean;
  dungeonName: string;
  myDrop: string | null;
  dropClaimed: boolean;
  logs: BattleLog[];
  coinReward?: number;
  onGoHome: () => void;
}

export default function BattleResultView({
  victory,
  dungeonName,
  myDrop,
  dropClaimed,
  logs,
  coinReward,
  onGoHome,
}: BattleResultViewProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="p-6 rounded-lg bg-slate-800 border border-slate-700 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {victory ? '🎉 勝利！' : '💀 敗北...'}
          </h2>
          <div className="text-slate-300 mb-2">
            {victory ? `${dungeonName}を踏破！` : `${dungeonName}で全滅...`}
          </div>
          {victory && coinReward && (
            <div className="text-amber-400 text-lg mb-4">
              🪙 {coinReward}コイン獲得！
            </div>
          )}
          {myDrop && (
            <div className="text-amber-400 text-lg mb-4">
              💎 【あなたのドロップ】{getItemById(myDrop)?.name || myDrop}
            </div>
          )}
          {victory && !myDrop && dropClaimed && (
            <div className="text-slate-400 mb-4">ドロップなし...</div>
          )}
          <button
            onClick={onGoHome}
            className="inline-block bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-lg font-semibold"
          >
            ホームに戻る
          </button>
          
          {/* 戦闘ログ */}
          {logs && logs.length > 0 && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
                📜 戦闘ログを表示
              </summary>
              <div className="mt-2 bg-slate-700 rounded-lg p-3 max-h-64 overflow-y-auto text-sm font-mono">
                {logs.map((logEntry, idx) => (
                  <div key={idx}>
                    {logEntry.message.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                      <div key={`${idx}-${i}`} className={getLogClassName(line)}>{line}</div>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </main>
  );
}
