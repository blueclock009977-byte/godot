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
          {myDrop && myDrop.length > 0 && (
            <div className="text-amber-400 text-lg mb-4">
              📜 【書ドロップ】{myDrop.map(id => getItemById(id)?.name || id).join('、')}
            </div>
          )}
          {myEquipment && myEquipment.length > 0 && (
            <div className="text-yellow-300 text-lg mb-4">
              ⚔️ 【装備ドロップ】{myEquipment.map(id => getEquipmentById(id)?.name || id).join('、')}
            </div>
          )}
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
          
          {/* 報酬受け取りボタン（未受け取りの場合） */}
          {!dropClaimed && onClaimDrop && (
            <button
              onClick={onClaimDrop}
              disabled={isClaiming}
              className="inline-block bg-green-600 hover:bg-green-500 disabled:bg-slate-600 px-6 py-2 rounded-lg font-semibold mb-3"
            >
              {isClaiming ? '受け取り中...' : '🎁 報酬を受け取る'}
            </button>
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
