'use client';

/**
 * ランクマッチ - レート自動マッチメイキング
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import {
  joinMatchQueue,
  leaveMatchQueue,
  watchMyQueueEntry,
  tryMatch,
  cleanupAfterMatch,
  QueueEntry,
} from '@/lib/online/matchmaking';
import { joinRoom } from '@/lib/online/room';

type MatchStatus = 'idle' | 'searching' | 'matched' | 'error';

export default function RankedMatch() {
  const router = useRouter();
  const { isLoggedIn, userData, isLoading } = useUser();
  const [status, setStatus] = useState<MatchStatus>('idle');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [matchedRoom, setMatchedRoom] = useState<string | null>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const userIdRef = useRef<string>('');

  // ユーザーID（Firebase auth uid or session id）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('onlineUserId');
      if (stored) {
        userIdRef.current = stored;
      } else {
        const newId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        sessionStorage.setItem('onlineUserId', newId);
        userIdRef.current = newId;
      }
    }
  }, []);

  const rating = userData?.rating ?? 1000;

  // クリーンアップ
  const cleanup = useCallback(() => {
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (unsubRef.current) unsubRef.current();
    searchTimerRef.current = null;
    pollTimerRef.current = null;
    unsubRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      // ページ離脱時にキューから退出
      if (userIdRef.current && status === 'searching') {
        leaveMatchQueue(userIdRef.current).catch(() => {});
      }
    };
  }, [cleanup, status]);

  // マッチング開始
  const startSearch = async () => {
    if (!userIdRef.current) return;
    
    try {
      setStatus('searching');
      setElapsedSec(0);
      setError(null);

      // キューに参加
      await joinMatchQueue(userIdRef.current, rating);

      // 経過時間タイマー
      searchTimerRef.current = setInterval(() => {
        setElapsedSec(prev => prev + 1);
      }, 1000);

      // 自分のエントリーを監視（相手がマッチしてくれた場合）
      unsubRef.current = watchMyQueueEntry(userIdRef.current, (entry) => {
        if (entry?.matchedRoomCode) {
          handleMatchFound(entry.matchedRoomCode, entry.matchedOpponentId !== userIdRef.current);
        }
      });

      // 定期的にマッチング試行（2秒間隔）
      pollTimerRef.current = setInterval(async () => {
        try {
          const roomCode = await tryMatch(userIdRef.current, rating);
          if (roomCode) {
            handleMatchFound(roomCode, true);
          }
        } catch {
          // ポーリングエラーは無視
        }
      }, 2000);

    } catch (err) {
      setStatus('error');
      setError('マッチング開始に失敗しました');
      cleanup();
    }
  };

  // マッチ成立
  const handleMatchFound = async (roomCode: string, isHost: boolean) => {
    cleanup();
    setStatus('matched');
    setMatchedRoom(roomCode);

    // キューからクリーンアップ
    await cleanupAfterMatch(userIdRef.current);

    // ゲストはルームに参加
    if (!isHost) {
      await joinRoom(roomCode, userIdRef.current);
    }

    // バトル画面へ遷移
    setTimeout(() => {
      router.push(`/online/battle?room=${roomCode}`);
    }, 1500);
  };

  // 検索キャンセル
  const cancelSearch = async () => {
    cleanup();
    await leaveMatchQueue(userIdRef.current).catch(() => {});
    setStatus('idle');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl">読み込み中...</p>
      </div>
    );
  }

  // レート帯の表示
  const getRankName = (r: number) => {
    if (r >= 2000) return { name: 'マスター', color: 'text-purple-400', icon: '👑' };
    if (r >= 1500) return { name: 'ゴールド', color: 'text-yellow-400', icon: '🥇' };
    return { name: 'シルバー', color: 'text-gray-300', icon: '🥈' };
  };

  const rank = getRankName(rating);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">⚔️ ランクマッチ</h1>

      {/* レート表示 */}
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm text-center">
        <div className="text-sm text-gray-400 mb-1">現在のレート</div>
        <div className={`text-4xl font-bold ${rank.color}`}>
          {rank.icon} {rating}
        </div>
        <div className={`text-sm ${rank.color} mt-1`}>{rank.name}ランク</div>
      </div>

      {/* ステータス別表示 */}
      {status === 'idle' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          {!isLoggedIn && (
            <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-3 text-sm text-yellow-200 w-full text-center">
              ⚠️ ログインしていません。レートは保存されません。
              <br />
              <Link href="/profile" className="underline">プロフィール</Link>で御三家を選んでスタート！
            </div>
          )}
          <button
            onClick={startSearch}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xl py-4 px-8 rounded-xl transition-colors shadow-lg"
          >
            🔍 対戦相手を探す
          </button>
        </div>
      )}

      {status === 'searching' && (
        <div className="flex flex-col items-center gap-4">
          {/* スピナー */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-gray-700 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-red-500 rounded-full animate-spin" />
          </div>
          <div className="text-xl font-medium">対戦相手を検索中...</div>
          <div className="text-gray-400">
            経過時間: {Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-500">
            レート {Math.max(0, rating - 100 - elapsedSec * 10)} 〜 {rating + 100 + elapsedSec * 10} の相手を検索中
          </div>
          <button
            onClick={cancelSearch}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            キャンセル
          </button>
        </div>
      )}

      {status === 'matched' && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-3xl animate-bounce">⚔️</div>
          <div className="text-xl font-bold text-green-400">対戦相手が見つかりました！</div>
          <div className="text-gray-400">バトル画面へ移動中...</div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-red-400">{error}</div>
          <button
            onClick={() => setStatus('idle')}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-lg"
          >
            戻る
          </button>
        </div>
      )}

      {/* ナビゲーション */}
      <div className="flex gap-4 mt-4">
        <Link
          href="/"
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← ホーム
        </Link>
        <Link
          href="/online"
          className="text-gray-400 hover:text-white transition-colors"
        >
          フレンド対戦 →
        </Link>
      </div>
    </div>
  );
}
