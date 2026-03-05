'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { PageLayout } from '@/components/PageLayout';
import { LoadingScreen } from '@/components/LoadingScreen';
import { CharacterIcon } from '@/components/CharacterIcon';
import { MonsterIcon } from '@/components/MonsterIcon';
import { dungeons } from '@/lib/data/dungeons';
import { DungeonType, BattleResult, Character, Monster } from '@/lib/types';
import { runBattle } from '@/lib/battle/engine';
import { getLogClassName } from '@/lib/utils';

// ============================================
// HPバー コンポーネント
// ============================================

interface HPBarProps {
  current: number;
  max: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function HPBar({ current, max, showText = true, size = 'md' }: HPBarProps) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));
  const barColor = percent > 50 ? 'bg-green-500' : percent > 25 ? 'bg-yellow-500' : 'bg-red-500';
  
  const heightClass = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-5' : 'h-3';
  
  return (
    <div className="w-full">
      <div className={`${heightClass} bg-slate-700 rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showText && (
        <div className="text-xs text-slate-300 text-center mt-0.5">
          {current} / {max}
        </div>
      )}
    </div>
  );
}

// ============================================
// ボス表示 コンポーネント
// ============================================

interface BossDisplayProps {
  boss: Monster;
  currentHp?: number;
}

function BossDisplay({ boss, currentHp }: BossDisplayProps) {
  const hp = currentHp ?? boss.stats.maxHp;
  
  return (
    <div className="bg-gradient-to-b from-red-900/30 to-slate-800 rounded-lg p-4 border border-red-800/50">
      <div className="text-center">
        <div className="text-lg font-bold text-red-400 mb-2">👹 {boss.name}</div>
        <div className="flex justify-center mb-3">
          <MonsterIcon monsterId={boss.id} size={80} isBoss={true} />
        </div>
        <div className="max-w-[200px] mx-auto">
          <HPBar current={hp} max={boss.stats.maxHp} size="lg" />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1 text-xs">
          <div className="text-orange-400">ATK {boss.stats.atk}</div>
          <div className="text-blue-400">DEF {boss.stats.def}</div>
          <div className="text-green-400">AGI {boss.stats.agi}</div>
          <div className="text-purple-400">MAG {boss.stats.mag}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 味方キャラ表示 コンポーネント
// ============================================

interface CharacterDisplayProps {
  character: Character;
  position: 'front' | 'back';
}

function CharacterDisplay({ character, position }: CharacterDisplayProps) {
  return (
    <div className={`bg-slate-800 rounded-lg p-2 border ${
      position === 'front' ? 'border-orange-700/50' : 'border-blue-700/50'
    }`}>
      <div className="flex items-center gap-2">
        <CharacterIcon race={character.race} job={character.job} size={40} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{character.name}</div>
          <div className="text-xs text-slate-400">
            Lv.{character.level || 1} • {position === 'front' ? '前衛' : '後衛'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 戦闘ログ表示 コンポーネント
// ============================================

interface BattleLogProps {
  logs: string[];
  characters: (Character | null)[];
  monsters: Monster[];
}

function BattleLogArea({ logs, characters, monsters }: BattleLogProps) {
  // 名前→アイコン情報のマップを構築
  const nameToIcon = useMemo(() => {
    const map = new Map<string, { type: 'character' | 'monster'; data: Character | Monster }>();
    
    for (const char of characters) {
      if (char) {
        map.set(char.name, { type: 'character', data: char });
      }
    }
    
    for (const monster of monsters) {
      map.set(monster.name, { type: 'monster', data: monster });
    }
    
    return map;
  }, [characters, monsters]);

  const renderLogLine = (log: string, index: number) => {
    if (nameToIcon.size === 0) {
      return (
        <div key={index} className={getLogClassName(log)}>{log}</div>
      );
    }

    const names = Array.from(nameToIcon.keys());
    if (names.length === 0) {
      return (
        <div key={index} className={getLogClassName(log)}>{log}</div>
      );
    }

    const escapedNames = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const namePattern = new RegExp(`(${escapedNames.join('|')})`, 'g');
    const parts = log.split(namePattern);
    
    return (
      <div key={index} className={`${getLogClassName(log)} flex flex-wrap items-center gap-0.5`}>
        {parts.map((part, i) => {
          const iconInfo = nameToIcon.get(part);
          if (iconInfo) {
            return (
              <span key={i} className="inline-flex items-center gap-0.5">
                {iconInfo.type === 'character' && (
                  <CharacterIcon 
                    race={(iconInfo.data as Character).race} 
                    job={(iconInfo.data as Character).job} 
                    size={18} 
                    className="inline-block"
                  />
                )}
                {iconInfo.type === 'monster' && (
                  <MonsterIcon 
                    monsterId={(iconInfo.data as Monster).id} 
                    size={18} 
                    className="inline-block"
                  />
                )}
                <span className="font-semibold">{part}</span>
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 max-h-[400px] overflow-y-auto">
      <div className="space-y-1 text-sm font-mono">
        {logs.map((log, i) => renderLogLine(log, i))}
      </div>
    </div>
  );
}

// ============================================
// バトルコンテンツ（useSearchParams使用）
// ============================================

function SimulationBattleContent() {
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading, party } = useGameStore();
  
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);
  const [allLogs, setAllLogs] = useState<string[]>([]);
  
  // URLパラメータからダンジョンを取得
  const dungeonId = searchParams.get('dungeon') as DungeonType | null;
  const dungeon = dungeonId ? dungeons[dungeonId] : null;
  
  // パーティメンバーを取得
  const partyMembers = useMemo(() => {
    return [
      ...(party.front || []),
      ...(party.back || []),
    ].filter((c): c is Character => c !== null);
  }, [party]);
  
  // 遭遇するモンスター一覧（ボス + 通常モンスター）
  const monsters = useMemo(() => {
    if (!dungeon) return [];
    const result: Monster[] = [];
    if (dungeon.boss) {
      result.push(dungeon.boss);
    }
    for (const spawn of dungeon.monsters) {
      if (!result.find(m => m.id === spawn.monster.id)) {
        result.push(spawn.monster);
      }
    }
    return result;
  }, [dungeon]);
  
  // 戦闘実行
  useEffect(() => {
    if (!battleStarted || !dungeon || partyMembers.length === 0) return;
    
    // 少し待ってから戦闘開始
    const timer = setTimeout(() => {
      const result = runBattle(party, dungeonId!);
      setBattleResult(result);
      
      // ログを展開
      const logs: string[] = [];
      for (const logEntry of result.logs) {
        if (logEntry.message) {
          logs.push(...logEntry.message.split('\n').filter(l => l.trim()));
        }
      }
      setAllLogs(logs);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [battleStarted, dungeon, dungeonId, party, partyMembers.length]);
  
  // ローディング中またはログイン前
  if (!isLoggedIn || isLoading) {
    return <LoadingScreen />;
  }
  
  // ダンジョン未指定
  if (!dungeonId || !dungeon) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <p className="text-slate-400 mb-4">ダンジョンが選択されていません</p>
          <Link
            href="/simulation"
            className="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-semibold"
          >
            ボス選択に戻る
          </Link>
        </div>
      </PageLayout>
    );
  }
  
  // パーティ未編成
  if (partyMembers.length === 0) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <p className="text-slate-400 mb-4">パーティが編成されていません</p>
          <Link
            href="/party"
            className="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-semibold"
          >
            パーティを編成する
          </Link>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">⚔️ {dungeon.name}</h1>
        <Link
          href="/simulation"
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
        >
          ← 戻る
        </Link>
      </div>
      
      {/* 戦闘開始前 */}
      {!battleStarted && (
        <>
          {/* ボス表示 */}
          {dungeon.boss && (
            <div className="mb-4">
              <BossDisplay boss={dungeon.boss} />
            </div>
          )}
          
          {/* 味方パーティ */}
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-400 mb-2">🛡️ 味方パーティ</h2>
            <div className="grid grid-cols-3 gap-2">
              {/* 前列 */}
              {(party.front || []).map((char) => char && (
                <CharacterDisplay key={char.id} character={char} position="front" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {/* 後列 */}
              {(party.back || []).map((char) => char && (
                <CharacterDisplay key={char.id} character={char} position="back" />
              ))}
            </div>
          </div>
          
          {/* 戦闘開始ボタン */}
          <button
            onClick={() => setBattleStarted(true)}
            className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-lg transition-colors"
          >
            ⚔️ 戦闘開始！
          </button>
        </>
      )}
      
      {/* 戦闘中/戦闘後 */}
      {battleStarted && (
        <>
          {/* 結果表示 */}
          {battleResult && (
            <div className={`mb-4 p-4 rounded-lg text-center ${
              battleResult.victory 
                ? 'bg-green-900/50 border border-green-700' 
                : 'bg-red-900/50 border border-red-700'
            }`}>
              {battleResult.victory ? (
                <div>
                  <div className="text-2xl mb-1">🎉 勝利！ 🎉</div>
                  <div className="text-sm text-slate-300">
                    {dungeon.boss?.name}を撃破した！
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl mb-1">💀 敗北... 💀</div>
                  <div className="text-sm text-slate-300">
                    {battleResult.encountersCleared}/{battleResult.totalEncounters} 遭遇クリア
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 戦闘ログ */}
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-400 mb-2">📜 戦闘ログ</h2>
            {allLogs.length > 0 ? (
              <BattleLogArea 
                logs={allLogs} 
                characters={partyMembers} 
                monsters={monsters} 
              />
            ) : (
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 text-center">
                <div className="animate-pulse text-slate-400">戦闘中...</div>
              </div>
            )}
          </div>
          
          {/* 再戦・戻るボタン */}
          {battleResult && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBattleStarted(false);
                  setBattleResult(null);
                  setAllLogs([]);
                }}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-semibold"
              >
                🔄 再戦
              </button>
              <Link
                href="/simulation"
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-center"
              >
                ← ボス選択に戻る
              </Link>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}

// ============================================
// メインページ（Suspenseでラップ）
// ============================================

export default function SimulationBattlePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SimulationBattleContent />
    </Suspense>
  );
}
