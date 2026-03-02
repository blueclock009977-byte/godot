'use client';

import { getItemById } from '@/lib/data/items';
import { getEquipmentById } from '@/lib/data/equipments';
import { BattleLog, Character, Monster } from '@/lib/types';
import BattleLogDisplay from '@/components/BattleLogDisplay';

interface BattleResultViewProps {
  victory: boolean;
  dungeonName: string;
  myDrop: string[] | null;  // 複数対応
  myEquipment: string[] | null;  // 複数対応
  dropClaimed: boolean;
  logs: BattleLog[];
  coinReward?: number;
  onGoHome: () => void;
  onClaimDrop?: () => void;  // 報酬受け取りボタン用
  isClaiming?: boolean;  // 受け取り中フラグ
  // 全プレイヤーのドロップ情報
  players?: string[];
  playerDrops?: Record<string, string | undefined>;  // 後方互換
  playerEquipmentDrops?: Record<string, string | undefined>;  // 後方互換
  playerDropsMulti?: Record<string, string[] | undefined>;  // 複数対応
  playerEquipmentDropsMulti?: Record<string, string[] | undefined>;  // 複数対応
  myUsername?: string;
  // バトルログ用アイコン情報
  characters?: (Character | null)[];
  monsters?: Monster[];
}

export default function BattleResultView({
  victory,
  dungeonName,
  myDrop,
  myEquipment,
  dropClaimed,
  logs,
  coinReward,
  onGoHome,
  onClaimDrop,
  isClaiming,
  players,
  playerDrops,
  playerEquipmentDrops,
  playerDropsMulti,
  playerEquipmentDropsMulti,
  myUsername,
  characters,
  monsters,
}: BattleResultViewProps) {
  // ログをstring[]に展開
  const displayedLogs = logs.flatMap(logEntry => 
    logEntry.message.split('\n').filter(l => l.trim())
  );
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="p-6 rounded-lg bg-slate-800 border border-slate-700 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {victory ? '🎉 勝利！' : '💀 敗北...'}
          </h2>
          <div className="text-slate-300 mb-2">
            {victory ? `${dungeonName}を踏破！` : `${dungeonName}で全滅...`}
          </div>
          {victory && coinReward && (
            <div className="text-amber-400 text-lg mb-4">
              🪙 {coinReward}コイン獲得！
            </div>
          )}
          {/* 複数アイテムドロップ表示 */}
          {myDrop && myDrop.length > 0 && myDrop.map((itemId, idx) => {
            const item = getItemById(itemId);
            const isTreasure = itemId.startsWith('treasure_');
            return (
              <div 
                key={`item-${idx}`} 
                className={`mb-3 p-3 rounded-lg ${
                  isTreasure 
                    ? 'bg-gradient-to-r from-yellow-900/50 via-amber-800/50 to-yellow-900/50 border-2 border-yellow-500 animate-pulse' 
                    : 'bg-slate-700/50'
                }`}
              >
                <div className={`font-bold ${isTreasure ? 'text-2xl text-yellow-300' : 'text-lg text-amber-400'}`}>
                  {isTreasure ? '👑✨【秘宝発見！】✨👑' : '💎【ドロップ】'}
                </div>
                <div className={isTreasure ? 'text-xl text-yellow-200 mt-1' : 'text-amber-400'}>
                  {item?.name || itemId}
                </div>
              </div>
            );
          })}
          {/* 複数装備ドロップ表示 */}
          {myEquipment && myEquipment.length > 0 && myEquipment.map((eqId, idx) => {
            const eq = getEquipmentById(eqId);
            const isRare = eq?.rarity === 'rare';
            return (
              <div 
                key={`eq-${idx}`} 
                className={`mb-3 p-3 rounded-lg ${
                  isRare 
                    ? 'bg-gradient-to-r from-purple-900/50 via-pink-800/50 to-purple-900/50 border-2 border-purple-400 animate-pulse' 
                    : 'bg-slate-700/50'
                }`}
              >
                <div className={`font-bold ${isRare ? 'text-2xl text-purple-300' : 'text-lg text-green-400'}`}>
                  {isRare ? '🌟⚔️【レア装備！】⚔️🌟' : '📦【装備】'}
                </div>
                <div className={isRare ? 'text-xl text-purple-200 mt-1' : 'text-green-400'}>
                  {eq?.name || eqId}
                </div>
              </div>
            );
          })}
          {victory && (!myDrop || myDrop.length === 0) && (!myEquipment || myEquipment.length === 0) && dropClaimed && (
            <div className="text-slate-400 mb-4">ドロップなし...</div>
          )}
          
          {/* 他のプレイヤーのドロップ */}
          {victory && players && (playerDrops || playerEquipmentDrops || playerDropsMulti || playerEquipmentDropsMulti) && (
            <div className="mt-4 mb-4 p-3 bg-slate-700 rounded-lg text-left">
              <div className="text-sm text-slate-400 mb-2">👥 パーティのドロップ</div>
              {players.map(player => {
                const isMe = player === myUsername;
                // 複数対応優先、後方互換で単一も
                const items = playerDropsMulti?.[player] || (playerDrops?.[player] ? [playerDrops[player]] : undefined);
                const equips = playerEquipmentDropsMulti?.[player] || (playerEquipmentDrops?.[player] ? [playerEquipmentDrops[player]] : undefined);
                return (
                  <div key={player} className="text-sm py-1">
                    <span className={isMe ? 'text-amber-400' : 'text-slate-300'}>
                      {player}{isMe ? '(自分)' : ''}:
                    </span>
                    {items && items.length > 0 && items.map((item, i) => (
                      <span key={i} className="text-amber-400 ml-2">📜{getItemById(item!)?.name}</span>
                    ))}
                    {equips && equips.length > 0 && equips.map((equip, i) => (
                      <span key={i} className="text-yellow-300 ml-2">⚔️{getEquipmentById(equip!)?.name}</span>
                    ))}
                    {(!items || items.length === 0) && (!equips || equips.length === 0) && (
                      <span className="text-slate-500 ml-2">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* 受け取り中表示 */}
          {isClaiming && (
            <div className="text-slate-400 mb-3 animate-pulse">
              🎁 報酬を受け取り中...
            </div>
          )}
          
          <button
            onClick={onGoHome}
            className="inline-block bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-lg font-semibold"
          >
            ホームに戻る
          </button>
          
          {/* 戦闘ログ */}
          {logs && logs.length > 0 && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
                📜 戦闘ログを表示
              </summary>
              <div className="mt-2 bg-slate-700 rounded-lg p-3 max-h-64 overflow-y-auto">
                <BattleLogDisplay 
                  logs={displayedLogs}
                  characters={characters}
                  monsters={monsters}
                />
              </div>
            </details>
          )}
        </div>
      </div>
    </main>
  );
}
