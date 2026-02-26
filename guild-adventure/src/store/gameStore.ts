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
import { 
  getUserData, 
  saveUserData, 
  createUser, 
  userExists,
  getStoredUsername,
  setStoredUsername,
  clearStoredUsername,
} from '@/lib/firebase';
import { initialInventory } from '@/lib/data/items';

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
  const maxMp = baseStats.maxMp + (jobMods.maxMp || 0) + (traitMods.maxMp || 0) + (envMods.maxMp || 0);
  
  return {
    maxHp,
    hp: maxHp,
    maxMp,
    mp: maxMp,
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
  // 認証状態
  isLoggedIn: boolean;
  username: string | null;
  isLoading: boolean;
  
  // ゲーム状態
  characters: Character[];
  party: Party;
  currentAdventure: Adventure | null;
  inventory: Record<string, number>;
  lastDroppedItem: string | null; // 直近でドロップしたアイテム（表示用）
  
  // 認証
  login: (username: string) => Promise<{ success: boolean; isNew: boolean; error?: string }>;
  logout: () => void;
  autoLogin: () => Promise<boolean>;
  
  // キャラクター管理
  createCharacter: (
    name: string,
    race: RaceType,
    job: JobType,
    trait: TraitType,
    environment: EnvironmentType,
  ) => Promise<Character>;
  deleteCharacter: (id: string) => Promise<void>;
  
  // パーティ管理
  addToParty: (characterId: string, position: Position, slot: number) => Promise<void>;
  removeFromParty: (position: Position, slot: number) => Promise<void>;
  clearParty: () => Promise<void>;
  
  // 冒険管理
  startAdventure: (dungeon: DungeonType) => void;
  completeAdventure: (result: Adventure['result']) => void;
  cancelAdventure: () => void;
  
  // アイテム管理
  addItem: (itemId: string, count?: number) => void;
  useItem: (itemId: string, count?: number) => boolean;
  getItemCount: (itemId: string) => number;
  
  // マスタリー解放
  unlockRaceMastery: (characterId: string) => Promise<boolean>;
  unlockJobMastery: (characterId: string) => Promise<boolean>;
  
  // サーバー同期
  syncToServer: () => Promise<void>;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      isLoggedIn: false,
      username: null,
      isLoading: false,
      characters: [],
      party: {
        front: [null, null, null],
        back: [null, null, null],
      },
      currentAdventure: null,
      inventory: {},
      lastDroppedItem: null,
      
      // ログイン
      login: async (username: string) => {
        set({ isLoading: true });
        
        // ユーザー名のバリデーション
        if (!username || username.length < 2 || username.length > 20) {
          set({ isLoading: false });
          return { success: false, isNew: false, error: 'ユーザー名は2〜20文字で入力してください' };
        }
        
        // 使用不可文字チェック
        if (!/^[a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/.test(username)) {
          set({ isLoading: false });
          return { success: false, isNew: false, error: '使用できない文字が含まれています' };
        }
        
        try {
          const exists = await userExists(username);
          
          if (exists) {
            // 既存ユーザー: データを読み込み
            const userData = await getUserData(username);
            if (userData) {
              set({
                isLoggedIn: true,
                username,
                characters: userData.characters || [],
                party: userData.party || { front: [null, null, null], back: [null, null, null] },
                inventory: userData.inventory || {},
                isLoading: false,
              });
              setStoredUsername(username);
              return { success: true, isNew: false };
            }
          } else {
            // 新規ユーザー: 作成
            const created = await createUser(username);
            if (created) {
              set({
                isLoggedIn: true,
                username,
                characters: [],
                party: { front: [null, null, null], back: [null, null, null] },
                inventory: { ...initialInventory },
                isLoading: false,
              });
              setStoredUsername(username);
              return { success: true, isNew: true };
            }
          }
          
          set({ isLoading: false });
          return { success: false, isNew: false, error: 'サーバーエラーが発生しました' };
        } catch (e) {
          set({ isLoading: false });
          return { success: false, isNew: false, error: 'ネットワークエラーが発生しました' };
        }
      },
      
      // ログアウト
      logout: () => {
        clearStoredUsername();
        set({
          isLoggedIn: false,
          username: null,
          characters: [],
          party: { front: [null, null, null], back: [null, null, null] },
          inventory: {},
          currentAdventure: null,
        });
      },
      
      // 自動ログイン
      autoLogin: async () => {
        const storedUsername = getStoredUsername();
        if (!storedUsername) return false;
        
        // サーバーからデータを取得
        set({ isLoading: true });
        try {
          const userData = await getUserData(storedUsername);
          if (userData) {
            set({
              isLoggedIn: true,
              username: storedUsername,
              characters: userData.characters || [],
              party: userData.party || { front: [null, null, null], back: [null, null, null] },
              inventory: userData.inventory || {},
              isLoading: false,
            });
            return true;
          }
        } catch (e) {
          console.error('Auto login failed:', e);
        }
        
        // 失敗したらログアウト状態に
        clearStoredUsername();
        set({ isLoggedIn: false, username: null, isLoading: false });
        return false;
      },
      
      // サーバー同期
      syncToServer: async () => {
        const { username, characters, party, inventory } = get();
        if (!username) return;
        
        await saveUserData(username, {
          characters,
          party,
          inventory,
        });
      },
      
      // アイテムを追加
      addItem: (itemId: string, count: number = 1) => {
        set((state) => ({
          inventory: {
            ...state.inventory,
            [itemId]: (state.inventory[itemId] || 0) + count,
          },
          lastDroppedItem: itemId,
        }));
      },
      
      // アイテムを消費
      useItem: (itemId: string, count: number = 1): boolean => {
        const { inventory } = get();
        if ((inventory[itemId] || 0) < count) return false;
        
        set((state) => ({
          inventory: {
            ...state.inventory,
            [itemId]: (state.inventory[itemId] || 0) - count,
          },
        }));
        return true;
      },
      
      // アイテム所持数を取得
      getItemCount: (itemId: string): number => {
        return get().inventory[itemId] || 0;
      },
      
      // 種族マスタリー解放（チケット5枚消費）
      unlockRaceMastery: async (characterId: string): Promise<boolean> => {
        const { characters, inventory } = get();
        const char = characters.find(c => c.id === characterId);
        if (!char || char.raceMastery) return false;
        
        const ticketId = `ticket_${char.race}`;
        if ((inventory[ticketId] || 0) < 5) return false;
        
        // チケット5枚消費
        set((state) => ({
          inventory: {
            ...state.inventory,
            [ticketId]: (state.inventory[ticketId] || 0) - 5,
          },
          characters: state.characters.map(c =>
            c.id === characterId ? { ...c, raceMastery: true } : c
          ),
        }));
        
        await get().syncToServer();
        return true;
      },
      
      // 職業マスタリー解放（指南書5枚消費）
      unlockJobMastery: async (characterId: string): Promise<boolean> => {
        const { characters, inventory } = get();
        const char = characters.find(c => c.id === characterId);
        if (!char || char.jobMastery) return false;
        
        const bookId = `book_${char.job}`;
        if ((inventory[bookId] || 0) < 5) return false;
        
        // 指南書5枚消費
        set((state) => ({
          inventory: {
            ...state.inventory,
            [bookId]: (state.inventory[bookId] || 0) - 5,
          },
          characters: state.characters.map(c =>
            c.id === characterId ? { ...c, jobMastery: true } : c
          ),
        }));
        
        await get().syncToServer();
        return true;
      },
      
      // キャラクター作成
      createCharacter: async (name, race, job, trait, environment) => {
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
        
        // サーバーに同期
        await get().syncToServer();
        
        return newCharacter;
      },
      
      // キャラクター削除
      deleteCharacter: async (id) => {
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
        
        await get().syncToServer();
      },
      
      // パーティに追加
      addToParty: async (characterId, position, slot) => {
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
        
        await get().syncToServer();
      },
      
      // パーティから削除
      removeFromParty: async (position, slot) => {
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
        
        await get().syncToServer();
      },
      
      // パーティクリア
      clearParty: async () => {
        set({
          party: {
            front: [null, null, null],
            back: [null, null, null],
          },
        });
        
        await get().syncToServer();
      },
      
      // 冒険開始（ローカルのみ）
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
      partialize: (state) => ({
        // ローカルには認証情報のみ保存
        username: state.username,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
