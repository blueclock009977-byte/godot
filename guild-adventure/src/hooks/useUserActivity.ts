'use client';

import { useEffect, useRef, useCallback } from 'react';

const INACTIVE_THRESHOLD = 5 * 60 * 1000; // 5分

export function useUserActivity() {
  const lastActivityRef = useRef<number>(Date.now());

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

  // アクティブかどうかを返す
  const isActive = useCallback(() => {
    return (Date.now() - lastActivityRef.current) < INACTIVE_THRESHOLD;
  }, []);

  return { isActive };
}
