'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { WeeklyChallengeEntry } from '@/lib/types';
import {
  WEEKLY_CHALLENGE_TEMPLATES,
  getChallengeTemplate,
  getWeekRemainingSeconds,
  formatRemainingTime,
  isNewWeek,
  generateWeeklyChallenges,
  getWeekStartDate,
  isChallengeComplete,
} from '@/lib/data/weeklyChallenge';

export function WeeklyChallengePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState(getWeekRemainingSeconds());
  
  const userData = useGameStore(state => state.userData);
  const syncToServer = useGameStore(state => state.syncToServer);
  const addCoins = useGameStore(state => state.addCoins);
  const addExp = useGameStore(state => state.addExp);
  
  // 週のリセット確認＆チャレンジ初期化
  useEffect(() => {
    if (!userData) return;
    
    const currentWeekStart = getWeekStartDate();
    
    if (isNewWeek(userData.weeklyChallenge?.weekStartDate)) {
      // 新しい週のチャレンジを生成
      const newChallenges = generateWeeklyChallenges();
      useGameStore.setState({
        userData: {
          ...userData,
          weeklyChallenge: {
            weekStartDate: currentWeekStart,
            challenges: newChallenges,
          },
        },
      });
      syncToServer();
    }
  }, [userData]);
  
  // 残り時間カウントダウン
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setRemainingTime(getWeekRemainingSeconds());
    }, 60000); // 1分ごと
    
    return () => clearInterval(timer);
  }, [isOpen]);
  
  const challenges = userData?.weeklyChallenge?.challenges ?? [];
  
  // 報酬受け取り
  const handleClaim = async (challengeId: string) => {
    if (!userData) return;
    
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !isChallengeComplete(challenge) || challenge.claimed) return;
    
    // 報酬付与
    if (challenge.reward.coins) {
      addCoins(challenge.reward.coins);
    }
    if (challenge.reward.exp) {
      addExp(challenge.reward.exp);
    }
    
    // チャレンジを受け取り済みに
    const updatedChallenges = challenges.map(c =>
      c.id === challengeId ? { ...c, claimed: true } : c
    );
    
    useGameStore.setState({
      userData: {
        ...userData,
        weeklyChallenge: {
          ...userData.weeklyChallenge!,
          challenges: updatedChallenges,
        },
      },
    });
    
    await syncToServer();
  };
  
  // 受け取り可能なチャレンジ数
  const claimableCount = challenges.filter(c => isChallengeComplete(c) && !c.claimed).length;
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 left-52 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
          claimableCount > 0 
            ? 'bg-purple-600 hover:bg-purple-500 animate-pulse' 
            : 'bg-slate-700 hover:bg-slate-600'
        } text-white`}
      >
        📅 ウィークリー
        {claimableCount > 0 && (
          <span className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
            {claimableCount}
          </span>
        )}
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-[480px] max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">📅 ウィークリーチャレンジ</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* 残り時間 */}
        <div className="p-3 bg-purple-600/20 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">リセットまで</span>
            <span className="text-purple-400 font-bold">{formatRemainingTime(remainingTime)}</span>
          </div>
        </div>
        
        {/* チャレンジ一覧 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {challenges.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              チャレンジを読み込み中...
            </div>
          ) : (
            challenges.map(challenge => {
              const template = getChallengeTemplate(challenge.id);
              if (!template) return null;
              
              const isComplete = isChallengeComplete(challenge);
              const progress = Math.min(100, (challenge.current / challenge.target) * 100);
              
              return (
                <div
                  key={challenge.id}
                  className={`p-4 rounded-lg border ${
                    challenge.claimed
                      ? 'bg-slate-700/30 border-slate-600 opacity-60'
                      : isComplete
                        ? 'bg-purple-600/20 border-purple-500'
                        : 'bg-slate-700/50 border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-white">{template.name}</div>
                      <div className="text-sm text-slate-400">{template.description}</div>
                    </div>
                    {challenge.claimed && (
                      <span className="text-xs text-emerald-400">✓ 完了</span>
                    )}
                  </div>
                  
                  {/* プログレスバー */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">進捗</span>
                      <span className={isComplete ? 'text-emerald-400' : 'text-slate-400'}>
                        {challenge.current} / {challenge.target}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isComplete ? 'bg-emerald-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* 報酬と受け取りボタン */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-sm">
                      {challenge.reward.coins && (
                        <span className="text-yellow-400">💰 {challenge.reward.coins}</span>
                      )}
                      {challenge.reward.exp && (
                        <span className="text-blue-400">✨ {challenge.reward.exp}</span>
                      )}
                    </div>
                    
                    {isComplete && !challenge.claimed && (
                      <button
                        onClick={() => handleClaim(challenge.id)}
                        className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-1.5 rounded"
                      >
                        受取
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
