'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { LoadingScreen } from '@/components/LoadingScreen';
import { CharacterIcon } from '@/components/CharacterIcon';
import { dungeons, dungeonList } from '@/lib/data/dungeons';
import { DungeonType } from '@/lib/types';

export default function SimulationPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading, party } = useGameStore();
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonType | null>(null);
  
  // ローディング中またはログイン前
  if (!isLoggedIn || isLoading) {
    return <LoadingScreen />;
  }
  
  // パーティメンバーを取得
  const partyMembers = [
    ...(party.front || []),
    ...(party.back || []),
  ].filter((c): c is NonNullable<typeof c> => c !== null);
  
  const partyCount = partyMembers.length;
  
  // 選択されたダンジョンのボス情報
  const selectedBoss = selectedDungeon ? dungeons[selectedDungeon]?.boss : null;
  
  // 戦闘開始
  const handleStartBattle = () => {
    if (!selectedDungeon || partyCount === 0) return;
    
    // クエリパラメータでダンジョンを渡す
    router.push(`/simulation/battle?dungeon=${selectedDungeon}`);
  };
  
  // テストパーティで戦闘開始
  const handleStartTestBattle = () => {
    if (!selectedDungeon) return;
    
    // テストモードフラグ付きで戦闘開始
    router.push(`/simulation/battle?dungeon=${selectedDungeon}&test=1`);
  };
  
  return (
    <PageLayout>
      <PageHeader title="🎮 シミュレーションモード" backHref="/" />
      
      <p className="text-sm text-slate-400 mb-4">
        各ステージのボスと模擬戦闘ができます。報酬はありません。
      </p>
      
      {/* ダンジョン選択 */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">📍 ボス選択</h2>
        <div className="grid grid-cols-2 gap-2">
          {dungeonList.map((dungeon) => {
            const isSelected = selectedDungeon === dungeon.id;
            return (
              <button
                key={dungeon.id}
                onClick={() => setSelectedDungeon(dungeon.id as DungeonType)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'bg-amber-900/50 border-amber-500'
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className="font-semibold">{dungeon.name}</div>
                <div className="text-xs text-slate-400">
                  ★{'★'.repeat(dungeon.difficulty - 1)} | {dungeon.boss?.name || '???'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* 選択されたボスの情報 */}
      {selectedBoss && (
        <div className="mb-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h2 className="text-lg font-bold mb-2">👹 {selectedBoss.name}</h2>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="bg-slate-700 rounded p-2 text-center">
              <div className="text-slate-400 text-xs">HP</div>
              <div className="font-bold text-red-400">{selectedBoss.stats.maxHp}</div>
            </div>
            <div className="bg-slate-700 rounded p-2 text-center">
              <div className="text-slate-400 text-xs">ATK</div>
              <div className="font-bold text-orange-400">{selectedBoss.stats.atk}</div>
            </div>
            <div className="bg-slate-700 rounded p-2 text-center">
              <div className="text-slate-400 text-xs">DEF</div>
              <div className="font-bold text-blue-400">{selectedBoss.stats.def}</div>
            </div>
            <div className="bg-slate-700 rounded p-2 text-center">
              <div className="text-slate-400 text-xs">AGI</div>
              <div className="font-bold text-green-400">{selectedBoss.stats.agi}</div>
            </div>
          </div>
          {selectedBoss.skills && selectedBoss.skills.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-slate-400 mb-1">スキル:</div>
              {selectedBoss.skills.map((skill) => (
                <div key={skill.id} className="text-sm text-amber-300">
                  ⚡ {skill.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* パーティ確認 */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">🛡️ 現在のパーティ ({partyCount}/6)</h2>
        {partyCount === 0 ? (
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
            <p className="text-slate-400 mb-3">パーティが編成されていません</p>
            <Link
              href="/party"
              className="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-semibold transition-colors"
            >
              パーティを編成する
            </Link>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            {/* 前列 */}
            {party.front && party.front.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-slate-400 mb-1">前列</div>
                <div className="flex flex-wrap gap-2">
                  {party.front.map((char) => char && (
                    <div key={char.id} className="flex items-center gap-2 bg-slate-700 rounded px-2 py-1">
                      <CharacterIcon race={char.race} job={char.job} size={24} />
                      <span className="text-sm">{char.name}</span>
                      <span className="text-xs text-amber-400">Lv.{char.level || 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* 後列 */}
            {party.back && party.back.length > 0 && (
              <div>
                <div className="text-xs text-slate-400 mb-1">後列</div>
                <div className="flex flex-wrap gap-2">
                  {party.back.map((char) => char && (
                    <div key={char.id} className="flex items-center gap-2 bg-slate-700 rounded px-2 py-1">
                      <CharacterIcon race={char.race} job={char.job} size={24} />
                      <span className="text-sm">{char.name}</span>
                      <span className="text-xs text-amber-400">Lv.{char.level || 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 戦闘開始ボタン */}
      <button
        onClick={handleStartBattle}
        disabled={!selectedDungeon || partyCount === 0}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
          selectedDungeon && partyCount > 0
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
        }`}
      >
        {!selectedDungeon
          ? 'ボスを選択してください'
          : partyCount === 0
          ? 'パーティを編成してください'
          : `⚔️ ${selectedBoss?.name}に挑む！`}
      </button>
      
      {/* テストパーティで戦うボタン */}
      {selectedDungeon && partyCount === 0 && (
        <button
          onClick={handleStartTestBattle}
          className="w-full py-3 mt-3 rounded-lg font-bold text-sm bg-slate-600 hover:bg-slate-500 text-white transition-colors"
        >
          🧪 テストパーティで戦う（デバッグ用）
        </button>
      )}
    </PageLayout>
  );
}
