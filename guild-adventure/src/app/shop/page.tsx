'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { raceTickets, jobBooks, ItemData } from '@/lib/data/items';

const SHOP_PRICE = 100; // 購入価格

export default function ShopPage() {
  const { coins, addCoins, addItem, syncToServer, inventory } = useGameStore();
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'race' | 'job'>('race');
  
  const handleBuy = async (item: ItemData) => {
    if (coins < SHOP_PRICE) {
      setMessage('コインが足りません！');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    
    addCoins(-SHOP_PRICE);
    addItem(item.id);
    await syncToServer();
    setMessage(`${item.name} を購入しました！`);
    setTimeout(() => setMessage(''), 2000);
  };
  
  const items = activeTab === 'race' ? raceTickets : jobBooks;
  
  return (
    <PageLayout>
      <PageHeader title="🛒 ショップ" />
      
      {/* コイン表示 */}
      <div className="bg-amber-900/30 rounded-lg p-4 border border-amber-700 mb-6 text-center">
        <span className="text-2xl">🪙</span>
        <span className="text-2xl font-bold ml-2">{coins}</span>
        <span className="text-slate-300 ml-1">コイン</span>
      </div>
      
      {message && (
        <div className={`rounded-lg p-3 mb-4 text-center ${
          message.includes('足りません') 
            ? 'bg-red-900/50 text-red-300' 
            : 'bg-green-900/50 text-green-300'
        }`}>
          {message}
        </div>
      )}
      
      {/* タブ切り替え */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('race')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'race'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          📜 血統書 ({raceTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('job')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'job'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          📖 指南書 ({jobBooks.length})
        </button>
      </div>
      
      {/* 価格説明 */}
      <p className="text-sm text-slate-400 mb-4 text-center">
        各アイテム {SHOP_PRICE} コインで購入できます
      </p>
      
      {/* アイテム一覧 */}
      <div className="space-y-2">
        {items.map((item) => {
          const owned = inventory[item.id] || 0;
          const canBuy = coins >= SHOP_PRICE;
          
          return (
            <div
              key={item.id}
              className="bg-slate-700 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.name}</span>
                  {owned > 0 && (
                    <span className="text-xs bg-slate-600 px-2 py-0.5 rounded text-amber-400">
                      所持: {owned}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{item.description}</p>
              </div>
              <button
                onClick={() => handleBuy(item)}
                disabled={!canBuy}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  canBuy
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                🪙 {SHOP_PRICE}
              </button>
            </div>
          );
        })}
      </div>
      
      {/* ヒント */}
      <div className="mt-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm text-slate-400 mb-2">💡 ヒント</h3>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>・血統書を使うと新しい種族でキャラ作成できます</li>
          <li>・指南書を使うと新しい職業でキャラ作成できます</li>
          <li>・冒険でもドロップしますが、ショップなら確実に入手！</li>
          <li>・マスタリー解放には複数枚必要です（Lv1: 5枚、Lv2: 10枚）</li>
        </ul>
      </div>
    </PageLayout>
  );
}
