'use client';

import { create } from 'zustand';
import { UserData, CharacterStats, IdleResult, SkillEffect } from '@/lib/types';
import { getUserData, saveUserData, createNewUser } from '@/lib/firebase';
import { getEquipmentById } from '@/lib/data/equipments';
import { getSkillById } from '@/lib/data/skills';

interface GameStore {
  // 状態
  userData: UserData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  idleResult: IdleResult | null;
  
  // アクション
  login: (username: string) => Promise<boolean>;
  logout: () => void;
  syncToServer: () => Promise<void>;
  
  // 装備
  equipItem: (itemId: string) => void;
  unequipItem: (type: 'weapon' | 'armor' | 'accessory') => void;
  
  // スキル
  equipSkill: (skillId: string, slot: number) => void;
  unequipSkill: (slot: number) => void;
  
  // 放置計算
  calculateIdleProgress: () => IdleResult | null;
  clearIdleResult: () => void;
  
  // ステータス計算
  getTotalStats: () => CharacterStats;
  getSkillEffects: () => SkillEffect;
  
  // 進行
  updateLastActive: () => void;
}

export const useGameStore = create<GameStore>()((set, get) => ({
  userData: null,
  isLoggedIn: false,
  isLoading: true,
  idleResult: null,
  
  login: async (username: string) => {
    set({ isLoading: true });
    
    // Firebaseからデータ取得
    let data = await getUserData(username);
    
    if (!data) {
      // 新規ユーザー作成
      data = createNewUser(username);
      await saveUserData(username, data);
    }
    
    // 放置進行を計算
    const now = Date.now();
    const elapsed = now - data.lastActiveAt;
    
    set({ userData: data, isLoggedIn: true, isLoading: false });
    
    // 放置時間が1分以上あれば進行計算
    if (elapsed > 60 * 1000) {
      const result = get().calculateIdleProgress();
      if (result) {
        set({ idleResult: result });
      }
    }
    
    // 最終アクティブ更新
    get().updateLastActive();
    
    // localStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('idle-dungeon-username', username);
    }
    
    return true;
  },
  
  logout: () => {
    set({ userData: null, isLoggedIn: false, idleResult: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('idle-dungeon-username');
    }
  },
  
  syncToServer: async () => {
    const { userData } = get();
    if (!userData) return;
    await saveUserData(userData.username, userData);
  },
  
  equipItem: (itemId: string) => {
    const { userData } = get();
    if (!userData) return;
    
    const equipment = getEquipmentById(itemId);
    if (!equipment) return;
    
    const newData = { ...userData };
    
    switch (equipment.type) {
      case 'weapon':
        newData.equippedWeapon = itemId;
        break;
      case 'armor':
        newData.equippedArmor = itemId;
        break;
      case 'accessory':
        newData.equippedAccessory = itemId;
        break;
    }
    
    set({ userData: newData });
    get().syncToServer();
  },
  
  unequipItem: (type: 'weapon' | 'armor' | 'accessory') => {
    const { userData } = get();
    if (!userData) return;
    
    const newData = { ...userData };
    
    switch (type) {
      case 'weapon':
        newData.equippedWeapon = null;
        break;
      case 'armor':
        newData.equippedArmor = null;
        break;
      case 'accessory':
        newData.equippedAccessory = null;
        break;
    }
    
    set({ userData: newData });
    get().syncToServer();
  },
  
  equipSkill: (skillId: string, slot: number) => {
    const { userData } = get();
    if (!userData || slot < 0 || slot > 3) return;
    
    const newSkills = [...userData.equippedSkills];
    // 既に装備していたら外す
    const existingSlot = newSkills.indexOf(skillId);
    if (existingSlot >= 0) {
      newSkills[existingSlot] = '';
    }
    newSkills[slot] = skillId;
    
    set({ userData: { ...userData, equippedSkills: newSkills } });
    get().syncToServer();
  },
  
  unequipSkill: (slot: number) => {
    const { userData } = get();
    if (!userData || slot < 0 || slot > 3) return;
    
    const newSkills = [...userData.equippedSkills];
    newSkills[slot] = '';
    
    set({ userData: { ...userData, equippedSkills: newSkills } });
    get().syncToServer();
  },
  
  calculateIdleProgress: () => {
    const { userData, getTotalStats, getSkillEffects } = get();
    if (!userData) return null;
    
    const now = Date.now();
    const elapsed = Math.min(now - userData.lastActiveAt, 8 * 60 * 60 * 1000); // 最大8時間
    const elapsedSeconds = Math.floor(elapsed / 1000);
    
    if (elapsedSeconds < 60) return null;
    
    const stats = getTotalStats();
    const effects = getSkillEffects();
    
    // 放置シミュレーション
    let currentFloor = userData.currentFloor;
    let playerHp = stats.hp;
    let earnedExp = 0;
    let earnedCoins = 0;
    const droppedEquipment: string[] = [];
    const droppedSkills: string[] = [];
    
    // 1分あたり1戦闘として計算
    const battles = Math.floor(elapsedSeconds / 60);
    
    for (let i = 0; i < battles; i++) {
      // 簡易戦闘シミュレーション
      const floorDifficulty = currentFloor * 2;
      const playerPower = stats.atk + stats.def;
      
      // 勝率計算（装備・レベル依存）
      const winChance = Math.min(90, 50 + (playerPower - floorDifficulty));
      
      if (Math.random() * 100 < winChance) {
        // 勝利
        earnedExp += 10 + currentFloor * 3;
        earnedCoins += 5 + currentFloor;
        
        // ドロップ判定（10%）
        if (Math.random() < 0.1) {
          droppedEquipment.push('iron_sword'); // 簡易: 固定ドロップ（後で改善）
        }
        
        // スキルドロップ（5%）
        if (Math.random() < 0.05) {
          droppedSkills.push('crit_rate_1');
        }
        
        currentFloor++;
        
        // HP回復
        const regen = effects.hpRegen || 0;
        playerHp = Math.min(stats.maxHp, playerHp + Math.floor(stats.maxHp * regen / 100));
      } else {
        // 敗北
        playerHp -= Math.floor(floorDifficulty * 0.5);
        
        if (playerHp <= 0) {
          // 死亡 → 階層リセット
          playerHp = stats.maxHp;
          // currentFloorはそのまま（死んだ階からやり直し）
          break;
        }
      }
    }
    
    // レベルアップ処理
    const newData = { ...userData };
    const expForLevel = (lv: number) => lv * 100;
    
    let totalExp = newData.character.exp + earnedExp;
    while (totalExp >= expForLevel(newData.character.level)) {
      totalExp -= expForLevel(newData.character.level);
      newData.character.level++;
      newData.character.maxHp += 10;
      newData.character.atk += 2;
      newData.character.def += 1;
    }
    newData.character.exp = totalExp;
    newData.character.hp = playerHp;
    
    // 最高階層更新
    newData.highestFloor = Math.max(newData.highestFloor, currentFloor);
    newData.currentFloor = currentFloor;
    newData.coins += earnedCoins;
    
    // ドロップをインベントリに追加
    newData.inventory = [...newData.inventory, ...droppedEquipment];
    newData.skillInventory = [...newData.skillInventory, ...droppedSkills];
    
    set({ userData: newData });
    get().syncToServer();
    
    return {
      startFloor: userData.currentFloor,
      endFloor: currentFloor,
      droppedEquipment,
      droppedSkills,
      earnedExp,
      earnedCoins,
      elapsedSeconds,
    };
  },
  
  clearIdleResult: () => {
    set({ idleResult: null });
  },
  
  getTotalStats: () => {
    const { userData } = get();
    if (!userData) {
      return { level: 1, exp: 0, maxHp: 100, hp: 100, atk: 10, def: 5, spd: 10 };
    }
    
    const base = { ...userData.character };
    
    // 装備ボーナス
    const weapon = userData.equippedWeapon ? getEquipmentById(userData.equippedWeapon) : null;
    const armor = userData.equippedArmor ? getEquipmentById(userData.equippedArmor) : null;
    const accessory = userData.equippedAccessory ? getEquipmentById(userData.equippedAccessory) : null;
    
    if (weapon) {
      base.atk += weapon.atk || 0;
      base.def += weapon.def || 0;
      base.maxHp += weapon.hp || 0;
    }
    if (armor) {
      base.atk += armor.atk || 0;
      base.def += armor.def || 0;
      base.maxHp += armor.hp || 0;
    }
    if (accessory) {
      base.atk += accessory.atk || 0;
      base.def += accessory.def || 0;
      base.maxHp += accessory.hp || 0;
    }
    
    return base;
  },
  
  getSkillEffects: () => {
    const { userData } = get();
    if (!userData) return {};
    
    const effects: SkillEffect = {};
    
    userData.equippedSkills.forEach(skillId => {
      if (!skillId) return;
      const skill = getSkillById(skillId);
      if (!skill) return;
      
      Object.entries(skill.effect).forEach(([key, value]) => {
        const k = key as keyof SkillEffect;
        effects[k] = (effects[k] || 0) + (value || 0);
      });
    });
    
    return effects;
  },
  
  updateLastActive: () => {
    const { userData } = get();
    if (!userData) return;
    
    set({ userData: { ...userData, lastActiveAt: Date.now() } });
    get().syncToServer();
  },
}));
