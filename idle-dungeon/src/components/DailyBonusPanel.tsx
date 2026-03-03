'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  LOGIN_BONUS_REWARDS,
  getTodayBonus,
  hasClaimedToday,
  isConsecutiveLogin,
  getTodayString,
} from '@/lib/data/loginBonus';

export function DailyBonusPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showClaimed, setShowClaimed] = useState(false);
  
  const userData = useGameStore(state => state.userData);
  const syncToServer = useGameStore(state => state.syncToServer);
  const addCoins = useGameStore(state => state.addCoins);
  const addExp = useGameStore(state => state.addExp);
  
  const loginBonus = userData?.loginBonus ?? {
    lastClaimDate: '',
    consecutiveDays: 0,
    totalDays: 0,
  };
  
  const canClaim = !hasClaimedToday(loginBonus.lastClaimDate);
  const isConsecutive = isConsecutiveLogin(loginBonus.lastClaimDate);
  
  // 今日のボーナス（連続ならカウント継続、そうでなければリセット）
  const currentStreak = canClaim 
    ? (isConsecutive ? loginBonus.consecutiveDays : 0)
    : loginBonus.consecutiveDays;
  const todayBonus = getTodayBonus(currentStreak);
  
  // ボーナス受け取り
  const handleClaim = async () => {
    if (!userData || !canClaim) return;
    
    // 報酬付与
    if (todayBonus.coins) {
      addCoins(todayBonus.coins);
    }
    if (todayBonus.exp) {
      addExp(todayBonus.exp);
    }
    if (todayBonus.potions) {
      // ポーション追加
      const newPotions = (userData.potions ?? 0) + todayBonus.potions;
      // storeを直接更新
      useGameStore.setState({
        userData: {
          ...userData,
          potions: newPotions,
          loginBonus: {
            lastClaimDate: getTodayString(),
            consecutiveDays: isConsecutive ? loginBonus.consecutiveDays + 1 : 1,
            totalDays: loginBonus.totalDays + 1,
          },
        },
      });
    } else {
      // ポーションなしの場合
      useGameStore.setState({
        userData: {
          ...userData,
          loginBonus: {
            lastClaimDate: getTodayString(),
            consecutiveDays: isConsecutive ? loginBonus.consecutiveDays + 1 : 1,
            totalDays: loginBonus.totalDays + 1,
          },
        },
      });
    }
    
    await syncToServer();
    setShowClaimed(true);
    
    // 3秒後にアニメーション終了
    setTimeout(() => setShowClaimed(false), 3000);
  };
  
  // 自動でボーナス画面を開く（未受け取りの場合）
  useEffect(() => {
    if (canClaim && userData) {
      setIsOpen(true);
    }
  }, [canClaim, userData]);
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 left-4 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
          canClaim 
            ? 'bg-emerald-600 hover:bg-emerald-500 animate-pulse' 
            : 'bg-slate-700 hover:bg-slate-600'
        } text-white`}
      >
        🎁 ログインボーナス
        {canClaim && <span className="text-xs bg-amber-500 text-black px-1.5 py-0.5 rounded-full">!</span>}
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-[400px] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">🎁 ログインボーナス</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* 連続ログイン情報 */}
        <div className="p-4 bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">連続ログイン</div>
              <div className="text-2xl font-bold text-amber-400">
                {canClaim ? (isConsecutive ? currentStreak + 1 : 1) : currentStreak}日目
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">累計ログイン</div>
              <div className="text-lg font-bold text-white">{loginBonus.totalDays + (canClaim ? 1 : 0)}日</div>
            </div>
          </div>
        </div>
        
        {/* 7日間のボーナス表示 */}
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-6">
            {LOGIN_BONUS_REWARDS.map((reward, index) => {
              const dayNum = canClaim 
                ? (isConsecutive ? loginBonus.consecutiveDays : 0)
                : loginBonus.consecutiveDays;
              const isToday = index === dayNum % 7;
              const isPast = index < dayNum % 7;
              
              return (
                <div
                  key={index}
                  className={`p-2 rounded-lg text-center ${
                    isToday 
                      ? 'bg-amber-600/40 border-2 border-amber-500' 
                      : isPast 
                        ? 'bg-slate-700/30 opacity-50'
                        : 'bg-slate-700/50'
                  }`}
                >
                  <div className="text-xs text-slate-400 mb-1">{index + 1}日</div>
                  <div className="text-sm">
                    {reward.special ? '🎉' : reward.potions ? '🧪' : '💰'}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 今日のボーナス詳細 */}
          <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
            <div className="text-center mb-3">
              <span className="text-sm text-slate-400">今日のボーナス</span>
              {todayBonus.special && (
                <div className="text-amber-400 font-bold mt-1">{todayBonus.special}</div>
              )}
            </div>
            <div className="flex justify-center gap-4">
              {todayBonus.coins && (
                <div className="text-center">
                  <div className="text-2xl">💰</div>
                  <div className="text-amber-400 font-bold">{todayBonus.coins}</div>
                </div>
              )}
              {todayBonus.potions && (
                <div className="text-center">
                  <div className="text-2xl">🧪</div>
                  <div className="text-emerald-400 font-bold">×{todayBonus.potions}</div>
                </div>
              )}
              {todayBonus.exp && (
                <div className="text-center">
                  <div className="text-2xl">✨</div>
                  <div className="text-blue-400 font-bold">{todayBonus.exp}</div>
                </div>
              )}
            </div>
          </div>
          
          {/* 受け取りボタン */}
          {canClaim ? (
            <button
              onClick={handleClaim}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-3 rounded-lg text-lg shadow-lg"
            >
              🎁 受け取る
            </button>
          ) : (
            <div className="text-center text-slate-400 py-3">
              ✅ 本日のボーナスは受け取り済みです
            </div>
          )}
        </div>
        
        {/* 受け取りアニメーション */}
        {showClaimed && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
            <div className="text-center animate-bounce">
              <div className="text-6xl mb-4">🎉</div>
              <div className="text-2xl font-bold text-amber-400">ボーナス獲得！</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
