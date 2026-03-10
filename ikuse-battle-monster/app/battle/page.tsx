'use client';

/**
 * バトルページ - AIとのテストバトル
 */

import { useMemo, useEffect, useRef } from 'react';
import { useBattle } from '@/hooks/useBattle';
import { getMonsterById, getStarters, ALL_MONSTERS } from '@/lib/data/monsters';
import { MonsterInstance, MonsterSpecies } from '@/lib/types';
import { createMonsterInstance } from '@/lib/monster/create';
import { BattleField } from '@/components/battle/BattleField';
import { BattleLog } from '@/components/battle/BattleLog';
import { ActionMenu } from '@/components/battle/ActionMenu';

// ============================================
// パーティ生成（createMonsterInstanceを使用）
// ============================================

function createTestParty(monsterIds: string[]): { instance: MonsterInstance; species: MonsterSpecies }[] {
  return monsterIds.map((id) => {
    const species = getMonsterById(id);
    if (!species) {
      throw new Error(`Monster not found: ${id}`);
    }
    
    // createMonsterInstanceで生成（御三家は固定、その他はランダム）
    const instance = createMonsterInstance(species);
    
    return { instance, species };
  });
}

function createAIParty(): { instance: MonsterInstance; species: MonsterSpecies }[] {
  // AIはランダムなモンスターを選ぶ
  const availableMonsters = ALL_MONSTERS.filter(m => !m.isStarter);
  const shuffled = [...availableMonsters].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);
  
  // 企画書通り: 8技から4技ランダム、2特性から1特性ランダム
  return selected.map((species) => {
    const instance = createMonsterInstance(species);
    return { instance, species };
  });
}

// ============================================
// バトルページコンポーネント
// ============================================

export default function BattlePage() {
  // 御三家の最初の3体をプレイヤーパーティに
  const playerParty = useMemo(() => {
    const starters = getStarters();
    return createTestParty(starters.map(s => s.id));
  }, []);
  
  // AIパーティをランダム生成
  const aiParty = useMemo(() => createAIParty(), []);
  
  // バトルフック
  const battle = useBattle({
    player1: {
      id: 'player',
      name: 'プレイヤー',
      party: playerParty,
    },
    player2: {
      id: 'ai',
      name: 'AI',
      party: aiParty,
    },
    isPlayer2AI: true,
    aiDelay: 1000,
  });
  
  // ゲーム開始時に自動スタート
  const hasStarted = useRef(false);
  useEffect(() => {
    if (!hasStarted.current && battle.status === 'selecting') {
      hasStarted.current = true;
      battle.startGame();
    }
  }, [battle]);
  
  // 強制交代が必要な場合のオプション
  const forcedSwitchOptions = useMemo(() => {
    if (battle.status !== 'forced_switch') return [];
    return battle.availableActions.switches;
  }, [battle.status, battle.availableActions]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">モンスターバトル</h1>
          <p className="text-gray-400">
            ターン {battle.battleState.turn} | 
            {battle.status === 'selecting' && ' 行動を選択'}
            {battle.status === 'resolving' && ' 行動解決中...'}
            {battle.status === 'forced_switch' && ' モンスターを選んでください'}
            {battle.status === 'ended' && (
              battle.winner === 0 ? ' 🎉 勝利！' : ' 💀 敗北...'
            )}
          </p>
        </header>
        
        {/* バトルフィールド */}
        <BattleField
          playerMonster={battle.playerMonster}
          opponentMonster={battle.opponentMonster}
          playerMana={battle.playerMana}
          opponentMana={battle.opponentMana}
          playerName="プレイヤー"
          opponentName="AI"
          weather={battle.battleState.weather}
        />
        
        {/* 行動選択メニュー */}
        {battle.status === 'selecting' && (
          <ActionMenu
            availableActions={battle.availableActions}
            selectedAction={battle.selectedAction}
            onSelectSkill={battle.selectSkill}
            onSelectSwitch={battle.selectSwitch}
            onSelectWait={battle.selectWait}
            onConfirm={battle.confirmAction}
            isLoading={battle.isLoading}
            getSkill={battle.getSkill}
            playerMana={battle.playerMana}
          />
        )}
        
        {/* 強制交代UI */}
        {battle.status === 'forced_switch' && forcedSwitchOptions.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mt-4">
            <h3 className="text-lg font-bold mb-3 text-red-400">
              モンスターが倒れた！次のモンスターを選んでください
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {forcedSwitchOptions.map(opt => (
                <button
                  key={opt.index}
                  onClick={() => battle.submitForcedSwitch(opt.index)}
                  disabled={battle.isLoading}
                  className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  <div className="font-bold">{opt.monster.name}</div>
                  <div className="text-sm text-gray-300">
                    HP: {opt.monster.hp}/{opt.monster.maxHp}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* バトル結果 */}
        {battle.status === 'ended' && battle.result && (
          <div className="bg-gray-800 rounded-lg p-6 mt-4 text-center">
            <h2 className="text-2xl font-bold mb-4">
              {battle.winner === 0 ? '🎉 勝利！' : '💀 敗北...'}
            </h2>
            <p className="text-gray-300 mb-4">
              {battle.result.turns}ターンで決着
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors"
            >
              もう一度バトル
            </button>
          </div>
        )}
        
        {/* バトルログ */}
        <div className="mt-4">
          <BattleLog
            log={battle.battleState.log}
            messages={battle.messages}
          />
        </div>
      </div>
    </div>
  );
}
