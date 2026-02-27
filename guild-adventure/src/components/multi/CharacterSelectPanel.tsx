'use client';

import { Character } from '@/lib/types';
import { RoomCharacter } from '@/lib/firebase';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';

interface CharacterSelectPanelProps {
  selectedChars: RoomCharacter[];
  characters: Character[];
  maxChars: number;
  isReady: boolean;
  onAddChar: (charId: string, position: 'front' | 'back') => void;
  onRemoveChar: (charId: string) => void;
}

export default function CharacterSelectPanel({
  selectedChars,
  characters,
  maxChars,
  isReady,
  onAddChar,
  onRemoveChar,
}: CharacterSelectPanelProps) {
  const availableChars = characters.filter(c => !selectedChars.some(sc => sc.character.id === c.id));
  const canAddMore = selectedChars.length < maxChars && !isReady;

  return (
    <>
      {/* 選択中のキャラ */}
      {selectedChars.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm text-slate-400 mb-2">選択中 ({selectedChars.length}/{maxChars})</h2>
          <div className="grid grid-cols-3 gap-2">
            {selectedChars.map((rc, idx) => (
              <div key={idx} className={`p-2 rounded-lg border text-center ${rc.position === 'front' ? 'bg-red-900/50 border-red-700' : 'bg-blue-900/50 border-blue-700'}`}>
                <div className="text-xs">{rc.position === 'front' ? '⚔️ 前衛' : '🛡️ 後衛'}</div>
                <div className="font-semibold text-sm truncate">{rc.character.name}</div>
                {!isReady && (
                  <button
                    onClick={() => onRemoveChar(rc.character.id)}
                    className="text-xs text-red-400 hover:text-red-300 mt-1"
                  >
                    外す
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* キャラ選択 */}
      <div className="mb-6">
        <h2 className="text-sm text-slate-400 mb-2">キャラを選択</h2>
        {characters.length === 0 ? (
          <div className="text-center py-4 text-slate-500">キャラがいません</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {availableChars.map((char) => {
              const raceData = races[char.race];
              const jobData = jobs[char.job];

              return (
                <div
                  key={char.id}
                  className={`p-3 rounded-lg border bg-slate-700 border-slate-600 ${!canAddMore ? 'opacity-50' : ''}`}
                >
                  <div className="font-semibold">{char.name}</div>
                  <div className="text-xs text-slate-300">{raceData.name} / {jobData.name}</div>
                  {canAddMore && (
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => onAddChar(char.id, 'front')}
                        className="flex-1 text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded"
                      >
                        前衛
                      </button>
                      <button
                        onClick={() => onAddChar(char.id, 'back')}
                        className="flex-1 text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded"
                      >
                        後衛
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
