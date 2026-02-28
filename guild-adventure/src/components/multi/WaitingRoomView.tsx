'use client';

import { Character } from '@/lib/types';
import { RoomCharacter, MultiRoom } from '@/lib/firebase';
import CharacterSelectPanel from './CharacterSelectPanel';
import PlayerListPanel from './PlayerListPanel';
import TreasureHuntPanel from './TreasureHuntPanel';

interface WaitingRoomViewProps {
  room: MultiRoom;
  code: string;
  dungeonName: string;
  dungeonRecommendedPlayers: number;
  dungeonDurationSeconds: number;
  selectedChars: RoomCharacter[];
  characters: Character[];
  maxCharsPerPlayer: number;
  isReady: boolean;
  isStarting: boolean;
  allReady: boolean;
  onAddChar: (charId: string, position: 'front' | 'back') => void;
  onRemoveChar: (charId: string) => void;
  onToggleReady: () => void;
  onStartBattle: () => void;
  onLeave: () => void;
  onShowInviteModal: () => void;
  onSaveParty: () => void;
  onLoadParty: () => void;
  hasLastParty: boolean;
}

export default function WaitingRoomView({
  room,
  code,
  dungeonName,
  dungeonRecommendedPlayers,
  dungeonDurationSeconds,
  selectedChars,
  characters,
  maxCharsPerPlayer,
  isReady,
  isStarting,
  allReady,
  onAddChar,
  onRemoveChar,
  onToggleReady,
  onStartBattle,
  onLeave,
  onShowInviteModal,
  onSaveParty,
  onLoadParty,
  hasLastParty,
}: WaitingRoomViewProps) {
  const playerCount = Object.keys(room.players).length;
  const durationDisplay = dungeonDurationSeconds < 60 
    ? `${dungeonDurationSeconds}秒` 
    : `${Math.floor(dungeonDurationSeconds / 60)}分`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{dungeonName}</h1>
            <div className="text-sm text-slate-400">
              ルームコード: <span className="text-amber-400 font-mono">{code}</span>
              {room.isPublic && <span className="ml-2 text-green-400">🌐 公開</span>}
            </div>
            <div className="text-xs text-slate-500">
              推奨人数: {dungeonRecommendedPlayers}人 / 探索時間: {durationDisplay}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onShowInviteModal} 
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              👥 招待
            </button>
            <button onClick={onLeave} className="text-red-400 hover:text-red-300 text-sm">
              退出
            </button>
          </div>
        </div>
        
        {/* プレイヤー一覧 */}
        <PlayerListPanel
          players={room.players}
          hostId={room.hostId}
          maxPlayers={room.maxPlayers}
          maxCharsPerPlayer={maxCharsPerPlayer}
        />
        
        {/* トレハンスキル表示 */}
        <TreasureHuntPanel players={room.players} />
        
        {/* キャラ選択パネル */}
        <CharacterSelectPanel
          selectedChars={selectedChars}
          characters={characters}
          maxChars={maxCharsPerPlayer}
          isReady={isReady}
          onAddChar={onAddChar}
          onRemoveChar={onRemoveChar}
        />
        
        {/* 編成保存・復元ボタン */}
        {!isReady && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={onSaveParty}
              disabled={selectedChars.length === 0}
              className="flex-1 py-2 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
            >
              💾 編成を保存
            </button>
            <button
              onClick={onLoadParty}
              disabled={!hasLastParty}
              className="flex-1 py-2 rounded-lg text-sm bg-amber-700 hover:bg-amber-600 disabled:opacity-50"
            >
              📂 前回の編成
            </button>
          </div>
        )}
        
        {/* 準備完了ボタン */}
        <button
          onClick={onToggleReady}
          disabled={selectedChars.length === 0}
          className={`w-full py-3 rounded-lg font-semibold mb-4 ${
            isReady
              ? 'bg-green-600 hover:bg-green-500'
              : 'bg-slate-600 hover:bg-slate-500'
          } disabled:opacity-50`}
        >
          {isReady ? '✓ 準備完了' : '準備する'}
        </button>
        
        {/* バトル開始ボタン（全員準備完了なら誰でも押せる） */}
        {allReady && (
          <button
            onClick={onStartBattle}
            disabled={isStarting}
            className="w-full bg-amber-600 hover:bg-amber-500 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? '開始中...' : '⚔️ 冒険開始！'}
          </button>
        )}
        
        {!allReady && playerCount === room.maxPlayers && (
          <div className="text-center text-slate-400 text-sm">
            全員の準備完了を待っています...
          </div>
        )}
      </div>
    </main>
  );
}
