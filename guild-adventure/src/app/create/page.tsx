'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { SkillDetail, PassiveDetail, formatEffect } from '@/components/SkillDisplay';
import { StatsDisplay } from '@/components/StatsDisplay';
import { RaceType, JobType, TraitType, EnvironmentType } from '@/lib/types';
import { races, raceList } from '@/lib/data/races';
import { jobs, jobList } from '@/lib/data/jobs';
import { traits, traitList } from '@/lib/data/traits';
import { environments, environmentList } from '@/lib/data/environments';
import { getRequiredItemForRace, getRequiredItemForJob, getItemById } from '@/lib/data/items';
import { getLvSkill } from '@/lib/data/lvSkills';
import { getLvBonus } from '@/lib/data/lvStatBonuses';

export default function CreatePage() {
  const router = useRouter();
  const { createCharacter, useItem, getItemCount, syncToServer } = useGameStore();
  
  const [name, setName] = useState('');
  const [race, setRace] = useState<RaceType>('human');
  const [job, setJob] = useState<JobType>('warrior');
  const [trait, setTrait] = useState<TraitType>('brave');
  const [environment, setEnvironment] = useState<EnvironmentType>('grassland');
  
  // ステータスプレビュー計算
  const previewStats = {
    maxHp: races[race].baseStats.maxHp 
      + (jobs[job].statModifiers.maxHp || 0)
      + (traits[trait].statModifiers?.maxHp || 0)
      + (environments[environment].statModifiers?.maxHp || 0),
    maxMp: races[race].baseStats.maxMp 
      + (jobs[job].statModifiers.maxMp || 0)
      + (traits[trait].statModifiers?.maxMp || 0)
      + (environments[environment].statModifiers?.maxMp || 0),
    atk: races[race].baseStats.atk 
      + (jobs[job].statModifiers.atk || 0)
      + (traits[trait].statModifiers?.atk || 0)
      + (environments[environment].statModifiers?.atk || 0),
    def: races[race].baseStats.def 
      + (jobs[job].statModifiers.def || 0)
      + (traits[trait].statModifiers?.def || 0)
      + (environments[environment].statModifiers?.def || 0),
    agi: races[race].baseStats.agi 
      + (jobs[job].statModifiers.agi || 0)
      + (traits[trait].statModifiers?.agi || 0)
      + (environments[environment].statModifiers?.agi || 0),
    mag: races[race].baseStats.mag 
      + (jobs[job].statModifiers.mag || 0)
      + (traits[trait].statModifiers?.mag || 0)
      + (environments[environment].statModifiers?.mag || 0),
  };
  
  // 必要なアイテムをチェック
  const requiredRaceItem = getRequiredItemForRace(race);
  const requiredJobItem = getRequiredItemForJob(job);
  const raceItemCount = requiredRaceItem ? getItemCount(requiredRaceItem) : 0;
  const jobItemCount = requiredJobItem ? getItemCount(requiredJobItem) : 0;
  
  const canCreate = 
    (!requiredRaceItem || raceItemCount > 0) && 
    (!requiredJobItem || jobItemCount > 0);
  
  // 自動命名
  const generateAutoName = () => {
    const r = races[race].name.charAt(0);
    const j = jobs[job].name.charAt(0);
    const t = traits[trait].name.charAt(0);
    const e = environments[environment].name.charAt(0);
    return `${r}${j}${t}${e}`;
  };
  
  const handleCreate = async () => {
    let finalName = name.trim();
    
    if (!finalName) {
      const autoName = generateAutoName();
      const confirmed = confirm(`名前が未入力です。\n「${autoName}」でよろしいですか？`);
      if (!confirmed) return;
      finalName = autoName;
    }
    
    if (requiredRaceItem) {
      if (!useItem(requiredRaceItem)) {
        alert('必要なアイテムがありません');
        return;
      }
    }
    if (requiredJobItem) {
      if (!useItem(requiredJobItem)) {
        alert('必要なアイテムがありません');
        return;
      }
    }
    
    await createCharacter(finalName, race, job, trait, environment);
    await syncToServer();
    router.push('/');
  };
  
  return (
    <PageLayout maxWidth="lg">
      <PageHeader title="キャラクター作成" />
        
        {/* 名前入力 */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="冒険者の名前"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            maxLength={20}
          />
        </div>
        
        {/* 種族選択 */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">種族</label>
          <div className="grid grid-cols-4 gap-2">
            {raceList.map((r) => {
              const itemId = getRequiredItemForRace(r.id);
              const count = itemId ? getItemCount(itemId) : null;
              const isLocked = itemId && count === 0;
              
              return (
                <button
                  key={r.id}
                  onClick={() => setRace(r.id)}
                  className={`p-2 rounded-lg border text-center transition-colors relative ${
                    race === r.id
                      ? 'bg-amber-600 border-amber-500'
                      : isLocked
                        ? 'bg-slate-800 border-slate-700 opacity-50'
                        : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <div className="font-semibold text-sm">{r.name}</div>
                  {count !== null && (
                    <div className={`text-xs ${count > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {count > 0 ? `×${count}` : '🔒'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* 種族詳細 */}
          <div className="mt-2 p-3 bg-slate-800 rounded text-xs space-y-2">
            <div className="text-slate-300">{races[race].description}</div>
            {requiredRaceItem && (
              <div className={`${raceItemCount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                必要: {getItemById(requiredRaceItem)?.name} (所持: {raceItemCount})
              </div>
            )}
            
            {/* ステータス */}
            <div className="text-cyan-400 font-semibold">📊 ステータス</div>
            <div className="grid grid-cols-3 gap-1 text-slate-400">
              <span>HP: {races[race].baseStats.maxHp}</span>
              <span>MP: {races[race].baseStats.maxMp}</span>
              <span>ATK: {races[race].baseStats.atk}</span>
              <span>DEF: {races[race].baseStats.def}</span>
              <span>AGI: {races[race].baseStats.agi}</span>
              <span>MAG: {races[race].baseStats.mag}</span>
            </div>
            
            {/* パッシブ */}
            <div className="text-amber-400 font-semibold">🔥 パッシブ</div>
            <div className="space-y-1">
              {races[race].passives.map((p, i) => (
                <PassiveDetail key={i} passive={p} />
              ))}
            </div>
            
            {/* スキル */}
            {races[race].skills && races[race].skills.length > 0 && (
              <>
                <div className="text-green-400 font-semibold">⚔️ スキル</div>
                <div className="space-y-1">
                  {races[race].skills.map((s, i) => (
                    <SkillDetail key={i} skill={s} />
                  ))}
                </div>
              </>
            )}
            
            {/* マスタリー */}
            {races[race].masterySkill && (
              <>
                <div className="text-purple-400 font-semibold">👑 マスタリー</div>
                <div className="bg-slate-700 rounded p-2">
                  <div className="font-semibold text-purple-300">{races[race].masterySkill.name}</div>
                  {races[race].masterySkill.effects && (
                    <div className="text-green-300">
                      {races[race].masterySkill.effects.map((e, i) => (
                        <span key={i}>{i > 0 && ', '}{formatEffect(e)}</span>
                      ))}
                    </div>
                  )}
                  {races[race].masterySkill.skill && (
                    <SkillDetail skill={races[race].masterySkill.skill} />
                  )}
                  <div className="text-slate-400">{races[race].masterySkill.description}</div>
                </div>
              </>
            )}
            
            {/* Lvボーナス（コインで獲得） */}
            <div className="text-amber-400 font-semibold">🪙 レベルアップボーナス</div>
            <div className="bg-slate-700 rounded p-2 space-y-1">
              {(() => {
                const lv2 = getLvBonus(`${race}_lv2`);
                const lv3 = getLvSkill(`${race}_lv3`);
                const lv4 = getLvBonus(`${race}_lv4`);
                const lv5 = getLvSkill(`${race}_lv5`);
                return (
                  <>
                    {lv2 && <div><span className="text-slate-400">Lv2:</span> <span className="text-cyan-300">{lv2.name}</span> - {lv2.description}</div>}
                    {lv3 && <div><span className="text-slate-400">Lv3:</span> <span className="text-amber-300">{lv3.name}</span> - {lv3.description}</div>}
                    {lv4 && <div><span className="text-slate-400">Lv4:</span> <span className="text-cyan-300">{lv4.name}</span> - {lv4.description}</div>}
                    {lv5 && <div><span className="text-slate-400">Lv5:</span> <span className="text-amber-300">{lv5.name}</span> - {lv5.description}</div>}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        
        {/* 職業選択 */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">職業</label>
          <div className="grid grid-cols-4 gap-2">
            {jobList.map((j) => {
              const itemId = getRequiredItemForJob(j.id);
              const count = itemId ? getItemCount(itemId) : null;
              const isLocked = itemId && count === 0;
              
              return (
                <button
                  key={j.id}
                  onClick={() => setJob(j.id)}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    job === j.id
                      ? 'bg-amber-600 border-amber-500'
                      : isLocked
                        ? 'bg-slate-800 border-slate-700 opacity-50'
                        : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <div className="font-semibold text-sm">{j.name}</div>
                  {count !== null && (
                    <div className={`text-xs ${count > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {count > 0 ? `×${count}` : '🔒'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* 職業詳細 */}
          <div className="mt-2 p-3 bg-slate-800 rounded text-xs space-y-2">
            <div className="text-slate-300">{jobs[job].description}</div>
            {requiredJobItem && (
              <div className={`${jobItemCount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                必要: {getItemById(requiredJobItem)?.name} (所持: {jobItemCount})
              </div>
            )}
            
            {/* ステータス補正 */}
            <div className="text-cyan-400 font-semibold">📊 ステータス補正</div>
            <div className="flex flex-wrap gap-2 text-slate-400">
              {jobs[job].statModifiers.maxHp && <span>HP{jobs[job].statModifiers.maxHp > 0 ? '+' : ''}{jobs[job].statModifiers.maxHp}</span>}
              {jobs[job].statModifiers.maxMp && <span>MP{jobs[job].statModifiers.maxMp > 0 ? '+' : ''}{jobs[job].statModifiers.maxMp}</span>}
              {jobs[job].statModifiers.atk && <span>ATK{jobs[job].statModifiers.atk > 0 ? '+' : ''}{jobs[job].statModifiers.atk}</span>}
              {jobs[job].statModifiers.def && <span>DEF{jobs[job].statModifiers.def > 0 ? '+' : ''}{jobs[job].statModifiers.def}</span>}
              {jobs[job].statModifiers.agi && <span>AGI{jobs[job].statModifiers.agi > 0 ? '+' : ''}{jobs[job].statModifiers.agi}</span>}
              {jobs[job].statModifiers.mag && <span>MAG{jobs[job].statModifiers.mag > 0 ? '+' : ''}{jobs[job].statModifiers.mag}</span>}
            </div>
            
            {/* パッシブ */}
            <div className="text-amber-400 font-semibold">🔥 パッシブ</div>
            <div className="space-y-1">
              {jobs[job].passives.map((p, i) => (
                <PassiveDetail key={i} passive={p} />
              ))}
            </div>
            
            {/* スキル */}
            <div className="text-green-400 font-semibold">⚔️ スキル</div>
            <div className="space-y-1">
              {jobs[job].skills.map((s, i) => (
                <SkillDetail key={i} skill={s} />
              ))}
            </div>
            
            {/* マスタリー */}
            {jobs[job].masterySkill && (
              <>
                <div className="text-purple-400 font-semibold">👑 マスタリー</div>
                <div className="bg-slate-700 rounded p-2">
                  <div className="font-semibold text-purple-300">{jobs[job].masterySkill.name}</div>
                  {jobs[job].masterySkill.effects && (
                    <div className="text-green-300">
                      {jobs[job].masterySkill.effects.map((e, i) => (
                        <span key={i}>{i > 0 && ', '}{formatEffect(e)}</span>
                      ))}
                    </div>
                  )}
                  {jobs[job].masterySkill.skill && (
                    <SkillDetail skill={jobs[job].masterySkill.skill} />
                  )}
                  <div className="text-slate-400">{jobs[job].masterySkill.description}</div>
                </div>
              </>
            )}
            
            {/* Lvボーナス（コインで獲得） */}
            <div className="text-amber-400 font-semibold">🪙 レベルアップボーナス</div>
            <div className="bg-slate-700 rounded p-2 space-y-1">
              {(() => {
                const lv2 = getLvBonus(`${job}_lv2`);
                const lv3 = getLvSkill(`${job}_lv3`);
                const lv4 = getLvBonus(`${job}_lv4`);
                const lv5 = getLvSkill(`${job}_lv5`);
                return (
                  <>
                    {lv2 && <div><span className="text-slate-400">Lv2:</span> <span className="text-cyan-300">{lv2.name}</span> - {lv2.description}</div>}
                    {lv3 && <div><span className="text-slate-400">Lv3:</span> <span className="text-amber-300">{lv3.name}</span> - {lv3.description}</div>}
                    {lv4 && <div><span className="text-slate-400">Lv4:</span> <span className="text-cyan-300">{lv4.name}</span> - {lv4.description}</div>}
                    {lv5 && <div><span className="text-slate-400">Lv5:</span> <span className="text-amber-300">{lv5.name}</span> - {lv5.description}</div>}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        
        {/* 個性選択 */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">個性</label>
          <div className="grid grid-cols-5 gap-2">
            {traitList.map((t) => (
              <button
                key={t.id}
                onClick={() => setTrait(t.id)}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  trait === t.id
                    ? 'bg-amber-600 border-amber-500'
                    : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                }`}
              >
                <div className="font-semibold text-sm">{t.name}</div>
              </button>
            ))}
          </div>
          <div className="mt-2 p-2 bg-slate-800 rounded text-xs text-slate-400">
            {traits[trait].description}
          </div>
        </div>
        
        {/* 環境選択 */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">出身環境</label>
          <div className="grid grid-cols-4 gap-2">
            {environmentList.map((e) => (
              <button
                key={e.id}
                onClick={() => setEnvironment(e.id)}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  environment === e.id
                    ? 'bg-amber-600 border-amber-500'
                    : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                }`}
              >
                <div className="font-semibold text-sm">{e.name}</div>
              </button>
            ))}
          </div>
          <div className="mt-2 p-2 bg-slate-800 rounded text-xs text-slate-400">
            {environments[environment].description}
          </div>
        </div>
        
        {/* ステータスプレビュー */}
        <div className="mb-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <StatsDisplay stats={previewStats} title="最終ステータス" />
        </div>
        
        {/* 作成ボタン */}
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className={`w-full py-3 rounded-lg font-semibold text-lg transition-colors ${
            canCreate
              ? 'bg-amber-600 hover:bg-amber-500'
              : 'bg-slate-600 text-slate-400 cursor-not-allowed'
          }`}
        >
          {canCreate ? 'キャラクターを作成' : '必要なアイテムがありません'}
        </button>
    </PageLayout>
  );
}
