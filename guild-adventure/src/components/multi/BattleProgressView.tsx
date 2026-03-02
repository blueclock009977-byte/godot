'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDuration } from '@/lib/utils';
import BattleLogDisplay from '@/components/BattleLogDisplay';
import { Character, Monster } from '@/lib/types';

interface BattleProgressViewProps {
  dungeonName: string;
  durationSeconds: number;
  startTime: number;
  progress: number;
  displayedLogs: string[];
  characters?: (Character | null)[];
  monsters?: Monster[];
}

export default function BattleProgressView({
  dungeonName,
  durationSeconds,
  startTime,
  progress,
  displayedLogs,
  characters,
  monsters,
}: BattleProgressViewProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [remainingSec, setRemainingSec] = useState(0);
  
  // ログが追加されたら自動スクロール
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [displayedLogs]);
  
  // 残り時間の更新（Date.now()をレンダー外で管理）
  useEffect(() => {
    const updateRemaining = () => {
      const totalTime = durationSeconds;
      const remainingMs = Math.max(0, startTime + (totalTime * 1000) - Date.now());
      setRemainingSec(Math.ceil(remainingMs / 1000));
    };
    
    updateRemaining(); // 初回実行
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [durationSeconds, startTime]);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="mb-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{dungeonName}</h1>
            <div className="text-sm text-slate-400">マルチプレイ冒険中</div>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/" 
              className="bg-slate-600 hover:bg-slate-500 px-3 py-2 rounded-lg text-sm font-semibold"
            >
              🏠 ホーム
            </Link>
            <Link 
              href="/friends" 
              className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg text-sm font-semibold"
            >
              👥 フレンド
            </Link>
          </div>
        </div>
        
        {/* 進捗バー */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>進捗 {Math.floor(progress)}%</span>
            <span>残り {formatDuration(remainingSec, true)}</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* ログ */}
        <div 
          ref={logContainerRef}
          className="bg-slate-800 rounded-lg p-4 h-96 overflow-y-auto border border-slate-700"
        >
          <BattleLogDisplay 
            logs={displayedLogs}
            characters={characters}
            monsters={monsters}
          />
        </div>
      </div>
    </main>
  );
}
