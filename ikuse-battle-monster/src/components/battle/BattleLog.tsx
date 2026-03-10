'use client';

import { useRef, useEffect } from 'react';
import { BattleLogEntry } from '@/lib/types';

interface BattleLogProps {
  log: BattleLogEntry[];
  messages?: string[];
  maxHeight?: string;
}

/** ログタイプに応じたスタイル */
const LOG_STYLES: Record<BattleLogEntry['type'], { color: string; icon: string }> = {
  info: { color: 'text-gray-300', icon: '📝' },
  damage: { color: 'text-red-400', icon: '💥' },
  heal: { color: 'text-green-400', icon: '💚' },
  status: { color: 'text-purple-400', icon: '🔮' },
  switch: { color: 'text-cyan-400', icon: '🔄' },
  weather: { color: 'text-yellow-400', icon: '🌤️' },
  ability: { color: 'text-orange-400', icon: '✨' },
  ko: { color: 'text-gray-500', icon: '💀' },
};

/**
 * バトルログ表示コンポーネント
 * バトル中のイベントをログとして表示
 */
export function BattleLog({ log, messages = [], maxHeight = '200px' }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 新しいログが追加されたら自動スクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log.length, messages.length]);

  const hasContent = log.length > 0 || messages.length > 0;

  if (!hasContent) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 text-center text-gray-500">
        バトルログがありません
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-3 py-2 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">📜 バトルログ</h3>
      </div>
      <div
        ref={scrollRef}
        className="p-3 overflow-y-auto space-y-1"
        style={{ maxHeight }}
      >
        {/* 構造化ログ */}
        {log.map((entry, idx) => {
          const style = LOG_STYLES[entry.type];
          
          return (
            <div
              key={`log-${idx}`}
              className={`text-sm ${style.color} flex items-start gap-2`}
            >
              <span className="flex-shrink-0">{style.icon}</span>
              <span>{entry.message}</span>
            </div>
          );
        })}
        
        {/* 直近のメッセージ（まだログに入っていないもの） */}
        {messages.map((message, idx) => (
          <div
            key={`msg-${idx}`}
            className="text-sm text-blue-300 flex items-start gap-2"
          >
            <span className="flex-shrink-0">▶</span>
            <span>{message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * コンパクトなバトルログ（最新N件のみ表示）
 */
export function CompactBattleLog({ 
  log, 
  count = 5 
}: { 
  log: BattleLogEntry[]; 
  count?: number;
}) {
  const recentEntries = log.slice(-count);

  return (
    <div className="space-y-1">
      {recentEntries.map((entry, idx) => {
        const style = LOG_STYLES[entry.type];
        const opacity = Math.max(100 - (count - 1 - idx) * 15, 50);
        
        return (
          <div
            key={idx}
            className={`text-xs ${style.color} flex items-center gap-1`}
            style={{ opacity: opacity / 100 }}
          >
            <span>{style.icon}</span>
            <span className="truncate">{entry.message}</span>
          </div>
        );
      })}
    </div>
  );
}
