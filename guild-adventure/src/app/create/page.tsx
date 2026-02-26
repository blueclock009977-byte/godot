'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { RaceType, JobType, TraitType, EnvironmentType } from '@/lib/types';
import { races, raceList } from '@/lib/data/races';
import { jobs, jobList } from '@/lib/data/jobs';
import { traits, traitList } from '@/lib/data/traits';
import { environments, environmentList } from '@/lib/data/environments';
import { getRequiredItemForRace, getRequiredItemForJob, getItemById } from '@/lib/data/items';

export default function CreatePage() {
  const router = useRouter();
  const { createCharacter, useItem, getItemCount, syncToServer } = useGameStore();
  
  const [name, setName] = useState('');
  const [race, setRace] = useState<RaceType>('human');
  const [job, setJob] = useState<JobType>('warrior');
  const [trait, setTrait] = useState<TraitType>('brave');
  const [environment, setEnvironment] = useState<EnvironmentType>('grassland');
  
  // ステータスプレビュー計算（種族 + 職業 + 個性 + 環境）
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
  
  const handleCreate = async () => {
    if (!name.trim()) {
      alert('名前を入力してください');
      return;
    }
    
    // アイテム消費
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
    
    await createCharacter(name.trim(), race, job, trait, environment);
    await syncToServer();
    router.push('/');
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-slate-400 hover:text-white">
            ← 戻る
          </Link>
          <h1 className="text-2xl font-bold">キャラクター作成</h1>
        </div>
        
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
          <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
            <div className="text-slate-300 mb-1">{races[race].description}</div>
            {requiredRaceItem && (
              <div className={`mb-1 ${raceItemCount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                必要: {getItemById(requiredRaceItem)?.name} (所持: {raceItemCount})
              </div>
            )}
            <div className="text-amber-400 font-semibold mb-1">パッシブ:</div>
            {races[race].passives.map((p, i) => (
              <div key={i} className="text-slate-400 ml-2">• {p.name}: {p.description}</div>
            ))}
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
          <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
            <div className="text-slate-300 mb-1">{jobs[job].description}</div>
            {requiredJobItem && (
              <div className={`mb-1 ${jobItemCount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                必要: {getItemById(requiredJobItem)?.name} (所持: {jobItemCount})
              </div>
            )}
            <div className="text-amber-400 font-semibold mb-1">パッシブ:</div>
            {jobs[job].passives.map((p, i) => (
              <div key={i} className="text-slate-400 ml-2">• {p.name}</div>
            ))}
            <div className="text-green-400 font-semibold mt-1">スキル:</div>
            {jobs[job].skills.map((s, i) => (
              <div key={i} className="text-slate-400 ml-2">• {s.name} (MP{s.mpCost})</div>
            ))}
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
          <p className="text-xs text-slate-400 mt-2">
            {traits[trait].description}
          </p>
        </div>
        
        {/* 環境選択 */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">育った環境</label>
          <div className="grid grid-cols-5 gap-2">
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
          <p className="text-xs text-slate-400 mt-2">
            {environments[environment].description}
          </p>
        </div>
        
        {/* ステータスプレビュー */}
        <div className="mb-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-3">ステータスプレビュー</h3>
          <div className="grid grid-cols-6 gap-2 text-center">
            <div>
              <div className="text-xs text-slate-400">HP</div>
              <div className="text-lg font-bold text-red-400">{previewStats.maxHp}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">MP</div>
              <div className="text-lg font-bold text-blue-300">{previewStats.maxMp}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">ATK</div>
              <div className="text-lg font-bold text-orange-400">{previewStats.atk}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">DEF</div>
              <div className="text-lg font-bold text-blue-400">{previewStats.def}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">AGI</div>
              <div className="text-lg font-bold text-green-400">{previewStats.agi}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">MAG</div>
              <div className="text-lg font-bold text-purple-400">{previewStats.mag}</div>
            </div>
          </div>
        </div>
        
        {/* 作成ボタン */}
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className={`w-full transition-colors rounded-lg py-3 font-semibold ${
            canCreate
              ? 'bg-amber-600 hover:bg-amber-500'
              : 'bg-slate-600 text-slate-400 cursor-not-allowed'
          }`}
        >
          {canCreate ? '作成する' : '必要なアイテムがありません'}
        </button>
      </div>
    </main>
  );
}
