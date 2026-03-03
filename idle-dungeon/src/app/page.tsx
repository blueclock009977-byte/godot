'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getEquipmentById, getRarityColor, getRarityBgColor, getRandomEquipment } from '@/lib/data/equipments';
import { getSkillById } from '@/lib/data/skills';
import { BattleCanvas } from '@/components/BattleCanvas';
import { StatsPanel } from '@/components/StatsPanel';
import { getMilestoneById, getMilestoneProgress, MILESTONES } from '@/lib/data/milestones';

// ログイン画面
function LoginScreen() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useGameStore();
  
  const handleLogin = async () => {
    if (!username.trim()) return;
    setIsLoading(true);
    await login(username.trim());
    setIsLoading(false);
  };
  
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-2">⚔️ Idle Dungeon</h1>
        <p className="text-slate-400 text-center mb-8">見下ろし型2D放置ハクスラRPG</p>
        
        <div className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ユーザー名を入力"
            className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-amber-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            disabled={isLoading || !username.trim()}
            className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {isLoading ? '読み込み中...' : '冒険を始める'}
          </button>
        </div>
      </div>
    </main>
  );
}

// 放置結果モーダル（詳細版）
function IdleResultModal() {
  const { idleResult, clearIdleResult, getIdleEfficiencyBonus } = useGameStore();
  const [showDetails, setShowDetails] = useState(false);
  
  if (!idleResult) return null;
  
  const minutes = Math.floor(idleResult.elapsedSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  const efficiency = getIdleEfficiencyBonus();
  const hasEfficiencyBonus = efficiency.coins > 0 || efficiency.exp > 0 || efficiency.drop > 0;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-amber-500 max-h-[85vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-center mb-4">🎉 放置結果</h2>
        
        <div className="text-center mb-4">
          <p className="text-slate-400">
            {hours > 0 ? `${hours}時間${remainMinutes}分` : `${minutes}分`}の冒険
          </p>
          <p className="text-xl mt-2">
            <span className="text-slate-400">{idleResult.startFloor}階</span>
            <span className="mx-2">→</span>
            <span className="text-amber-400 font-bold">{idleResult.endFloor}階</span>
          </p>
        </div>
        
        {/* サマリー */}
        <div className="bg-slate-700 rounded-lg p-4 mb-4 space-y-2">
          <p>💰 コイン: +{idleResult.earnedCoins.toLocaleString()}</p>
          <p>✨ 経験値: +{idleResult.earnedExp.toLocaleString()}</p>
          
          {/* 詳細統計 */}
          {idleResult.details && (
            <div className="border-t border-slate-600 pt-2 mt-2 text-sm text-slate-400">
              <p>⚔️ 撃破: {idleResult.details.enemiesKilled}体（ボス{idleResult.details.bossesKilled}体）</p>
              <p>🏔️ クリア: {idleResult.details.floorsCleared}フロア</p>
              {idleResult.details.deaths > 0 && (
                <p>💀 倒れた回数: {idleResult.details.deaths}回</p>
              )}
              {idleResult.details.levelsGained > 0 && (
                <p className="text-amber-400">⬆️ レベルアップ: +{idleResult.details.levelsGained}</p>
              )}
            </div>
          )}
          
          {/* 効率ボーナス */}
          {hasEfficiencyBonus && (
            <div className="border-t border-slate-600 pt-2 mt-2 text-sm">
              <p className="text-green-400 font-semibold">📈 効率ボーナス適用中:</p>
              <div className="ml-2 text-green-300">
                {efficiency.coins > 0 && <span className="mr-2">💰+{efficiency.coins}%</span>}
                {efficiency.exp > 0 && <span className="mr-2">✨+{efficiency.exp}%</span>}
                {efficiency.drop > 0 && <span>🎁+{efficiency.drop}%</span>}
              </div>
            </div>
          )}
          
          {idleResult.droppedEquipment.length > 0 && (
            <div>
              <p className="text-amber-400">⚔️ 装備ドロップ:</p>
              {idleResult.droppedEquipment.map((id, i) => {
                const eq = getEquipmentById(id);
                return (
                  <p key={i} className={`ml-4 ${eq ? getRarityColor(eq.rarity) : ''}`}>
                    ・{eq?.name || id}
                  </p>
                );
              })}
            </div>
          )}
          
          {idleResult.droppedSkills.length > 0 && (
            <div>
              <p className="text-purple-400">📜 スキルドロップ:</p>
              {idleResult.droppedSkills.map((id, i) => {
                const skill = getSkillById(id);
                return <p key={i} className="ml-4">・{skill?.name || id}</p>;
              })}
            </div>
          )}
        </div>
        
        {/* 詳細イベントログ */}
        {idleResult.details?.events && idleResult.details.events.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-left text-sm text-slate-400 hover:text-white flex items-center justify-between"
            >
              <span>📋 詳細ログ ({idleResult.details.events.length}件)</span>
              <span>{showDetails ? '▲' : '▼'}</span>
            </button>
            
            {showDetails && (
              <div className="mt-2 bg-slate-900 rounded-lg p-3 max-h-40 overflow-y-auto text-sm space-y-1">
                {idleResult.details.events.map((event, i) => {
                  const timeStr = formatEventTime(event.timestamp);
                  const icon = event.type === 'boss_kill' ? '👑' 
                    : event.type === 'death' ? '💀'
                    : event.type === 'level_up' ? '⬆️'
                    : event.type === 'equipment_drop' ? '💎'
                    : event.type === 'skill_drop' ? '📜'
                    : event.type === 'milestone' ? '🏆'
                    : '🏔️';
                  
                  return (
                    <p key={i} className="text-slate-300">
                      <span className="text-slate-500">[{timeStr}]</span> {icon} {event.message}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={clearIdleResult}
          className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 font-semibold"
        >
          OK
        </button>
      </div>
    </div>
  );
}

// イベント時間をフォーマット（秒→m:ss）
function formatEventTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 装備スロット
function EquipmentSlot({ 
  type, 
  equippedId, 
  onClick 
}: { 
  type: 'weapon' | 'armor' | 'accessory'; 
  equippedId: string | null;
  onClick: () => void;
}) {
  const equipment = equippedId ? getEquipmentById(equippedId) : null;
  const typeEmoji = type === 'weapon' ? '⚔️' : type === 'armor' ? '🛡️' : '💍';
  const typeName = type === 'weapon' ? '武器' : type === 'armor' ? '防具' : 'アクセ';
  
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border ${
        equipment 
          ? getRarityBgColor(equipment.rarity) 
          : 'bg-slate-700 border-slate-600'
      } hover:brightness-110 transition-all`}
    >
      <div className="text-2xl mb-1">{typeEmoji}</div>
      <div className="text-xs text-slate-400">{typeName}</div>
      {equipment && (
        <div className={`text-sm font-semibold ${getRarityColor(equipment.rarity)}`}>
          {equipment.name}
        </div>
      )}
      {!equipment && (
        <div className="text-sm text-slate-500">なし</div>
      )}
    </button>
  );
}

// 放置時間をフォーマット
function formatIdleTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}日${hours % 24}時間`;
  if (hours > 0) return `${hours}時間${minutes % 60}分`;
  if (minutes > 0) return `${minutes}分${seconds % 60}秒`;
  return `${seconds}秒`;
}

// メイン画面
function MainScreen() {
  const { 
    userData, 
    getTotalStats,
    getSkillEffects,
    logout, 
    idleResult,
    addCoins,
    addExp,
    advanceFloor,
    addEquipmentToInventory,
    resetFloorAndHeal,
    healHp,
    buyPotion,
    usePotion,
    getPotionCount,
    updateLastActive,
    recordKill,
    recordDeath,
    recordFloorClear,
    checkAndShowNewMilestones,
    claimMilestoneReward,
    getMilestoneProgress,
    getTotalPlayTime,
    getIdleEfficiencyBonus,
  } = useGameStore();
  const [showEquipment, setShowEquipment] = useState(false);
  const [isBattling, setIsBattling] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [lastReward, setLastReward] = useState<{ coins: number; exp: number; equipment?: string } | null>(null);
  const [autoBattle, setAutoBattle] = useState(false);
  const [currentIdleTime, setCurrentIdleTime] = useState(0);
  const [newMilestoneIds, setNewMilestoneIds] = useState<string[]>([]);
  
  // 放置時間のリアルタイム更新
  useEffect(() => {
    if (!userData) return;
    
    const updateIdleTime = () => {
      const elapsed = Date.now() - userData.lastActiveAt;
      setCurrentIdleTime(elapsed);
    };
    
    updateIdleTime();
    const interval = setInterval(updateIdleTime, 1000);
    return () => clearInterval(interval);
  }, [userData?.lastActiveAt]);
  
  // バックグラウンド検知と通知
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // フォアグラウンドに戻った時
        updateLastActive();
      } else if (document.visibilityState === 'hidden' && isBattling) {
        // バックグラウンドに移行した時（戦闘中なら通知を出す準備）
        if ('Notification' in window && Notification.permission === 'granted') {
          // バックグラウンドでも戦闘は続くことを通知
          new Notification('⚔️ Idle Dungeon', {
            body: `${userData?.currentFloor}階で戦闘中...バックグラウンドでも自動進行します`,
            icon: '/favicon.ico',
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isBattling, userData?.currentFloor, updateLastActive]);
  
  // 通知許可リクエスト
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };
  
  // マイルストーンチェック
  useEffect(() => {
    if (!userData) return;
    const newIds = checkAndShowNewMilestones();
    if (newIds.length > 0) {
      setNewMilestoneIds(newIds);
    }
  }, [userData?.highestFloor, checkAndShowNewMilestones]);
  
  if (!userData) return null;
  
  const stats = getTotalStats();
  const skillEffects = getSkillEffects();
  const efficiency = getIdleEfficiencyBonus();
  const totalPlayTime = getTotalPlayTime();
  
  // ボス報酬を保持するstate
  const [bossBonus, setBossBonus] = useState<number>(0);
  
  // ボス撃破報酬処理
  const handleBossKill = (bonusCoins: number) => {
    addCoins(bonusCoins);
    setBossBonus(bonusCoins);
    recordKill(true); // ボス撃破を統計に記録
  };
  
  // フロアクリア報酬処理
  const handleFloorClear = () => {
    const floor = userData.currentFloor;
    const isBoss = floor % 5 === 0;
    
    // 基本報酬
    const coins = floor * 10;
    const exp = floor * 5;
    
    addCoins(coins);
    addExp(exp);
    advanceFloor();
    
    // フロアクリアを統計に記録
    recordFloorClear(floor);
    
    // スキル効果: HP回復
    const hpRegen = skillEffects.hpRegen || 0;
    if (hpRegen > 0) {
      healHp(hpRegen);
    }
    
    // ボスフロアは20%、通常は10%で装備ドロップ
    const dropChance = isBoss ? 0.2 : 0.1;
    let droppedEquipment: string | undefined;
    if (Math.random() < dropChance) {
      const equipment = getRandomEquipment(floor);
      addEquipmentToInventory(equipment.id);
      droppedEquipment = equipment.name;
    }
    
    setLastReward({ coins: coins + bossBonus, exp, equipment: droppedEquipment });
    setBossBonus(0); // リセット
    setIsBattling(false);
  };
  
  // プレイヤー死亡処理
  const handlePlayerDeath = () => {
    recordDeath(); // 死亡を統計に記録
    resetFloorAndHeal();
    setLastReward(null);
    setIsBattling(false);
  };
  
  return (
    <main className="min-h-screen p-4 pb-20">
      <IdleResultModal />
      
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">⚔️ Idle Dungeon</h1>
          <button 
            onClick={logout}
            className="text-slate-400 hover:text-white text-sm"
          >
            ログアウト
          </button>
        </div>
        
        {/* キャラクター情報 */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl">🧙</div>
            <div className="flex-1">
              <div className="font-bold text-lg">{userData.username}</div>
              <div className="text-amber-400">Lv.{stats.level}</div>
              <div className="text-sm text-slate-400">
                EXP: {userData.character.exp} / {stats.level * 100}
              </div>
            </div>
          </div>
          
          {/* HP */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>HP</span>
              <span>{stats.hp} / {stats.maxHp}</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }}
              />
            </div>
          </div>
          
          {/* ステータス */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm">
            <div className="bg-slate-700 rounded p-2">
              <div className="text-red-400">ATK</div>
              <div className="font-bold">{stats.atk}</div>
            </div>
            <div className="bg-slate-700 rounded p-2">
              <div className="text-blue-400">DEF</div>
              <div className="font-bold">{stats.def}</div>
            </div>
            <div className="bg-slate-700 rounded p-2">
              <div className="text-green-400">SPD</div>
              <div className="font-bold">{stats.spd}</div>
            </div>
          </div>
        </div>
        
        {/* 現在の階層 */}
        <div className="bg-gradient-to-r from-amber-900/50 to-amber-800/50 rounded-xl p-4 border border-amber-600 mb-4 text-center">
          <div className="text-slate-300">現在の階層</div>
          <div className="text-4xl font-bold text-amber-400">{userData.currentFloor}階</div>
          <div className="text-sm text-slate-400 mt-1">
            最高記録: {userData.highestFloor}階
          </div>
        </div>

        {/* バトルセクション */}
        {isBattling ? (
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4">
            {/* オートバトルトグル */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">オートバトル</span>
              <button
                onClick={() => setAutoBattle(!autoBattle)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  autoBattle
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-600 text-slate-300'
                }`}
              >
                {autoBattle ? '🔄 ON' : 'OFF'}
              </button>
            </div>
            
            <BattleCanvas
              playerStats={{
                maxHp: stats.maxHp,
                hp: stats.hp,
                atk: stats.atk,
                def: stats.def,
                speed: stats.spd,
              }}
              skillEffects={skillEffects}
              floor={userData.currentFloor}
              potionCount={getPotionCount()}
              autoBattle={autoBattle}
              onFloorClear={handleFloorClear}
              onPlayerDeath={handlePlayerDeath}
              onBossKill={handleBossKill}
              onEnemyKill={(isBoss) => recordKill(isBoss)}
              onUsePotion={usePotion}
              onAutoNextFloor={() => {
                // オートバトル: 次のフロアを自動開始
                setLastReward(null);
              }}
            />
            <button
              onClick={() => {
                setIsBattling(false);
                setAutoBattle(false);
              }}
              className="w-full mt-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500"
            >
              戦闘を中断
            </button>
          </div>
        ) : (
          <>
            {/* 報酬表示 */}
            {lastReward && (
              <div className="bg-gradient-to-r from-amber-900/50 to-green-900/50 rounded-xl p-4 border border-amber-500 mb-4">
                <div className="text-center font-bold text-amber-400 mb-2">🎉 クリア報酬</div>
                <div className="flex justify-center gap-6 text-sm">
                  <span>💰 +{lastReward.coins}</span>
                  <span>✨ +{lastReward.exp}</span>
                </div>
                {lastReward.equipment && (
                  <div className="text-center mt-2 text-purple-400">
                    ⚔️ {lastReward.equipment} をゲット！
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => {
                setLastReward(null);
                setIsBattling(true);
              }}
              className="w-full mb-4 py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 font-bold text-xl"
            >
              ⚔️ 戦闘開始
            </button>
          </>
        )}
        
        {/* 装備スロット */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4">
          <h2 className="font-semibold mb-3">装備</h2>
          <div className="grid grid-cols-3 gap-2">
            <EquipmentSlot 
              type="weapon" 
              equippedId={userData.equippedWeapon}
              onClick={() => setShowEquipment(true)}
            />
            <EquipmentSlot 
              type="armor" 
              equippedId={userData.equippedArmor}
              onClick={() => setShowEquipment(true)}
            />
            <EquipmentSlot 
              type="accessory" 
              equippedId={userData.equippedAccessory}
              onClick={() => setShowEquipment(true)}
            />
          </div>
        </div>
        
        {/* 所持コイン & ショップ */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4">
          <div className="text-center mb-3">
            <span className="text-2xl mr-2">💰</span>
            <span className="text-xl font-bold text-amber-400">{userData.coins}</span>
            <span className="text-slate-400 ml-1">コイン</span>
          </div>
          
          {/* ポーション */}
          <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧪</span>
              <div>
                <div className="font-semibold">ヒールポーション</div>
                <div className="text-xs text-slate-400">HP 50%回復</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold">×{getPotionCount()}</span>
              <button
                onClick={() => {
                  if (buyPotion()) {
                    // 購入成功
                  }
                }}
                disabled={userData.coins < 100}
                className={`px-3 py-1.5 rounded font-semibold text-sm ${
                  userData.coins >= 100
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                💰100 購入
              </button>
            </div>
          </div>
        </div>
        
        {/* アクションボタン */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowEquipment(true)}
            className="py-3 rounded-lg bg-slate-700 hover:bg-slate-600 font-semibold text-sm"
          >
            🎒 装備
          </button>
          <button
            onClick={() => setShowSkills(true)}
            className="py-3 rounded-lg bg-slate-700 hover:bg-slate-600 font-semibold text-sm"
          >
            📜 スキル
          </button>
          <button
            onClick={() => setShowMilestones(true)}
            className={`py-3 rounded-lg font-semibold text-sm relative ${
              newMilestoneIds.length > 0
                ? 'bg-amber-600 hover:bg-amber-500 animate-pulse'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            🏆 報酬
            {newMilestoneIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {newMilestoneIds.length}
              </span>
            )}
          </button>
        </div>
        
        {/* マイルストーン進捗 */}
        <MilestoneProgressBar currentFloor={userData.highestFloor} />
        
        {/* 放置効率ボーナス */}
        {(efficiency.coins > 0 || efficiency.exp > 0 || efficiency.drop > 0) && (
          <div className="mt-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-600">
            <h3 className="text-sm text-green-400 mb-2 font-semibold">📈 放置効率ボーナス</h3>
            <div className="flex justify-center gap-4 text-sm">
              {efficiency.coins > 0 && (
                <span className="text-green-300">💰 +{efficiency.coins}%</span>
              )}
              {efficiency.exp > 0 && (
                <span className="text-green-300">✨ +{efficiency.exp}%</span>
              )}
              {efficiency.drop > 0 && (
                <span className="text-green-300">🎁 +{efficiency.drop}%</span>
              )}
            </div>
          </div>
        )}
        
        {/* 放置時間・通知設定 */}
        <div className="mt-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">放置進行</h3>
          <div className="text-center">
            <p className="text-slate-300">
              現在のセッション: <span className="text-amber-400 font-semibold">{formatIdleTime(currentIdleTime)}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              アプリを閉じている間も自動で冒険が進みます（最大8時間）
            </p>
          </div>
          
          {/* 累計プレイ時間 */}
          <div className="mt-3 pt-3 border-t border-slate-700 text-center">
            <p className="text-xs text-slate-500">
              累計プレイ時間: <span className="text-slate-300">{formatPlayTime(totalPlayTime)}</span>
            </p>
          </div>
          
          {/* 通知許可 */}
          {'Notification' in (typeof window !== 'undefined' ? window : {}) && (
            <div className="mt-3 text-center">
              {typeof window !== 'undefined' && Notification.permission === 'default' && (
                <button
                  onClick={requestNotificationPermission}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm"
                >
                  🔔 通知を有効にする
                </button>
              )}
              {typeof window !== 'undefined' && Notification.permission === 'granted' && (
                <span className="text-xs text-green-400">🔔 通知ON</span>
              )}
              {typeof window !== 'undefined' && Notification.permission === 'denied' && (
                <span className="text-xs text-red-400">🔕 通知OFF（ブラウザ設定で許可してください）</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 装備変更モーダル（簡易版） */}
      {showEquipment && (
        <EquipmentModal onClose={() => setShowEquipment(false)} />
      )}
      
      {/* スキルモーダル */}
      {showSkills && (
        <SkillModal onClose={() => setShowSkills(false)} />
      )}
      
      {/* マイルストーンモーダル */}
      {showMilestones && (
        <MilestoneModal 
          onClose={() => {
            setShowMilestones(false);
            setNewMilestoneIds([]); // 閉じたら通知クリア
          }}
        />
      )}
      
      {/* 統計パネル */}
      <StatsPanel />
    </main>
  );
}

// 装備変更モーダル
function EquipmentModal({ onClose }: { onClose: () => void }) {
  const { userData, equipItem, unequipItem } = useGameStore();
  
  if (!userData) return null;
  
  const groupedInventory = {
    weapon: userData.inventory.filter(id => getEquipmentById(id)?.type === 'weapon'),
    armor: userData.inventory.filter(id => getEquipmentById(id)?.type === 'armor'),
    accessory: userData.inventory.filter(id => getEquipmentById(id)?.type === 'accessory'),
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🎒 装備変更</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        
        {(['weapon', 'armor', 'accessory'] as const).map(type => {
          const typeName = type === 'weapon' ? '武器' : type === 'armor' ? '防具' : 'アクセサリ';
          const equipped = type === 'weapon' ? userData.equippedWeapon 
            : type === 'armor' ? userData.equippedArmor 
            : userData.equippedAccessory;
          
          return (
            <div key={type} className="mb-4">
              <h3 className="text-sm text-slate-400 mb-2">{typeName}</h3>
              <div className="space-y-2">
                {groupedInventory[type].map(id => {
                  const eq = getEquipmentById(id);
                  if (!eq) return null;
                  const isEquipped = equipped === id;
                  
                  return (
                    <button
                      key={id}
                      onClick={() => isEquipped ? unequipItem(type) : equipItem(id)}
                      className={`w-full p-3 rounded-lg text-left flex justify-between items-center ${
                        isEquipped 
                          ? 'bg-amber-600/30 border-amber-500' 
                          : 'bg-slate-700 border-slate-600'
                      } border hover:brightness-110`}
                    >
                      <div>
                        <div className={`font-semibold ${getRarityColor(eq.rarity)}`}>
                          {eq.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {eq.atk && `ATK+${eq.atk} `}
                          {eq.def && `DEF+${eq.def} `}
                          {eq.hp && `HP+${eq.hp}`}
                        </div>
                      </div>
                      {isEquipped && <span className="text-amber-400">装備中</span>}
                    </button>
                  );
                })}
                {groupedInventory[type].length === 0 && (
                  <p className="text-slate-500 text-sm">所持なし</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// スキルモーダル
function SkillModal({ onClose }: { onClose: () => void }) {
  const { userData, equipSkill, unequipSkill } = useGameStore();
  
  if (!userData) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📜 スキル</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        
        {/* 装備中スキル */}
        <div className="mb-4">
          <h3 className="text-sm text-slate-400 mb-2">装備中（最大4つ）</h3>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map(slot => {
              const skillId = userData.equippedSkills[slot];
              const skill = skillId ? getSkillById(skillId) : null;
              
              return (
                <button
                  key={slot}
                  onClick={() => skillId && unequipSkill(slot)}
                  className="p-3 rounded-lg bg-slate-700 border border-slate-600 text-center hover:bg-slate-600"
                >
                  {skill ? (
                    <>
                      <div className="font-semibold text-purple-400">{skill.name}</div>
                      <div className="text-xs text-slate-400">{skill.description}</div>
                    </>
                  ) : (
                    <div className="text-slate-500">空きスロット</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* 所持スキル */}
        <div>
          <h3 className="text-sm text-slate-400 mb-2">所持スキル</h3>
          <div className="space-y-2">
            {userData.skillInventory.map((id, i) => {
              const skill = getSkillById(id);
              if (!skill) return null;
              const isEquipped = userData.equippedSkills.includes(id);
              
              return (
                <button
                  key={`${id}-${i}`}
                  onClick={() => {
                    if (!isEquipped) {
                      // 空きスロットを探す
                      const emptySlot = userData.equippedSkills.findIndex((s, idx) => !s || idx >= userData.equippedSkills.length);
                      if (emptySlot >= 0 || userData.equippedSkills.length < 4) {
                        equipSkill(id, emptySlot >= 0 ? emptySlot : userData.equippedSkills.length);
                      }
                    }
                  }}
                  disabled={isEquipped}
                  className={`w-full p-3 rounded-lg text-left ${
                    isEquipped 
                      ? 'bg-slate-600 opacity-50' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  } border border-slate-600`}
                >
                  <div className="font-semibold text-purple-400">{skill.name}</div>
                  <div className="text-xs text-slate-400">{skill.description}</div>
                  {isEquipped && <span className="text-xs text-amber-400">装備中</span>}
                </button>
              );
            })}
            {userData.skillInventory.length === 0 && (
              <p className="text-slate-500 text-sm">スキルを持っていません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// マイルストーンプログレスバー
function MilestoneProgressBar({ currentFloor }: { currentFloor: number }) {
  const progress = getMilestoneProgress(currentFloor);
  
  return (
    <div className="mt-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-slate-400">次のマイルストーン</span>
        {progress.next ? (
          <span className="text-amber-400">{progress.next.icon} {progress.next.floor}階</span>
        ) : (
          <span className="text-green-400">🏆 全達成！</span>
        )}
      </div>
      
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      
      {progress.next && (
        <div className="text-center mt-2 text-xs text-slate-500">
          あと{progress.next.floor - currentFloor}階で「{progress.next.name}」達成
        </div>
      )}
    </div>
  );
}

// マイルストーンモーダル
function MilestoneModal({ onClose }: { onClose: () => void }) {
  const { 
    userData, 
    claimMilestoneReward, 
    getMilestoneProgress: getUserMilestoneProgress 
  } = useGameStore();
  
  if (!userData) return null;
  
  const userProgress = getUserMilestoneProgress();
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-amber-500 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🏆 マイルストーン報酬</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        
        <p className="text-sm text-slate-400 mb-4">
          特定の階層に初めて到達するとボーナス報酬がもらえます！
        </p>
        
        <div className="space-y-3">
          {MILESTONES.map(milestone => {
            const progress = userProgress[milestone.id];
            const isReached = userData.highestFloor >= milestone.floor;
            const isClaimed = progress?.claimedAt && progress.claimedAt > 0;
            const canClaim = isReached && !isClaimed;
            
            return (
              <div
                key={milestone.id}
                className={`p-3 rounded-lg border ${
                  canClaim
                    ? 'bg-amber-900/30 border-amber-500 animate-pulse'
                    : isClaimed
                    ? 'bg-slate-700 border-green-600'
                    : isReached
                    ? 'bg-slate-700 border-slate-500'
                    : 'bg-slate-900/50 border-slate-700 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{milestone.icon}</span>
                    <div>
                      <div className="font-semibold">{milestone.name}</div>
                      <div className="text-xs text-slate-400">{milestone.description}</div>
                    </div>
                  </div>
                  
                  {canClaim ? (
                    <button
                      onClick={() => claimMilestoneReward(milestone.id)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-semibold"
                    >
                      受取
                    </button>
                  ) : isClaimed ? (
                    <span className="text-green-400 text-sm">✓ 受取済</span>
                  ) : (
                    <span className="text-slate-500 text-sm">{milestone.floor}階</span>
                  )}
                </div>
                
                {/* 報酬表示 */}
                <div className="mt-2 text-xs text-slate-400 flex gap-3">
                  {milestone.reward.coins && <span>💰 {milestone.reward.coins}</span>}
                  {milestone.reward.exp && <span>✨ {milestone.reward.exp}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// プレイ時間フォーマット
function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}時間${mins}分`;
  }
  return `${mins}分`;
}

// メインコンポーネント
export default function Home() {
  const { isLoggedIn, isLoading, login } = useGameStore();
  const [autoLoginChecked, setAutoLoginChecked] = useState(false);
  
  // 自動ログイン
  useEffect(() => {
    const savedUsername = typeof window !== 'undefined' 
      ? localStorage.getItem('idle-dungeon-username') 
      : null;
    
    if (savedUsername) {
      login(savedUsername).finally(() => setAutoLoginChecked(true));
    } else {
      setAutoLoginChecked(true);
    }
  }, [login]);
  
  if (!autoLoginChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-xl">⏳ 読み込み中...</div>
      </main>
    );
  }
  
  return isLoggedIn ? <MainScreen /> : <LoginScreen />;
}
