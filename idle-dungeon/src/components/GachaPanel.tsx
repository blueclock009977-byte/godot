'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { equipments, getEquipmentById, getRarityColor, getRarityBgColor } from '@/lib/data/equipments';
import { skills, getSkillById } from '@/lib/data/skills';
import { Equipment, Skill, GachaResult, Rarity } from '@/lib/types';

// ガチャ価格設定
const GACHA_PRICES = {
  single: 100,
  ten: 900, // 10連は10%OFF
};

// レアリティ確率（%）
const RARITY_RATES = {
  common: 60,
  rare: 30,
  epic: 8,
  legendary: 2,
};

// 天井発動回数
const PITY_THRESHOLD = 100;

// ガチャプール（装備とスキルを混合）
function getGachaPool(): Array<{ type: 'equipment' | 'skill'; item: Equipment | Skill; rarity: Rarity }> {
  const pool: Array<{ type: 'equipment' | 'skill'; item: Equipment | Skill; rarity: Rarity }> = [];
  
  // 装備をプールに追加
  equipments.forEach(eq => {
    pool.push({ type: 'equipment', item: eq, rarity: eq.rarity });
  });
  
  // スキルをプールに追加（スキルはレア以上のみ）
  skills.forEach(skill => {
    // スキルIDから推定レアリティ
    let rarity: Rarity = 'rare';
    if (skill.id.includes('_2')) rarity = 'epic';
    if (skill.id.includes('_3')) rarity = 'legendary';
    pool.push({ type: 'skill', item: skill, rarity });
  });
  
  return pool;
}

// 確率に基づいてレアリティを決定
function rollRarity(pityCounter: number): { rarity: Rarity; isPity: boolean } {
  // 天井チェック
  if (pityCounter >= PITY_THRESHOLD) {
    return { rarity: 'legendary', isPity: true };
  }
  
  const roll = Math.random() * 100;
  let cumulative = 0;
  
  cumulative += RARITY_RATES.legendary;
  if (roll < cumulative) return { rarity: 'legendary', isPity: false };
  
  cumulative += RARITY_RATES.epic;
  if (roll < cumulative) return { rarity: 'epic', isPity: false };
  
  cumulative += RARITY_RATES.rare;
  if (roll < cumulative) return { rarity: 'rare', isPity: false };
  
  return { rarity: 'common', isPity: false };
}

// ガチャを引く
function pullSingleGacha(
  pityCounter: number,
  ownedEquipments: string[],
  ownedSkills: string[]
): GachaResult & { newPityCounter: number } {
  const { rarity, isPity } = rollRarity(pityCounter);
  const pool = getGachaPool().filter(p => p.rarity === rarity);
  
  if (pool.length === 0) {
    // フォールバック：コモン装備
    const fallback = equipments.find(e => e.rarity === 'common')!;
    return {
      item: fallback,
      isNew: !ownedEquipments.includes(fallback.id),
      rarity: 'common',
      isPity: false,
      itemType: 'equipment',
      newPityCounter: pityCounter + 1,
    };
  }
  
  const selected = pool[Math.floor(Math.random() * pool.length)];
  const isNew = selected.type === 'equipment' 
    ? !ownedEquipments.includes((selected.item as Equipment).id)
    : !ownedSkills.includes((selected.item as Skill).id);
  
  return {
    item: selected.item,
    isNew,
    rarity: selected.rarity,
    isPity,
    itemType: selected.type,
    newPityCounter: rarity === 'legendary' ? 0 : pityCounter + 1,
  };
}

export function GachaPanel() {
  const { userData, syncToServer } = useGameStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [results, setResults] = useState<GachaResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [message, setMessage] = useState('');
  
  if (!userData) return null;
  
  const { coins, inventory, skillInventory, gachaHistory } = userData;
  const pityCounter = gachaHistory?.pityCounter ?? 0;
  const totalPulls = gachaHistory?.totalPulls ?? 0;
  
  const canPullSingle = coins >= GACHA_PRICES.single;
  const canPullTen = coins >= GACHA_PRICES.ten;
  
  const doPull = async (count: number) => {
    const price = count === 1 ? GACHA_PRICES.single : GACHA_PRICES.ten;
    
    if (coins < price) {
      setMessage('コインが足りません！');
      return;
    }
    
    setIsAnimating(true);
    setShowResults(false);
    setMessage('');
    
    // アニメーション待機
    await new Promise(r => setTimeout(r, 1500));
    
    const newResults: GachaResult[] = [];
    let currentPity = pityCounter;
    let legendaryCount = 0;
    
    for (let i = 0; i < count; i++) {
      const result = pullSingleGacha(currentPity, inventory, skillInventory);
      newResults.push(result);
      currentPity = result.newPityCounter;
      if (result.rarity === 'legendary') legendaryCount++;
    }
    
    // ステート更新
    const newCoins = coins - price;
    const newInventory = [...inventory];
    const newSkillInventory = [...skillInventory];
    
    newResults.forEach(result => {
      if (result.itemType === 'equipment') {
        const eq = result.item as Equipment;
        if (!newInventory.includes(eq.id)) {
          newInventory.push(eq.id);
        }
      } else {
        const sk = result.item as Skill;
        if (!newSkillInventory.includes(sk.id)) {
          newSkillInventory.push(sk.id);
        }
      }
    });
    
    // Zustandストア更新
    useGameStore.setState((state) => ({
      userData: state.userData ? {
        ...state.userData,
        coins: newCoins,
        inventory: newInventory,
        skillInventory: newSkillInventory,
        gachaHistory: {
          totalPulls: totalPulls + count,
          pityCounter: currentPity,
          lastPullTimestamp: Date.now(),
          legendaryPulls: (gachaHistory?.legendaryPulls ?? 0) + legendaryCount,
        },
      } : null,
    }));
    
    setResults(newResults);
    setIsAnimating(false);
    setShowResults(true);
    
    // サーバー同期
    await syncToServer();
  };
  
  const pityProgress = Math.round((pityCounter / PITY_THRESHOLD) * 100);
  
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        🎰 ガチャ
      </h3>
      
      {/* 所持コイン */}
      <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
        <div className="text-sm text-slate-400">所持コイン</div>
        <div className="text-2xl font-bold text-amber-400">{coins.toLocaleString()} 🪙</div>
      </div>
      
      {/* 天井カウンター */}
      <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">天井まで</span>
          <span className="text-yellow-400">{PITY_THRESHOLD - pityCounter}回</span>
        </div>
        <div className="w-full bg-slate-600 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full h-2 transition-all"
            style={{ width: `${pityProgress}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 mt-1">
          ★5確定まで残り{PITY_THRESHOLD - pityCounter}回
        </div>
      </div>
      
      {/* 確率表示 */}
      <div className="mb-4 p-3 bg-slate-700/50 rounded-lg text-sm">
        <div className="text-slate-400 mb-2">排出確率</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between">
            <span className="text-yellow-400">★5 Legendary</span>
            <span>{RARITY_RATES.legendary}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-400">★4 Epic</span>
            <span>{RARITY_RATES.epic}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-400">★3 Rare</span>
            <span>{RARITY_RATES.rare}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">★2 Common</span>
            <span>{RARITY_RATES.common}%</span>
          </div>
        </div>
      </div>
      
      {/* ガチャボタン */}
      <div className="space-y-2">
        <button
          onClick={() => doPull(1)}
          disabled={!canPullSingle || isAnimating}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed font-semibold transition-colors"
        >
          {isAnimating ? '抽選中...' : `単発 ${GACHA_PRICES.single} 🪙`}
        </button>
        <button
          onClick={() => doPull(10)}
          disabled={!canPullTen || isAnimating}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 disabled:bg-slate-600 disabled:cursor-not-allowed font-semibold transition-colors"
        >
          {isAnimating ? '抽選中...' : `10連 ${GACHA_PRICES.ten} 🪙 (10%OFF!)`}
        </button>
      </div>
      
      {message && (
        <div className="mt-3 text-center text-red-400 text-sm">{message}</div>
      )}
      
      {/* 累計統計 */}
      <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
        <div className="flex justify-between">
          <span>累計ガチャ回数</span>
          <span>{totalPulls}回</span>
        </div>
        <div className="flex justify-between">
          <span>★5排出回数</span>
          <span className="text-yellow-400">{gachaHistory?.legendaryPulls ?? 0}回</span>
        </div>
      </div>
      
      {/* 結果表示モーダル */}
      {showResults && results.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto border border-slate-600">
            <h3 className="text-xl font-bold mb-4 text-center">
              {results.some(r => r.rarity === 'legendary') ? '🎉 大当たり！' : 'ガチャ結果'}
            </h3>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {results.map((result, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border-2 ${getRarityBgColor(result.rarity)} ${
                    result.rarity === 'legendary' ? 'border-yellow-400 animate-pulse' : 
                    result.rarity === 'epic' ? 'border-purple-400' : 
                    result.rarity === 'rare' ? 'border-blue-400' : 'border-slate-600'
                  }`}
                >
                  <div className={`font-semibold ${getRarityColor(result.rarity)}`}>
                    {result.itemType === 'equipment' 
                      ? (result.item as Equipment).name 
                      : (result.item as Skill).name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {result.itemType === 'equipment' ? '装備' : 'スキル'}
                    {result.isNew && <span className="ml-1 text-green-400">NEW!</span>}
                    {result.isPity && <span className="ml-1 text-yellow-400">天井!</span>}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setShowResults(false)}
              className="w-full py-2 rounded-lg bg-slate-600 hover:bg-slate-500 font-semibold transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
