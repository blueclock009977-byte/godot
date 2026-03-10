'use client';

import { useState } from 'react';
import { BattleAction, Skill } from '@/lib/types';
import { getTypeInfo } from '@/lib/data/types';
import { AvailableActions } from '@/lib/battle/gameLoop';

interface ActionMenuProps {
  availableActions: AvailableActions;
  selectedAction: BattleAction | null;
  onSelectSkill: (skillId: string) => void;
  onSelectSwitch: (index: number) => void;
  onSelectWait: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  getSkill: (skillId: string) => Skill | undefined;
  playerMana: number;
}

type MenuState = 'main' | 'skills' | 'switch';

/**
 * 行動選択UIコンポーネント
 */
export function ActionMenu({
  availableActions,
  selectedAction,
  onSelectSkill,
  onSelectSwitch,
  onSelectWait,
  onConfirm,
  isLoading,
  getSkill,
  playerMana,
}: ActionMenuProps) {
  const [menuState, setMenuState] = useState<MenuState>('main');

  const handleSkillSelect = (skillId: string) => {
    onSelectSkill(skillId);
    setMenuState('main');
  };

  const handleSwitch = (switchTo: number) => {
    onSelectSwitch(switchTo);
    setMenuState('main');
  };

  const handleWait = () => {
    onSelectWait();
    setMenuState('main');
  };

  // 選択された行動の表示
  const getSelectedActionText = () => {
    if (!selectedAction) return null;
    
    switch (selectedAction.type) {
      case 'skill':
        const skill = getSkill(selectedAction.skillId!);
        return skill ? `⚔️ ${skill.name}` : '技';
      case 'switch':
        const switchTarget = availableActions.switches.find(s => s.index === selectedAction.switchTo);
        return switchTarget ? `🔄 ${switchTarget.monster.name}に交代` : '交代';
      case 'wait':
        return '⏳ 待機';
    }
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
        <div className="animate-pulse">処理中...</div>
      </div>
    );
  }

  // メインメニュー
  if (menuState === 'main') {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mt-4">
        <h3 className="text-lg font-bold mb-3 text-white">行動を選択</h3>
        
        {/* 選択済み表示 */}
        {selectedAction && (
          <div className="mb-3 p-2 bg-blue-900/50 rounded text-blue-300 text-sm">
            選択中: {getSelectedActionText()}
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-3 mb-3">
          <button
            onClick={() => setMenuState('skills')}
            className="bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            ⚔️ たたかう
          </button>
          <button
            onClick={() => setMenuState('switch')}
            disabled={availableActions.switches.length === 0}
            className={`py-3 px-4 rounded-lg font-medium transition-colors ${
              availableActions.switches.length === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            🔄 こうたい
          </button>
          <button
            onClick={handleWait}
            className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            ⏳ まつ
          </button>
        </div>
        
        {/* 決定ボタン */}
        <button
          onClick={onConfirm}
          disabled={!selectedAction}
          className={`w-full py-3 rounded-lg font-bold transition-colors ${
            selectedAction
              ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          決定
        </button>
      </div>
    );
  }

  // 技選択メニュー
  if (menuState === 'skills') {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-white">技を選ぶ</h3>
          <button
            onClick={() => setMenuState('main')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← もどる
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {availableActions.skills.map(({ skillId, skill }) => {
            const typeInfo = getTypeInfo(skill.type);
            const canUse = playerMana >= skill.manaCost;

            return (
              <button
                key={skillId}
                onClick={() => canUse && handleSkillSelect(skillId)}
                disabled={!canUse}
                className={`p-3 rounded-lg text-left transition-colors ${
                  canUse
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-800 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-white">
                    {typeInfo.emoji} {skill.name}
                  </span>
                  <span className={`text-xs ${canUse ? 'text-blue-400' : 'text-red-400'}`}>
                    💎{skill.manaCost}
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-gray-400">
                  <span>{skill.category === 'physical' ? '物理' : skill.category === 'special' ? '特殊' : '変化'}</span>
                  {skill.power > 0 && <span>威力:{skill.power}</span>}
                  {skill.accuracy > 0 && <span>命中:{skill.accuracy}</span>}
                </div>
              </button>
            );
          })}
          {availableActions.skills.length === 0 && (
            <div className="col-span-2 text-center text-gray-500 py-4">
              使える技がありません（マナ不足）
            </div>
          )}
        </div>
      </div>
    );
  }

  // 交代メニュー
  if (menuState === 'switch') {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-white">交代先を選ぶ</h3>
          <button
            onClick={() => setMenuState('main')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← もどる
          </button>
        </div>
        <div className="space-y-2">
          {availableActions.switches.map(({ index, monster }) => {
            const hpPercent = (monster.hp / monster.maxHp) * 100;

            return (
              <button
                key={index}
                onClick={() => handleSwitch(index)}
                className="w-full p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-left transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-white">
                    {monster.name}
                  </span>
                  <span className={`text-sm ${
                    hpPercent > 50 ? 'text-green-400' : hpPercent > 25 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {monster.hp}/{monster.maxHp}
                  </span>
                </div>
                {/* ミニHPバー */}
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                  <div
                    className={`h-full rounded-full ${
                      hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
