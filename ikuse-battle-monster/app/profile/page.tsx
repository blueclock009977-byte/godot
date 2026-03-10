'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { ALL_MONSTERS } from '@/lib/data/monsters';
import { STARTER_BONUS_MONSTERS, STARTER_IDS } from '@/lib/save/userData';
import { getEggTypeName, formatTimeUntilHatch, getRatingTier, getTimeUntilHatch } from '@/lib/egg';

export default function ProfilePage() {
  const { 
    user, 
    userData, 
    isLoading, 
    isLoggedIn, 
    login, 
    addNewMonster,
    setParty,
    syncStatus,
    canHatchEgg,
    hatchEgg,
  } = useUser();
  
  // 新規ユーザーで御三家未選択なら選択画面を表示
  const showStarterSelect = userData && userData.monsters.length === 0;
  const [starterSelectClosed, setStarterSelectClosed] = useState(false);
  
  // 卵タイマー更新用
  const [eggTimeLeft, setEggTimeLeft] = useState<string>('');
  const [isHatching, setIsHatching] = useState(false);
  const [hatchedMonster, setHatchedMonster] = useState<string | null>(null);
  
  // 卵の残り時間を1秒ごとに更新
  useEffect(() => {
    if (!userData?.egg || userData.egg.isHatched) {
      setEggTimeLeft('');
      return;
    }
    
    const updateTime = () => {
      if (userData.egg) {
        setEggTimeLeft(formatTimeUntilHatch(userData.egg));
      }
    };
    updateTime();
    
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [userData?.egg]);
  
  // 孵化処理
  const handleHatch = useCallback(async () => {
    if (!canHatchEgg) return;
    
    setIsHatching(true);
    const newMonster = await hatchEgg();
    setIsHatching(false);
    
    if (newMonster) {
      const species = ALL_MONSTERS.find(m => m.id === newMonster.speciesId);
      setHatchedMonster(species?.name || '新しいモンスター');
      // 3秒後にメッセージを消す
      setTimeout(() => setHatchedMonster(null), 3000);
    }
  }, [canHatchEgg, hatchEgg]);
  
  // 初回ログイン
  useEffect(() => {
    if (!isLoggedIn && !isLoading) {
      login();
    }
  }, [isLoggedIn, isLoading, login]);
  
  // 御三家選択
  const handleSelectStarter = async (speciesId: string) => {
    const partyIds: string[] = [];

    const starter = await addNewMonster(speciesId);
    if (!starter) return;
    partyIds.push(starter.id);

    const bonusSpecies = STARTER_BONUS_MONSTERS[speciesId] || [];
    for (const bonusSpeciesId of bonusSpecies) {
      const bonus = await addNewMonster(bonusSpeciesId);
      if (bonus) {
        partyIds.push(bonus.id);
      }
    }

    await setParty(partyIds.slice(0, 6));
    setStarterSelectClosed(true);
  };
  
  // パーティ編集
  const handleToggleParty = async (monsterId: string) => {
    if (!userData) return;
    
    const currentParty = [...userData.party];
    const index = currentParty.indexOf(monsterId);
    
    if (index >= 0) {
      // パーティから外す
      currentParty.splice(index, 1);
    } else if (currentParty.length < 6) {
      // パーティに追加
      currentParty.push(monsterId);
    }
    
    await setParty(currentParty);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">読み込み中...</div>
      </div>
    );
  }
  
  // 御三家選択画面
  if (showStarterSelect && !starterSelectClosed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            🎮 最初のパートナーを選ぼう！
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STARTER_IDS.map(id => {
              const species = ALL_MONSTERS.find(m => m.id === id);
              if (!species) return null;
              
              const typeEmoji = getTypeEmoji(species.types[0]);
              
              return (
                <div 
                  key={id}
                  className="bg-white/10 backdrop-blur rounded-xl p-6 text-center cursor-pointer hover:bg-white/20 transition border-2 border-transparent hover:border-yellow-400"
                  onClick={() => handleSelectStarter(id)}
                >
                  <div className="text-6xl mb-4">{typeEmoji}</div>
                  <h2 className="text-2xl font-bold text-white mb-2">{species.name}</h2>
                  <p className="text-gray-300 text-sm mb-4">{species.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                    <div>HP: {species.baseStats.hp}</div>
                    <div>ATK: {species.baseStats.atk}</div>
                    <div>DEF: {species.baseStats.def}</div>
                    <div>SPD: {species.baseStats.spd}</div>
                    <div>MAG: {species.baseStats.mag}</div>
                    <div>RES: {species.baseStats.res}</div>
                  </div>
                  
                  <button className="mt-4 px-6 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400">
                    選ぶ！
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-white hover:text-yellow-400 transition">
            ← ホームに戻る
          </Link>
          <div className="text-gray-400 text-sm">
            {syncStatus === 'syncing' && '同期中...'}
            {syncStatus === 'synced' && '✓ 保存済み'}
            {syncStatus === 'error' && '⚠️ 同期エラー'}
          </div>
        </div>
        
        {/* プロフィールカード */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-4">📋 プロフィール</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">{userData?.record.wins || 0}</div>
              <div className="text-gray-400 text-sm">勝利</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-400">{userData?.record.losses || 0}</div>
              <div className="text-gray-400 text-sm">敗北</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-3xl font-bold text-yellow-400">{userData?.record.streak || 0}</div>
              <div className="text-gray-400 text-sm">連勝中</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-400">{userData?.record.maxStreak || 0}</div>
              <div className="text-gray-400 text-sm">最大連勝</div>
            </div>
          </div>
          
          <div className="mt-4 text-gray-400 text-sm">
            ユーザーID: {user?.uid.slice(0, 8)}...
          </div>
        </div>
        
        {/* 卵セクション */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">🥚 卵</h2>
            {userData && (
              <div className="text-sm text-gray-400">
                レート: <span className="text-yellow-400 font-bold">{userData.rating}</span>
                <span className="ml-2 text-xs">
                  ({getRatingTier(userData.rating) === 'beginner' && '初心者帯'}
                  {getRatingTier(userData.rating) === 'intermediate' && '中級者帯'}
                  {getRatingTier(userData.rating) === 'advanced' && '上級者帯'})
                </span>
              </div>
            )}
          </div>
          
          {/* 孵化完了メッセージ */}
          {hatchedMonster && (
            <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-4 mb-4 text-center animate-pulse">
              <div className="text-2xl mb-2">🎉</div>
              <div className="text-white font-bold">
                <span className="text-yellow-400">{hatchedMonster}</span> が生まれた！
              </div>
            </div>
          )}
          
          {userData?.egg && !userData.egg.isHatched ? (
            <div className="bg-white/5 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4 animate-bounce">🥚</div>
              <div className="text-lg font-bold text-white mb-2">
                {getEggTypeName(userData.egg.type)}
              </div>
              <div className={`text-xl mb-4 ${canHatchEgg ? 'text-green-400 animate-pulse' : 'text-gray-300'}`}>
                {eggTimeLeft}
              </div>
              
              {canHatchEgg ? (
                <button
                  onClick={handleHatch}
                  disabled={isHatching}
                  className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isHatching ? '孵化中...' : '🐣 孵化する！'}
                </button>
              ) : (
                <div className="text-gray-400 text-sm">
                  バトルに勝利すると孵化時間が25%短縮されます
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/5 rounded-lg p-6 text-center text-gray-400">
              <div className="text-4xl mb-4 opacity-50">🥚</div>
              <div className="mb-2">卵を持っていません</div>
              <div className="text-sm">
                オンラインバトルで勝利すると卵がもらえます！
              </div>
            </div>
          )}
        </div>
        
        {/* パーティ */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">⚔️ パーティ ({userData?.party.length || 0}/6)</h2>
          <p className="text-gray-400 text-sm mb-4">バトル時に6体から3体を選出します</p>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[0, 1, 2, 3, 4, 5].map(slot => {
              const monsterId = userData?.party[slot];
              const monster = monsterId 
                ? userData?.monsters.find(m => m.id === monsterId) 
                : null;
              const species = monster 
                ? ALL_MONSTERS.find(m => m.id === monster.speciesId) 
                : null;
              
              if (!monster || !species) {
                return (
                  <div 
                    key={slot}
                    className="bg-white/5 rounded-lg p-4 text-center text-gray-500 border-2 border-dashed border-gray-600"
                  >
                    空きスロット
                  </div>
                );
              }
              
              const typeEmoji = getTypeEmoji(species.types[0]);
              
              return (
                <div 
                  key={slot}
                  className="bg-white/10 rounded-lg p-4 text-center border-2 border-yellow-500"
                >
                  <div className="text-4xl mb-2">{typeEmoji}</div>
                  <div className="text-white font-bold">{species.name}</div>
                  {monster.nickname && (
                    <div className="text-yellow-400 text-sm">&quot;{monster.nickname}&quot;</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 所持モンスター */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            📦 所持モンスター ({userData?.monsters.length || 0})
          </h2>
          
          {userData?.monsters.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              モンスターを持っていません
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userData?.monsters.map(monster => {
                const species = ALL_MONSTERS.find(m => m.id === monster.speciesId);
                if (!species) return null;
                
                const isInParty = userData.party.includes(monster.id);
                const typeEmoji = getTypeEmoji(species.types[0]);
                
                return (
                  <div 
                    key={monster.id}
                    className={`rounded-lg p-4 text-center cursor-pointer transition ${
                      isInParty 
                        ? 'bg-yellow-500/20 border-2 border-yellow-500' 
                        : 'bg-white/5 border-2 border-transparent hover:border-white/30'
                    }`}
                    onClick={() => handleToggleParty(monster.id)}
                  >
                    <div className="text-3xl mb-1">{typeEmoji}</div>
                    <div className="text-white font-bold text-sm">{species.name}</div>
                    {monster.nickname && (
                      <div className="text-yellow-400 text-xs">&quot;{monster.nickname}&quot;</div>
                    )}
                    <div className="text-gray-400 text-xs mt-1">
                      {isInParty ? '✓ パーティ' : 'タップで追加'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* アクションボタン */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/battle"
            className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 text-center"
          >
            🤖 AI対戦
          </Link>
          <Link 
            href="/online"
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 text-center"
          >
            🌐 オンライン対戦
          </Link>
        </div>
      </div>
    </div>
  );
}

function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    fire: '🔥',
    water: '💧',
    earth: '🪨',
    wind: '🌪️',
    light: '✨',
    dark: '🌑',
    thunder: '⚡',
    ice: '❄️',
    none: '⚪',
  };
  return emojis[type] || '❓';
}
