'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_MONSTERS, getAbilityById } from '@/lib/data/monsters';
import { getSkillById } from '@/lib/data/skills';
import { TYPE_INFO } from '@/lib/data/types';
import type { MonsterType, MonsterSpecies, StatTier } from '@/lib/types';

const TIER_LABELS: Record<StatTier, { name: string; color: string; total: number }> = {
  starter: { name: '御三家', color: 'text-yellow-400', total: 490 },
  early: { name: '早熟', color: 'text-green-400', total: 450 },
  normal: { name: '普通', color: 'text-blue-400', total: 490 },
  late: { name: '晩成', color: 'text-purple-400', total: 530 },
};

const ALL_TYPES: MonsterType[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark', 'thunder', 'ice'];

function TypeBadge({ type }: { type: MonsterType }) {
  const info = TYPE_INFO[type];
  return (
    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-gray-700">
      {info?.emoji || '⚪'} {info?.name || type}
    </span>
  );
}

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= 110 ? 'bg-red-500' : value >= 90 ? 'bg-orange-400' : value >= 70 ? 'bg-yellow-400' : value >= 50 ? 'bg-green-400' : 'bg-blue-400';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-gray-400 text-right">{label}</span>
      <span className="w-8 text-right font-mono">{value}</span>
      <div className="flex-1 bg-gray-700 rounded h-2 overflow-hidden">
        <div className={`h-full ${color} rounded`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MonsterDetail({ monster }: { monster: MonsterSpecies }) {
  const [showSkills, setShowSkills] = useState(false);
  const tierInfo = TIER_LABELS[monster.statTier];
  const stats = monster.baseStats;
  const maxStat = 140;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-bold text-white">{monster.name}</h3>
          <div className="flex gap-1 mt-1">
            {monster.types.map(t => <TypeBadge key={t} type={t} />)}
          </div>
        </div>
        <span className={`text-xs font-medium ${tierInfo.color}`}>
          {tierInfo.name} ({tierInfo.total}族)
        </span>
      </div>

      {/* Description */}
      {monster.description && (
        <p className="text-xs text-gray-400 mb-3">{monster.description}</p>
      )}

      {/* Stats */}
      <div className="space-y-1 mb-3">
        <StatBar label="HP" value={stats.hp} max={maxStat} />
        <StatBar label="ATK" value={stats.atk} max={maxStat} />
        <StatBar label="DEF" value={stats.def} max={maxStat} />
        <StatBar label="SPD" value={stats.spd} max={maxStat} />
        <StatBar label="MAG" value={stats.mag} max={maxStat} />
        <StatBar label="RES" value={stats.res} max={maxStat} />
        <div className="text-xs text-gray-500 text-right">
          合計: {stats.hp + stats.atk + stats.def + stats.spd + stats.mag + stats.res}
        </div>
      </div>

      {/* Abilities */}
      <div className="mb-3">
        <h4 className="text-xs font-medium text-gray-300 mb-1">特性候補</h4>
        <div className="space-y-1">
          {monster.abilities.map(aid => {
            const ab = getAbilityById(aid);
            return (
              <div key={aid} className="text-xs bg-gray-700/50 rounded px-2 py-1">
                <span className="text-yellow-300">{ab?.name || aid}</span>
                {ab && <span className="text-gray-400 ml-1">- {ab.description}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills toggle */}
      <button
        onClick={() => setShowSkills(!showSkills)}
        className="text-xs text-blue-400 hover:text-blue-300"
      >
        {showSkills ? '▲ 技候補を隠す' : `▼ 技候補を見る (${monster.fixedSkills ? monster.fixedSkills.length + '固定' : monster.skillPool.length + '候補'})`}
      </button>

      {showSkills && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
          {(monster.fixedSkills || monster.skillPool).map(sid => {
            const skill = getSkillById(sid);
            if (!skill) return null;
            const typeInfo = TYPE_INFO[skill.type as MonsterType];
            return (
              <div key={sid} className="bg-gray-700/50 rounded p-2 text-xs flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span>{typeInfo?.emoji || '⚪'}</span>
                  <span className="font-medium text-white">{skill.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  {skill.power > 0 && <span>威力{skill.power}</span>}
                  <span>💎{skill.manaCost}</span>
                </div>
              </div>
            );
          })}
          {monster.fixedSkills && (
            <div className="col-span-full text-xs text-gray-500 italic">※ 御三家は技固定</div>
          )}
          {!monster.fixedSkills && (
            <div className="col-span-full text-xs text-gray-500 italic">※ {monster.skillPool.length}候補から4技をランダム習得</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MonstersPage() {
  const [filterType, setFilterType] = useState<MonsterType | 'all'>('all');
  const [filterTier, setFilterTier] = useState<StatTier | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return ALL_MONSTERS.filter(m => {
      if (filterType !== 'all' && !m.types.includes(filterType)) return false;
      if (filterTier !== 'all' && m.statTier !== filterTier) return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filterType, filterTier, search]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">← ホーム</Link>
        <h1 className="text-xl font-bold">📖 モンスター図鑑</h1>
        <span className="text-gray-500 text-sm">{filtered.length}/{ALL_MONSTERS.length}体</span>
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-4">
        {/* Search */}
        <input
          type="text"
          placeholder="名前で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
        />

        {/* Type filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterType('all')}
            className={`text-xs px-2 py-1 rounded ${filterType === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >全タイプ</button>
          {ALL_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`text-xs px-2 py-1 rounded ${filterType === t ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              {TYPE_INFO[t]?.emoji} {TYPE_INFO[t]?.name}
            </button>
          ))}
        </div>

        {/* Tier filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterTier('all')}
            className={`text-xs px-2 py-1 rounded ${filterTier === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >全ランク</button>
          {(Object.entries(TIER_LABELS) as [StatTier, typeof TIER_LABELS[StatTier]][]).map(([tier, info]) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`text-xs px-2 py-1 rounded ${filterTier === tier ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              {info.name} ({info.total})
            </button>
          ))}
        </div>
      </div>

      {/* Monster List */}
      <div className="space-y-3">
        {filtered.map(m => (
          <MonsterDetail key={m.id} monster={m} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">該当するモンスターがいません</p>
        )}
      </div>
    </div>
  );
}
