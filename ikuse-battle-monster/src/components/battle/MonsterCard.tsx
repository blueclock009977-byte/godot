'use client';

import { BattleMonster, StatusCondition, StatStages } from '@/lib/types';
import { getTypeInfo } from '@/lib/data/types';

interface MonsterCardProps {
  monster: BattleMonster;
  isEnemy?: boolean;
  isActive?: boolean;
  showDetails?: boolean;
}

/** ステータス異常の表示情報 */
const STATUS_DISPLAY: Record<StatusCondition, { emoji: string; label: string; color: string }> = {
  none: { emoji: '', label: '', color: '' },
  burn: { emoji: '🔥', label: 'やけど', color: 'text-orange-400' },
  paralyze: { emoji: '⚡', label: 'まひ', color: 'text-yellow-400' },
  freeze: { emoji: '🧊', label: 'こおり', color: 'text-cyan-400' },
  poison: { emoji: '☠️', label: 'どく', color: 'text-purple-400' },
  badly_poison: { emoji: '💀', label: 'もうどく', color: 'text-purple-600' },
  sleep: { emoji: '💤', label: 'ねむり', color: 'text-gray-400' },
};

/** 能力変化の表示 */
function StatChangesDisplay({ stages }: { stages: StatStages }) {
  const stats: { key: keyof StatStages; label: string }[] = [
    { key: 'atk', label: '攻' },
    { key: 'def', label: '防' },
    { key: 'spd', label: '速' },
    { key: 'mag', label: '特攻' },
    { key: 'res', label: '特防' },
    { key: 'accuracy', label: '命' },
    { key: 'evasion', label: '回' },
  ];

  const changes = stats
    .filter(s => stages[s.key] !== 0)
    .map(s => ({
      ...s,
      value: stages[s.key],
    }));

  if (changes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {changes.map(({ key, label, value }) => (
        <span
          key={key}
          className={`text-xs px-1 rounded ${
            value > 0 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}
        >
          {label}{value > 0 ? `+${value}` : value}
        </span>
      ))}
    </div>
  );
}

/**
 * モンスターカード表示コンポーネント
 * HP、状態異常、能力変化などを表示
 */
export function MonsterCard({ monster, isEnemy = false, isActive = true, showDetails = true }: MonsterCardProps) {
  const { instance, species, currentHp, maxHp, status, isConfused, statStages } = monster;
  const hpPercentage = Math.max(0, (currentHp / maxHp) * 100);
  
  // HP量に応じて色を変える
  const getHpColor = () => {
    if (hpPercentage > 50) return 'bg-green-500';
    if (hpPercentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // 戦闘不能かどうか
  const isFainted = currentHp <= 0;

  // タイプ情報取得
  const typeInfos = species.types.map(t => getTypeInfo(t));

  return (
    <div
      className={`
        relative rounded-lg p-3 transition-all duration-200
        ${isActive ? 'opacity-100' : 'opacity-60'}
        ${isFainted ? 'bg-gray-800 grayscale' : isEnemy ? 'bg-red-900/40' : 'bg-blue-900/40'}
        ${isActive && !isFainted ? 'ring-2 ring-white/30' : ''}
        border border-gray-600
      `}
    >
      {/* 名前とタイプ */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">
            {instance.nickname || species.name}
          </span>
          <div className="flex gap-1">
            {typeInfos.map(type => (
              <span key={type.id} className="text-sm" title={type.name}>
                {type.emoji}
              </span>
            ))}
          </div>
        </div>
        {isFainted && (
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
            ひんし
          </span>
        )}
      </div>

      {/* HPバー */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">HP</span>
          <span className="text-gray-300">
            {currentHp} / {maxHp}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${getHpColor()} transition-all duration-300 rounded-full`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </div>

      {/* 状態異常 */}
      {showDetails && (status !== 'none' || isConfused) && (
        <div className="flex gap-2 mt-2">
          {status !== 'none' && (
            <span className={`text-xs px-2 py-0.5 rounded bg-gray-700 ${STATUS_DISPLAY[status].color}`}>
              {STATUS_DISPLAY[status].emoji} {STATUS_DISPLAY[status].label}
            </span>
          )}
          {isConfused && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-pink-400">
              😵 こんらん
            </span>
          )}
        </div>
      )}

      {/* 能力変化 */}
      {showDetails && <StatChangesDisplay stages={statStages} />}

      {/* 特殊状態（守り、溜め中など） */}
      {showDetails && (
        <div className="flex gap-2 mt-2">
          {monster.protected && (
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-900 text-cyan-300">
              🛡️ まもり
            </span>
          )}
          {monster.charging && (
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-900 text-yellow-300">
              ⚡ 溜め中
            </span>
          )}
          {monster.diving && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-900 text-blue-300">
              🌊 潜り中
            </span>
          )}
          {monster.flying && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-600 text-gray-300">
              🪽 飛行中
            </span>
          )}
          {monster.trapped && (
            <span className="text-xs px-2 py-0.5 rounded bg-purple-900 text-purple-300">
              ⛓️ 拘束
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * パーティ概要表示（控えモンスター用）
 */
export function PartyOverview({ party, activeIndex }: { party: BattleMonster[]; activeIndex: number }) {
  return (
    <div className="flex gap-2">
      {party.map((mon, idx) => {
        const isFainted = mon.currentHp <= 0;
        const isActive = idx === activeIndex;
        
        return (
          <div
            key={mon.instance.id}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${isFainted ? 'bg-gray-700' : isActive ? 'bg-green-600' : 'bg-blue-600'}
              ${isActive ? 'ring-2 ring-white' : ''}
            `}
            title={`${mon.species.name}: ${mon.currentHp}/${mon.maxHp}`}
          >
            {isFainted ? '✕' : '●'}
          </div>
        );
      })}
    </div>
  );
}
