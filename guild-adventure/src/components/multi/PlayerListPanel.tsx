'use client';

import { RoomCharacter } from '@/lib/firebase';

interface Player {
  username: string;
  ready: boolean;
  characters: RoomCharacter[];
}

interface PlayerListPanelProps {
  players: Record<string, Player>;
  hostId: string;
  maxPlayers: number;
  maxCharsPerPlayer: number;
}

export default function PlayerListPanel({
  players,
  hostId,
  maxPlayers,
  maxCharsPerPlayer,
}: PlayerListPanelProps) {
  const playerCount = Object.keys(players).length;
  
  return (
    <div className="mb-6">
      <h2 className="text-sm text-slate-400 mb-2">
        プレイヤー ({playerCount}/{maxPlayers})
      </h2>
      <div className="space-y-2">
        {Object.values(players).map((player) => (
          <div
            key={player.username}
            className={`p-3 rounded-lg border ${
              player.ready ? 'bg-green-900/50 border-green-700' : 'bg-slate-700 border-slate-600'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold">{player.username}</span>
                {player.username === hostId && (
                  <span className="ml-2 text-xs text-amber-400">ホスト</span>
                )}
              </div>
              <div className="text-sm">
                {player.ready ? (
                  <span className="text-green-400">準備完了</span>
                ) : (
                  <span className="text-slate-400">
                    {player.characters?.length || 0}/{maxCharsPerPlayer}キャラ
                  </span>
                )}
              </div>
            </div>
            {player.characters && player.characters.length > 0 && (
              <div className="mt-2 flex gap-1 flex-wrap">
                {player.characters.map((rc: RoomCharacter, idx: number) => (
                  <span key={idx} className={`text-xs px-2 py-1 rounded ${rc.position === 'front' ? 'bg-red-600' : 'bg-blue-600'}`}>
                    {rc.position === 'front' ? '前' : '後'} {rc.character.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* 空きスロット */}
        {Array(maxPlayers - playerCount).fill(0).map((_, i) => (
          <div key={`empty-${i}`} className="p-3 rounded-lg border-2 border-dashed border-slate-600 text-slate-500 text-center">
            待機中...
          </div>
        ))}
      </div>
    </div>
  );
}
