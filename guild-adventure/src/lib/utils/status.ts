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
export function calculateRemainingMinutes(startTime: number, dungeonId: string): number {
  const duration = dungeons[dungeonId as keyof typeof dungeons]?.durationSeconds || 0;
  const endTime = startTime + duration * 1000;
  return Math.max(0, Math.ceil((endTime - Date.now()) / 60000));
}

/**
 * フレンドのステータス表示情報を取得する共通関数
 * friends/page.tsx と multi/[code]/page.tsx で共用
 */
export function getStatusDisplay(fullStatus: FriendFullStatus | undefined): StatusDisplay {
  if (!fullStatus) {
    return { text: 'オフライン', color: 'text-slate-500', emoji: '⚫', detail: '' };
  }

  const { status, currentAdventure, multiAdventure, multiRoom } = fullStatus;

  // ソロ冒険中をチェック（Web閉じても表示）
  if (currentAdventure) {
    const dungeonName = getDungeonName(currentAdventure.dungeon);
    const remaining = calculateRemainingMinutes(currentAdventure.startTime, currentAdventure.dungeon);

    if (remaining > 0) {
      // まだ冒険中
      return {
        text: 'ソロ冒険中',
        color: 'text-amber-400',
        emoji: '⚔️',
        detail: `${dungeonName} (残り${remaining}分)`,
      };
    } else {
      // 帰還待ち
      return {
        text: '帰還待ち',
        color: 'text-orange-400',
        emoji: '🏠',
        detail: `${dungeonName} の結果確認待ち`,
      };
    }
  }

  // マルチルームの状態をチェック（冒険中かどうか）
  if (multiRoom && status?.activity === 'multi') {
    const dungeonName = getDungeonName(multiRoom.dungeonId);

    if (multiRoom.status === 'battle') {
      // マルチ冒険中
      const startTime = multiRoom.startTime || Date.now();
      const remaining = calculateRemainingMinutes(startTime, multiRoom.dungeonId);
      return {
        text: 'マルチ冒険中',
        color: 'text-purple-400',
        emoji: '⚔️👥',
        detail: `${dungeonName} (残り${remaining}分)`,
      };
    } else if (multiRoom.status === 'waiting' || multiRoom.status === 'ready') {
      // マルチ待機中
      const playerCount = Object.keys(multiRoom.players || {}).length;
      return {
        text: 'マルチ待機中',
        color: 'text-blue-400',
        emoji: '👥',
        detail: `${dungeonName} (${playerCount}/${multiRoom.maxPlayers}人)`,
      };
    }
  }

  // マルチ結果待ちをチェック
  if (multiAdventure && !multiAdventure.claimed) {
    const dungeonName = getDungeonName(multiAdventure.dungeonId);
    return {
      text: 'マルチ結果待ち',
      color: 'text-purple-400',
      emoji: '👥',
      detail: `${dungeonName} の結果確認待ち`,
    };
  }

  // 通常のステータス
  if (!status || !isOnline(status)) {
    return { text: 'オフライン', color: 'text-slate-500', emoji: '⚫', detail: '' };
  }

  switch (status.activity) {
    case 'lobby':
      return { text: 'ロビー', color: 'text-green-400', emoji: '🟢', detail: 'オンライン' };
    case 'multi':
      return { text: 'マルチ中', color: 'text-purple-400', emoji: '👥', detail: '' };
    case 'solo':
      return { text: 'ソロ中', color: 'text-amber-400', emoji: '⚔️', detail: '' };
    default:
      return { text: 'オンライン', color: 'text-green-400', emoji: '🟢', detail: '' };
  }
}
