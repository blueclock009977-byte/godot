'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getFloorRanking, getLevelRanking } from '@/lib/firebase';
import { RankingEntry } from '@/lib/types';

type RankingType = 'floor' | 'level';

export function RankingPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RankingType>('floor');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const userData = useGameStore(state => state.userData);
  
  // ランキング取得
  const fetchRankings = async (type: RankingType) => {
    setIsLoading(true);
    try {
      const data = type === 'floor' 
        ? await getFloorRanking()
        : await getLevelRanking();
      setRankings(data);
    } catch (e) {
      console.error('Ranking fetch error:', e);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (isOpen) {
      fetchRankings(activeTab);
    }
  }, [isOpen, activeTab]);
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-20 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
      >
        🏆 ランキング
      </button>
    );
  }
  
  // 自分の順位を探す
  const myRank = userData 
    ? rankings.findIndex(r => r.username === userData.username) + 1
    : 0;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-[480px] max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">🏆 ランキング</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* タブ */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('floor')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'floor'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏔️ 最高階層
          </button>
          <button
            onClick={() => setActiveTab('level')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'level'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⭐ レベル
          </button>
        </div>
        
        {/* 自分の順位 */}
        {userData && myRank > 0 && (
          <div className="p-3 bg-amber-600/20 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold">あなたの順位</span>
              <span className="text-white font-bold text-lg">#{myRank}</span>
            </div>
          </div>
        )}
        
        {/* ランキングリスト */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center text-slate-400 py-8">
              読み込み中...
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              ランキングデータがありません
            </div>
          ) : (
            <div className="space-y-2">
              {rankings.slice(0, 50).map((entry, index) => (
                <RankingRow
                  key={entry.username}
                  rank={index + 1}
                  entry={entry}
                  isMe={userData?.username === entry.username}
                  type={activeTab}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* 更新ボタン */}
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={() => fetchRankings(activeTab)}
            disabled={isLoading}
            className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm"
          >
            🔄 更新
          </button>
        </div>
      </div>
    </div>
  );
}

function RankingRow({
  rank,
  entry,
  isMe,
  type,
}: {
  rank: number;
  entry: RankingEntry;
  isMe: boolean;
  type: RankingType;
}) {
  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };
  
  const formatLastActive = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 5) return '🟢 オンライン';
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(diff / 86400000);
    return `${days}日前`;
  };
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      isMe ? 'bg-amber-600/30 border border-amber-500' : 'bg-slate-700/50'
    }`}>
      {/* 順位 */}
      <div className={`w-12 text-center font-bold ${
        rank <= 3 ? 'text-xl' : 'text-slate-400'
      }`}>
        {getRankEmoji(rank)}
      </div>
      
      {/* ユーザー情報 */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isMe ? 'text-amber-400' : 'text-white'}`}>
            {entry.username}
          </span>
          {isMe && <span className="text-xs text-amber-400">(あなた)</span>}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {formatLastActive(entry.lastActiveAt)}
        </div>
      </div>
      
      {/* スコア */}
      <div className="text-right">
        {type === 'floor' ? (
          <>
            <div className="text-lg font-bold text-amber-400">{entry.highestFloor}F</div>
            <div className="text-xs text-slate-400">Lv.{entry.level}</div>
          </>
        ) : (
          <>
            <div className="text-lg font-bold text-blue-400">Lv.{entry.level}</div>
            <div className="text-xs text-slate-400">{entry.highestFloor}F</div>
          </>
        )}
      </div>
    </div>
  );
}
