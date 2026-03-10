'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthUser, onAuthChange, autoLogin, signOut } from '../lib/firebase/auth';
import { UserData, SavedMonster, createMonsterInstance, addMonster, updateParty, recordWin, recordLoss, hatchCurrentEgg, isEggReady, hasSelectedStarter, selectStarter as selectStarterFn } from '../lib/save/userData';
import { syncUserData, listenUserData, getLocalUserData, SyncStatus } from '../lib/save/sync';

export interface UseUserResult {
  // 認証状態
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  
  // ユーザーデータ
  userData: UserData | null;
  syncStatus: SyncStatus;
  
  // 御三家選択状態
  needsStarterSelection: boolean;
  
  // アクション
  login: () => Promise<void>;
  logout: () => Promise<void>;
  
  // 御三家選択
  selectStarter: (starterId: 'flameoo' | 'frosty' | 'gale_wing') => Promise<boolean>;
  
  // モンスター管理
  addNewMonster: (speciesId: string, nickname?: string) => Promise<SavedMonster | null>;
  setParty: (monsterIds: string[]) => Promise<void>;
  
  // 戦績
  reportWin: () => Promise<{
    eggResult: 'new' | 'shortened' | 'replaced';
    newRating: number;
    ratingChange: number;
  } | null>;
  reportLoss: () => Promise<{
    newRating: number;
    ratingChange: number;
  } | null>;
  
  // 卵
  canHatchEgg: boolean;
  hatchEgg: () => Promise<SavedMonster | null>;
  
  // データ更新
  refreshData: () => Promise<void>;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  
  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        // ログイン状態ならデータを同期
        setSyncStatus('syncing');
        try {
          const data = await syncUserData(authUser);
          setUserData(data);
          setSyncStatus('synced');
        } catch (error) {
          console.error('Failed to sync user data:', error);
          setSyncStatus('error');
          // ローカルデータがあれば使う
          const local = getLocalUserData();
          if (local) setUserData(local);
        }
      } else {
        setUserData(null);
        setSyncStatus('idle');
      }
      
      setIsLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  // Firebaseからのリアルタイム更新を監視
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = listenUserData(user.uid, (data) => {
      if (data) {
        setUserData(data);
      }
    });
    
    return unsubscribe;
  }, [user]);
  
  // ログイン
  const login = useCallback(async () => {
    setIsLoading(true);
    try {
      await autoLogin();
      // onAuthChangeが発火してデータ同期される
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  }, []);
  
  // ログアウト
  const logout = useCallback(async () => {
    try {
      await signOut();
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);
  
  // モンスター追加
  const addNewMonster = useCallback(async (
    speciesId: string, 
    nickname?: string
  ): Promise<SavedMonster | null> => {
    if (!user || !userData) return null;
    
    const monster = createMonsterInstance(speciesId, nickname);
    if (!monster) return null;
    
    try {
      const newData = await addMonster(user.uid, { ...userData }, monster);
      setUserData(newData);
      return monster;
    } catch (error) {
      console.error('Failed to add monster:', error);
      return null;
    }
  }, [user, userData]);
  
  // パーティ設定
  const setParty = useCallback(async (monsterIds: string[]) => {
    if (!user || !userData) return;
    
    try {
      const newData = await updateParty(user.uid, { ...userData }, monsterIds);
      setUserData(newData);
    } catch (error) {
      console.error('Failed to update party:', error);
    }
  }, [user, userData]);
  
  // 勝利記録
  const reportWin = useCallback(async (): Promise<{
    eggResult: 'new' | 'shortened' | 'replaced';
    newRating: number;
    ratingChange: number;
  } | null> => {
    if (!user || !userData) return null;
    
    const oldRating = userData.rating;
    try {
      const { userData: newData, eggResult } = await recordWin(user.uid, { ...userData });
      setUserData(newData);
      return {
        eggResult,
        newRating: newData.rating,
        ratingChange: newData.rating - oldRating,
      };
    } catch (error) {
      console.error('Failed to record win:', error);
      return null;
    }
  }, [user, userData]);
  
  // 敗北記録
  const reportLoss = useCallback(async (): Promise<{
    newRating: number;
    ratingChange: number;
  } | null> => {
    if (!user || !userData) return null;
    
    const oldRating = userData.rating;
    try {
      const newData = await recordLoss(user.uid, { ...userData });
      setUserData(newData);
      return {
        newRating: newData.rating,
        ratingChange: newData.rating - oldRating,
      };
    } catch (error) {
      console.error('Failed to record loss:', error);
      return null;
    }
  }, [user, userData]);
  
  // データ再取得
  const refreshData = useCallback(async () => {
    if (!user) return;
    
    setSyncStatus('syncing');
    try {
      const data = await syncUserData(user);
      setUserData(data);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setSyncStatus('error');
    }
  }, [user]);
  
  // 卵孵化可能か
  const canHatchEgg = userData ? isEggReady(userData) : false;
  
  // 卵を孵化
  const hatchEgg = useCallback(async (): Promise<SavedMonster | null> => {
    if (!user || !userData) return null;
    
    try {
      const { userData: newData, newMonster } = await hatchCurrentEgg(user.uid, { ...userData });
      setUserData(newData);
      return newMonster;
    } catch (error) {
      console.error('Failed to hatch egg:', error);
      return null;
    }
  }, [user, userData]);
  
  // ログイン状態の計算
  const isLoggedIn = !!user;
  
  // 御三家選択が必要か
  const needsStarterSelection = isLoggedIn && userData !== null && !hasSelectedStarter(userData);
  
  // 御三家を選択
  const selectStarter = useCallback(async (
    starterId: 'flameoo' | 'frosty' | 'gale_wing'
  ): Promise<boolean> => {
    if (!user || !userData) return false;
    
    try {
      const newData = await selectStarterFn(user.uid, { ...userData }, starterId);
      setUserData(newData);
      return true;
    } catch (error) {
      console.error('Failed to select starter:', error);
      return false;
    }
  }, [user, userData]);
  
  return {
    user,
    isLoading,
    isLoggedIn,
    userData,
    syncStatus,
    needsStarterSelection,
    login,
    logout,
    selectStarter,
    addNewMonster,
    setParty,
    reportWin,
    reportLoss,
    canHatchEgg,
    hatchEgg,
    refreshData,
  };
}
