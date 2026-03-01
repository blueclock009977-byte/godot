import { create } from 'zustand';
import {
  ChallengeProgress,
  ChallengeHistoryEntry,
  ChallengeRankingEntry,
  ChallengePartySlot,
  getChallengeProgress,
  saveChallengeProgress,
  getChallengeParty,
  saveChallengeParty,
  getChallengeHistory,
  addChallengeHistory,
  getChallengeRanking,
  updateChallengeRanking,
} from '@/lib/firebase';

// 8時間をミリ秒で
const COOLDOWN_MS = 8 * 60 * 60 * 1000;

interface ChallengeStore {
  // 状態
  progress: ChallengeProgress | null;
  party: ChallengePartySlot[];
  history: ChallengeHistoryEntry[];
  ranking: ChallengeRankingEntry[];
  isLoading: boolean;
  
  // 計算値
  canChallenge: () => boolean;
  getRemainingCooldown: () => number;  // 残りミリ秒
  
  // アクション
  loadData: (username: string) => Promise<void>;
  saveParty: (username: string, party: ChallengePartySlot[]) => Promise<void>;
  recordAttempt: (
    username: string,
    reachedFloor: number,
    defeatedAtFloor: number,
    earnedCoins: number,
    earnedBooks: number,
    earnedEquipments: number
  ) => Promise<void>;
  loadRanking: () => Promise<void>;
}

export const useChallengeStore = create<ChallengeStore>()((set, get) => ({
  // 初期状態
  progress: null,
  party: [],
  history: [],
  ranking: [],
  isLoading: false,
  
  // 挑戦可能かどうか
  canChallenge: () => {
    const { progress } = get();
    if (!progress) return true;  // 初回挑戦
    
    const elapsed = Date.now() - progress.lastAttemptTime;
    return elapsed >= COOLDOWN_MS;
  },
  
  // 残りクールダウン時間（ミリ秒）
  getRemainingCooldown: () => {
    const { progress } = get();
    if (!progress) return 0;
    
    const elapsed = Date.now() - progress.lastAttemptTime;
    const remaining = COOLDOWN_MS - elapsed;
    return Math.max(0, remaining);
  },
  
  // データをロード
  loadData: async (username: string) => {
    set({ isLoading: true });
    try {
      const [progress, party, history] = await Promise.all([
        getChallengeProgress(username),
        getChallengeParty(username),
        getChallengeHistory(username),
      ]);
      
      set({
        progress,
        party: party || [],
        history: history || [],
        isLoading: false,
      });
    } catch (e) {
      console.error('Failed to load challenge data:', e);
      set({ isLoading: false });
    }
  },
  
  // パーティを保存
  saveParty: async (username: string, party: ChallengePartySlot[]) => {
    set({ party });
    await saveChallengeParty(username, party);
  },
  
  // 挑戦結果を記録
  recordAttempt: async (
    username: string,
    reachedFloor: number,
    defeatedAtFloor: number,
    earnedCoins: number,
    earnedBooks: number,
    earnedEquipments: number
  ) => {
    const { progress } = get();
    
    // 進捗を更新
    const newProgress: ChallengeProgress = {
      highestFloor: Math.max(progress?.highestFloor || 0, reachedFloor),
      lastAttemptTime: Date.now(),
      totalAttempts: (progress?.totalAttempts || 0) + 1,
    };
    
    await saveChallengeProgress(username, newProgress);
    
    // ランキングを更新
    await updateChallengeRanking(username, reachedFloor);
    
    // 履歴を追加
    await addChallengeHistory(username, {
      attemptedAt: Date.now(),
      reachedFloor,
      defeatedAtFloor,
      earnedCoins,
      earnedBooks,
      earnedEquipments,
    });
    
    // ローカル状態を更新
    const newHistory = await getChallengeHistory(username);
    set({
      progress: newProgress,
      history: newHistory,
    });
  },
  
  // ランキングをロード
  loadRanking: async () => {
    const ranking = await getChallengeRanking();
    set({ ranking });
  },
}));
