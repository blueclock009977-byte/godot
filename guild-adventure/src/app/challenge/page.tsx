'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { useChallengeStore } from '@/store/challengeStore';
import { runChallengeBattle, ChallengeResult } from '@/lib/battle/challengeEngine';
import { Party, Character } from '@/lib/types';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';
import { getRandomItem } from '@/lib/data/items';
import { allEquipments } from '@/lib/data/equipments';

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
  const router = useRouter();
  const { username, characters, addItem, addEquipment, addCoins, syncToServer, autoLogin } = useGameStore();
  const { 
    progress, 
    party: challengeParty, 
    loadData, 
    saveParty, 
    recordAttempt,
    canChallenge,
    getRemainingCooldown,
  } = useChallengeStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showPartyEdit, setShowPartyEdit] = useState(false);
  const [earnedItems, setEarnedItems] = useState<{ books: string[]; equipments: string[] }>({ books: [], equipments: [] });
  
  // 自動ログイン
  useEffect(() => {
    if (!username) {
      autoLogin().then(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [username, autoLogin]);
  
  // データロード
  useEffect(() => {
    if (username) {
      loadData(username);
    }
  }, [username, loadData]);
  
  // クールダウン更新
  useEffect(() => {
    const update = () => setCooldown(getRemainingCooldown());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [getRemainingCooldown, progress]);
  
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
      
      // 記録を保存
      await recordAttempt(
        username,
        battleResult.reachedFloor,
        battleResult.defeatedAtFloor,
        battleResult.earnedCoins,
        battleResult.earnedBooks,
        battleResult.earnedEquipments
      );
      
      setResult(battleResult);
    } catch (e) {
      console.error('Challenge battle error:', e);
      alert('エラーが発生しました');
    } finally {
      setIsRunning(false);
    }
  };
  
  // キャラをパーティに追加/削除
  const toggleCharInParty = async (charId: string, position: 'front' | 'back') => {
    if (!username) return;
    
    const existing = challengeParty.find(s => s.charId === charId);
    let newParty;
    
    if (existing) {
      // 削除
      newParty = challengeParty.filter(s => s.charId !== charId);
    } else {
      // 追加（最大6人）
      if (challengeParty.length >= 6) {
        alert('パーティは最大6人までです');
        return;
      }
      newParty = [...challengeParty, { charId, position }];
    }
    
    await saveParty(username, newParty);
  };
  
  if (isLoading || !username) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <p>読み込み中...</p>
      </main>
    );
  }
  
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
          
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-6">
            <h2 className="font-semibold mb-3">獲得報酬</h2>
            <div className="space-y-2">
              <p>💰 コイン: {result.earnedCoins}</p>
              <p>📜 書: {result.earnedBooks}冊</p>
              <p>🎒 装備: {result.earnedEquipments}個</p>
            </div>
          </div>
          
          <button
            onClick={() => setResult(null)}
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
        
        {/* パーティ編成 */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">🛡️ パーティ ({partyCount}/6)</h2>
            <button
              onClick={() => setShowPartyEdit(!showPartyEdit)}
              className="text-sm bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded"
            >
              {showPartyEdit ? '閉じる' : '📝 編成'}
            </button>
          </div>
          
          {partyCount > 0 ? (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {partyChars.map(({ char, position }) => (
                <div 
                  key={char.id}
                  className={`text-center p-2 rounded text-xs ${
                    position === 'front' ? 'bg-red-900/50' : 'bg-blue-900/50'
                  }`}
                >
                  <p className="font-semibold truncate">{char.name}</p>
                  <p className="text-slate-400">{races[char.race].name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">キャラを選択してください</p>
          )}
          
          {/* 編成モード */}
          {showPartyEdit && (
            <div className="mt-4 border-t border-slate-600 pt-4">
              <p className="text-sm text-slate-400 mb-2">タップで追加/削除（前衛/後衛は交互）</p>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {characters.map(char => {
                  const inParty = challengeParty.find(s => s.charId === char.id);
                  const frontCount = challengeParty.filter(s => s.position === 'front').length;
                  const nextPosition = frontCount < 3 ? 'front' : 'back';
                  
                  return (
                    <button
                      key={char.id}
                      onClick={() => toggleCharInParty(char.id, inParty?.position || nextPosition)}
                      className={`p-2 rounded text-left text-sm ${
                        inParty 
                          ? 'bg-amber-600 hover:bg-amber-500' 
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      <p className="font-semibold truncate">{char.name}</p>
                      <p className="text-xs text-slate-300">
                        {races[char.race].name} {jobs[char.job].name}
                      </p>
                      {inParty && (
                        <p className="text-xs text-amber-200">
                          {inParty.position === 'front' ? '前衛' : '後衛'}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
