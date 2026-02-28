'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { EmptyState } from '@/components/EmptyState';
import { getItemById } from '@/lib/data/items';
import { allEquipments, getEquipmentById } from '@/lib/data/equipments';

const SELL_PRICE = 20; // チケット・書の売却価格
const EQUIPMENT_SELL_PRICE = 30; // 通常装備の売却価格

export default function ItemsPage() {
  const router = useRouter();
  const { inventory, equipments, characters, coins, addCoins, useItem, removeEquipment, syncToServer } = useGameStore();
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
  
  // 売却可能な装備（通常のみ）
  const sellableEquipments = Object.entries(equipments)
    .filter(([eqId, count]) => count > 0)
    .map(([eqId, count]) => {
      const eq = getEquipmentById(eqId);
      // 装備中のキャラ数を計算
      const equippedCount = characters.filter(c => c.equipmentId === eqId).length;
      const available = count - equippedCount;
      return { eqId, count, available, eq };
    })
    .filter(({ eq }) => eq && eq.rarity === 'normal');
  
  // レア装備（売却不可）
  const rareEquipments = Object.entries(equipments)
    .filter(([eqId, count]) => count > 0)
    .map(([eqId, count]) => ({ eqId, count, eq: getEquipmentById(eqId) }))
    .filter(({ eq }) => eq && eq.rarity === 'rare');
  
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
  
  // 装備売却
  const handleSellEquipment = async (eqId: string) => {
    const eq = getEquipmentById(eqId);
    if (!eq) return;
    
    if (removeEquipment(eqId, 1)) {
      addCoins(EQUIPMENT_SELL_PRICE);
      await syncToServer();
      setMessage(`${eq.name} を売却して ${EQUIPMENT_SELL_PRICE} コイン獲得！`);
      setTimeout(() => setMessage(''), 2000);
    }
  };
  
  const handleSellAllEquipment = async (eqId: string, count: number) => {
    const eq = getEquipmentById(eqId);
    if (!eq) return;
    
    if (removeEquipment(eqId, count)) {
      const totalCoins = EQUIPMENT_SELL_PRICE * count;
      addCoins(totalCoins);
      await syncToServer();
      setMessage(`${eq.name} x${count} を売却して ${totalCoins} コイン獲得！`);
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
        
        {/* 通常装備（売却可能） */}
        {sellableEquipments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm text-slate-400 mb-2">🎒 装備（{EQUIPMENT_SELL_PRICE}コイン/個）</h2>
            <div className="space-y-2">
              {sellableEquipments.map(({ eqId, count, available, eq }) => (
                <div key={eqId} className="bg-slate-700 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{eq?.name}</span>
                    <span className="text-slate-400 ml-2">x{count}</span>
                    {available < count && (
                      <span className="text-xs text-slate-500 ml-2">（{count - available}個装備中）</span>
                    )}
                  </div>
                  {available > 0 ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSellEquipment(eqId)}
                        className="bg-amber-600 hover:bg-amber-500 px-3 py-1 rounded text-sm"
                      >
                        1個売却
                      </button>
                      {available > 1 && (
                        <button
                          onClick={() => handleSellAllEquipment(eqId, available)}
                          className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm"
                        >
                          全売却
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-sm">装備中</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* レア装備（売却不可） */}
        {rareEquipments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm text-yellow-400 mb-2">🌟 レア装備（売却不可）</h2>
            <div className="space-y-2">
              {rareEquipments.map(({ eqId, count, eq }) => (
                <div key={eqId} className="bg-yellow-900/30 rounded-lg p-3 border border-yellow-700 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-yellow-300">{eq?.name}</span>
                    <span className="text-slate-400 ml-2">x{count}</span>
                  </div>
                  <span className="text-yellow-500 text-sm">売却不可</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {sellableItems.length === 0 && otherItems.length === 0 && sellableEquipments.length === 0 && rareEquipments.length === 0 && (
          <EmptyState message="アイテムがありません" />
        )}
    </PageLayout>
  );
}
