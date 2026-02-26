'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { allItems, getItemById } from '@/lib/data/items';

function LoginScreen() {
  const { login, autoLogin, isLoading } = useGameStore();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isAutoLogging, setIsAutoLogging] = useState(true);
  
  // 自動ログイン試行
  useEffect(() => {
    const tryAutoLogin = async () => {
      const success = await autoLogin();
      setIsAutoLogging(false);
      if (!success) {
        // 自動ログイン失敗時は何もしない
      }
    };
    tryAutoLogin();
  }, [autoLogin]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    const result = await login(username.trim());
    
    if (result.success) {
      if (result.isNew) {
        setMessage('新規登録しました！');
      } else {
        setMessage('ログインしました！');
      }
    } else {
      setError(result.error || 'エラーが発生しました');
    }
  };
  
  if (isAutoLogging) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚔️</div>
          <p className="text-slate-400">読み込み中...</p>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md flex flex-col items-center justify-center min-h-screen">
        {/* タイトル */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            ギルドアドベンチャー
          </h1>
          <p className="text-slate-400">放置系ビルド探索RPG</p>
        </div>
        
        {/* ログインフォーム */}
        <div className="w-full bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-center">ログイン / 新規登録</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">ユーザー名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="2〜20文字"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                maxLength={20}
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-300">
                {error}
              </div>
            )}
            
            {message && (
              <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-sm text-green-300">
                {message}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                isLoading || !username.trim()
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isLoading ? '処理中...' : 'ログイン / 新規登録'}
            </button>
          </form>
          
          <p className="mt-4 text-xs text-slate-500 text-center">
            ユーザー名が存在すればログイン、なければ新規登録されます
          </p>
        </div>
        
        {/* フッター */}
        <div className="mt-8 text-center text-slate-500 text-xs">
          <p>v0.2.0 Beta - サーバー保存対応</p>
        </div>
      </div>
    </main>
  );
}

function GameScreen() {
  const router = useRouter();
  const { characters, party, currentAdventure, username, logout, inventory } = useGameStore();
  
  console.log('[GameScreen] render, currentAdventure:', currentAdventure);
  
  // 探索中または完了済みなら自動で探索画面に遷移
  useEffect(() => {
    if (currentAdventure) {
      console.log('[GameScreen] redirecting to adventure, status:', currentAdventure.status);
      router.push('/adventure');
    }
  }, [currentAdventure, router]);
  
  const partyCount = [...party.front, ...party.back].filter(Boolean).length;
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              ギルドアドベンチャー
            </h1>
            <p className="text-sm text-slate-400">ようこそ、{username} さん</p>
          </div>
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 border border-slate-600 rounded"
          >
            ログアウト
          </button>
        </div>
        
        {/* メニュー */}
        <div className="space-y-4">
          <Link href="/create" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">⚔️ キャラ作成</h2>
                  <p className="text-slate-400 text-sm">新しい冒険者を雇う</p>
                </div>
                <span className="text-slate-400">→</span>
              </div>
            </div>
          </Link>
          
          <Link href="/party" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">👥 パーティ編成</h2>
                  <p className="text-slate-400 text-sm">冒険者を編成する</p>
                </div>
                <span className="text-amber-400">{partyCount}/6</span>
              </div>
            </div>
          </Link>
          
          <Link href="/dungeon" className="block">
            <div className={`rounded-lg p-4 border transition-colors ${
              partyCount > 0 
                ? 'bg-amber-600 hover:bg-amber-500 border-amber-500' 
                : 'bg-slate-700 border-slate-600 opacity-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">🗺️ ソロ冒険</h2>
                  <p className="text-slate-200 text-sm">（4キャラまで編成可能）</p>
                </div>
                <span className="text-white">→</span>
              </div>
            </div>
          </Link>
          
          {currentAdventure ? (
            <div className="bg-slate-700 rounded-lg p-4 border border-slate-600 opacity-50 cursor-not-allowed">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">👥 マルチプレイ</h2>
                  <p className="text-slate-400 text-sm">ソロ冒険中は参加できません</p>
                </div>
                <span className="text-slate-500">🚫</span>
              </div>
            </div>
          ) : (
            <Link href="/multi" className="block">
              <div className="bg-purple-600 hover:bg-purple-500 rounded-lg p-4 border border-purple-500 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">👥 マルチプレイ</h2>
                    <p className="text-purple-200 text-sm">（6キャラまで編成可能）</p>
                  </div>
                  <span className="text-white">→</span>
                </div>
              </div>
            </Link>
          )}
          
          <Link href="/history" className="block">
            <div className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 border border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">📜 過去の挑戦ログ</h2>
                  <p className="text-slate-400 text-sm">過去20回分の冒険履歴</p>
                </div>
                <span className="text-slate-400">→</span>
              </div>
            </div>
          </Link>
        </div>
        
        {/* 冒険中表示 */}
        {currentAdventure && currentAdventure.status === 'inProgress' && (
          <div className="mt-8 bg-amber-900/50 rounded-lg p-4 border border-amber-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="animate-pulse">🔥</span>
              <span className="font-semibold">冒険中...</span>
            </div>
            <Link href="/adventure" className="text-amber-400 hover:underline text-sm">
              冒険の状況を見る →
            </Link>
          </div>
        )}
        
        {/* キャラクター一覧 */}
        <div className="mt-8 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">👤 所属冒険者 ({characters.length}人)</h3>
          {characters.length === 0 ? (
            <p className="text-xs text-slate-500">まだ冒険者がいません</p>
          ) : (
            <div className="space-y-2">
              {characters.map(char => (
                <Link key={char.id} href={`/character/${char.id}`} className="block">
                  <div className="flex justify-between items-center p-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                    <div>
                      <span className="font-semibold">{char.name}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        {char.race === 'human' ? '人' : char.race === 'elf' ? 'エ' : char.race === 'dwarf' ? 'ド' : char.race === 'halfling' ? 'ハ' : char.race === 'orc' ? 'オ' : char.race === 'lizardman' ? 'リ' : char.race === 'fairy' ? 'フ' : char.race === 'undead' ? 'ア' : char.race === 'goblin' ? 'ゴ' : char.race === 'dragonewt' ? '竜' : char.race === 'angel' ? '天' : '悪'}
                        ・
                        {char.job === 'warrior' ? '戦' : char.job === 'mage' ? '魔' : char.job === 'priest' ? '司' : char.job === 'thief' ? '盗' : char.job === 'knight' ? '騎' : char.job === 'hunter' ? '狩' : char.job === 'ninja' ? '忍' : char.job === 'sage' ? '賢' : char.job === 'berserker' ? '狂' : char.job === 'paladin' ? '聖' : char.job === 'necromancer' ? '死' : char.job === 'monk' ? '拳' : char.job === 'ranger' ? '野' : char.job === 'samurai' ? '侍' : char.job === 'witch' ? '魔女' : '詩'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {char.raceMastery && <span className="text-amber-400 text-xs">★種</span>}
                      {char.jobMastery && <span className="text-amber-400 text-xs">★職</span>}
                      <span className="text-slate-400">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* インベントリ */}
        <div className="mt-4 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">💎 アイテム</h3>
          {Object.keys(inventory).filter(id => inventory[id] > 0).length === 0 ? (
            <p className="text-xs text-slate-500">アイテムを持っていません</p>
          ) : (
            <div className="space-y-1 text-sm">
              {Object.entries(inventory)
                .filter(([_, count]) => count > 0)
                .map(([itemId, count]) => {
                  const item = getItemById(itemId);
                  if (!item) return null;
                  return (
                    <div key={itemId} className="flex justify-between">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-amber-400">×{count}</span>
                    </div>
                  );
                })}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">
            ダンジョンボス撃破でドロップ
          </p>
        </div>
        
        {/* フッター */}
        <div className="mt-8 text-center text-slate-500 text-xs">
          <p>v0.7.0 Beta - マルチプレイ</p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  const { isLoggedIn, autoLogin, username } = useGameStore();
  
  // ハイドレーション対策
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 初回ロード時のみautoLogin（データ復元用）
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    if (mounted && isLoggedIn && username && !dataLoaded) {
      console.log('[Home] auto login for logged in user (first load)');
      autoLogin().then(() => setDataLoaded(true));
    }
  }, [mounted, isLoggedIn, username, autoLogin, dataLoaded]);
  
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="animate-spin text-4xl">⚔️</div>
      </main>
    );
  }
  
  return isLoggedIn ? <GameScreen /> : <LoginScreen />;
}
