'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Character, Position } from '@/lib/types';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { CharacterIcon } from '@/components/CharacterIcon';
import { getPartyTreasureHuntBonuses, hasTreasureHuntBonuses } from '@/lib/drop/dropBonus';
import { calculateTotalStats } from '@/lib/character/bonuses';

function CharacterCard({ 
  character, 
  onClick,
  selected,
  inParty,
  position,
}: { 
  character: Character; 
  onClick?: () => void;
  selected?: boolean;
  inParty?: boolean;
  position?: Position;
}) {
  const raceData = races[character.race];
  const jobData = jobs[character.job];
  const totalStats = calculateTotalStats(character);
  
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
        selected 
          ? 'bg-amber-600 border-amber-500' 
          : inParty
            ? 'bg-slate-600 border-slate-500'
            : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
      }`}
    >
      <div className="flex gap-3 items-start">
        {/* キャラアイコン */}
        <CharacterIcon race={character.race} job={character.job} size={48} />
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="font-semibold truncate">{character.name}</div>
            {position && (
              <span className={`text-xs px-1 rounded flex-shrink-0 ${position === 'front' ? 'bg-red-600' : 'bg-blue-600'}`}>
                {position === 'front' ? '前' : '後'}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-300">
            {raceData.name} / {jobData.name}
          </div>
          <div className="flex gap-2 mt-1 text-xs">
            <span className="text-red-400">HP{totalStats.maxHp}</span>
            <span className="text-orange-400">ATK{totalStats.atk}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartyPage() {
  const { characters, party, addToParty, removeFromParty, isLoggedIn, isLoading } = useGameStore();
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  
  // ローディング中またはログイン前
  if (!isLoggedIn || isLoading) {
    return <LoadingScreen />;
  }
  
  // パーティメンバー
  // パーティメンバー（最新のcharactersから取得）
  const frontMembers = (party.front || [])
    .filter((c): c is Character => c !== null)
    .map(c => characters.find(char => char.id === c.id))
    .filter((c): c is Character => c !== undefined);
  const backMembers = (party.back || [])
    .filter((c): c is Character => c !== null)
    .map(c => characters.find(char => char.id === c.id))
    .filter((c): c is Character => c !== undefined);
  const partyCharIds = [...frontMembers, ...backMembers].map(c => c.id);
  const partyCount = partyCharIds.length;
  
  // 待機中キャラ
  const availableChars = characters.filter(c => !partyCharIds.includes(c.id));
  
  // キャラをパーティに追加（ソロは合計6人まで）
  const MAX_PARTY_SIZE = 6;
  
  const handleAddToParty = (position: Position) => {
    if (!selectedChar) return;
    
    // 合計4人制限チェック
    if (partyCount >= MAX_PARTY_SIZE) {
      alert('ソロは6人までです');
      return;
    }
    
    // 空きスロットを探す
    const arr = position === 'front' ? (party.front || []) : (party.back || []);
    const emptySlot = arr.findIndex(c => c === null);
    
    if (emptySlot !== -1) {
      addToParty(selectedChar, position, emptySlot);
    } else {
      // 空きがなければ末尾に追加（配列を拡張）
      addToParty(selectedChar, position, arr.length);
    }
    setSelectedChar(null);
  };
  
  // キャラをパーティから外す
  const handleRemove = (char: Character) => {
    const frontIdx = (party.front || []).findIndex(c => c?.id === char.id);
    if (frontIdx !== -1) {
      removeFromParty('front', frontIdx);
      return;
    }
    const backIdx = (party.back || []).findIndex(c => c?.id === char.id);
    if (backIdx !== -1) {
      removeFromParty('back', backIdx);
    }
  };
  
  return (
    <PageLayout>
      <PageHeader title="パーティ編成" />
        
        {/* 説明 */}
        <div className="mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-400">
          <p>ソロ: <span className="text-amber-400">合計6人まで</span>（前衛のみ・後衛のみもOK）</p>
          <p>前衛: 火力+20%, 被ダメ+20% ／ 後衛: 火力-20%, 被ダメ-20%</p>
        </div>
        
        {/* トレハンボーナス */}
        {(() => {
          const partyChars = [...frontMembers, ...backMembers];
          if (partyChars.length === 0) return null;
          
          const bonuses = getPartyTreasureHuntBonuses(partyChars);
          if (!hasTreasureHuntBonuses(bonuses)) return null;
          
          return (
            <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="text-sm font-semibold text-amber-400 mb-2">🔍 トレハンスキル（パーティ合計）</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {bonuses.dropBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">ドロップ率</span>
                    <span className="text-green-400">+{bonuses.dropBonus}%</span>
                  </div>
                )}
                {bonuses.rareDropBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">レア発見</span>
                    <span className="text-purple-400">+{bonuses.rareDropBonus}%</span>
                  </div>
                )}
                {bonuses.coinBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">コイン</span>
                    <span className="text-yellow-400">+{bonuses.coinBonus}%</span>
                  </div>
                )}
                {bonuses.explorationSpeedBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">探索時間</span>
                    <span className="text-cyan-400">-{bonuses.explorationSpeedBonus}%</span>
                  </div>
                )}
                {bonuses.rollCount > 4 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">抽選回数</span>
                    <span className="text-pink-400">{bonuses.rollCount}回</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        
        {/* パーティ */}
        <div className="mb-6 space-y-4">
          {/* 前衛 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm text-red-400 font-semibold">⚔️ 前衛 ({frontMembers.length}人)</h2>
              {selectedChar && (
                <button
                  onClick={() => handleAddToParty('front')}
                  className="text-xs bg-red-600 hover:bg-red-500 px-3 py-1 rounded"
                >
                  + 前衛に追加
                </button>
              )}
            </div>
            {frontMembers.length === 0 ? (
              <div className="text-slate-500 text-sm p-4 border-2 border-dashed border-slate-600 rounded-lg text-center">
                前衛がいません
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {frontMembers.map(char => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    inParty
                    position="front"
                    onClick={() => handleRemove(char)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* 後衛 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm text-blue-400 font-semibold">🛡️ 後衛 ({backMembers.length}人)</h2>
              {selectedChar && (
                <button
                  onClick={() => handleAddToParty('back')}
                  className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded"
                >
                  + 後衛に追加
                </button>
              )}
            </div>
            {backMembers.length === 0 ? (
              <div className="text-slate-500 text-sm p-4 border-2 border-dashed border-slate-600 rounded-lg text-center">
                後衛がいません
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {backMembers.map(char => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    inParty
                    position="back"
                    onClick={() => handleRemove(char)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 選択中の表示 */}
        {selectedChar && (
          <div className="mb-4 p-3 bg-amber-900/50 rounded-lg border border-amber-700 text-center">
            <span className="text-amber-400">
              「前衛に追加」か「後衛に追加」をタップ
            </span>
          </div>
        )}
        
        {/* 待機キャラ */}
        <div>
          <h2 className="text-sm text-slate-400 mb-2">
            待機中 ({availableChars.length}人)
          </h2>
          {availableChars.length === 0 ? (
            characters.length === 0 ? (
              <EmptyState
                message="キャラクターがいません"
                linkText="キャラを作成する →"
                linkHref="/create"
              />
            ) : (
              <EmptyState message="全員パーティにいます" />
            )
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {availableChars.map((char) => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  selected={selectedChar === char.id}
                  onClick={() => setSelectedChar(
                    selectedChar === char.id ? null : char.id
                  )}
                />
              ))}
            </div>
          )}
        </div>
    </PageLayout>
  );
}
