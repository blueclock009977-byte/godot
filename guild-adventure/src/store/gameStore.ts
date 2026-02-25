import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Character, 
  Party, 
  Adventure, 
  RaceType, 
  JobType, 
  TraitType, 
  EnvironmentType,
  Position,
  DungeonType,
  Stats,
} from '@/lib/types';
import { races } from '@/lib/data/races';
import { jobs } from '@/lib/data/jobs';

// ============================================
// ステータス計算
// ============================================

function calculateStats(
  race: RaceType,
  job: JobType,
): Stats {
  const raceData = races[race];
  const jobData = jobs[job];
  
  const baseStats = raceData.baseStats;
  const modifiers = jobData.statModifiers;
  
  return {
    maxHp: baseStats.maxHp + (modifiers.maxHp || 0),
    hp: baseStats.maxHp + (modifiers.maxHp || 0),
    atk: baseStats.atk + (modifiers.atk || 0),
    def: baseStats.def + (modifiers.def || 0),
    agi: baseStats.agi + (modifiers.agi || 0),
    mag: baseStats.mag + (modifiers.mag || 0),
  };
}

// ============================================
// ストア定義
// ============================================

interface GameStore {
  // 状態
  characters: Character[];
  party: Party;
  currentAdventure: Adventure | null;
  
  // キャラクター管理
  createCharacter: (
    name: string,
    race: RaceType,
    job: JobType,
    trait: TraitType,
    environment: EnvironmentType,
  ) => Character;
  deleteCharacter: (id: string) => void;
  
  // パーティ管理
  addToParty: (characterId: string, position: Position, slot: number) => void;
  removeFromParty: (position: Position, slot: number) => void;
  clearParty: () => void;
  
  // 冒険管理
  startAdventure: (dungeon: DungeonType) => void;
  completeAdventure: (result: Adventure['result']) => void;
  cancelAdventure: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      characters: [],
      party: {
        front: [null, null, null],
        back: [null, null, null],
      },
      currentAdventure: null,
      
      // キャラクター作成
      createCharacter: (name, race, job, trait, environment) => {
        const stats = calculateStats(race, job);
        const newCharacter: Character = {
          id: crypto.randomUUID(),
          name,
          race,
          job,
          trait,
          environment,
          stats,
        };
        
        set((state) => ({
          characters: [...state.characters, newCharacter],
        }));
        
        return newCharacter;
      },
      
      // キャラクター削除
      deleteCharacter: (id) => {
        set((state) => {
          // パーティからも削除
          const newParty = {
            front: state.party.front.map((c) => 
              c?.id === id ? null : c
            ),
            back: state.party.back.map((c) => 
              c?.id === id ? null : c
            ),
          };
          
          return {
            characters: state.characters.filter((c) => c.id !== id),
            party: newParty,
          };
        });
      },
      
      // パーティに追加
      addToParty: (characterId, position, slot) => {
        const character = get().characters.find((c) => c.id === characterId);
        if (!character) return;
        
        set((state) => {
          // 既にパーティにいる場合は削除
          const newFront = state.party.front.map((c) => 
            c?.id === characterId ? null : c
          );
          const newBack = state.party.back.map((c) => 
            c?.id === characterId ? null : c
          );
          
          // 新しい位置に追加
          const charWithPosition = { ...character, position };
          if (position === 'front') {
            newFront[slot] = charWithPosition;
          } else {
            newBack[slot] = charWithPosition;
          }
          
          return {
            party: { front: newFront, back: newBack },
          };
        });
      },
      
      // パーティから削除
      removeFromParty: (position, slot) => {
        set((state) => {
          const newParty = { ...state.party };
          if (position === 'front') {
            newParty.front = [...newParty.front];
            newParty.front[slot] = null;
          } else {
            newParty.back = [...newParty.back];
            newParty.back[slot] = null;
          }
          return { party: newParty };
        });
      },
      
      // パーティクリア
      clearParty: () => {
        set({
          party: {
            front: [null, null, null],
            back: [null, null, null],
          },
        });
      },
      
      // 冒険開始
      startAdventure: (dungeon) => {
        const { party } = get();
        const { dungeons } = require('@/lib/data/dungeons');
        const dungeonData = dungeons[dungeon];
        
        set({
          currentAdventure: {
            dungeon,
            party,
            startTime: Date.now(),
            duration: dungeonData.durationSeconds * 1000,
            status: 'inProgress',
          },
        });
      },
      
      // 冒険完了
      completeAdventure: (result) => {
        set((state) => ({
          currentAdventure: state.currentAdventure
            ? { ...state.currentAdventure, status: 'completed', result }
            : null,
        }));
      },
      
      // 冒険キャンセル
      cancelAdventure: () => {
        set({ currentAdventure: null });
      },
    }),
    {
      name: 'guild-adventure-storage',
    }
  )
);
