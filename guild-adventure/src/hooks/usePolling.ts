import { useEffect, useRef, useCallback } from 'react';

/**
 * ポーリング用カスタムフック
 * 初回実行 + 指定間隔での定期実行を行う
 * 
 * @param callback - 実行する関数（非同期可）
 * @param intervalMs - ポーリング間隔（ミリ秒）
 * @param enabled - ポーリングを有効にするかどうか（デフォルト: true）
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);

  // コールバックが変わっても参照を最新に保つ
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    
    const tick = () => savedCallback.current();
    tick(); // 初回実行
    
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
