'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { EmptyState } from '@/components/EmptyState';
import { getItemById } from '@/lib/data/items';

const SELL_PRICE = 20; // チケット・書の売却価格

export default function ItemsPage() {
  const router = useRouter();
  const { inventory, coins, addCoins, useItem, syncToServer } = useGameStore();
  const [message, setMessage] = useState('');
  
  // 売却可能なアイテム（種族チケット・職業の書）
  const sellableItems = Object.entries(inventory)
    .filter(([itemId, count]) => count > 0)
    .map(([itemId, count]) => ({ itemId, count, item: getItemById(itemId) }))
    .filter(({ item }) => item && (item.type === 'raceTicket' || item.type === 'jobBook'));
  
  // その他のアイテム
  const otherItems = Object.entries(inventory)
    .filter(([itemId, count]) => count > 0)
    .map(([itemId, count]) => ({ itemId, count, item: getItemById(itemId) }))
    .filter(({ item }) => item && item.type !== 'raceTicket' && item.type !== 'jobBook');
  
  const handleSell = async (itemId: string) => {
    const item = getItemById(itemId);
    if (!item) return;
    
    if (useItem(itemId, 1)) {
      addCoins(SELL_PRICE);
      await syncToServer();
      setMessage(`${item.name} を売却して ${SELL_PRICE} コイン獲得！`);
      setTimeout(() => setMessage(''), 2000);
    }
  };
  
  const handleSellAll = async (itemId: string, count: number) => {
    const item = getItemById(itemId);
    if (!item) return;
    
    if (useItem(itemId, count)) {
      const totalCoins = SELL_PRICE * count;
      addCoins(totalCoins);
      await syncToServer();
      setMessage(`${item.name} x${count} を売却して ${totalCoins} コイン獲得！`);
      setTimeout(() => setMessage(''), 2000);
    }
  };
  
  return (
    <PageLayout>
      <PageHeader title="📦 アイテム" />
        
        {/* コイン表示 */}
        <div className="bg-amber-900/30 rounded-lg p-4 border border-amber-700 mb-6 text-center">
          <span className="text-2xl">🪙</span>
          <span className="text-2xl font-bold ml-2">{coins}</span>
          <span className="text-slate-300 ml-1">コイン</span>
        </div>
        
        {message && (
          <div className="bg-green-900/50 rounded-lg p-3 mb-4 text-center text-green-300">
            {message}
          </div>
        )}
        
        {/* 売却可能アイテム */}
        {sellableItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm text-slate-400 mb-2">売却可能（{SELL_PRICE}コイン/個）</h2>
            <div className="space-y-2">
              {sellableItems.map(({ itemId, count, item }) => (
                <div key={itemId} className="bg-slate-700 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{item?.name}</span>
                    <span className="text-slate-400 ml-2">x{count}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSell(itemId)}
                      className="bg-amber-600 hover:bg-amber-500 px-3 py-1 rounded text-sm"
                    >
                      1個売却
                    </button>
                    {count > 1 && (
                      <button
                        onClick={() => handleSellAll(itemId, count)}
                        className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm"
                      >
                        全売却
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* その他のアイテム */}
        {otherItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm text-slate-400 mb-2">その他のアイテム</h2>
            <div className="space-y-2">
              {otherItems.map(({ itemId, count, item }) => (
                <div key={itemId} className="bg-slate-700 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{item?.name}</span>
                    <span className="text-slate-400 ml-2">x{count}</span>
                  </div>
                  <span className="text-slate-500 text-sm">売却不可</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {sellableItems.length === 0 && otherItems.length === 0 && (
          <EmptyState message="アイテムがありません" />
        )}
    </PageLayout>
  );
}
