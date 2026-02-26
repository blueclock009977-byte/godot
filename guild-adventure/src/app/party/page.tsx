'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { Character, Position, POSITION_HIT_RATE } from '@/lib/types';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';

function CharacterCard({ 
  character, 
  onClick,
  selected,
}: { 
  character: Character; 
  onClick?: () => void;
  selected?: boolean;
}) {
  const raceData = races[character.race];
  const jobData = jobs[character.job];
  
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
        selected 
          ? 'bg-amber-600 border-amber-500' 
          : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
      }`}
    >
      <div className="font-semibold">{character.name}</div>
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

function PartySlot({ 
  character, 
  slot,
  onRemove,
}: { 
  character: Character | null;
  slot: number;  // 0-5
  onRemove: () => void;
}) {
  const position = (slot + 1) as Position;
  const hitRate = POSITION_HIT_RATE[position];
  
  if (!character) {
    return (
      <div className="h-24 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500">
        <div className="text-xs">{position}列目</div>
        <div className="text-xs text-slate-600">被弾{hitRate}%</div>
      </div>
    );
  }
  
  const raceData = races[character.race];
  const jobData = jobs[character.job];
  
  return (
    <div 
      className="h-24 rounded-lg border border-slate-600 bg-slate-700 p-2 relative"
    >
      <div className="font-semibold text-sm truncate">{character.name}</div>
      <div className="text-xs text-slate-400 truncate">
        {raceData.name} / {jobData.name}
      </div>
      <div className="text-xs text-amber-400 mt-1">
        {position}列目（被弾{hitRate}%）
      </div>
      <button 
        className="absolute top-1 right-1 text-slate-400 hover:text-red-400 text-xs"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
      >
        ✕
      </button>
    </div>
  );
}

export default function PartyPage() {
  const { characters, party, addToParty, removeFromParty } = useGameStore();
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  
  // パーティにいないキャラ
  const partyCharIds = party.members
    .filter(Boolean)
    .map((c) => c!.id);
  const availableChars = characters.filter((c) => !partyCharIds.includes(c.id));
  
  const handleSlotClick = (slot: number) => {
    if (!selectedChar) return;
    addToParty(selectedChar, slot as any, slot);
    setSelectedChar(null);
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
          <p>6列の隊列。前列ほど攻撃されやすく、後列は安全。</p>
          <p>1-2列目は与ダメ+10%、5-6列目は与ダメ-10%</p>
        </div>
        
        {/* パーティスロット（6列） */}
        <div className="mb-8">
          <h2 className="text-sm text-slate-400 mb-2">パーティ編成</h2>
          <div className="grid grid-cols-3 gap-2">
            {party.members.map((char, i) => (
              <div 
                key={`slot-${i}`}
                onClick={() => !char && selectedChar && handleSlotClick(i)}
                className={selectedChar && !char ? 'cursor-pointer ring-2 ring-amber-500 rounded-lg' : ''}
              >
                <PartySlot
                  character={char}
                  slot={i}
                  onRemove={() => removeFromParty(i as any, i)}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* 選択中の表示 */}
        {selectedChar && (
          <div className="mb-4 p-3 bg-amber-900/50 rounded-lg border border-amber-700 text-center">
            <span className="text-amber-400">
              空きスロットをクリックして配置
            </span>
          </div>
        )}
        
        {/* 待機キャラ */}
        <div>
          <h2 className="text-sm text-slate-400 mb-2">
            待機中のキャラクター（{availableChars.length}人）
          </h2>
          {availableChars.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>キャラクターがいません</p>
              <Link href="/create" className="text-amber-400 hover:underline">
                キャラを作成する →
              </Link>
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
