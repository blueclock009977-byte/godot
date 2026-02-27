'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { SkillDetail, PassiveDetail, formatEffect } from '@/components/SkillDisplay';
import { StatsDisplay } from '@/components/StatsDisplay';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';
import { traits } from '@/lib/data/traits';
import { environments } from '@/lib/data/environments';

export default function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { 
    characters, 
    getItemCount, 
    unlockRaceMastery, 
    unlockJobMastery,
    deleteCharacter,
    coins,
    levelUpCharacter,
  } = useGameStore();
  
  const [isLoading, setIsLoading] = useState(false);
  
  const character = characters.find(c => c.id === id);
  
  if (!character) {
    return (
      <PageLayout maxWidth="lg">
        <div className="text-center">
          <p>キャラクターが見つかりません</p>
          <Link href="/" className="text-amber-400 hover:underline">ホームに戻る</Link>
        </div>
      </PageLayout>
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
  
  const currentLevel = character?.level || 1;
  const levelUpCost = currentLevel < 5 ? currentLevel * 100 : 0;
  const canLevelUp = currentLevel < 5 && coins >= levelUpCost;
  
  const handleLevelUp = async () => {
    if (!canLevelUp || isLoading) return;
    setIsLoading(true);
    const result = await levelUpCharacter(character.id);
    setIsLoading(false);
    if (result.success && result.skill) {
      alert(`レベル${result.newLevel}に上がりました！\nスキル「${result.skill}」を習得！`);
    } else if (result.success) {
      alert(`レベル${result.newLevel}に上がりました！`);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`${character.name}を削除しますか？`)) return;
    await deleteCharacter(character.id);
    router.push('/');
  };
  
  return (
    <PageLayout maxWidth="lg">
      <PageHeader title={character.name} />
        
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
          <StatsDisplay stats={character.stats} title="ステータス" />
        </div>
        
        {/* パッシブ一覧 */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">パッシブ効果</h3>
          <div className="space-y-2">
            {/* 種族パッシブ */}
            {raceData.passives.map((passive, i) => (
              <PassiveDetail key={`race-${i}`} passive={passive} label="種族" />
            ))}
            {/* 職業パッシブ */}
            {jobData.passives.map((passive, i) => (
              <PassiveDetail key={`job-${i}`} passive={passive} label="職業" />
            ))}
            {/* 種族マスタリー（パッシブの場合） */}
            {character.raceMastery && raceData.masterySkill?.type === 'passive' && raceData.masterySkill.effects && (
              <PassiveDetail 
                passive={{ name: raceData.masterySkill.name, description: raceData.masterySkill.description, effects: raceData.masterySkill.effects }} 
                label="★種族" 
              />
            )}
            {/* 職業マスタリー（パッシブの場合） */}
            {character.jobMastery && jobData.masterySkill?.type === 'passive' && jobData.masterySkill.effects && (
              <PassiveDetail 
                passive={{ name: jobData.masterySkill.name, description: jobData.masterySkill.description, effects: jobData.masterySkill.effects }} 
                label="★職業" 
              />
            )}
          </div>
        </div>
        
        {/* スキル一覧 */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">スキル</h3>
          <div className="space-y-2">
            {/* 種族スキル */}
            {raceData.skills?.map(skill => (
              <SkillDetail key={skill.id} skill={skill} label="種族" />
            ))}
            {/* 職業スキル */}
            {jobData.skills.map(skill => (
              <SkillDetail key={skill.id} skill={skill} label="職業" />
            ))}
            {/* マスタリースキル（アクティブのみ） */}
            {character.raceMastery && raceData.masterySkill?.type === 'active' && raceData.masterySkill.skill && (
              <SkillDetail skill={raceData.masterySkill.skill} label="★種族" />
            )}
            {character.jobMastery && jobData.masterySkill?.type === 'active' && jobData.masterySkill.skill && (
              <SkillDetail skill={jobData.masterySkill.skill} label="★職業" />
            )}
          </div>
        </div>
        
        {/* 種族マスタリー解放 */}
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
        
        {/* 職業マスタリー解放 */}
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
        
        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          className="w-full py-2 rounded text-sm text-red-400 border border-red-400 hover:bg-red-400/20"
        >
          キャラクターを削除
        </button>
    </PageLayout>
  );
}
