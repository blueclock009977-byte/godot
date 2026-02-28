'use client';

import { useEffect, useRef, useCallback } from 'react';

const INACTIVE_THRESHOLD = 1 * 60 * 1000; // 1分（オンライン判定と同じ）

export function useUserActivity() {
  // 初期値は0（まだ操作してない状態）
  const lastActivityRef = useRef<number>(0);

  // 操作を検知したら時刻を更新
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    // 各種操作を検知
    const events = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove'];
    
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [updateActivity]);

  // アクティブかどうかを返す（最後の操作から1分以内）
  const isActive = useCallback(() => {
    if (lastActivityRef.current === 0) return false; // まだ操作してない
    return (Date.now() - lastActivityRef.current) < INACTIVE_THRESHOLD;
  }, []);

  return { isActive };
}
