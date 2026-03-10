'use client';

/**
 * プロフィールページ - ユーザー情報、モンスター、卵の管理
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { getMonsterById } from '@/lib/data/monsters';
import { getAbilityById } from '@/lib/data/monsters';
import { getSkillById } from '@/lib/data/skills';
import { SavedMonster } from '@/lib/save/userData';
import { getRatingTier } from '@/lib/egg/egg';
import { formatTimeUntilHatch, getEggTypeName } from '@/lib/egg/egg';
import { TYPE_INFO } from '@/lib/data/types';
import { MonsterType } from '@/lib/types';

// ============================================
// タイプアイコン
// ============================================

function TypeBadge({ type }: { type: MonsterType }) {
  const info = TYPE_INFO[type];
  return (
    <span className="inline-flex items-center gap-1 bg-gray-700 px-2 py-0.5 rounded text-sm">
      <span>{info.emoji}</span>
      <span>{info.name}</span>
    </span>
  );
}

// ============================================
// モンスターカード
// ============================================

interface MonsterCardProps {
  monster: SavedMonster;
  isInParty: boolean;
  onToggleParty: () => void;
}

function MonsterCard({ monster, isInParty, onToggleParty }: MonsterCardProps) {
  const species = getMonsterById(monster.speciesId);
  const ability = monster.ability ? getAbilityById(monster.ability) : null;
  const [expanded, setExpanded] = useState(false);
  
  if (!species) return null;
  
  return (
    <div 
      className={`bg-gray-800 rounded-lg p-3 border-2 transition-colors ${
        isInParty ? 'border-blue-500' : 'border-transparent'
      }`}
    >
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {species.types.map(t => (
              <span key={t} className="text-xl">{TYPE_INFO[t as MonsterType].emoji}</span>
            ))}
            <span className="font-bold">{monster.nickname || species.name}</span>
          </div>
          {monster.nickname && (
            <div className="text-xs text-gray-400">{species.name}</div>
          )}
        </div>
        <button
          onClick={onToggleParty}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
            isInParty 
              ? 'bg-blue-600 hover:bg-blue-500' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isInParty ? '✓ パーティ' : '+ 追加'}
        </button>
      </div>
      
      {/* ステータス */}
      <div className="grid grid-cols-6 gap-1 text-xs text-center mb-2">
        <div className="bg-gray-700 rounded p-1">
          <div className="text-gray-400">HP</div>
          <div className="font-bold">{species.baseStats.hp}</div>
        </div>
        <div className="bg-gray-700 rounded p-1">
          <div className="text-gray-400">ATK</div>
          <div className="font-bold">{species.baseStats.atk}</div>
        </div>
        <div className="bg-gray-700 rounded p-1">
          <div className="text-gray-400">DEF</div>
          <div className="font-bold">{species.baseStats.def}</div>
        </div>
        <div className="bg-gray-700 rounded p-1">
          <div className="text-gray-400">SPD</div>
          <div className="font-bold">{species.baseStats.spd}</div>
        </div>
        <div className="bg-gray-700 rounded p-1">
          <div className="text-gray-400">MAG</div>
          <div className="font-bold">{species.baseStats.mag}</div>
        </div>
        <div className="bg-gray-700 rounded p-1">
          <div className="text-gray-400">RES</div>
          <div className="font-bold">{species.baseStats.res}</div>
        </div>
      </div>
      
      {/* 特性 */}
      {ability && (
        <div className="text-xs mb-2">
          <span className="text-gray-400">特性: </span>
          <span className="text-yellow-300">{ability.name}</span>
          <span className="text-gray-500 ml-1">- {ability.description}</span>
        </div>
      )}
      
      {/* 詳細トグル */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-400 hover:text-blue-300"
      >
        {expanded ? '▲ 技を隠す' : '▼ 技を見る'}
      </button>
      
      {/* 技一覧 */}
      {expanded && (
        <div className="mt-2 space-y-1">
          {monster.skills.map(skillId => {
            const skill = getSkillById(skillId);
            if (!skill) return null;
            return (
              <div key={skillId} className="bg-gray-700/50 rounded p-2 text-xs">
                <div className="flex items-center gap-2">
                  <span>{TYPE_INFO[skill.type as MonsterType]?.emoji || '⚪'}</span>
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-gray-400">マナ{skill.manaCost}</span>
                  {skill.power > 0 && (
                    <span className="text-gray-400">威力{skill.power}</span>
                  )}
                </div>
                <div className="text-gray-500 mt-1">{skill.description}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// 卵カード
// ============================================

interface EggCardProps {
  egg: {
    type: string;
    obtainedAt: number;
    hatchTime: number;
    isHatched: boolean;
  };
  canHatch: boolean;
  onHatch: () => void;
  isHatching: boolean;
}

function EggCard({ egg, canHatch, onHatch, isHatching }: EggCardProps) {
  const remaining = Math.max(0, egg.hatchTime - Date.now());
  const progress = Math.min(100, ((Date.now() - egg.obtainedAt) / (egg.hatchTime - egg.obtainedAt)) * 100);
  
  // 残り時間フォーマット
  const formatRemaining = () => {
    if (remaining <= 0) return '孵化可能！';
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `残り ${hours}時間${minutes % 60}分`;
    if (minutes > 0) return `残り ${minutes}分${seconds % 60}秒`;
    return `残り ${seconds}秒`;
  };
  
  return (
    <div className="bg-gradient-to-b from-yellow-900/30 to-gray-800 rounded-lg p-4 border border-yellow-700/50">
      <div className="text-center mb-4">
        <div className="text-6xl mb-2">🥚</div>
        <div className="font-bold text-yellow-300">
          {egg.type === 'early' && '早熟卵'}
          {egg.type === 'normal' && '普通卵'}
          {egg.type === 'late' && '晩成卵'}
        </div>
        <div className="text-sm text-gray-400">
          {egg.type === 'early' && '孵化が早い（450族）'}
          {egg.type === 'normal' && '標準的な孵化時間（490族）'}
          {egg.type === 'late' && '孵化が遅いが強い（530族）'}
        </div>
      </div>
      
      {/* 進捗バー */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>孵化進捗</span>
          <span>{formatRemaining()}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* 孵化ボタン */}
      {canHatch && (
        <button
          onClick={onHatch}
          disabled={isHatching}
          className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 rounded-lg font-bold transition-colors"
        >
          {isHatching ? '孵化中...' : '🐣 孵化する！'}
        </button>
      )}
    </div>
  );
}

// ============================================
// メインコンポーネント
// ============================================

export default function ProfilePage() {
  const { 
    user, 
    isLoading, 
    isLoggedIn, 
    userData, 
    login, 
    canHatchEgg, 
    hatchEgg,
    setParty 
  } = useUser();
  
  const [isHatching, setIsHatching] = useState(false);
  const [hatchedMonster, setHatchedMonster] = useState<SavedMonster | null>(null);
  
  // パーティに含まれるモンスターID
  const partyIds = useMemo(() => new Set(userData?.party || []), [userData?.party]);
  
  // モンスターリスト（パーティ優先でソート）
  const sortedMonsters = useMemo(() => {
    if (!userData?.monsters) return [];
    return [...userData.monsters].sort((a, b) => {
      const aInParty = partyIds.has(a.id);
      const bInParty = partyIds.has(b.id);
      if (aInParty && !bInParty) return -1;
      if (!aInParty && bInParty) return 1;
      return 0;
    });
  }, [userData?.monsters, partyIds]);
  
  // パーティ切り替え
  const toggleParty = async (monsterId: string) => {
    if (!userData) return;
    
    const currentParty = userData.party || [];
    const isInParty = currentParty.includes(monsterId);
    
    let newParty: string[];
    if (isInParty) {
      // パーティから除外
      newParty = currentParty.filter(id => id !== monsterId);
    } else {
      // パーティに追加（最大6体）
      if (currentParty.length >= 6) {
        alert('パーティは最大6体までです');
        return;
      }
      newParty = [...currentParty, monsterId];
    }
    
    await setParty(newParty);
  };
  
  // 卵孵化
  const handleHatch = async () => {
    setIsHatching(true);
    try {
      const monster = await hatchEgg();
      if (monster) {
        setHatchedMonster(monster);
      }
    } finally {
      setIsHatching(false);
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
          <h1 className="text-4xl font-bold mb-4">プロフィール</h1>
          <p className="text-gray-400 mb-8">
            ログインして戦績を記録し、モンスターを集めよう
          </p>
          
          <button
            onClick={login}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg transition-colors"
          >
            ログイン
          </button>
          
          <div className="mt-8">
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300"
            >
              ← トップに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // レート帯
  const ratingTier = userData ? getRatingTier(userData.rating) : 'beginner';
  const tierNames: Record<string, string> = {
    beginner: '初心者',
    intermediate: '中級者',
    advanced: '上級者',
  };
  const tierColors: Record<string, string> = {
    beginner: 'text-green-400',
    intermediate: 'text-blue-400',
    advanced: 'text-purple-400',
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <header className="mb-6">
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
            ← トップに戻る
          </Link>
          <h1 className="text-3xl font-bold mt-2">プロフィール</h1>
        </header>
        
        {/* 孵化結果モーダル */}
        {hatchedMonster && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">孵化成功！</h2>
              <div className="text-xl text-yellow-300 mb-4">
                {getMonsterById(hatchedMonster.speciesId)?.name}
              </div>
              <button
                onClick={() => setHatchedMonster(null)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}
        
        {/* ユーザー情報 */}
        <section className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold mb-2">
                プレイヤー
              </h2>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-400">レート: </span>
                  <span className="font-bold text-lg">{userData?.rating || 1000}</span>
                  <span className={`ml-2 ${tierColors[ratingTier]}`}>
                    {tierNames[ratingTier]}
                  </span>
                </div>
                <div className="text-gray-400">
                  {userData?.record?.wins || 0}勝 {userData?.record?.losses || 0}敗
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-gray-400">
                モンスター: {userData?.monsters?.length || 0}体
              </div>
              <div className="text-gray-400">
                パーティ: {userData?.party?.length || 0}/6体
              </div>
            </div>
          </div>
        </section>
        
        {/* 卵セクション */}
        {userData?.egg && !userData.egg.isHatched && (
          <section className="mb-6">
            <h2 className="text-xl font-bold mb-3">🥚 卵</h2>
            <EggCard
              egg={userData.egg}
              canHatch={canHatchEgg}
              onHatch={handleHatch}
              isHatching={isHatching}
            />
          </section>
        )}
        
        {/* パーティセクション */}
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-3">
            ⚔️ パーティ ({userData?.party?.length || 0}/6)
          </h2>
          {(userData?.party?.length || 0) < 3 && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 mb-3 text-sm text-yellow-300">
              ⚠️ バトルには最低3体必要です
            </div>
          )}
          <p className="text-sm text-gray-400 mb-3">
            下のモンスター一覧から「+ 追加」を押してパーティを編成してください
          </p>
        </section>
        
        {/* モンスター一覧 */}
        <section>
          <h2 className="text-xl font-bold mb-3">
            📦 モンスター一覧 ({userData?.monsters?.length || 0}体)
          </h2>
          
          {sortedMonsters.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
              まだモンスターがいません。バトルに勝って卵を手に入れよう！
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {sortedMonsters.map(monster => (
                <MonsterCard
                  key={monster.id}
                  monster={monster}
                  isInParty={partyIds.has(monster.id)}
                  onToggleParty={() => toggleParty(monster.id)}
                />
              ))}
            </div>
          )}
        </section>
        
        {/* バトルへのリンク */}
        <div className="mt-8 text-center">
          <Link
            href="/battle"
            className="inline-block px-8 py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg transition-colors"
          >
            ⚔️ バトルへ
          </Link>
        </div>
      </div>
    </div>
  );
}
