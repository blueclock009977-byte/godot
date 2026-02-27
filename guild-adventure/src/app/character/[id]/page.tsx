'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';
import { traits } from '@/lib/data/traits';
import { environments } from '@/lib/data/environments';
import { useState } from 'react';
import { SkillData, PassiveSkill } from '@/lib/types';
import { elementNames } from '@/lib/utils';

// スキルの詳細表示
function SkillDetail({ skill, label }: { skill: SkillData; label: string }) {
  const targetMap: Record<string, string> = {
    single: '単体',
    all: '全体',
    self: '自身',
    ally: '味方1人',
    allAllies: '味方全体',
  };
  const typeMap: Record<string, string> = {
    attack: '物理',
    magic: '魔法',
    heal: '回復',
    buff: 'バフ',
    debuff: 'デバフ',
  };
  
  return (
    <div className="bg-slate-700 rounded p-2">
      <div className="flex justify-between items-start">
        <div>
          <span className={`font-semibold ${
            label === '種族' ? 'text-purple-300' : 
            label === '職業' ? 'text-blue-300' : 'text-amber-400'
          }`}>
            [{label}] {skill.name}
          </span>
          {skill.element && skill.element !== 'none' && (
            <span className="ml-1 text-xs">{elementNames[skill.element]}</span>
          )}
        </div>
        <span className="text-blue-300 text-sm">MP{skill.mpCost}</span>
      </div>
      <div className="text-xs text-slate-400 mt-1">
        {typeMap[skill.type] || skill.type} / {targetMap[skill.target] || skill.target}
        {skill.multiplier > 0 && ` / ${skill.multiplier}倍`}
        {skill.effect && (
          <span className="text-green-300">
            {' '}/ {skill.effect.type === 'atkUp' ? `ATK+${skill.effect.value}%` :
              skill.effect.type === 'defUp' ? `DEF+${skill.effect.value}%` :
              skill.effect.type === 'agiUp' ? `AGI+${skill.effect.value}%` :
              skill.effect.type === 'statDown' ? `ステ-${skill.effect.value}%` :
              skill.effect.type === 'atkDown' ? `ATK-${skill.effect.value}%` :
              skill.effect.type === 'agiDown' ? `AGI-${skill.effect.value}%` :
              `${skill.effect.type}+${skill.effect.value}`}
            ({skill.effect.duration}T)
          </span>
        )}
      </div>
      <div className="text-xs text-slate-500">{skill.description}</div>
    </div>
  );
}

// パッシブの詳細表示
function PassiveDetail({ passive, label }: { passive: PassiveSkill; label: string }) {
  const formatEffect = (effect: { type: string; value: number }) => {
    const effectMap: Record<string, string> = {
      critBonus: 'クリ率',
      evasionBonus: '回避',
      damageBonus: 'ダメージ',
      dropBonus: 'ドロップ率',
      magicBonus: '魔法ダメ',
      physicalBonus: '物理ダメ',
      firstStrikeBonus: '先制率',
      mpRegen: 'MP回復/T',
      hpRegen: 'HP回復/T',
      damageReduction: '被ダメ',
      poisonResist: '毒耐性',
      statusResist: '状態異常耐性',
      healBonus: '回復量',
      healReceived: '被回復',
      hpSteal: 'HP吸収',
      critDamage: 'クリダメ',
      allyDefense: '味方被ダメ',
      allyAtkBonus: '味方ATK',
      intimidate: '敵ATK',
      mpReduction: 'MP消費',
      accuracyBonus: '命中',
      cover: '庇う確率',
      counterRate: '反撃確率',
      perfectEvasion: '完全回避',
      allStats: '全ステ',
      lowHpBonus: 'HP30%以下ATK',
      allyCountBonus: '味方1人につきダメ',
      followUp: '追撃確率',
      revive: '蘇生HP',
      autoRevive: '自動蘇生回数',
      doublecast: '2回発動',
      attackStack: '攻撃毎ATK累積',
      debuffBonus: 'デバフ成功率',
      summonUndead: '召喚確率',
    };
    
    // 系統特攻/耐性
    if (effect.type.startsWith('speciesKiller_')) {
      const species = effect.type.replace('speciesKiller_', '');
      const speciesMap: Record<string, string> = {
        humanoid: '人型', beast: '獣', undead: '不死', demon: '悪魔', dragon: '竜',
      };
      return `${speciesMap[species] || species}特攻+${effect.value}%`;
    }
    if (effect.type.startsWith('speciesResist_')) {
      const species = effect.type.replace('speciesResist_', '');
      const speciesMap: Record<string, string> = {
        humanoid: '人型', beast: '獣', undead: '不死', demon: '悪魔', dragon: '竜',
      };
      return `${speciesMap[species] || species}耐性-${effect.value}%被ダメ`;
    }
    
    const name = effectMap[effect.type] || effect.type;
    const sign = effect.value >= 0 ? '+' : '';
    return `${name}${sign}${effect.value}%`;
  };
  
  return (
    <div className="bg-slate-700 rounded p-2">
      <div className="flex justify-between items-start">
        <span className={`font-semibold text-sm ${
          label === '種族' ? 'text-purple-300' : 
          label === '職業' ? 'text-blue-300' : 'text-amber-400'
        }`}>
          [{label}] {passive.name}
        </span>
      </div>
      <div className="text-xs text-green-300 mt-1">
        {passive.effects.map((e, i) => (
          <span key={i}>
            {i > 0 && ', '}
            {formatEffect(e)}
          </span>
        ))}
      </div>
      <div className="text-xs text-slate-500">{passive.description}</div>
    </div>
  );
}

export default function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { 
    characters, 
    getItemCount, 
    unlockRaceMastery, 
    unlockJobMastery,
    deleteCharacter,
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
