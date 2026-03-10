'use client';

/**
 * バトルコンテンツ - クライアント側のみで実行
 */

import { useMemo, useEffect, useRef, useState } from 'react';
import { useBattle } from '@/hooks/useBattle';
import { useUser } from '@/hooks/useUser';
import { getStarters, ALL_MONSTERS } from '@/lib/data/monsters';
import { MonsterInstance, MonsterSpecies } from '@/lib/types';
import { BattleField } from '@/components/battle/BattleField';
import { BattleLog } from '@/components/battle/BattleLog';
import { ActionMenu } from '@/components/battle/ActionMenu';
import { createMonsterInstance } from '@/lib/monster/create';

// ============================================
// テスト用パーティ生成（6体）
// ============================================

function createTestParty6(): { instance: MonsterInstance; species: MonsterSpecies }[] {
  // 御三家 + 早熟モンスター3体で合計6体
  const starters = getStarters();
  const earlyMonsters = ALL_MONSTERS.filter(m => !m.isStarter && m.statTier === 'early');
  const shuffled = [...earlyMonsters].sort(() => Math.random() - 0.5);
  const selected = [...starters, ...shuffled.slice(0, 3)];
  
  return selected.map((species) => {
    const instance = createMonsterInstance(species);
    return { instance, species };
  });
}

function createAIParty6(): { instance: MonsterInstance; species: MonsterSpecies }[] {
  // AIは6体のランダムパーティ
  const availableMonsters = ALL_MONSTERS.filter(m => !m.isStarter);
  const shuffled = [...availableMonsters].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 6);
  
  return selected.map((species) => {
    const instance = createMonsterInstance(species);
    return { instance, species };
  });
}

// ============================================
// バトル結果の詳細
// ============================================

interface BattleResultDetails {
  isWin: boolean;
  eggResult?: 'new' | 'shortened' | 'replaced';
  newRating: number;
  ratingChange: number;
}

// ============================================
// バトルコンテンツコンポーネント
// ============================================

export default function BattleContent() {
  // 6体パーティを生成
  const playerParty = useMemo(() => createTestParty6(), []);
  const aiParty = useMemo(() => createAIParty6(), []);
  
  // ユーザーデータ
  const { isLoggedIn, userData, reportWin, reportLoss } = useUser();
  
  // 結果詳細（卵獲得、レート変動）
  const [resultDetails, setResultDetails] = useState<BattleResultDetails | null>(null);
  const hasRecordedResult = useRef(false);
  
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
  
  // バトル終了時に勝敗を記録
  useEffect(() => {
    if (battle.status === 'ended' && !hasRecordedResult.current && isLoggedIn && userData) {
      hasRecordedResult.current = true;
      const isWin = battle.winner === 0;
      
      if (isWin) {
        reportWin().then(result => {
          if (result) {
            setResultDetails({
              isWin: true,
              eggResult: result.eggResult,
              newRating: result.newRating,
              ratingChange: result.ratingChange,
            });
          }
        });
      } else {
        reportLoss().then(result => {
          if (result) {
            setResultDetails({
              isWin: false,
              newRating: result.newRating,
              ratingChange: result.ratingChange,
            });
          }
        });
      }
    }
  }, [battle.status, battle.winner, isLoggedIn, userData, reportWin, reportLoss]);
  
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
            {battle.status === 'picking' && '6体から3体を選出'}
            {battle.status === 'selecting' && `ターン ${battle.battleState.turn} | 行動を選択`}
            {battle.status === 'resolving' && `ターン ${battle.battleState.turn} | 行動解決中...`}
            {battle.status === 'forced_switch' && `ターン ${battle.battleState.turn} | モンスターを選んでください`}
            {battle.status === 'ended' && (
              battle.winner === 0 ? ' 🎉 勝利！' : ' 💀 敗北...'
            )}
          </p>
        </header>
        
        {/* 選出フェーズ */}
        {battle.status === 'picking' && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h2 className="text-xl font-bold mb-4 text-center">
              🎯 パーティ選出 ({battle.selectedIndices.length}/3)
            </h2>
            <p className="text-gray-400 text-center mb-4">
              相手のパーティを確認して、バトルに出す3体を選んでください
            </p>
            
            {/* 相手のパーティ（見せ合い） */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-red-400">👁️ 相手のパーティ</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {battle.gameState.fullParty[1].map((m, i) => (
                  <div key={i} className="bg-gray-700 rounded p-2 text-center">
                    <div className="text-2xl mb-1">
                      {m.species.types.map(t => {
                        const icons: Record<string, string> = {
                          fire: '🔥', water: '💧', earth: '🪨', wind: '🌪️',
                          light: '✨', dark: '🌑', thunder: '⚡', ice: '❄️'
                        };
                        return icons[t] || '';
                      }).join('')}
                    </div>
                    <div className="text-sm font-medium truncate">{m.species.name}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 自分のパーティ（選出可能） */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">⚔️ あなたのパーティ</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {battle.fullParty.map((m, i) => {
                  const isSelected = battle.selectedIndices.includes(i);
                  const order = battle.selectedIndices.indexOf(i) + 1;
                  
                  return (
                    <button
                      key={i}
                      onClick={() => battle.togglePick(i)}
                      className={`p-3 rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-blue-600 ring-2 ring-blue-400' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl">
                          {m.species.types.map(t => {
                            const icons: Record<string, string> = {
                              fire: '🔥', water: '💧', earth: '🪨', wind: '🌪️',
                              light: '✨', dark: '🌑', thunder: '⚡', ice: '❄️'
                            };
                            return icons[t] || '';
                          }).join('')}
                        </span>
                        {isSelected && (
                          <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-sm font-bold">
                            {order}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-bold">{m.species.name}</div>
                        <div className="text-xs text-gray-400">
                          HP:{m.species.baseStats.hp} ATK:{m.species.baseStats.atk} SPD:{m.species.baseStats.spd}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* 選出確定ボタン */}
            <div className="mt-6 text-center">
              <button
                onClick={battle.confirmPicks}
                disabled={battle.selectedIndices.length !== 3 || battle.isLoading}
                className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:opacity-50 rounded-lg font-bold text-lg transition-colors"
              >
                {battle.selectedIndices.length === 3 ? '選出確定 → バトル開始！' : `あと${3 - battle.selectedIndices.length}体選んでください`}
              </button>
            </div>
          </div>
        )}
        
        {/* バトルフィールド（選出フェーズ以外） */}
        {battle.status !== 'picking' && (
          <BattleField
            playerMonster={battle.playerMonster}
            opponentMonster={battle.opponentMonster}
            playerMana={battle.playerMana}
            opponentMana={battle.opponentMana}
            playerName="プレイヤー"
            opponentName="AI"
            weather={battle.battleState.weather}
          />
        )}
        
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
            
            {/* 報酬・レート変動表示 */}
            {resultDetails && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-4 space-y-3">
                {/* レート変動 */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-gray-400">レート:</span>
                  <span className="font-bold">{resultDetails.newRating}</span>
                  <span className={`text-sm ${resultDetails.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ({resultDetails.ratingChange >= 0 ? '+' : ''}{resultDetails.ratingChange})
                  </span>
                </div>
                
                {/* 卵獲得（勝利時のみ） */}
                {resultDetails.isWin && resultDetails.eggResult && (
                  <div className="bg-yellow-900/30 rounded-lg p-3 border border-yellow-700/50">
                    <div className="text-2xl mb-1">🥚</div>
                    <div className="text-yellow-300 font-bold">
                      {resultDetails.eggResult === 'new' && '卵を手に入れた！'}
                      {resultDetails.eggResult === 'shortened' && '卵の孵化時間が短縮された！'}
                      {resultDetails.eggResult === 'replaced' && '新しい卵を手に入れた！'}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      プロフィールで確認できます
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* ログインしていない場合の案内 */}
            {!isLoggedIn && (
              <div className="bg-gray-700/30 rounded-lg p-3 mb-4 text-sm text-gray-400">
                ログインすると戦績が記録され、卵がもらえます
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors"
              >
                もう一度バトル
              </button>
              <a
                href="/profile"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
              >
                プロフィールへ
              </a>
            </div>
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
