'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ACHIEVEMENTS, getAchievementById } from '@/lib/data/achievements';
import { BattleHistoryEntry } from '@/lib/types';

type TabType = 'statistics' | 'history' | 'achievements';

export function StatsPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('statistics');
  const [isOpen, setIsOpen] = useState(false);
  
  const getStatistics = useGameStore(state => state.getStatistics);
  const getBattleHistory = useGameStore(state => state.getBattleHistory);
  const getAchievementProgress = useGameStore(state => state.getAchievementProgress);
  const claimAchievementReward = useGameStore(state => state.claimAchievementReward);
  const userData = useGameStore(state => state.userData);
  
  const stats = getStatistics();
  const history = getBattleHistory();
  const achievementProgress = getAchievementProgress();
  
  // 未受け取り報酬数
  const unclaimedCount = ACHIEVEMENTS.filter(a => {
    const progress = achievementProgress[a.id];
    return progress?.unlockedAt > 0 && !progress.claimed;
  }).length;
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
      >
        📊 統計
        {unclaimedCount > 0 && (
          <span className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
            {unclaimedCount}
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
          <h2 className="text-xl font-bold text-white">📊 統計・履歴</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* タブ */}
        <div className="flex border-b border-slate-700">
          <TabButton
            active={activeTab === 'statistics'}
            onClick={() => setActiveTab('statistics')}
          >
            📈 統計
          </TabButton>
          <TabButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          >
            📜 履歴
          </TabButton>
          <TabButton
            active={activeTab === 'achievements'}
            onClick={() => setActiveTab('achievements')}
            badge={unclaimedCount > 0 ? unclaimedCount : undefined}
          >
            🏆 実績
          </TabButton>
        </div>
        
        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'statistics' && (
            <StatisticsTab stats={stats} userData={userData} />
          )}
          {activeTab === 'history' && (
            <HistoryTab history={history} />
          )}
          {activeTab === 'achievements' && (
            <AchievementsTab
              achievementProgress={achievementProgress}
              stats={stats}
              userData={userData}
              onClaim={claimAchievementReward}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// タブボタン
function TabButton({
  active,
  onClick,
  children,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium relative ${
        active
          ? 'text-amber-400 border-b-2 border-amber-400'
          : 'text-slate-400 hover:text-white'
      }`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

// 統計タブ
function StatisticsTab({ stats, userData }: { stats: ReturnType<typeof useGameStore.getState>['getStatistics'] extends () => infer R ? R : never; userData: ReturnType<typeof useGameStore.getState>['userData'] }) {
  // プレイ時間フォーマット
  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}時間${mins}分`;
    return `${mins}分`;
  };
  
  return (
    <div className="space-y-4">
      {/* 基本統計 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="⚔️" label="累計撃破数" value={stats.totalKills.toLocaleString()} />
        <StatCard icon="👑" label="ボス撃破数" value={stats.totalBossKills.toLocaleString()} />
        <StatCard icon="🏔️" label="クリアフロア数" value={stats.totalFloorsCleared.toLocaleString()} />
        <StatCard icon="💀" label="累計死亡回数" value={stats.totalDeaths.toLocaleString()} />
        <StatCard icon="💰" label="累計獲得コイン" value={stats.totalCoinsEarned.toLocaleString()} />
        <StatCard icon="✨" label="累計獲得EXP" value={stats.totalExpEarned.toLocaleString()} />
        <StatCard icon="🧪" label="ポーション使用数" value={stats.totalPotionsUsed.toLocaleString()} />
        <StatCard icon="⏱️" label="累計プレイ時間" value={formatPlayTime(stats.totalPlayTimeSeconds)} />
        <StatCard
          icon="📊"
          label="到達最高階層"
          value={`${userData?.highestFloor ?? 1}F`}
          highlight
        />
      </div>
      
      {/* プレイヤー情報 */}
      {userData && (
        <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
          <h3 className="text-sm font-medium text-slate-300 mb-3">プレイヤー情報</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-slate-400">ユーザー名</div>
            <div className="text-white">{userData.username}</div>
            <div className="text-slate-400">レベル</div>
            <div className="text-amber-400 font-bold">Lv.{userData.character.level}</div>
            <div className="text-slate-400">所持コイン</div>
            <div className="text-yellow-400">{userData.coins.toLocaleString()} 💰</div>
          </div>
        </div>
      )}
    </div>
  );
}

// 統計カード
function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-amber-600/20 border border-amber-600/50' : 'bg-slate-700/50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className={`text-lg font-bold ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

// 履歴タブ
function HistoryTab({ history }: { history: BattleHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        まだ履歴がありません
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {history.map(entry => (
        <div
          key={entry.id}
          className={`p-3 rounded-lg ${getHistoryBgColor(entry.type)}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">{entry.message}</span>
            <span className="text-xs text-slate-400">
              {formatTimeAgo(entry.timestamp)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function getHistoryBgColor(type: BattleHistoryEntry['type']): string {
  switch (type) {
    case 'floor_clear':
      return 'bg-emerald-600/20 border-l-4 border-emerald-500';
    case 'boss_kill':
      return 'bg-amber-600/20 border-l-4 border-amber-500';
    case 'death':
      return 'bg-red-600/20 border-l-4 border-red-500';
    case 'level_up':
      return 'bg-blue-600/20 border-l-4 border-blue-500';
    case 'drop':
      return 'bg-purple-600/20 border-l-4 border-purple-500';
    case 'achievement':
      return 'bg-yellow-600/20 border-l-4 border-yellow-500';
    default:
      return 'bg-slate-700/50';
  }
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '今';
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  return `${days}日前`;
}

// 実績タブ
function AchievementsTab({
  achievementProgress,
  stats,
  userData,
  onClaim,
}: {
  achievementProgress: Record<string, { unlockedAt: number; claimed: boolean }>;
  stats: ReturnType<typeof useGameStore.getState>['getStatistics'] extends () => infer R ? R : never;
  userData: ReturnType<typeof useGameStore.getState>['userData'];
  onClaim: (id: string) => boolean;
}) {
  // 解除済みを上に
  const sortedAchievements = [...ACHIEVEMENTS].sort((a, b) => {
    const aUnlocked = achievementProgress[a.id]?.unlockedAt > 0;
    const bUnlocked = achievementProgress[b.id]?.unlockedAt > 0;
    const aClaimed = achievementProgress[a.id]?.claimed;
    const bClaimed = achievementProgress[b.id]?.claimed;
    
    // 未受け取りを最上位
    if (aUnlocked && !aClaimed && (!bUnlocked || bClaimed)) return -1;
    if (bUnlocked && !bClaimed && (!aUnlocked || aClaimed)) return 1;
    // 解除済みを上
    if (aUnlocked && !bUnlocked) return -1;
    if (bUnlocked && !aUnlocked) return 1;
    return 0;
  });
  
  const unlockedCount = ACHIEVEMENTS.filter(a => achievementProgress[a.id]?.unlockedAt > 0).length;
  
  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-400 mb-4">
        解除済み: {unlockedCount} / {ACHIEVEMENTS.length}
      </div>
      
      {sortedAchievements.map(achievement => {
        const progress = achievementProgress[achievement.id];
        const isUnlocked = progress?.unlockedAt > 0;
        const isClaimed = progress?.claimed;
        
        return (
          <div
            key={achievement.id}
            className={`p-3 rounded-lg border ${
              isUnlocked
                ? isClaimed
                  ? 'bg-slate-700/30 border-slate-600'
                  : 'bg-amber-600/20 border-amber-500'
                : 'bg-slate-700/20 border-slate-700 opacity-60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{achievement.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                    {achievement.name}
                  </span>
                  {isUnlocked && isClaimed && (
                    <span className="text-xs text-emerald-400">✓ 達成</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{achievement.description}</p>
                
                {/* 報酬表示 */}
                {achievement.reward && (
                  <div className="flex gap-2 mt-2 text-xs">
                    {achievement.reward.coins && (
                      <span className="text-yellow-400">💰 {achievement.reward.coins}</span>
                    )}
                    {achievement.reward.exp && (
                      <span className="text-blue-400">✨ {achievement.reward.exp} EXP</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* 受け取りボタン */}
              {isUnlocked && !isClaimed && (
                <button
                  onClick={() => onClaim(achievement.id)}
                  className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded"
                >
                  受取
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
