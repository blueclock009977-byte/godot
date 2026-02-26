'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';
import { traits } from '@/lib/data/traits';
import { environments } from '@/lib/data/environments';

export default function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { 
    characters, 
    inventory, 
    getItemCount, 
    unlockRaceMastery, 
    unlockJobMastery,
    deleteCharacter,
  } = useGameStore();
  
  const [isLoading, setIsLoading] = useState(false);
  
  const character = characters.find(c => c.id === id);
  
  if (!character) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4">
        <div className="text-center">
          <p>キャラクターが見つかりません</p>
          <Link href="/" className="text-amber-400 hover:underline">ホームに戻る</Link>
        </div>
      </main>
    );
  }
  
  const raceData = races[character.race];
  const jobData = jobs[character.job];
  const traitData = traits[character.trait];
  const envData = environments[character.environment];
  
  const raceTicketId = `ticket_${character.race}`;
  const jobBookId = `book_${character.job}`;
  const raceTicketCount = getItemCount(raceTicketId);
  const jobBookCount = getItemCount(jobBookId);
  
  const canUnlockRaceMastery = !character.raceMastery && raceTicketCount >= 5;
  const canUnlockJobMastery = !character.jobMastery && jobBookCount >= 5;
  
  const handleUnlockRaceMastery = async () => {
    if (!canUnlockRaceMastery || isLoading) return;
    setIsLoading(true);
    await unlockRaceMastery(character.id);
    setIsLoading(false);
  };
  
  const handleUnlockJobMastery = async () => {
    if (!canUnlockJobMastery || isLoading) return;
    setIsLoading(true);
    await unlockJobMastery(character.id);
    setIsLoading(false);
  };
  
  const handleDelete = async () => {
    if (!confirm(`${character.name}を削除しますか？`)) return;
    await deleteCharacter(character.id);
    router.push('/');
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-slate-400 hover:text-white">← 戻る</Link>
          <h1 className="text-2xl font-bold">{character.name}</h1>
        </div>
        
        {/* 基本情報 */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-400">種族:</span> {raceData.name}</div>
            <div><span className="text-slate-400">職業:</span> {jobData.name}</div>
            <div><span className="text-slate-400">個性:</span> {traitData.name}</div>
            <div><span className="text-slate-400">環境:</span> {envData.name}</div>
          </div>
        </div>
        
        {/* ステータス */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-3">ステータス</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-slate-400">HP</div>
              <div className="text-lg font-bold text-red-400">{character.stats.maxHp}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">MP</div>
              <div className="text-lg font-bold text-blue-300">{character.stats.maxMp}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">ATK</div>
              <div className="text-lg font-bold text-orange-400">{character.stats.atk}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">DEF</div>
              <div className="text-lg font-bold text-blue-400">{character.stats.def}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">AGI</div>
              <div className="text-lg font-bold text-green-400">{character.stats.agi}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">MAG</div>
              <div className="text-lg font-bold text-purple-400">{character.stats.mag}</div>
            </div>
          </div>
        </div>
        
        {/* 種族マスタリー */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">種族マスタリー: {raceData.name}</h3>
          {raceData.masterySkill && (
            <div className="mb-3">
              <div className={`font-semibold ${character.raceMastery ? 'text-amber-400' : 'text-slate-500'}`}>
                ★ {raceData.masterySkill.name}
              </div>
              <div className="text-xs text-slate-400">{raceData.masterySkill.description}</div>
            </div>
          )}
          {character.raceMastery ? (
            <div className="text-green-400 text-sm">✓ 解放済み</div>
          ) : (
            <div>
              <div className="text-xs text-slate-400 mb-2">
                必要: {raceData.name}の血統書 ×5 (所持: {raceTicketCount})
              </div>
              <button
                onClick={handleUnlockRaceMastery}
                disabled={!canUnlockRaceMastery || isLoading}
                className={`w-full py-2 rounded text-sm font-semibold ${
                  canUnlockRaceMastery
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? '...' : '解放する'}
              </button>
            </div>
          )}
        </div>
        
        {/* 職業マスタリー */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">職業マスタリー: {jobData.name}</h3>
          {jobData.masterySkill && (
            <div className="mb-3">
              <div className={`font-semibold ${character.jobMastery ? 'text-amber-400' : 'text-slate-500'}`}>
                ★ {jobData.masterySkill.name}
              </div>
              <div className="text-xs text-slate-400">{jobData.masterySkill.description}</div>
            </div>
          )}
          {character.jobMastery ? (
            <div className="text-green-400 text-sm">✓ 解放済み</div>
          ) : (
            <div>
              <div className="text-xs text-slate-400 mb-2">
                必要: {jobData.name}の指南書 ×5 (所持: {jobBookCount})
              </div>
              <button
                onClick={handleUnlockJobMastery}
                disabled={!canUnlockJobMastery || isLoading}
                className={`w-full py-2 rounded text-sm font-semibold ${
                  canUnlockJobMastery
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? '...' : '解放する'}
              </button>
            </div>
          )}
        </div>
        
        {/* スキル一覧 */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">スキル</h3>
          <div className="space-y-2 text-sm">
            {/* 種族スキル */}
            {raceData.skills?.map(skill => (
              <div key={skill.id} className="flex justify-between">
                <span className="text-purple-300">[種族] {skill.name}</span>
                <span className="text-slate-400">MP{skill.mpCost}</span>
              </div>
            ))}
            {/* 職業スキル */}
            {jobData.skills.map(skill => (
              <div key={skill.id} className="flex justify-between">
                <span className="text-blue-300">[職業] {skill.name}</span>
                <span className="text-slate-400">MP{skill.mpCost}</span>
              </div>
            ))}
            {/* マスタリースキル（アクティブのみ） */}
            {character.raceMastery && raceData.masterySkill?.type === 'active' && raceData.masterySkill.skill && (
              <div className="flex justify-between">
                <span className="text-amber-400">★ {raceData.masterySkill.skill.name}</span>
                <span className="text-slate-400">MP{raceData.masterySkill.skill.mpCost}</span>
              </div>
            )}
            {character.jobMastery && jobData.masterySkill?.type === 'active' && jobData.masterySkill.skill && (
              <div className="flex justify-between">
                <span className="text-amber-400">★ {jobData.masterySkill.skill.name}</span>
                <span className="text-slate-400">MP{jobData.masterySkill.skill.mpCost}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          className="w-full py-2 rounded text-sm text-red-400 border border-red-400 hover:bg-red-400/20"
        >
          キャラクターを削除
        </button>
      </div>
    </main>
  );
}
