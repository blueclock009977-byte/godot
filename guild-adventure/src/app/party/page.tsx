'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { Character, Position } from '@/lib/types';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';

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
      <div className="flex justify-between items-start">
        <div className="font-semibold">{character.name}</div>
        {position && (
          <span className={`text-xs px-1 rounded ${position === 'front' ? 'bg-red-600' : 'bg-blue-600'}`}>
            {position === 'front' ? '前' : '後'}
          </span>
        )}
      </div>
      <div className="text-xs text-slate-300">
        {raceData.name} / {jobData.name}
      </div>
      <div className="flex gap-2 mt-2 text-xs">
        <span className="text-red-400">HP{character.stats.maxHp}</span>
        <span className="text-orange-400">ATK{character.stats.atk}</span>
      </div>
    </div>
  );
}

export default function PartyPage() {
  const { characters, party, addToParty, removeFromParty } = useGameStore();
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  
  // パーティメンバー
  const frontMembers = party.front.filter(Boolean) as Character[];
  const backMembers = party.back.filter(Boolean) as Character[];
  const partyCharIds = [...frontMembers, ...backMembers].map(c => c.id);
  const partyCount = partyCharIds.length;
  
  // 待機中キャラ
  const availableChars = characters.filter(c => !partyCharIds.includes(c.id));
  
  // キャラをパーティに追加
  const handleAddToParty = (position: Position) => {
    if (!selectedChar) return;
    
    // 空きスロットを探す
    const arr = position === 'front' ? party.front : party.back;
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
    const frontIdx = party.front.findIndex(c => c?.id === char.id);
    if (frontIdx !== -1) {
      removeFromParty('front', frontIdx);
      return;
    }
    const backIdx = party.back.findIndex(c => c?.id === char.id);
    if (backIdx !== -1) {
      removeFromParty('back', backIdx);
    }
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-slate-400 hover:text-white">
            ← 戻る
          </Link>
          <h1 className="text-2xl font-bold">パーティ編成</h1>
        </div>
        
        {/* 説明 */}
        <div className="mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-400">
          <p>ソロ: 4人まで ／ マルチ: 6人まで</p>
          <p>前衛: 火力+20%, 被ダメ+20% ／ 後衛: 火力-20%, 被ダメ-20%</p>
        </div>
        
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
            <div className="text-center py-8 text-slate-500">
              {characters.length === 0 ? (
                <>
                  <p>キャラクターがいません</p>
                  <Link href="/create" className="text-amber-400 hover:underline">
                    キャラを作成する →
                  </Link>
                </>
              ) : (
                <p>全員パーティにいます</p>
              )}
            </div>
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
      </div>
    </main>
  );
}
