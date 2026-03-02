'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { useChallengeStore } from '@/store/challengeStore';
import { LoadingScreen } from '@/components/LoadingScreen';
import { runChallengeBattle, ChallengeResult } from '@/lib/battle/engine';
import { Party, Character } from '@/lib/types';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';
import { allEquipments } from '@/lib/data/equipments';
import { allItems } from '@/lib/data/items';
import BattleLogDisplay from '@/components/BattleLogDisplay';

// クールダウン時間をフォーマット
function formatCooldown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ChallengePage() {
  const { username, characters, addItem, addEquipment, addCoins, syncToServer, isLoggedIn, isLoading: storeLoading } = useGameStore();
  const { 
    progress, 
    party: challengeParty, 
    loadData, 
    saveParty, 
    recordAttempt,
    canChallenge,
    getRemainingCooldown,
  } = useChallengeStore();
  
  // 全てのHooksを条件分岐の前に配置
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [earnedItems, setEarnedItems] = useState<{ books: string[]; equipments: string[] }>({ books: [], equipments: [] });
  
  // データロード（usernameが確定したら）
  useEffect(() => {
    if (username) {
      loadData(username).then(() => setIsDataLoaded(true));
    }
  }, [username, loadData]);
  
  // クールダウン更新
  useEffect(() => {
    const update = () => setCooldown(getRemainingCooldown());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [getRemainingCooldown, progress]);
  
  // ローディング中またはログイン前またはデータ未ロード
  if (!isLoggedIn || storeLoading || !isDataLoaded) {
    return <LoadingScreen />;
  }
  
  // 現在のパーティを取得
  const getPartyCharacters = (): { char: Character; position: 'front' | 'back' }[] => {
    return challengeParty
      .map(slot => {
        const char = characters.find(c => c.id === slot.charId);
        if (!char) return null;
        return { char, position: slot.position };
      })
      .filter((x): x is { char: Character; position: 'front' | 'back' } => x !== null);
  };
  
  // パーティをParty型に変換
  const buildParty = (): Party => {
    const partyChars = getPartyCharacters();
    const front: (Character | null)[] = [null, null, null];
    const back: (Character | null)[] = [null, null, null];
    
    let frontIdx = 0, backIdx = 0;
    for (const { char, position } of partyChars) {
      if (position === 'front' && frontIdx < 3) {
        front[frontIdx++] = char;
      } else if (position === 'back' && backIdx < 3) {
        back[backIdx++] = char;
      }
    }
    
    return { front, back };
  };
  
  // 挑戦実行
  const handleChallenge = async () => {
    if (!username || !canChallenge() || isRunning) return;
    
    const partyChars = getPartyCharacters();
    if (partyChars.length === 0) {
      alert('パーティを編成してください');
      return;
    }
    
    setIsRunning(true);
    setResult(null);
    
    try {
      const party = buildParty();
      const battleResult = runChallengeBattle(party);
      
      // 報酬を付与
      const books: string[] = [];
      const equipments: string[] = [];
      
      // コイン
      addCoins(battleResult.earnedCoins);
      
      // 書（ランダム：血統書 or 指南書）
      for (let i = 0; i < battleResult.earnedBooks; i++) {
        const isBloodline = Math.random() < 0.5;
        const bookId = isBloodline ? getRandomBloodlineBook() : getRandomJobBook();
        if (bookId) {
          addItem(bookId);
          books.push(bookId);
        }
      }
      
      // 装備
      for (let i = 0; i < battleResult.earnedEquipments; i++) {
        // ランダムに装備を選択（レア判定は通常ロジック：10%がレア）
        const isRare = Math.random() < 0.1;
        const pool = isRare 
          ? allEquipments.filter(e => e.rarity === 'rare')
          : allEquipments.filter(e => e.rarity === 'normal');
        if (pool.length > 0) {
          const equipment = pool[Math.floor(Math.random() * pool.length)];
          addEquipment(equipment.id);
          equipments.push(equipment.id);
        }
      }
      
      setEarnedItems({ books, equipments });
      await syncToServer();
      
      // 記録を保存（ログも保存）
      await recordAttempt(
        username,
        battleResult.reachedFloor,
        battleResult.defeatedAtFloor,
        battleResult.earnedCoins,
        battleResult.earnedBooks,
        battleResult.earnedEquipments,
        battleResult.logs
      );
      
      setResult(battleResult);
    } catch (e) {
      console.error('Challenge battle error:', e);
      alert('エラーが発生しました');
    } finally {
      setIsRunning(false);
    }
  };
  
  // パーティに追加（通常のパーティ編成と同じUI用）
  const handleAddToParty = async (position: 'front' | 'back') => {
    if (!username || !selectedChar) return;
    
    if (challengeParty.length >= 6) {
      alert('パーティは最大6人までです');
      return;
    }
    
    const newParty = [...challengeParty, { charId: selectedChar, position }];
    await saveParty(username, newParty);
    setSelectedChar(null);
  };
  
  // パーティから外す（通常のパーティ編成と同じUI用）
  const handleRemoveFromParty = async (charId: string) => {
    if (!username) return;
    
    const newParty = challengeParty.filter(s => s.charId !== charId);
    await saveParty(username, newParty);
  };
  
  // 結果画面
  if (result) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">⚔️ 挑戦結果</h1>
          
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6 text-center">
            <p className="text-4xl font-bold mb-2">
              {result.victory ? '🎉' : '💀'} {result.reachedFloor}F
            </p>
            <p className="text-slate-400">
              {result.victory 
                ? 'チャレンジダンジョン完全制覇！' 
                : `${result.defeatedAtFloor}Fで敗北...`}
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
            <h2 className="font-semibold mb-3">獲得報酬</h2>
            <div className="space-y-2">
              <p>💰 コイン: {result.earnedCoins}</p>
              {earnedItems.books.length > 0 && (
                <div>
                  <p className="text-amber-400">📜 書:</p>
                  <ul className="ml-4 text-sm text-slate-300">
                    {earnedItems.books.map((bookId, i) => {
                      const item = allItems.find(it => it.id === bookId);
                      return <li key={i}>・{item?.name || bookId}</li>;
                    })}
                  </ul>
                </div>
              )}
              {earnedItems.equipments.length > 0 && (
                <div>
                  <p className="text-blue-400">🎒 装備:</p>
                  <ul className="ml-4 text-sm text-slate-300">
                    {earnedItems.equipments.map((eqId, i) => {
                      const eq = allEquipments.find(e => e.id === eqId);
                      return <li key={i}>・{eq?.name || eqId}</li>;
                    })}
                  </ul>
                </div>
              )}
              {earnedItems.books.length === 0 && earnedItems.equipments.length === 0 && result.earnedCoins === 0 && (
                <p className="text-slate-400">報酬なし</p>
              )}
            </div>
          </div>
          
          {/* 詳細ログ */}
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="w-full bg-slate-700 hover:bg-slate-600 rounded-lg py-2 mb-4 text-sm"
          >
            📋 {showLogs ? 'ログを閉じる' : '詳細ログを見る'}
          </button>
          
          {showLogs && (
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 mb-4 max-h-96 overflow-y-auto">
              <BattleLogDisplay 
                logs={result.logs.map(log => log.message)}
                characters={getPartyCharacters().map(p => p.char)}
              />
            </div>
          )}
          
          <button
            onClick={() => { setResult(null); setShowLogs(false); }}
            className="w-full bg-amber-600 hover:bg-amber-500 rounded-lg py-3 font-semibold"
          >
            🏠 戻る
          </button>
        </div>
      </main>
    );
  }
  
  const partyChars = getPartyCharacters();
  const partyCount = partyChars.length;
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* ヘッダー */}
        <div className="flex items-center mb-6">
          <Link href="/" className="text-slate-400 hover:text-white mr-4">← 戻る</Link>
          <h1 className="text-2xl font-bold">⚔️ チャレンジダンジョン</h1>
        </div>
        
        {/* 仕様説明 */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
          <h2 className="font-semibold mb-2">📖 ルール</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>・100階層を即時挑戦</li>
            <li>・8時間に1回挑戦可能</li>
            <li>・1Fごと3コイン</li>
            <li>・5Fごと書×1、20Fごと装備×1</li>
          </ul>
        </div>
        
        {/* パーティ編成（通常と同じUI） */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
          <h2 className="font-semibold mb-3">🛡️ パーティ編成 ({partyCount}/6)</h2>
          
          {/* 説明 */}
          <div className="mb-3 p-2 bg-slate-700/50 rounded text-xs text-slate-400">
            <p>前衛: 火力+20%, 被ダメ+20% ／ 後衛: 火力-20%, 被ダメ-20%</p>
          </div>
          
          {/* 前衛 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm text-red-400 font-semibold">⚔️ 前衛 ({partyChars.filter(p => p.position === 'front').length}人)</h3>
              {selectedChar && (
                <button
                  onClick={() => handleAddToParty('front')}
                  className="text-xs bg-red-600 hover:bg-red-500 px-3 py-1 rounded"
                >
                  + 前衛に追加
                </button>
              )}
            </div>
            {partyChars.filter(p => p.position === 'front').length === 0 ? (
              <div className="text-slate-500 text-xs p-3 border-2 border-dashed border-slate-600 rounded-lg text-center">
                前衛がいません
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {partyChars.filter(p => p.position === 'front').map(({ char }) => (
                  <button
                    key={char.id}
                    onClick={() => handleRemoveFromParty(char.id)}
                    className="p-2 rounded text-left text-sm bg-red-900/50 border border-red-700 hover:bg-red-800/50"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold truncate">{char.name}</span>
                      <span className="text-xs bg-red-600 px-1 rounded">前</span>
                    </div>
                    <p className="text-xs text-slate-300">{races[char.race].name} / {jobs[char.job].name}</p>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className="text-red-400">HP{char.stats.maxHp}</span>
                      <span className="text-orange-400">ATK{char.stats.atk}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* 後衛 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm text-blue-400 font-semibold">🛡️ 後衛 ({partyChars.filter(p => p.position === 'back').length}人)</h3>
              {selectedChar && (
                <button
                  onClick={() => handleAddToParty('back')}
                  className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded"
                >
                  + 後衛に追加
                </button>
              )}
            </div>
            {partyChars.filter(p => p.position === 'back').length === 0 ? (
              <div className="text-slate-500 text-xs p-3 border-2 border-dashed border-slate-600 rounded-lg text-center">
                後衛がいません
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {partyChars.filter(p => p.position === 'back').map(({ char }) => (
                  <button
                    key={char.id}
                    onClick={() => handleRemoveFromParty(char.id)}
                    className="p-2 rounded text-left text-sm bg-blue-900/50 border border-blue-700 hover:bg-blue-800/50"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold truncate">{char.name}</span>
                      <span className="text-xs bg-blue-600 px-1 rounded">後</span>
                    </div>
                    <p className="text-xs text-slate-300">{races[char.race].name} / {jobs[char.job].name}</p>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className="text-red-400">HP{char.stats.maxHp}</span>
                      <span className="text-orange-400">ATK{char.stats.atk}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* 選択中の表示 */}
          {selectedChar && (
            <div className="mb-3 p-2 bg-amber-900/50 rounded-lg border border-amber-700 text-center text-sm">
              <span className="text-amber-400">「前衛に追加」か「後衛に追加」をタップ</span>
            </div>
          )}
          
          {/* 待機キャラ */}
          <div>
            <h3 className="text-sm text-slate-400 mb-2">
              待機中 ({characters.filter(c => !challengeParty.find(s => s.charId === c.id)).length}人)
            </h3>
            {characters.filter(c => !challengeParty.find(s => s.charId === c.id)).length === 0 ? (
              characters.length === 0 ? (
                <Link href="/create" className="block text-center text-sm text-amber-400 hover:underline">
                  キャラを作成する →
                </Link>
              ) : (
                <p className="text-slate-500 text-xs text-center">全員パーティにいます</p>
              )
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {characters.filter(c => !challengeParty.find(s => s.charId === c.id)).map(char => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedChar(selectedChar === char.id ? null : char.id)}
                    className={`p-2 rounded text-left text-sm transition-colors ${
                      selectedChar === char.id
                        ? 'bg-amber-600 border border-amber-500'
                        : 'bg-slate-700 border border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    <p className="font-semibold truncate">{char.name}</p>
                    <p className="text-xs text-slate-300">{races[char.race].name} / {jobs[char.job].name}</p>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className="text-red-400">HP{char.stats.maxHp}</span>
                      <span className="text-orange-400">ATK{char.stats.atk}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 挑戦ボタン */}
        <div className="mb-4">
          {canChallenge() ? (
            <button
              onClick={handleChallenge}
              disabled={isRunning || partyCount === 0}
              className={`w-full py-4 rounded-lg font-bold text-lg ${
                isRunning || partyCount === 0
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-500'
              }`}
            >
              {isRunning ? '⏳ 計算中...' : '⚔️ 挑戦する！'}
            </button>
          ) : (
            <div className="w-full py-4 rounded-lg bg-slate-700 text-center">
              <p className="text-slate-400">⏰ 次回挑戦まで</p>
              <p className="text-2xl font-bold">{formatCooldown(cooldown)}</p>
            </div>
          )}
        </div>
        
        {/* 記録 */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
          <h2 className="font-semibold mb-2">📊 あなたの記録</h2>
          <p className="text-2xl font-bold">
            最高到達: {progress?.highestFloor || 0}F
          </p>
          <p className="text-sm text-slate-400">
            総挑戦回数: {progress?.totalAttempts || 0}回
          </p>
        </div>
        
        {/* ランキング・履歴ボタン */}
        <div className="flex gap-3">
          <Link href="/challenge/ranking" className="flex-1">
            <div className="bg-slate-700 hover:bg-slate-600 rounded-lg p-3 text-center">
              🏆 ランキング
            </div>
          </Link>
          <Link href="/challenge/history" className="flex-1">
            <div className="bg-slate-700 hover:bg-slate-600 rounded-lg p-3 text-center">
              📜 挑戦履歴
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}

// ランダムな血統書を取得
function getRandomBloodlineBook(): string {
  const books = [
    'human_bloodline', 'elf_bloodline', 'dwarf_bloodline', 'halfling_bloodline',
    'orc_bloodline', 'goblin_bloodline', 'undead_bloodline', 'fairy_bloodline',
    'dragonborn_bloodline', 'beastkin_bloodline', 'demon_bloodline', 'angel_bloodline',
    'genasi_bloodline', 'aasimar_bloodline', 'tiefling_bloodline', 'dhampir_bloodline',
  ];
  return books[Math.floor(Math.random() * books.length)];
}

// ランダムな指南書を取得
function getRandomJobBook(): string {
  const books = [
    'warrior_guide', 'mage_guide', 'priest_guide', 'thief_guide',
    'ranger_guide', 'paladin_guide', 'monk_guide', 'bard_guide',
    'necromancer_guide', 'berserker_guide', 'assassin_guide', 'summoner_guide',
    'witch_guide', 'samurai_guide', 'ninja_guide', 'alchemist_guide',
    'spellblade_guide', 'battlemage_guide', 'runesmith_guide', 'redmage_guide',
  ];
  return books[Math.floor(Math.random() * books.length)];
}
