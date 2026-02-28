import { dungeons } from '@/lib/data/dungeons';
import { FriendFullStatus, isOnline } from '@/lib/firebase';

export interface StatusDisplay {
  text: string;
  color: string;
  emoji: string;
  detail?: string;
}

/**
 * ダンジョン名を取得するヘルパー
 */
export function getDungeonName(dungeonId: string): string {
  return dungeons[dungeonId as keyof typeof dungeons]?.name || dungeonId;
}

/**
 * 残り時間（分）を計算するヘルパー
 */
export function calculateRemainingMinutes(startTime: number, dungeonId: string, actualDurationSeconds?: number): number {
  const duration = actualDurationSeconds || dungeons[dungeonId as keyof typeof dungeons]?.durationSeconds || 0;
  const endTime = startTime + duration * 1000;
  return Math.max(0, Math.ceil((endTime - Date.now()) / 60000));
}

/**
 * フレンドのステータス表示情報を取得する共通関数
 * ソロとマルチの両方を同時に表示可能
 */
export function getStatusDisplay(fullStatus: FriendFullStatus | undefined): StatusDisplay {
  const statuses = getStatusDisplays(fullStatus);
  return statuses[0] || { text: 'オフライン', color: 'text-slate-500', emoji: '⚫', detail: '' };
}

/**
 * 複数のステータスを取得（ソロ+マルチ同時表示用）
 */
export function getStatusDisplays(fullStatus: FriendFullStatus | undefined): StatusDisplay[] {
  if (!fullStatus) {
    return [{ text: 'オフライン', color: 'text-slate-500', emoji: '⚫', detail: '' }];
  }

  const { status, currentAdventure, multiAdventure, multiRoom } = fullStatus;
  const results: StatusDisplay[] = [];

  // ソロ冒険中をチェック
  if (currentAdventure) {
    const dungeonName = getDungeonName(currentAdventure.dungeon);
    const remaining = calculateRemainingMinutes(currentAdventure.startTime, currentAdventure.dungeon);

    if (remaining > 0) {
      results.push({
        text: 'ソロ冒険中',
        color: 'text-amber-400',
        emoji: '⚔️',
        detail: `${dungeonName} (残り${remaining}分)`,
      });
    } else {
      results.push({
        text: '帰還待ち',
        color: 'text-orange-400',
        emoji: '🏠',
        detail: `${dungeonName} の結果確認待ち`,
      });
    }
  }

  // マルチルームの状態をチェック
  if (multiRoom && status?.activity === 'multi') {
    const dungeonName = getDungeonName(multiRoom.dungeonId);

    if (multiRoom.status === 'battle') {
      const startTime = multiRoom.startTime || Date.now();
      const remaining = calculateRemainingMinutes(startTime, multiRoom.dungeonId, multiRoom.actualDurationSeconds);
      if (remaining > 0) {
        results.push({
          text: 'マルチ冒険中',
          color: 'text-purple-400',
          emoji: '⚔️👥',
          detail: `${dungeonName} (残り${remaining}分)`,
        });
      } else {
        results.push({
          text: 'マルチ結果待ち',
          color: 'text-purple-400',
          emoji: '👥',
          detail: `${dungeonName} の結果確認待ち`,
        });
      }
    } else if (multiRoom.status === 'done') {
      results.push({
        text: 'マルチ結果待ち',
        color: 'text-purple-400',
        emoji: '👥',
        detail: `${dungeonName} の結果確認待ち`,
      });
    } else if (multiRoom.status === 'waiting' || multiRoom.status === 'ready') {
      const playerCount = Object.keys(multiRoom.players || {}).length;
      results.push({
        text: 'マルチ待機中',
        color: 'text-blue-400',
        emoji: '👥',
        detail: `${dungeonName} (${playerCount}/${multiRoom.maxPlayers}人)`,
      });
    }
  } else if (multiAdventure && !multiAdventure.claimed) {
    // マルチ結果待ちをチェック（multiRoomがない場合）
    const dungeonName = getDungeonName(multiAdventure.dungeonId);
    results.push({
      text: 'マルチ結果待ち',
      color: 'text-purple-400',
      emoji: '👥',
      detail: `${dungeonName} の結果確認待ち`,
    });
  }

  // 何もなければオンライン/オフライン
  if (results.length === 0) {
    if (!status || !isOnline(status)) {
      return [{ text: 'オフライン', color: 'text-slate-500', emoji: '⚫', detail: '' }];
    }
    return [{ text: 'ロビー', color: 'text-green-400', emoji: '🟢', detail: 'オンライン' }];
  }

  return results;
}
