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
  addAdventureHistory,
  AdventureHistory,
  startAdventureOnServer,
  clearAdventureOnServer,
  getAdventureOnServer,
  claimAdventureDrop,
  ServerAdventure,
} from '@/lib/firebase';
import { initialInventory } from '@/lib/data/items';
import { runBattle, rollDrop } from '@/lib/battle/engine';

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
  history: AdventureHistory[];
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
  startAdventure: (dungeon: DungeonType) => Promise<{ success: boolean; error?: string }>;
  completeAdventure: (result: Adventure['result']) => Promise<void>;
  cancelAdventure: () => Promise<void>;
  restoreAdventure: () => Promise<void>;
  
  // アイテム管理
  addItem: (itemId: string, count?: number) => void;
  useItem: (itemId: string, count?: number) => boolean;
  getItemCount: (itemId: string) => number;
  
  // マスタリー解放
  unlockRaceMastery: (characterId: string) => Promise<boolean>;
  unlockJobMastery: (characterId: string) => Promise<boolean>;
  
  // 履歴管理
  addHistory: (history: Omit<AdventureHistory, 'id' | 'completedAt'>) => Promise<void>;
  
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
      party: { front: [], back: [] },
      currentAdventure: null,
      inventory: {},
      history: [],
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
                party: userData.party || { front: [], back: [] },
                inventory: userData.inventory || {},
                history: userData.history || [],
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
                party: { front: [], back: [] },
                history: [],
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
          party: { front: [], back: [] },
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
              party: userData.party || { front: [], back: [] },
              inventory: userData.inventory || {},
              history: userData.history || [],
              isLoading: false,
            });
            // 既存の探索を復元
            await get().restoreAdventure();
            console.log('[autoLogin] after restoreAdventure, currentAdventure:', get().currentAdventure);
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
      
      // 履歴を追加
      addHistory: async (historyData) => {
        const { username } = get();
        if (!username) return;
        
        const history: AdventureHistory = {
          ...historyData,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          completedAt: Date.now(),
        };
        
        // ローカル状態を更新
        set((state) => ({
          history: [history, ...state.history].slice(0, 20),
        }));
        
        // Firebaseに保存
        await addAdventureHistory(username, history);
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
          const newParty = {
            front: state.party.front.map((c) => c?.id === id ? null : c),
            back: state.party.back.map((c) => c?.id === id ? null : c),
          };
          
          return {
            characters: state.characters.filter((c) => c.id !== id),
            party: newParty,
          };
        });
        
        await get().syncToServer();
      },
      
      // パーティに追加（可変長、枠数制限なし）
      addToParty: async (characterId, position, slot) => {
        const character = get().characters.find((c) => c.id === characterId);
        if (!character) return;
        
        set((state) => {
          // 既にパーティにいる場合は削除
          let newFront = state.party.front.filter((c) => c?.id !== characterId);
          let newBack = state.party.back.filter((c) => c?.id !== characterId);
          
          // 新しい位置に追加
          const charWithPosition = { ...character, position };
          if (position === 'front') {
            newFront = [...newFront, charWithPosition];
          } else {
            newBack = [...newBack, charWithPosition];
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
            newParty.front = state.party.front.filter((_, i) => i !== slot);
          } else {
            newParty.back = state.party.back.filter((_, i) => i !== slot);
          }
          return { party: newParty };
        });
        
        await get().syncToServer();
      },
      
      // パーティクリア
      clearParty: async () => {
        set({
          party: { front: [], back: [] },
        });
        
        await get().syncToServer();
      },
      
      // 冒険開始（バトル計算+ドロップ抽選→サーバー保存）
      startAdventure: async (dungeon) => {
        const { party, username } = get();
        if (!username) return { success: false, error: 'ログインしてください' };
        
        const { dungeons } = require('@/lib/data/dungeons');
        const dungeonData = dungeons[dungeon];
        
        // バトル計算（開始時に結果を決定）
        const battleResult = runBattle(party, dungeon);
        
        // ドロップ抽選（勝利時のみ）
        let droppedItemId: string | undefined;
        if (battleResult.victory) {
          const allChars = [...party.front, ...party.back].filter((c): c is Character => c !== null);
          droppedItemId = rollDrop(dungeon, allChars);
        }
        
        // バトル結果にドロップを含める
        battleResult.droppedItemId = droppedItemId;
        
        // サーバーに探索開始を記録（バトル結果+ドロップ含む）
        const result = await startAdventureOnServer(username, dungeon, party, battleResult, droppedItemId);
        if (!result.success) {
          if (result.existingAdventure) {
            return { success: false, error: '別の端末で探索中です。そちらを完了してください。' };
          }
          return { success: false, error: 'サーバーエラー。再試行してください。' };
        }
        
        set({
          currentAdventure: {
            dungeon,
            party,
            startTime: Date.now(),
            duration: dungeonData.durationSeconds * 1000,
            status: 'inProgress',
            result: battleResult, // バトル結果も保持
          },
        });
        
        return { success: true };
      },
      
      // 冒険完了
      completeAdventure: async (result) => {
        const { username } = get();
        
        set((state) => ({
          currentAdventure: state.currentAdventure
            ? { ...state.currentAdventure, status: 'completed', result }
            : null,
        }));
        
        // サーバーから探索状態を削除
        if (username) {
          await clearAdventureOnServer(username);
        }
      },
      
      // 冒険キャンセル
      cancelAdventure: async () => {
        const { username } = get();
        set({ currentAdventure: null });
        
        // サーバーからも削除
        if (username) {
          await clearAdventureOnServer(username);
        }
      },
      
      // 既存の探索を復元（ログイン時に呼ぶ）
      restoreAdventure: async () => {
        try {
        const { username } = get();
        console.log('[restoreAdventure] username:', username);
        if (!username) return;
        
        const adventure = await getAdventureOnServer(username);
        console.log('[restoreAdventure] adventure:', adventure);
        if (!adventure) return;
        
        const { dungeons } = require('@/lib/data/dungeons');
        const dungeonData = dungeons[adventure.dungeon];
        console.log('[restoreAdventure] dungeonData:', dungeonData?.id);
        if (!dungeonData) {
          // 無効なダンジョン → クリア
          console.log('[restoreAdventure] invalid dungeon, clearing');
          await clearAdventureOnServer(username);
          return;
        }
        
        // 探索時間チェック
        const elapsed = Date.now() - adventure.startTime;
        const duration = dungeonData.durationSeconds * 1000;
        console.log('[restoreAdventure] elapsed:', elapsed, 'duration:', duration);
        
        // 探索時間が終了している場合
        if (elapsed >= duration) {
          console.log('[restoreAdventure] adventure completed, claimed:', adventure.claimed);
          
          // まだドロップを受け取ってない場合は受け取る
          if (!adventure.claimed) {
            let droppedItemId: string | undefined;
            if (adventure.battleResult?.victory) {
              const claimResult = await claimAdventureDrop(username);
              console.log('[restoreAdventure] claimed drop:', claimResult);
              if (claimResult.success && claimResult.itemId) {
                droppedItemId = claimResult.itemId;
                get().addItem(claimResult.itemId);
                await get().syncToServer();
              }
            }
            
            // 履歴に追加
            await get().addHistory({
              type: 'solo',
              dungeonId: adventure.dungeon,
              victory: adventure.battleResult?.victory || false,
              droppedItemId,
              logs: adventure.battleResult?.logs || [],
            });
          }
          
          // 完了後はサーバーからクリア（ドロップと履歴は既に処理済み）
          // でもcurrentAdventureは復元して結果を見れるようにする
          console.log('[restoreAdventure] adventure done, clearing server state but keeping local');
          await clearAdventureOnServer(username);
        }
        
        // 復元（バトル結果も含む）
        console.log('[restoreAdventure] restoring adventure');
        set({
          currentAdventure: {
            dungeon: adventure.dungeon as DungeonType,
            party: adventure.party,
            startTime: adventure.startTime,
            duration,
            status: elapsed >= duration ? 'completed' : 'inProgress',
            result: adventure.battleResult,
          },
        });
        console.log('[restoreAdventure] after set, currentAdventure:', get().currentAdventure);
        } catch (e) {
          console.error('[restoreAdventure] error:', e);
        }
      },
    }),
    {
      name: 'guild-adventure-storage',
      partialize: (state) => ({
        // ローカルには認証情報のみ保存
        username: state.username,
        isLoggedIn: state.isLoggedIn,
      }),
      // rehydrate時に現在のstateを保持（currentAdventureを上書きしない）
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as object),
      }),
    }
  )
);
