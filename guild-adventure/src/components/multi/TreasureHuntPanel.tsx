'use client';

import { MultiRoom, RoomCharacter } from '@/lib/firebase';
import { 
  getPartyTreasureHuntBonuses,
  hasTreasureHuntBonuses,
  PartyTreasureHuntBonuses,
} from '@/lib/drop/dropBonus';

interface TreasureHuntPanelProps {
  players: MultiRoom['players'];
}

function calculatePlayerBonuses(
  characters: RoomCharacter[], 
  ownerId: string
): PartyTreasureHuntBonuses {
  const chars = characters.map(rc => ({
    ...rc.character,
    ownerId,
  }));
  return getPartyTreasureHuntBonuses(chars);
}

function calculateTotalBonuses(
  players: MultiRoom['players']
): PartyTreasureHuntBonuses {
  // 全員のキャラにownerIdを付けて合算
  const allChars = Object.entries(players).flatMap(([playerName, p]) =>
    (p.characters || []).map(rc => ({
      ...rc.character,
      ownerId: playerName,
    }))
  );
  return getPartyTreasureHuntBonuses(allChars);
}

export default function TreasureHuntPanel({ players }: TreasureHuntPanelProps) {
  const totalBonuses = calculateTotalBonuses(players);

  if (!hasTreasureHuntBonuses(totalBonuses)) {
    return (
      <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="text-sm font-semibold text-amber-400 mb-2">🔍 トレハンスキル</h3>
        <p className="text-xs text-slate-500">スキル持ちがいません</p>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
      <h3 className="text-sm font-semibold text-amber-400 mb-2">🔍 トレハンスキル（パーティ合計）</h3>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        {totalBonuses.dropBonus > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">ドロップ率</span>
            <span className="text-green-400">+{totalBonuses.dropBonus}%</span>
          </div>
        )}
        {totalBonuses.rareDropBonus > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">レア発見</span>
            <span className="text-purple-400">+{totalBonuses.rareDropBonus}%</span>
          </div>
        )}
        {totalBonuses.coinBonus > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">コイン</span>
            <span className="text-yellow-400">+{totalBonuses.coinBonus}%</span>
          </div>
        )}
        {totalBonuses.explorationSpeedBonus > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">探索時間</span>
            <span className="text-cyan-400">-{totalBonuses.explorationSpeedBonus}%</span>
          </div>
        )}
        {totalBonuses.rollCount > 4 && (
          <div className="flex justify-between">
            <span className="text-slate-400">抽選回数</span>
            <span className="text-pink-400">{totalBonuses.rollCount}回</span>
          </div>
        )}
      </div>
      
      {/* プレイヤー別の内訳 */}
      <details className="mt-2">
        <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
          プレイヤー別内訳 ▼
        </summary>
        <div className="mt-2 space-y-2">
          {Object.entries(players).map(([playerName, player]) => {
            const bonuses = calculatePlayerBonuses(player.characters || [], playerName);
            
            if (!hasTreasureHuntBonuses(bonuses)) return null;
            
            return (
              <div key={playerName} className="text-xs pl-2 border-l border-slate-600">
                <div className="text-slate-300 font-medium">{playerName}</div>
                <div className="text-slate-500 flex flex-wrap gap-2">
                  {bonuses.dropBonus > 0 && <span>ドロ+{bonuses.dropBonus}%</span>}
                  {bonuses.rareDropBonus > 0 && <span>レア+{bonuses.rareDropBonus}%</span>}
                  {bonuses.coinBonus > 0 && <span>コイン+{bonuses.coinBonus}%</span>}
                  {bonuses.explorationSpeedBonus > 0 && <span>速度-{bonuses.explorationSpeedBonus}%</span>}
                  {bonuses.rollCount > 4 && <span>抽選{bonuses.rollCount}回</span>}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
