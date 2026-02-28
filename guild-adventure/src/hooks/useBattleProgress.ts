import { useState, useEffect, useRef } from 'react';
import { updateRoomStatus } from '@/lib/firebase';
import { dungeons } from '@/lib/data/dungeons';
import { BattleResult } from '@/lib/types';

interface UseBattleProgressOptions {
  roomStatus: string | undefined;
  battleResult: BattleResult | undefined;
  startTime: number | undefined;
  dungeonId: string | undefined;
  roomCode: string;
  actualDurationSeconds?: number;  // 短縮後の探索時間
}

/**
 * バトル進行のログ表示を管理するカスタムフック
 * - Firebaseからバトル結果を読み取り
 * - 時間経過に応じてログを表示
 * - 完了時にステータスを更新
 */
export function useBattleProgress({
  roomStatus,
  battleResult,
  startTime,
  dungeonId,
  roomCode,
  actualDurationSeconds,
}: UseBattleProgressOptions) {
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentEncounter, setCurrentEncounter] = useState(0);
  const battleResultRef = useRef<BattleResult | null>(null);

  // バトル結果をFirebaseから読み取る
  useEffect(() => {
    if (roomStatus !== 'battle' || !battleResult) return;
    if (battleResultRef.current) return; // 既に設定済み

    // Firebaseからバトル結果を取得（ホストが計算したもの）
    battleResultRef.current = battleResult;

    // 冒険開始ログを即座に表示
    const startLog = (battleResult as any).startLog;
    if (startLog) {
      const startLogLines = startLog.split('\n').filter((l: string) => l.trim());
      setDisplayedLogs(startLogLines);
    }
  }, [roomStatus, battleResult]);

  // 時間経過に応じてログを表示
  useEffect(() => {
    if (roomStatus !== 'battle' || !startTime || !battleResultRef.current || !dungeonId) return;

    const dungeonData = dungeons[dungeonId as keyof typeof dungeons];
    if (!dungeonData) return;

    const totalTime = (actualDurationSeconds || dungeonData.durationSeconds) * 1000;
    const encounterCount = dungeonData.encounterCount;
    const timePerEncounter = totalTime / encounterCount;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / totalTime) * 100);
      setProgress(newProgress);

      const shouldShowEncounter = Math.min(
        encounterCount,
        Math.floor(elapsed / timePerEncounter)
      );

      if (shouldShowEncounter > currentEncounter && battleResultRef.current) {
        const result = battleResultRef.current;

        for (let i = currentEncounter; i < shouldShowEncounter; i++) {
          if (result.logs[i]) {
            const newLogs = result.logs[i].message.split('\n').filter(l => l.trim());
            setDisplayedLogs(prev => [...prev, ...newLogs]);
          }
        }
        setCurrentEncounter(shouldShowEncounter);
      }

      // 完了判定
      if (newProgress >= 100) {
        clearInterval(interval);

        if (battleResultRef.current) {
          const result = battleResultRef.current;
          // 残りのログを全部表示
          for (let i = currentEncounter; i < result.logs.length; i++) {
            const newLogs = result.logs[i].message.split('\n').filter(l => l.trim());
            setDisplayedLogs(prev => [...prev, ...newLogs]);
          }

          // ステータスをdoneに更新（最初に完了した人が更新）
          updateRoomStatus(roomCode, 'done');
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [roomStatus, startTime, dungeonId, currentEncounter, roomCode]);

  return {
    displayedLogs,
    progress,
  };
}
