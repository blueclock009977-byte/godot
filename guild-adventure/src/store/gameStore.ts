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
import { traits } from '@/lib/data/traits';
import { environments } from '@/lib/data/environments';

// ============================================
// ステータス計算
// ============================================

function calculateStats(
  race: RaceType,
  job: JobType,
  trait: TraitType,
  environment: EnvironmentType,
): Stats {
  const raceData = races[race];
  const jobData = jobs[job];
  const traitData = traits[trait];
  const envData = environments[environment];
  
  const baseStats = raceData.baseStats;
  const jobMods = jobData.statModifiers;
  const traitMods = traitData.statModifiers || {};
  const envMods = envData.statModifiers || {};
  
  const maxHp = baseStats.maxHp + (jobMods.maxHp || 0) + (traitMods.maxHp || 0) + (envMods.maxHp || 0);
  
  return {
    maxHp,
    hp: maxHp,
    atk: baseStats.atk + (jobMods.atk || 0) + (traitMods.atk || 0) + (envMods.atk || 0),
    def: baseStats.def + (jobMods.def || 0) + (traitMods.def || 0) + (envMods.def || 0),
    agi: baseStats.agi + (jobMods.agi || 0) + (traitMods.agi || 0) + (envMods.agi || 0),
    mag: baseStats.mag + (jobMods.mag || 0) + (traitMods.mag || 0) + (envMods.mag || 0),
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
        const stats = calculateStats(race, job, trait, environment);
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
