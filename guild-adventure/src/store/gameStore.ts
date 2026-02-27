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
  getMultiAdventure,
  claimMultiAdventure,
  clearMultiAdventure,
  getUserStatus,
  getRoom,
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
// 冒険復元ヘルパー（マルチ/ソロ分離）
// ============================================

interface RestoreContext {
  username: string;
  addItem: (itemId: string) => void;
  addHistory: (history: Omit<AdventureHistory, 'id' | 'completedAt'>) => Promise<void>;
  syncToServer: () => Promise<void>;
  setCurrentMultiRoom: (code: string | null) => void;
}

async function restoreMultiAdventureHelper(ctx: RestoreContext): Promise<boolean> {
  const { username, addItem, addHistory, syncToServer, setCurrentMultiRoom } = ctx;
  
  const multiAdventure = await getMultiAdventure(username);
  if (!multiAdventure || multiAdventure.claimed) return false;
  
  // ルーム情報を取得して時間経過をチェック
  const room = await getRoom(multiAdventure.roomCode);
  if (room && room.startTime) {
    const { dungeons } = require('@/lib/data/dungeons');
    const dungeonData = dungeons[multiAdventure.dungeonId];
    if (dungeonData) {
      const elapsed = Date.now() - room.startTime;
      const duration = dungeonData.durationSeconds * 1000;
      
      // まだ冒険時間が経過していない場合
      if (elapsed < duration) {
        console.log('[restoreMultiAdventure] multi adventure still in progress');
        setCurrentMultiRoom(multiAdventure.roomCode);
        return true; // 処理したがまだ進行中
      }
    }
  }

  // claimを試みる（レースコンディション防止）
  const claimResult = await claimMultiAdventure(username);
  if (!claimResult.success) {
    console.log('[restoreMultiAdventure] multiAdventure already claimed');
    return false;
  }
  
  // ドロップを受け取る
  let droppedItemId: string | undefined;
  if (claimResult.itemId) {
    droppedItemId = claimResult.itemId;
    addItem(claimResult.itemId);
    await syncToServer();
  }
  
  // 履歴に追加
  await addHistory({
    type: 'multi',
    dungeonId: multiAdventure.dungeonId,
    victory: multiAdventure.victory,
    droppedItemId,
    logs: multiAdventure.logs,
    roomCode: multiAdventure.roomCode,
    players: multiAdventure.players,
  });
  
  await clearMultiAdventure(username);
  return true;
}

interface SoloRestoreResult {
  adventure: ServerAdventure | null;
  droppedItemId?: string;
}

async function restoreSoloAdventureHelper(ctx: RestoreContext): Promise<SoloRestoreResult> {
  const { username, addItem, addHistory, syncToServer } = ctx;
  
  const adventure = await getAdventureOnServer(username);
  if (!adventure) return { adventure: null };
  
  const { dungeons } = require('@/lib/data/dungeons');
  const dungeonData = dungeons[adventure.dungeon];
  if (!dungeonData) {
    // 無効なダンジョン → クリア
    await clearAdventureOnServer(username);
    return { adventure: null };
  }
  
  const elapsed = Date.now() - adventure.startTime;
  const duration = dungeonData.durationSeconds * 1000;
  
  // 探索時間が終了している場合
  if (elapsed >= duration && !adventure.claimed) {
    let droppedItemId: string | undefined;
    if (adventure.battleResult?.victory) {
      const claimResult = await claimAdventureDrop(username);
      if (claimResult.success && claimResult.itemId) {
        droppedItemId = claimResult.itemId;
        addItem(claimResult.itemId);
        await syncToServer();
      }
    }
    
    await addHistory({
      type: 'solo',
      dungeonId: adventure.dungeon,
      victory: adventure.battleResult?.victory || false,
      droppedItemId,
      logs: adventure.battleResult?.logs || [],
    });
    
    await clearAdventureOnServer(username);
    return { adventure, droppedItemId };
  }
  
  return { adventure };
}

// ============================================
// マスタリー解放ヘルパー（共通ロジック）
// ============================================

type MasteryType = 'race' | 'job';

async function unlockMastery(
  get: () => GameStore,
  set: (fn: (state: GameStore) => Partial<GameStore>) => void,
  characterId: string,
  masteryType: MasteryType
): Promise<boolean> {
  const { characters, inventory } = get();
  const char = characters.find(c => c.id === characterId);
  
  const masteryKey = masteryType === 'race' ? 'raceMastery' : 'jobMastery';
  if (!char || char[masteryKey]) return false;
  
  // アイテムID: race→ticket_X, job→book_X
  const itemPrefix = masteryType === 'race' ? 'ticket' : 'book';
  const itemKey = masteryType === 'race' ? char.race : char.job;
  const itemId = `${itemPrefix}_${itemKey}`;
  
  if ((inventory[itemId] || 0) < 5) return false;
  
  // アイテム5枚消費 + マスタリー解放
  set((state) => ({
    inventory: {
      ...state.inventory,
      [itemId]: (state.inventory[itemId] || 0) - 5,
    },
    characters: state.characters.map(c =>
      c.id === characterId ? { ...c, [masteryKey]: true } : c
    ),
  }));
  
  await get().syncToServer();
  return true;
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
  currentMultiRoom: string | null; // マルチ冒険中のルームコード
  setCurrentMultiRoom: (code: string | null) => void;
  inventory: Record<string, number>;
  coins: number;
  history: AdventureHistory[];
  lastDroppedItem: string | null;
  _dataLoaded: boolean; // 初回データロード完了フラグ（persistしない）
  
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
  addCoins: (amount: number) => void;
  useItem: (itemId: string, count?: number) => boolean;
  getItemCount: (itemId: string) => number;
  
  // マスタリー解放
  unlockRaceMastery: (characterId: string) => Promise<boolean>;
  unlockJobMastery: (characterId: string) => Promise<boolean>;
  levelUpCharacter: (characterId: string) => Promise<{ success: boolean; newLevel?: number; skill?: string }>;
  
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
      currentMultiRoom: null,
      inventory: {},
      coins: 0,
      history: [],
      lastDroppedItem: null,
      _dataLoaded: false,
      
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
                coins: userData.coins || 0,
                history: userData.history || [],
                isLoading: false,
                _dataLoaded: true,
              });
              setStoredUsername(username);
              
              // 既存の探索を復元
              await get().restoreAdventure();
              
              // マルチ冒険中かチェック
              const status = await getUserStatus(username);
              if (status?.activity === 'multi' && status?.roomCode) {
                const room = await getRoom(status.roomCode);
                if (room && (room.status === 'battle' || room.status === 'waiting')) {
                  set({ currentMultiRoom: status.roomCode });
                }
              }
              
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
                _dataLoaded: true,
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
      
      
      // マルチルームコード設定
      setCurrentMultiRoom: (code) => set({ currentMultiRoom: code }),

      // ログアウト
      logout: () => {
        clearStoredUsername();
        set({
          isLoggedIn: false,
          _dataLoaded: false,
          username: null,
          characters: [],
          party: { front: [], back: [] },
          inventory: {},
          coins: 0,
          currentAdventure: null,
          currentMultiRoom: null,
        });
      },
      
      // 自動ログイン
      autoLogin: async () => {
        // 既にロード済みならスキップ（ページ遷移後の再呼び出し防止）
        if (get()._dataLoaded) return true;
        
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
                coins: userData.coins || 0,
              history: userData.history || [],
              isLoading: false,
            });
            // 既存の探索を復元
            await get().restoreAdventure();
            
            // マルチ冒険中かチェック
            const status = await getUserStatus(storedUsername);
            if (status?.activity === 'multi' && status?.roomCode) {
              const room = await getRoom(status.roomCode);
              if (room && (room.status === 'battle' || room.status === 'waiting')) {
                set({ currentMultiRoom: status.roomCode });
              }
            }
            
            set({ _dataLoaded: true });
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
        const { username, characters, party, inventory, coins } = get();
        if (!username) return;
        
        await saveUserData(username, {
          characters,
          party,
          inventory,
          coins,
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
      
      
      // コインを追加
      addCoins: (amount: number) => {
        set((state) => ({ coins: state.coins + amount }));
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
        return unlockMastery(get, set, characterId, 'race');
      },
      
      // 職業マスタリー解放（指南書5枚消費）
      unlockJobMastery: async (characterId: string): Promise<boolean> => {
        return unlockMastery(get, set, characterId, 'job');
      },
      
      
      // キャラクターレベルアップ
      levelUpCharacter: async (characterId: string): Promise<{ success: boolean; newLevel?: number; skill?: string }> => {
        const { characters, coins } = get();
        const character = characters.find(c => c.id === characterId);
        if (!character) return { success: false };
        
        const currentLevel = character.level || 1;
        if (currentLevel >= 5) return { success: false }; // 最大レベル
        
        // レベルアップコスト: Lv1→2: 100, Lv2→3: 200, Lv3→4: 300, Lv4→5: 400
        const cost = currentLevel * 100;
        if (coins < cost) return { success: false };
        
        const newLevel = currentLevel + 1;
        let skill: string | undefined;
        
        // Lv3, Lv5でスキル抽選
        if (newLevel === 3 || newLevel === 5) {
          // 種族か職業のスキルを50%ずつで抽選
          const isRaceSkill = Math.random() < 0.5;
          skill = isRaceSkill 
            ? `${character.race}_lv${newLevel}` 
            : `${character.job}_lv${newLevel}`;
        }
        
        // コイン消費
        set((state) => ({ coins: state.coins - cost }));
        
        // キャラクター更新
        set((state) => ({
          characters: state.characters.map(c => {
            if (c.id !== characterId) return c;
            return {
              ...c,
              level: newLevel,
              ...(newLevel === 3 ? { lv3Skill: skill } : {}),
              ...(newLevel === 5 ? { lv5Skill: skill } : {}),
            };
          }),
        }));
        
        await get().syncToServer();
        return { success: true, newLevel, skill };
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
            front: (state.party.front || []).map((c) => c?.id === id ? null : c),
            back: (state.party.back || []).map((c) => c?.id === id ? null : c),
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
          let newFront = (state.party.front || []).filter((c) => c?.id !== characterId);
          let newBack = (state.party.back || []).filter((c) => c?.id !== characterId);
          
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
            newParty.front = (state.party.front || []).filter((_, i) => i !== slot);
          } else {
            newParty.back = (state.party.back || []).filter((_, i) => i !== slot);
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
          const allChars = [...(party.front || []), ...(party.back || [])].filter((c): c is Character => c !== null);
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
          if (!username) return;
          
          const ctx: RestoreContext = {
            username,
            addItem: get().addItem,
            addHistory: get().addHistory,
            syncToServer: get().syncToServer,
            setCurrentMultiRoom: (code) => set({ currentMultiRoom: code }),
          };
          
          // マルチ冒険の復元（進行中ならここで終了）
          const multiRestored = await restoreMultiAdventureHelper(ctx);
          if (multiRestored) return;
          
          // ソロ冒険の復元
          const { adventure } = await restoreSoloAdventureHelper(ctx);
          if (!adventure) return;
          
          const { dungeons } = require('@/lib/data/dungeons');
          const dungeonData = dungeons[adventure.dungeon];
          const duration = dungeonData?.durationSeconds * 1000 || 0;
          const elapsed = Date.now() - adventure.startTime;
          
          // 復元（バトル結果も含む）
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
