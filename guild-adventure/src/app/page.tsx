'use client';

import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';

export default function Home() {
  const { characters, party, currentAdventure } = useGameStore();
  
  const partyCount = [...party.front, ...party.back].filter(Boolean).length;
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* タイトル */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            ギルドアドベンチャー
          </h1>
          <p className="text-slate-400">放置系ビルド探索RPG</p>
        </div>
        
        {/* メニュー */}
        <div className="space-y-4">
          <Link href="/create" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">⚔️ キャラ作成</h2>
                  <p className="text-slate-400 text-sm">新しい冒険者を雇う</p>
                </div>
                <span className="text-slate-400">→</span>
              </div>
            </div>
          </Link>
          
          <Link href="/party" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">👥 パーティ編成</h2>
                  <p className="text-slate-400 text-sm">冒険者を編成する</p>
                </div>
                <span className="text-amber-400">{partyCount}/6</span>
              </div>
            </div>
          </Link>
          
          <Link href="/dungeon" className="block">
            <div className={`rounded-lg p-4 border transition-colors ${
              partyCount > 0 
                ? 'bg-amber-600 hover:bg-amber-500 border-amber-500' 
                : 'bg-slate-700 border-slate-600 opacity-50 cursor-not-allowed'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">🗺️ 冒険に出る</h2>
                  <p className="text-slate-200 text-sm">ダンジョンを探索</p>
                </div>
                <span className="text-white">→</span>
              </div>
            </div>
          </Link>
        </div>
        
        {/* 冒険中表示 */}
        {currentAdventure && currentAdventure.status === 'inProgress' && (
          <div className="mt-8 bg-amber-900/50 rounded-lg p-4 border border-amber-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="animate-pulse">🔥</span>
              <span className="font-semibold">冒険中...</span>
            </div>
            <Link href="/adventure" className="text-amber-400 hover:underline text-sm">
              冒険の状況を見る →
            </Link>
          </div>
        )}
        
        {/* ステータス */}
        <div className="mt-8 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">ギルド情報</h3>
          <div className="flex justify-between text-sm">
            <span>所属冒険者</span>
            <span className="text-amber-400">{characters.length} 人</span>
          </div>
        </div>
        
        {/* フッター */}
        <div className="mt-8 text-center text-slate-500 text-xs">
          <p>v0.1.0 Beta</p>
        </div>
      </div>
    </main>
  );
}
