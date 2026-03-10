'use client';

import { BattleMonster, Weather } from '@/lib/types';
import { MonsterCard } from './MonsterCard';
import { ManaBar } from './ManaBar';

/** 天候表示 */
const WEATHER_DISPLAY: Record<Weather, { emoji: string; label: string }> = {
  none: { emoji: '', label: '' },
  sunny: { emoji: '☀️', label: 'はれ' },
  rain: { emoji: '🌧️', label: 'あめ' },
  sandstorm: { emoji: '🏜️', label: 'すなあらし' },
  snow: { emoji: '❄️', label: 'ゆき' },
};

interface BattleFieldProps {
  playerMonster: BattleMonster;
  opponentMonster: BattleMonster;
  playerMana: number;
  opponentMana: number;
  playerName: string;
  opponentName: string;
  weather?: Weather;
  weatherTurns?: number;
}

/**
 * バトルフィールド - メインのバトル画面
 */
export function BattleField({
  playerMonster,
  opponentMonster,
  playerMana,
  opponentMana,
  playerName,
  opponentName,
  weather = 'none',
  weatherTurns = 0,
}: BattleFieldProps) {
  const weatherDisplay = WEATHER_DISPLAY[weather];

  return (
    <div className="space-y-4">
      {/* 天候表示 */}
      {weather !== 'none' && (
        <div className="flex justify-center items-center gap-2 text-yellow-400 bg-gray-800/50 rounded-lg py-2">
          <span className="text-xl">{weatherDisplay.emoji}</span>
          <span>{weatherDisplay.label}</span>
          <span className="text-xs text-gray-400">({weatherTurns}ターン)</span>
        </div>
      )}

      {/* 相手サイド */}
      <div className="bg-red-900/20 rounded-lg p-4 border border-red-900/30">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-lg font-bold text-red-300">{opponentName}</h2>
          <div className="w-32">
            <ManaBar current={opponentMana} size="sm" />
          </div>
        </div>
        <MonsterCard monster={opponentMonster} isEnemy />
      </div>

      {/* VS表示 */}
      <div className="flex items-center justify-center">
        <div className="text-4xl opacity-50">⚔️</div>
      </div>

      {/* 自分サイド */}
      <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-900/30">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-lg font-bold text-blue-300">{playerName}</h2>
          <div className="w-48">
            <ManaBar current={playerMana} />
          </div>
        </div>
        <MonsterCard monster={playerMonster} />
      </div>
    </div>
  );
}

/**
 * バトル結果画面
 */
export function BattleResult({
  winner,
  winnerName,
  loserName,
  turns,
  onRematch,
  onExit,
}: {
  winner: 0 | 1;
  winnerName: string;
  loserName: string;
  turns: number;
  onRematch?: () => void;
  onExit?: () => void;
}) {
  const isWin = winner === 0;

  return (
    <div className="bg-gray-800 rounded-lg p-8 text-center">
      <div className="text-6xl mb-4">
        {isWin ? '🏆' : '😢'}
      </div>
      <h1 className={`text-3xl font-bold mb-2 ${
        isWin ? 'text-yellow-400' : 'text-gray-400'
      }`}>
        {isWin ? 'しょうり！' : 'はいぼく...'}
      </h1>
      <p className="text-gray-400 mb-2">
        {isWin ? `${loserName}に勝利しました！` : `${winnerName}に敗北しました...`}
      </p>
      <p className="text-gray-500 text-sm mb-6">
        {turns}ターンで決着
      </p>
      
      <div className="flex gap-4 justify-center">
        {onRematch && (
          <button
            onClick={onRematch}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            もう一度
          </button>
        )}
        {onExit && (
          <button
            onClick={onExit}
            className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            おわる
          </button>
        )}
      </div>
    </div>
  );
}
