'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { LoadingScreen } from '@/components/LoadingScreen';
import {
  MODIFICATIONS,
  MODIFICATION_CONSTANTS,
  getModificationById,
  getModificationsBySlotCost,
  calculateUsedSlots,
  calculateRemainingSlots,
  canSelectModification,
} from '@/lib/data/modifications';

type SlotCategory = 1 | 3 | 5 | 10;

const CATEGORY_LABELS: Record<SlotCategory, string> = {
  1: '1枠 - ステータス強化',
  3: '3枠 - 基本パッシブ',
  5: '5枠 - 属性・系統特化',
  10: '10枠 - 強力パッシブ',
};

export default function BioModificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    characters,
    coins,
    unlockModificationSlots,
    selectModification,
    removeModification,
    isLoggedIn,
    isLoading: storeLoading,
  } = useGameStore();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<SlotCategory | null>(null);

  // ローディング中またはログイン前
  if (!isLoggedIn || storeLoading) {
    return <LoadingScreen />;
  }

  const character = characters.find(c => c.id === id);

  if (!character) {
    return (
      <PageLayout maxWidth="lg">
        <div className="text-center">
          <p>キャラクターが見つかりません</p>
          <Link href="/" className="text-amber-400 hover:underline">ホームに戻る</Link>
        </div>
      </PageLayout>
    );
  }

  const totalSlots = character.modificationSlots ?? 0;
  const modifications = character.modifications ?? [];
  const usedSlots = calculateUsedSlots(modifications);
  const remainingSlots = calculateRemainingSlots(totalSlots, modifications);
  
  // 解放回数（0→3→6→9→12→15）
  const unlockCount = totalSlots / MODIFICATION_CONSTANTS.SLOTS_PER_UNLOCK;
  const canUnlock = unlockCount < MODIFICATION_CONSTANTS.MAX_UNLOCKS && coins >= MODIFICATION_CONSTANTS.UNLOCK_COST;

  const showMessage = (msg: string, isError: boolean = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2500);
  };

  const handleUnlockSlots = async () => {
    if (!canUnlock || isLoading) return;
    setIsLoading(true);
    const result = await unlockModificationSlots(character.id);
    setIsLoading(false);
    if (result.success) {
      showMessage(`枠を解放しました！（${result.newSlots}枠）`);
    } else {
      showMessage(result.error || 'エラーが発生しました', true);
    }
  };

  const handleSelectModification = async (modificationId: string) => {
    if (isLoading) return;
    
    const check = canSelectModification(modificationId, modifications, totalSlots);
    if (!check.canSelect) {
      showMessage(check.reason || '選択できません', true);
      return;
    }
    
    setIsLoading(true);
    const result = await selectModification(character.id, modificationId);
    setIsLoading(false);
    
    if (result.success) {
      const mod = getModificationById(modificationId);
      showMessage(`${mod?.name}を選択しました！`);
    } else {
      showMessage(result.error || 'エラーが発生しました', true);
    }
  };

  const handleRemoveModification = async (modificationId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    const result = await removeModification(character.id, modificationId);
    setIsLoading(false);
    
    if (result.success) {
      const mod = getModificationById(modificationId);
      showMessage(`${mod?.name}を解除しました`);
    } else {
      showMessage(result.error || 'エラーが発生しました', true);
    }
  };

  const toggleCategory = (category: SlotCategory) => {
    setExpandedCategory(prev => prev === category ? null : category);
  };

  return (
    <PageLayout maxWidth="lg">
      <PageHeader title="🧬 生物改造" />

      {/* キャラ名とコイン */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-slate-400">対象:</span>
            <span className="ml-2 font-semibold text-lg">{character.name}</span>
          </div>
          <div className="text-amber-400">
            🪙 {coins}
          </div>
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <div className={`rounded-lg p-3 mb-4 text-center ${
          message.includes('エラー') || message.includes('足りません') || message.includes('できません')
            ? 'bg-red-900/50 text-red-300'
            : 'bg-green-900/50 text-green-300'
        }`}>
          {message}
        </div>
      )}

      {/* 枠情報 */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm text-slate-400">改造枠</h3>
            <div className="text-xl font-bold">
              <span className={usedSlots > 0 ? 'text-amber-400' : 'text-slate-300'}>{usedSlots}</span>
              <span className="text-slate-400"> / {totalSlots}</span>
              <span className="text-sm text-slate-500 ml-2">（残り{remainingSlots}枠）</span>
            </div>
          </div>
          {unlockCount >= MODIFICATION_CONSTANTS.MAX_UNLOCKS ? (
            <span className="text-green-400 font-semibold px-4 py-2">MAX</span>
          ) : (
            <button
              onClick={handleUnlockSlots}
              disabled={!canUnlock || isLoading}
              className={`px-4 py-2 rounded-lg font-semibold ${
                canUnlock
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-slate-600 opacity-50 cursor-not-allowed'
              }`}
            >
              {isLoading ? '...' : `+3枠解放 (🪙${MODIFICATION_CONSTANTS.UNLOCK_COST})`}
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500">
          解放: {unlockCount}/{MODIFICATION_CONSTANTS.MAX_UNLOCKS}回 
          （{MODIFICATION_CONSTANTS.UNLOCK_COST}コイン/回）
        </div>
      </div>

      {/* 選択中のボーナス */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
        <h3 className="text-sm text-slate-400 mb-3">✨ 選択中のボーナス</h3>
        {modifications.length === 0 ? (
          <p className="text-slate-500 text-sm">ボーナスが選択されていません</p>
        ) : (
          <div className="space-y-2">
            {modifications.map(modId => {
              const mod = getModificationById(modId);
              if (!mod) return null;
              return (
                <div
                  key={modId}
                  className="bg-slate-700 rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold">
                      {mod.name}
                      <span className="text-xs text-slate-400 ml-2">({mod.slotCost}枠)</span>
                    </div>
                    <div className="text-xs text-slate-400">{mod.description}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveModification(modId)}
                    disabled={isLoading}
                    className="text-red-400 hover:text-red-300 text-sm px-3 py-1"
                  >
                    外す
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ボーナス一覧 */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm text-slate-400 mb-3">📋 ボーナス一覧</h3>
        
        <div className="space-y-2">
            {([1, 3, 5, 10] as SlotCategory[]).map(slotCost => {
              const mods = getModificationsBySlotCost(slotCost);
              const isExpanded = expandedCategory === slotCost;
              
              return (
                <div key={slotCost} className="border border-slate-600 rounded-lg overflow-hidden">
                  {/* カテゴリヘッダー */}
                  <button
                    onClick={() => toggleCategory(slotCost)}
                    className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 flex justify-between items-center"
                  >
                    <span className="font-semibold">{CATEGORY_LABELS[slotCost]}</span>
                    <span className="text-slate-400">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  
                  {/* 展開されたボーナス一覧 */}
                  {isExpanded && (
                    <div className="p-3 space-y-2 bg-slate-800/50">
                      {mods.map(mod => {
                        const isSelected = modifications.includes(mod.id);
                        const check = canSelectModification(mod.id, modifications, totalSlots);
                        
                        return (
                          <div
                            key={mod.id}
                            className={`p-3 rounded-lg ${
                              isSelected
                                ? 'bg-amber-900/30 border border-amber-600'
                                : 'bg-slate-700/50 border border-slate-600'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className={`font-semibold ${isSelected ? 'text-amber-400' : ''}`}>
                                  {mod.name}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  {mod.description}
                                </div>
                              </div>
                              <div className="ml-3">
                                {isSelected ? (
                                  <span className="text-xs text-green-400">選択中</span>
                                ) : check.canSelect ? (
                                  <button
                                    onClick={() => handleSelectModification(mod.id)}
                                    disabled={isLoading}
                                    className="text-xs bg-amber-600 hover:bg-amber-500 px-3 py-1 rounded"
                                  >
                                    選択
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-500">
                                    {remainingSlots < slotCost ? '枠不足' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      </div>

      {/* 戻るリンク */}
      <div className="mt-6 text-center">
        <Link
          href={`/character/${id}`}
          className="text-amber-400 hover:underline"
        >
          ← キャラクター詳細に戻る
        </Link>
      </div>
    </PageLayout>
  );
}
