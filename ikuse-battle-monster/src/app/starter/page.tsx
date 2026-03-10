'use client';

/**
 * 御三家選択ページ
 * ゲーム開始時に3体の御三家から1体を選び、相性のいい早熟モンスター2体と一緒にスタート
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { getMonsterById, ABILITIES } from '@/lib/data/monsters';
import { TYPE_INFO } from '@/lib/data/types';
import { MonsterType, MonsterSpecies } from '@/lib/types';
import { STARTER_BONUS_MONSTERS } from '@/lib/save/userData';

// 御三家データ
const STARTERS = [
  { id: 'flameoo' as const, emoji: '🔥', color: 'from-red-600 to-orange-500', ring: 'ring-red-500' },
  { id: 'frosty' as const, emoji: '❄️', color: 'from-blue-400 to-cyan-300', ring: 'ring-cyan-500' },
  { id: 'gale_wing' as const, emoji: '🌪️', color: 'from-teal-500 to-green-400', ring: 'ring-teal-500' },
];

// 相性説明
const TYPE_ADVANTAGE: Record<string, string> = {
  flameoo: 'フロスティ（氷）に強い',
  frosty: 'ゲイルウィング（風）に強い',
  gale_wing: 'フレイムー（炎）に強い',
};

// モンスターカード（詳細表示用）
function StarterCard({
  species,
  isSelected,
  onClick,
  bonusMonsters,
  starterConfig,
}: {
  species: MonsterSpecies;
  isSelected: boolean;
  onClick: () => void;
  bonusMonsters: MonsterSpecies[];
  starterConfig: typeof STARTERS[0];
}) {
  const ability = species.fixedAbility ? ABILITIES[species.fixedAbility] : null;
  
  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-xl transition-all duration-300 ${
        isSelected
          ? `bg-gradient-to-br ${starterConfig.color} ring-4 ${starterConfig.ring} scale-105`
          : 'bg-gray-800 hover:bg-gray-700'
      }`}
    >
      {/* アイコン */}
      <div className="text-6xl mb-3 transition-transform duration-300">
        {starterConfig.emoji}
      </div>
      
      {/* 名前 */}
      <h3 className="text-xl font-bold mb-1">{species.name}</h3>
      
      {/* タイプ */}
      <div className="flex justify-center gap-1 mb-2">
        {species.types.map(type => (
          <span
            key={type}
            className="px-2 py-0.5 bg-black/30 rounded text-sm"
          >
            {TYPE_INFO[type as MonsterType].emoji} {TYPE_INFO[type as MonsterType].name}
          </span>
        ))}
      </div>
      
      {/* 説明 */}
      <p className="text-sm text-gray-300 mb-3">{species.description}</p>
      
      {/* ステータス */}
      <div className="grid grid-cols-3 gap-1 text-xs mb-3">
        <div className="bg-black/20 rounded p-1">
          <div className="text-gray-400">HP</div>
          <div className="font-bold">{species.baseStats.hp}</div>
        </div>
        <div className="bg-black/20 rounded p-1">
          <div className="text-gray-400">ATK</div>
          <div className="font-bold">{species.baseStats.atk}</div>
        </div>
        <div className="bg-black/20 rounded p-1">
          <div className="text-gray-400">SPD</div>
          <div className="font-bold">{species.baseStats.spd}</div>
        </div>
      </div>
      
      {/* 特性 */}
      {ability && (
        <div className="text-xs bg-black/20 rounded p-2 mb-3">
          <span className="text-yellow-300">特性: {ability.name}</span>
          <br />
          <span className="text-gray-400">{ability.description}</span>
        </div>
      )}
      
      {/* 相性説明 */}
      <div className="text-xs text-green-300">
        ⚔️ {TYPE_ADVANTAGE[species.id]}
      </div>
      
      {/* ボーナスモンスター */}
      <div className="mt-3 pt-3 border-t border-white/20">
        <div className="text-xs text-gray-400 mb-2">+ 相性補完の仲間</div>
        <div className="flex justify-center gap-2">
          {bonusMonsters.map(m => (
            <div key={m.id} className="text-center">
              <div className="text-lg">
                {m.types.map(t => TYPE_INFO[t as MonsterType].emoji).join('')}
              </div>
              <div className="text-xs">{m.name}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 選択マーク */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
          ✓
        </div>
      )}
    </button>
  );
}

export default function StarterPage() {
  const router = useRouter();
  const { isLoading, isLoggedIn, needsStarterSelection, selectStarter, login } = useUser();
  const [selectedId, setSelectedId] = useState<'flameoo' | 'frosty' | 'gale_wing' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 選択確定
  const handleConfirm = async () => {
    if (!selectedId) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const success = await selectStarter(selectedId);
      if (success) {
        // プロフィールページへ遷移
        router.push('/profile');
      } else {
        setError('御三家の選択に失敗しました。もう一度お試しください。');
      }
    } catch (err) {
      setError('エラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ローディング
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }
  
  // 未ログイン
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
        <div className="max-w-2xl mx-auto pt-12 text-center">
          <h1 className="text-4xl font-bold mb-4">🎮 ゲームスタート</h1>
          <p className="text-gray-300 mb-8">
            ログインして御三家を選び、冒険を始めよう！
          </p>
          
          <button
            onClick={login}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg transition-colors"
          >
            ログインして始める
          </button>
        </div>
      </div>
    );
  }
  
  // 既に選択済み
  if (!needsStarterSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
        <div className="max-w-2xl mx-auto pt-12 text-center">
          <h1 className="text-4xl font-bold mb-4">✅ 御三家選択済み</h1>
          <p className="text-gray-300 mb-8">
            すでに冒険は始まっています！
          </p>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/battle')}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors"
            >
              ⚔️ バトルへ
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
            >
              👤 プロフィール
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold mb-2">🎮 御三家を選ぼう！</h1>
          <p className="text-gray-300">
            最初のパートナーを1体選んでください。<br />
            選んだ御三家と相性のいい早熟モンスター2体も仲間になります！
          </p>
        </header>
        
        {/* 御三家カード */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {STARTERS.map(starter => {
            const species = getMonsterById(starter.id);
            if (!species) return null;
            
            const bonusIds = STARTER_BONUS_MONSTERS[starter.id];
            const bonusMonsters = bonusIds
              .map(id => getMonsterById(id))
              .filter((m): m is MonsterSpecies => m !== undefined);
            
            return (
              <StarterCard
                key={starter.id}
                species={species}
                isSelected={selectedId === starter.id}
                onClick={() => setSelectedId(starter.id)}
                bonusMonsters={bonusMonsters}
                starterConfig={starter}
              />
            );
          })}
        </div>
        
        {/* 相性図 */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-center">
          <h2 className="text-lg font-bold mb-3">⚔️ 三つ巴の相性</h2>
          <div className="flex items-center justify-center gap-4 text-2xl">
            <span>🔥</span>
            <span className="text-xl">→</span>
            <span>❄️</span>
            <span className="text-xl">→</span>
            <span>🌪️</span>
            <span className="text-xl">→</span>
            <span>🔥</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            炎は氷に強い / 氷は風に強い / 風は炎に強い
          </p>
        </div>
        
        {/* エラー表示 */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4 text-center text-red-300">
            {error}
          </div>
        )}
        
        {/* 確定ボタン */}
        <div className="text-center">
          <button
            onClick={handleConfirm}
            disabled={!selectedId || isSubmitting}
            className="px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed rounded-xl font-bold text-xl transition-all duration-300 shadow-lg"
          >
            {isSubmitting
              ? '決定中...'
              : selectedId
                ? `${getMonsterById(selectedId)?.name}を選んで冒険開始！`
                : '御三家を選んでください'}
          </button>
        </div>
        
        {/* 補足説明 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>※ 御三家は後から変更できません。慎重に選んでください。</p>
          <p>※ 御三家は特性・技が固定の特別なモンスターです。</p>
        </div>
      </div>
    </div>
  );
}
