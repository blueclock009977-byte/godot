'use client';

import { useState } from 'react';
import { BattleAIType, JobType } from '@/lib/types';
import { JOB_DEFAULT_AI } from '@/lib/data/jobs';

// AIタイプの表示情報
const AI_INFO: Record<BattleAIType, { name: string; icon: string; description: string }> = {
  balanced: {
    name: 'バランス型',
    icon: '⚖️',
    description: '状況に応じて回復・バフ・デバフ・攻撃を使い分ける。汎用的なAI。',
  },
  breaker: {
    name: 'ブレイク型',
    icon: '💥',
    description: '50%でデバフ、50%で与ダメ最大の攻撃を選択。デバッファー向け。',
  },
  attacker: {
    name: 'アタック型',
    icon: '⚔️',
    description: '通常攻撃+スキルから与ダメ最大を選択。回復・バフは使わない。',
  },
  support: {
    name: 'サポート型',
    icon: '🛡️',
    description: 'バフ→デバフ→回復→攻撃の優先順位で行動。バッファー向け。',
  },
  healer: {
    name: 'ヒーラー型',
    icon: '💚',
    description: '味方HP70%以下で即回復。回復を最優先する。回復職向け。',
  },
};

interface BattleAISelectorProps {
  currentAI: BattleAIType | undefined;
  jobDefaultAI: BattleAIType;
  jobName: string;
  onSelect: (ai: BattleAIType | undefined) => Promise<void>;
  isLoading?: boolean;
}

export function BattleAISelector({ 
  currentAI, 
  jobDefaultAI, 
  jobName,
  onSelect,
  isLoading = false,
}: BattleAISelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAI, setSelectedAI] = useState<BattleAIType | undefined>(currentAI);
  
  // 実際に適用されるAI（未設定なら職業デフォルト）
  const effectiveAI = currentAI ?? jobDefaultAI;
  const info = AI_INFO[effectiveAI];
  
  const handleSelect = async (ai: BattleAIType) => {
    setSelectedAI(ai);
  };
  
  const handleSave = async () => {
    // 職業デフォルトと同じ場合はundefinedに戻す（リセット）
    const valueToSave = selectedAI === jobDefaultAI ? undefined : selectedAI;
    await onSelect(valueToSave);
    setIsOpen(false);
  };
  
  const handleReset = async () => {
    setSelectedAI(undefined);
    await onSelect(undefined);
    setIsOpen(false);
  };

  return (
    <>
      {/* 現在のAI表示 */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
        <h3 className="text-sm text-slate-400 mb-2">🤖 戦闘AI</h3>
        <div className="flex justify-between items-center">
          <div>
            <div className="font-semibold text-amber-400">
              {info.icon} {info.name}
              {!currentAI && (
                <span className="text-xs text-slate-400 ml-2">（職業デフォルト）</span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">{info.description}</div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-3 py-1 rounded text-sm bg-slate-600 hover:bg-slate-500"
          >
            変更
          </button>
        </div>
      </div>
      
      {/* モーダル */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-600 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-600">
              <h2 className="text-lg font-semibold">🤖 戦闘AI設定</h2>
              <p className="text-xs text-slate-400 mt-1">
                {jobName}のデフォルト: {AI_INFO[jobDefaultAI].icon} {AI_INFO[jobDefaultAI].name}
              </p>
            </div>
            
            <div className="p-4 space-y-2">
              {(Object.keys(AI_INFO) as BattleAIType[]).map((ai) => {
                const aiInfo = AI_INFO[ai];
                const isSelected = (selectedAI ?? jobDefaultAI) === ai;
                const isDefault = ai === jobDefaultAI;
                
                return (
                  <button
                    key={ai}
                    onClick={() => handleSelect(ai)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-amber-900/50 border-amber-500'
                        : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">
                        {aiInfo.icon} {aiInfo.name}
                      </div>
                      <div className="flex items-center gap-2">
                        {isDefault && (
                          <span className="text-xs text-slate-400 bg-slate-600 px-2 py-0.5 rounded">
                            デフォルト
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-amber-400">✓</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{aiInfo.description}</div>
                  </button>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-slate-600 flex justify-between">
              <button
                onClick={handleReset}
                disabled={isLoading || !currentAI}
                className={`px-4 py-2 rounded text-sm ${
                  currentAI
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                デフォルトに戻す
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedAI(currentAI);
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 rounded text-sm bg-slate-600 hover:bg-slate-500"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 rounded text-sm bg-amber-600 hover:bg-amber-500 font-semibold"
                >
                  {isLoading ? '...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ヘルパー関数: キャラクターの実効AIを取得
export function getEffectiveAI(character: { battleAI?: BattleAIType; job: JobType }): BattleAIType {
  return character.battleAI ?? JOB_DEFAULT_AI[character.job];
}

// ヘルパー関数: AI情報を取得
export function getAIInfo(ai: BattleAIType) {
  return AI_INFO[ai];
}
