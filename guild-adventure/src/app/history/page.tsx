'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { dungeons } from '@/lib/data/dungeons';
import { getItemById } from '@/lib/data/items';
import { AdventureHistory } from '@/lib/firebase';

function HistoryCard({ 
  history, 
  onClick,
  isSelected,
}: { 
  history: AdventureHistory; 
  onClick: () => void;
  isSelected: boolean;
}) {
  const dungeon = dungeons[history.dungeonId as keyof typeof dungeons];
  const date = new Date(history.completedAt);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-amber-600 border-amber-500' 
          : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className={`text-xs px-2 py-0.5 rounded ${history.type === 'solo' ? 'bg-blue-600' : 'bg-purple-600'}`}>
            {history.type === 'solo' ? 'ソロ' : 'マルチ'}
          </span>
          <span className={`ml-2 text-xs ${history.victory ? 'text-green-400' : 'text-red-400'}`}>
            {history.victory ? '勝利' : '敗北'}
          </span>
        </div>
        <span className="text-xs text-slate-400">{dateStr}</span>
      </div>
      <div className="font-semibold mt-1">{dungeon?.name || history.dungeonId}</div>
      {history.droppedItemId && (
        <div className="text-xs text-amber-400 mt-1">
          💎 {getItemById(history.droppedItemId)?.name}
        </div>
      )}
      {history.type === 'multi' && history.players && (
        <div className="text-xs text-slate-400 mt-1">
          👥 {history.players.join(', ')}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { history } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const selectedHistory = history.find(h => h.id === selectedId);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-slate-400 hover:text-white">
            ← 戻る
          </Link>
          <h1 className="text-2xl font-bold">📜 過去の挑戦ログ</h1>
        </div>
        
        {history.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg">まだ挑戦履歴がありません</p>
            <p className="text-sm mt-2">ダンジョンに挑戦しよう！</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {/* 履歴リスト */}
            <div className="space-y-2">
              <h2 className="text-sm text-slate-400 mb-2">履歴（{history.length}件）</h2>
              {history.map((h) => (
                <HistoryCard
                  key={h.id}
                  history={h}
                  onClick={() => setSelectedId(h.id === selectedId ? null : h.id)}
                  isSelected={h.id === selectedId}
                />
              ))}
            </div>
            
            {/* ログ詳細 */}
            <div className="md:sticky md:top-4 h-fit">
              <h2 className="text-sm text-slate-400 mb-2">バトルログ</h2>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 h-96 overflow-y-auto">
                {selectedHistory ? (
                  <div className="space-y-1 text-sm font-mono">
                    {selectedHistory.logs.map((log, i) => (
                      <div key={i}>
                        {log.message?.split('\n').filter((l: string) => l.trim()).map((line: string, j: number) => (
                          <div 
                            key={j} 
                            className={`${
                              line.includes('🔴BOSS:') ? 'text-red-500 font-bold mt-3' :
                              line.includes('【遭遇') ? 'text-yellow-400 font-bold mt-3' :
                              line.includes('勝利') ? 'text-green-400 font-bold' :
                              line.includes('全滅') ? 'text-red-400 font-bold' :
                              line.includes('倒した') ? 'text-green-300' :
                              line.includes('ダメージ') ? 'text-orange-300' :
                              line.includes('回復') ? 'text-blue-300' :
                              'text-slate-300'
                            }`}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-center py-8">
                    履歴を選択してログを表示
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
