'use client';

import { create } from 'zustand';
import { UserData, CharacterStats, IdleResult, SkillEffect, BattleHistoryEntry, Statistics, AchievementProgress, IdleEvent, MilestoneProgress } from '@/lib/types';
import { getUserData, saveUserData, createNewUser } from '@/lib/firebase';
import { getEquipmentById, getRandomEquipment } from '@/lib/data/equipments';
import { getSkillById } from '@/lib/data/skills';
import { selectRandomEnemy, selectBoss, calculateEnemyStats, isBossFloor } from '@/data/enemies';
import { checkNewAchievements, getAchievementById, ACHIEVEMENTS } from '@/lib/data/achievements';
import { checkNewMilestones, getMilestoneById, MILESTONES } from '@/lib/data/milestones';
import { updateChallengeProgress, isNewWeek, generateWeeklyChallenges, getWeekStartDate } from '@/lib/data/weeklyChallenge';
import { WeeklyChallengeEntry } from '@/lib/types';

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
  
  // 戦闘報酬
  addCoins: (amount: number) => void;
  addExp: (amount: number) => void;
  advanceFloor: () => void;
  addEquipmentToInventory: (itemId: string) => void;
  resetFloorAndHeal: () => void;
  healHp: (percent: number) => void;  // HP回復（%）
  
  // ポーション
  buyPotion: () => boolean;  // 購入成功ならtrue
  usePotion: () => boolean;  // 使用成功ならtrue
  getPotionCount: () => number;
  
  // 統計・履歴
  getStatistics: () => Statistics;
  getBattleHistory: () => BattleHistoryEntry[];
  addBattleHistoryEntry: (entry: Omit<BattleHistoryEntry, 'id' | 'timestamp'>) => void;
  recordKill: (isBoss: boolean) => void;
  recordDeath: () => void;
  recordFloorClear: (floor: number) => void;
  recordPotionUse: () => void;
  
  // 実績
  checkAndUnlockAchievements: () => string[];  // 新規解除された実績IDを返す
  claimAchievementReward: (achievementId: string) => boolean;
  getAchievementProgress: () => Record<string, AchievementProgress>;
  
  // マイルストーン
  checkAndShowNewMilestones: () => string[];  // 受取可能なマイルストーンIDを返す
  claimMilestoneReward: (milestoneId: string) => boolean;
  getMilestoneProgress: () => Record<string, MilestoneProgress>;
  
  // プレイ時間
  getTotalPlayTime: () => number;  // 累計プレイ時間（秒）
  getCurrentSessionTime: () => number;  // 現在セッションのプレイ時間（秒）
  updatePlayTime: () => void;  // プレイ時間を更新
  
  // 放置効率
  getIdleEfficiencyBonus: () => { coins: number; exp: number; drop: number };
  
  // ウィークリーチャレンジ
  updateWeeklyChallenge: (type: WeeklyChallengeEntry['type'], amount: number) => void;
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
    const { userData, getTotalStats, getSkillEffects, getIdleEfficiencyBonus } = get();
    if (!userData) return null;
    
    const now = Date.now();
    const elapsed = Math.min(now - userData.lastActiveAt, 8 * 60 * 60 * 1000); // 最大8時間
    const elapsedSeconds = Math.floor(elapsed / 1000);
    
    if (elapsedSeconds < 60) return null;
    
    const stats = getTotalStats();
    const effects = getSkillEffects();
    const efficiency = getIdleEfficiencyBonus();
    
    // スキル効果を適用
    const atkBonus = 1 + (effects.atkPercent || 0) / 100;
    const defBonus = 1 + (effects.defPercent || 0) / 100;
    const critRate = effects.critRate || 0;
    const critDamage = 150 + (effects.critDamage || 0);
    const dodgeRate = effects.dodgeRate || 0;
    
    const playerAtk = Math.floor(stats.atk * atkBonus);
    const playerDef = Math.floor(stats.def * defBonus);
    
    // 放置シミュレーション
    let currentFloor = userData.currentFloor;
    let playerHp = stats.hp;
    let earnedExp = 0;
    let earnedCoins = 0;
    const droppedEquipment: string[] = [];
    const droppedSkills: string[] = [];
    
    // 詳細イベントログ
    const events: IdleEvent[] = [];
    let floorsCleared = 0;
    let enemiesKilled = 0;
    let bossesKilled = 0;
    let deaths = 0;
    const startLevel = userData.character.level;
    
    // 1分あたり1フロアとして計算
    const floors = Math.floor(elapsedSeconds / 60);
    
    for (let i = 0; i < floors; i++) {
      const isBoss = isBossFloor(currentFloor);
      const enemiesPerFloor = isBoss ? 1 : 5 + Math.floor(currentFloor / 5) * 2;
      const relativeTime = i * 60; // 相対時間（秒）
      
      // このフロアの戦闘シミュレーション
      let floorCleared = true;
      
      for (let enemyIdx = 0; enemyIdx < enemiesPerFloor; enemyIdx++) {
        // 敵タイプを選択してステータスを計算
        const enemyType = isBoss ? selectBoss(currentFloor) : selectRandomEnemy(currentFloor);
        const enemyStats = calculateEnemyStats(enemyType, currentFloor);
        let enemyHp = enemyStats.hp;
        
        // 戦闘シミュレーション（簡略化: ターン制）
        const maxTurns = 20; // 無限ループ防止
        for (let turn = 0; turn < maxTurns && enemyHp > 0 && playerHp > 0; turn++) {
          // プレイヤー攻撃
          const isCrit = Math.random() * 100 < critRate;
          const dmgMultiplier = isCrit ? critDamage / 100 : 1;
          const playerDamage = Math.floor(playerAtk * dmgMultiplier);
          enemyHp -= playerDamage;
          
          if (enemyHp <= 0) {
            enemiesKilled++;
            if (isBoss) bossesKilled++;
            break;
          }
          
          // 敵攻撃（回避判定）
          const dodged = Math.random() * 100 < dodgeRate;
          if (!dodged) {
            const enemyDamage = Math.max(1, enemyStats.atk - playerDef);
            playerHp -= enemyDamage;
          }
        }
        
        if (playerHp <= 0) {
          // 敗北
          floorCleared = false;
          deaths++;
          events.push({
            type: 'death',
            floor: currentFloor,
            message: `${currentFloor}階で倒れた...`,
            timestamp: relativeTime,
          });
          playerHp = stats.maxHp; // 回復してやり直し
          break;
        }
      }
      
      if (floorCleared) {
        floorsCleared++;
        
        // 基本報酬（効率ボーナス適用）
        const baseExp = 10 + currentFloor * 3;
        const baseCoins = 5 + currentFloor * 2;
        const floorExp = Math.floor(baseExp * (1 + efficiency.exp / 100));
        let floorCoins = Math.floor(baseCoins * (1 + efficiency.coins / 100));
        
        earnedExp += floorExp;
        earnedCoins += floorCoins;
        
        // ボス報酬
        if (isBoss) {
          const bossCoins = Math.floor((50 + currentFloor * 10) * (1 + efficiency.coins / 100));
          earnedCoins += bossCoins;
          events.push({
            type: 'boss_kill',
            floor: currentFloor,
            message: `${currentFloor}階のボスを撃破！(+${bossCoins}💰)`,
            timestamp: relativeTime,
          });
        }
        
        // ドロップ判定（ボス20%, 通常10% + 効率ボーナス）
        const baseDropChance = isBoss ? 0.2 : 0.1;
        const dropChance = baseDropChance * (1 + efficiency.drop / 100);
        if (Math.random() < dropChance) {
          const equipment = getRandomEquipment(currentFloor);
          droppedEquipment.push(equipment.id);
          events.push({
            type: 'equipment_drop',
            floor: currentFloor,
            message: `${equipment.name}をゲット！`,
            timestamp: relativeTime,
          });
        }
        
        // スキルドロップ（ボス10%, 通常5% + 効率ボーナス）
        const baseSkillDropChance = isBoss ? 0.1 : 0.05;
        const skillDropChance = baseSkillDropChance * (1 + efficiency.drop / 100);
        if (Math.random() < skillDropChance) {
          // ランダムスキル選択（放置効率スキルも含む）
          const skillPool = [
            'crit_rate_1', 'crit_damage_1', 'dodge_1', 'atk_percent_1', 'def_percent_1', 'hp_regen_1',
            'idle_coins_1', 'idle_exp_1', 'idle_drop_1'
          ];
          const skillId = skillPool[Math.floor(Math.random() * skillPool.length)];
          droppedSkills.push(skillId);
          const skill = getSkillById(skillId);
          events.push({
            type: 'skill_drop',
            floor: currentFloor,
            message: `スキル「${skill?.name || skillId}」をゲット！`,
            timestamp: relativeTime,
          });
        }
        
        // HP回復（スキル効果）
        const regen = effects.hpRegen || 0;
        playerHp = Math.min(stats.maxHp, playerHp + Math.floor(stats.maxHp * regen / 100));
        
        // 5階ごとにフロアクリアイベントを記録
        if (currentFloor % 5 === 0) {
          events.push({
            type: 'floor_clear',
            floor: currentFloor,
            message: `${currentFloor}階をクリア！`,
            timestamp: relativeTime,
          });
        }
        
        currentFloor++;
      }
    }
    
    // レベルアップ処理
    const newData = { ...userData };
    const expForLevel = (lv: number) => lv * 100;
    
    let totalExp = newData.character.exp + earnedExp;
    let levelsGained = 0;
    while (totalExp >= expForLevel(newData.character.level)) {
      totalExp -= expForLevel(newData.character.level);
      newData.character.level++;
      newData.character.maxHp += 10;
      newData.character.atk += 2;
      newData.character.def += 1;
      levelsGained++;
    }
    newData.character.exp = totalExp;
    newData.character.hp = playerHp;
    
    // レベルアップイベント記録
    if (levelsGained > 0) {
      events.push({
        type: 'level_up',
        message: `レベルアップ！Lv.${startLevel} → Lv.${newData.character.level}`,
        timestamp: elapsedSeconds,
      });
    }
    
    // 最高階層更新
    newData.highestFloor = Math.max(newData.highestFloor, currentFloor);
    newData.currentFloor = currentFloor;
    newData.coins += earnedCoins;
    
    // ドロップをインベントリに追加
    newData.inventory = [...newData.inventory, ...droppedEquipment];
    newData.skillInventory = [...newData.skillInventory, ...droppedSkills];
    
    // 統計更新
    const statsUpdate = newData.statistics ?? {
      totalKills: 0,
      totalBossKills: 0,
      totalCoinsEarned: 0,
      totalFloorsCleared: 0,
      totalDeaths: 0,
      totalPotionsUsed: 0,
      totalPlayTimeSeconds: 0,
      totalExpEarned: 0,
    };
    newData.statistics = {
      ...statsUpdate,
      totalKills: statsUpdate.totalKills + enemiesKilled,
      totalBossKills: statsUpdate.totalBossKills + bossesKilled,
      totalCoinsEarned: statsUpdate.totalCoinsEarned + earnedCoins,
      totalFloorsCleared: statsUpdate.totalFloorsCleared + floorsCleared,
      totalDeaths: statsUpdate.totalDeaths + deaths,
      totalExpEarned: statsUpdate.totalExpEarned + earnedExp,
      totalPlayTimeSeconds: statsUpdate.totalPlayTimeSeconds + elapsedSeconds,
    };
    
    set({ userData: newData });
    get().syncToServer();
    
    // 効率ボーナス計算
    const totalEfficiency = efficiency.coins + efficiency.exp + efficiency.drop;
    
    return {
      startFloor: userData.currentFloor,
      endFloor: currentFloor,
      droppedEquipment,
      droppedSkills,
      earnedExp,
      earnedCoins,
      elapsedSeconds,
      details: {
        floorsCleared,
        enemiesKilled,
        bossesKilled,
        deaths,
        levelsGained,
        efficiencyBonus: totalEfficiency,
        events: events.slice(-20), // 直近20件のみ保持
      },
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
    
    (userData.equippedSkills || []).forEach(skillId => {
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
  
  addCoins: (amount: number) => {
    const { userData, checkAndUnlockAchievements, updateWeeklyChallenge } = get();
    if (!userData) return;
    
    // 統計も更新
    const stats = userData.statistics ?? {
      totalKills: 0,
      totalBossKills: 0,
      totalCoinsEarned: 0,
      totalFloorsCleared: 0,
      totalDeaths: 0,
      totalPotionsUsed: 0,
      totalPlayTimeSeconds: 0,
      totalExpEarned: 0,
    };
    
    const newStats = {
      ...stats,
      totalCoinsEarned: stats.totalCoinsEarned + amount,
    };
    
    set({ userData: { ...userData, coins: userData.coins + amount, statistics: newStats } });
    
    // ウィークリーチャレンジ更新
    updateWeeklyChallenge('coins_earn', amount);
    
    checkAndUnlockAchievements();
    get().syncToServer();
  },
  
  addExp: (amount: number) => {
    const { userData, addBattleHistoryEntry, checkAndUnlockAchievements, updateWeeklyChallenge } = get();
    if (!userData) return;
    
    const newData = { ...userData };
    const expForLevel = (lv: number) => lv * 100;
    const oldLevel = newData.character.level;
    
    // 統計更新
    const stats = newData.statistics ?? {
      totalKills: 0,
      totalBossKills: 0,
      totalCoinsEarned: 0,
      totalFloorsCleared: 0,
      totalDeaths: 0,
      totalPotionsUsed: 0,
      totalPlayTimeSeconds: 0,
      totalExpEarned: 0,
    };
    newData.statistics = {
      ...stats,
      totalExpEarned: stats.totalExpEarned + amount,
    };
    
    let totalExp = newData.character.exp + amount;
    let levelsGained = 0;
    while (totalExp >= expForLevel(newData.character.level)) {
      totalExp -= expForLevel(newData.character.level);
      newData.character.level++;
      newData.character.maxHp += 10;
      newData.character.atk += 2;
      newData.character.def += 1;
      levelsGained++;
    }
    newData.character.exp = totalExp;
    
    set({ userData: newData });
    
    // レベルアップした場合、履歴に追加＆ウィークリーチャレンジ更新
    if (newData.character.level > oldLevel) {
      addBattleHistoryEntry({
        type: 'level_up',
        message: `⬆️ レベルアップ！Lv.${newData.character.level}になった`,
        details: {
          level: newData.character.level,
        },
      });
      
      // ウィークリーチャレンジ更新
      updateWeeklyChallenge('level_up', levelsGained);
    }
    
    checkAndUnlockAchievements();
    get().syncToServer();
  },
  
  advanceFloor: () => {
    const { userData } = get();
    if (!userData) return;
    
    const newFloor = userData.currentFloor + 1;
    const newData = {
      ...userData,
      currentFloor: newFloor,
      highestFloor: Math.max(userData.highestFloor, newFloor),
    };
    
    set({ userData: newData });
    get().syncToServer();
  },
  
  addEquipmentToInventory: (itemId: string) => {
    const { userData, addBattleHistoryEntry } = get();
    if (!userData) return;
    
    const equipment = getEquipmentById(itemId);
    
    set({ userData: { ...userData, inventory: [...userData.inventory, itemId] } });
    
    // 履歴に追加
    if (equipment) {
      addBattleHistoryEntry({
        type: 'drop',
        floor: userData.currentFloor,
        message: `💎 ${equipment.name}をゲット！`,
        details: {
          itemId,
          itemName: equipment.name,
        },
      });
    }
    
    get().syncToServer();
  },
  
  resetFloorAndHeal: () => {
    const { userData, getTotalStats } = get();
    if (!userData) return;
    
    const stats = getTotalStats();
    const newData = {
      ...userData,
      currentFloor: 1,
      character: {
        ...userData.character,
        hp: stats.maxHp,
      },
    };
    
    set({ userData: newData });
    get().syncToServer();
  },
  
  healHp: (percent: number) => {
    const { userData, getTotalStats } = get();
    if (!userData || percent <= 0) return;
    
    const stats = getTotalStats();
    const healAmount = Math.floor(stats.maxHp * percent / 100);
    const newHp = Math.min(stats.maxHp, userData.character.hp + healAmount);
    
    const newData = {
      ...userData,
      character: {
        ...userData.character,
        hp: newHp,
      },
    };
    
    set({ userData: newData });
    get().syncToServer();
  },
  
  buyPotion: () => {
    const { userData } = get();
    if (!userData) return false;
    
    const POTION_PRICE = 100;
    if (userData.coins < POTION_PRICE) return false;
    
    const potions = userData.potions ?? 0;
    const newData = {
      ...userData,
      coins: userData.coins - POTION_PRICE,
      potions: potions + 1,
    };
    
    set({ userData: newData });
    get().syncToServer();
    return true;
  },
  
  usePotion: () => {
    const { userData, getTotalStats, healHp, recordPotionUse } = get();
    if (!userData) return false;
    
    const potions = userData.potions ?? 0;
    if (potions <= 0) return false;
    
    const stats = getTotalStats();
    // 既に満タンなら使わない
    if (userData.character.hp >= stats.maxHp) return false;
    
    // ポーション消費
    const newData = {
      ...userData,
      potions: potions - 1,
    };
    set({ userData: newData });
    
    // 50%回復
    healHp(50);
    
    // 統計記録
    recordPotionUse();
    
    return true;
  },
  
  getPotionCount: () => {
    const { userData } = get();
    return userData?.potions ?? 0;
  },
  
  // 統計取得
  getStatistics: () => {
    const { userData } = get();
    if (!userData?.statistics) {
      return {
        totalKills: 0,
        totalBossKills: 0,
        totalCoinsEarned: 0,
        totalFloorsCleared: 0,
        totalDeaths: 0,
        totalPotionsUsed: 0,
        totalPlayTimeSeconds: 0,
        totalExpEarned: 0,
      };
    }
    return userData.statistics;
  },
  
  // 戦闘履歴取得
  getBattleHistory: () => {
    const { userData } = get();
    return userData?.battleHistory ?? [];
  },
  
  // 戦闘履歴追加
  addBattleHistoryEntry: (entry: Omit<BattleHistoryEntry, 'id' | 'timestamp'>) => {
    const { userData } = get();
    if (!userData) return;
    
    const newEntry: BattleHistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    
    // 直近50件を保持
    const history = [newEntry, ...(userData.battleHistory ?? [])].slice(0, 50);
    
    set({ userData: { ...userData, battleHistory: history } });
    get().syncToServer();
  },
  
  // キル記録
  recordKill: (isBoss: boolean) => {
    const { userData, addBattleHistoryEntry, checkAndUnlockAchievements, updateWeeklyChallenge } = get();
    if (!userData) return;
    
    const stats = userData.statistics ?? {
      totalKills: 0,
      totalBossKills: 0,
      totalCoinsEarned: 0,
      totalFloorsCleared: 0,
      totalDeaths: 0,
      totalPotionsUsed: 0,
      totalPlayTimeSeconds: 0,
      totalExpEarned: 0,
    };
    
    const newStats = {
      ...stats,
      totalKills: stats.totalKills + 1,
      totalBossKills: isBoss ? stats.totalBossKills + 1 : stats.totalBossKills,
    };
    
    set({ userData: { ...userData, statistics: newStats } });
    
    // ウィークリーチャレンジ更新
    updateWeeklyChallenge('enemy_kill', 1);
    if (isBoss) {
      updateWeeklyChallenge('boss_kill', 1);
    }
    
    if (isBoss) {
      addBattleHistoryEntry({
        type: 'boss_kill',
        floor: userData.currentFloor,
        message: `🏆 フロア${userData.currentFloor}のボスを撃破！`,
      });
    }
    
    // 実績チェック
    checkAndUnlockAchievements();
    get().syncToServer();
  },
  
  // 死亡記録
  recordDeath: () => {
    const { userData, addBattleHistoryEntry, checkAndUnlockAchievements } = get();
    if (!userData) return;
    
    const stats = userData.statistics ?? {
      totalKills: 0,
      totalBossKills: 0,
      totalCoinsEarned: 0,
      totalFloorsCleared: 0,
      totalDeaths: 0,
      totalPotionsUsed: 0,
      totalPlayTimeSeconds: 0,
      totalExpEarned: 0,
    };
    
    const newStats = {
      ...stats,
      totalDeaths: stats.totalDeaths + 1,
    };
    
    set({ userData: { ...userData, statistics: newStats } });
    
    addBattleHistoryEntry({
      type: 'death',
      floor: userData.currentFloor,
      message: `💀 フロア${userData.currentFloor}で倒れた...`,
    });
    
    // 実績チェック
    checkAndUnlockAchievements();
    get().syncToServer();
  },
  
  // フロアクリア記録
  recordFloorClear: (floor: number) => {
    const { userData, addBattleHistoryEntry, checkAndUnlockAchievements, updateWeeklyChallenge } = get();
    if (!userData) return;
    
    const stats = userData.statistics ?? {
      totalKills: 0,
      totalBossKills: 0,
      totalCoinsEarned: 0,
      totalFloorsCleared: 0,
      totalDeaths: 0,
      totalPotionsUsed: 0,
      totalPlayTimeSeconds: 0,
      totalExpEarned: 0,
    };
    
    const newStats = {
      ...stats,
      totalFloorsCleared: stats.totalFloorsCleared + 1,
    };
    
    set({ userData: { ...userData, statistics: newStats } });
    
    // ウィークリーチャレンジ更新
    updateWeeklyChallenge('floor_clear', 1);
    
    addBattleHistoryEntry({
      type: 'floor_clear',
      floor,
      message: `🎉 フロア${floor}をクリア！`,
    });
    
    // 実績チェック
    checkAndUnlockAchievements();
    get().syncToServer();
  },
  
  // ポーション使用記録
  recordPotionUse: () => {
    const { userData, checkAndUnlockAchievements } = get();
    if (!userData) return;
    
    const stats = userData.statistics ?? {
      totalKills: 0,
      totalBossKills: 0,
      totalCoinsEarned: 0,
      totalFloorsCleared: 0,
      totalDeaths: 0,
      totalPotionsUsed: 0,
      totalPlayTimeSeconds: 0,
      totalExpEarned: 0,
    };
    
    const newStats = {
      ...stats,
      totalPotionsUsed: stats.totalPotionsUsed + 1,
    };
    
    set({ userData: { ...userData, statistics: newStats } });
    
    // 実績チェック
    checkAndUnlockAchievements();
    get().syncToServer();
  },
  
  // 実績チェック・解除
  checkAndUnlockAchievements: () => {
    const { userData, addBattleHistoryEntry } = get();
    if (!userData) return [];
    
    const stats = userData.statistics ?? {
      totalKills: 0,
      totalBossKills: 0,
      totalCoinsEarned: 0,
      totalFloorsCleared: 0,
      totalDeaths: 0,
      totalPotionsUsed: 0,
      totalPlayTimeSeconds: 0,
      totalExpEarned: 0,
    };
    
    const newAchievements = checkNewAchievements(stats, userData);
    if (newAchievements.length === 0) return [];
    
    const achievements = { ...(userData.achievements ?? {}) };
    const unlockedIds: string[] = [];
    
    for (const achievement of newAchievements) {
      achievements[achievement.id] = {
        unlockedAt: Date.now(),
        claimed: false,
      };
      unlockedIds.push(achievement.id);
      
      // 履歴に追加
      addBattleHistoryEntry({
        type: 'achievement',
        message: `🏅 実績解除: ${achievement.name}`,
        details: {
          achievementId: achievement.id,
        },
      });
    }
    
    set({ userData: { ...userData, achievements } });
    get().syncToServer();
    
    return unlockedIds;
  },
  
  // 実績報酬受け取り
  claimAchievementReward: (achievementId: string) => {
    const { userData, addCoins, addExp } = get();
    if (!userData) return false;
    
    const progress = userData.achievements?.[achievementId];
    if (!progress || progress.unlockedAt === 0 || progress.claimed) return false;
    
    const achievement = getAchievementById(achievementId);
    if (!achievement) return false;
    
    // 報酬付与
    if (achievement.reward?.coins) {
      addCoins(achievement.reward.coins);
    }
    if (achievement.reward?.exp) {
      addExp(achievement.reward.exp);
    }
    
    // 受け取り済みにする
    const achievements = { ...userData.achievements };
    achievements[achievementId] = {
      ...progress,
      claimed: true,
    };
    
    set({ userData: { ...userData, achievements } });
    get().syncToServer();
    
    return true;
  },
  
  // 実績進捗取得
  getAchievementProgress: () => {
    const { userData } = get();
    return userData?.achievements ?? {};
  },
  
  // マイルストーン: 受取可能なものをチェック
  checkAndShowNewMilestones: () => {
    const { userData } = get();
    if (!userData) return [];
    
    const newMilestones = checkNewMilestones(userData);
    return newMilestones.map(m => m.id);
  },
  
  // マイルストーン報酬受け取り
  claimMilestoneReward: (milestoneId: string) => {
    const { userData, addCoins, addExp, addBattleHistoryEntry } = get();
    if (!userData) return false;
    
    const milestone = getMilestoneById(milestoneId);
    if (!milestone) return false;
    
    // 必要フロアに到達していない
    if (userData.highestFloor < milestone.floor) return false;
    
    // 既に受け取り済み
    const progress = userData.milestones?.[milestoneId];
    if (progress && progress.claimedAt > 0) return false;
    
    // 報酬付与
    if (milestone.reward?.coins) {
      addCoins(milestone.reward.coins);
    }
    if (milestone.reward?.exp) {
      addExp(milestone.reward.exp);
    }
    
    // 受け取り済みにする
    const milestones = { ...(userData.milestones ?? {}) };
    milestones[milestoneId] = {
      claimedAt: Date.now(),
    };
    
    // 履歴に追加
    addBattleHistoryEntry({
      type: 'achievement', // 既存の型を流用
      message: `🏆 マイルストーン達成: ${milestone.name}`,
      details: {
        achievementId: milestoneId, // 流用
      },
    });
    
    set({ userData: { ...userData, milestones } });
    get().syncToServer();
    
    return true;
  },
  
  // マイルストーン進捗取得
  getMilestoneProgress: () => {
    const { userData } = get();
    return userData?.milestones ?? {};
  },
  
  // プレイ時間: 累計
  getTotalPlayTime: () => {
    const { userData } = get();
    return userData?.statistics?.totalPlayTimeSeconds ?? 0;
  },
  
  // プレイ時間: 現在セッション
  getCurrentSessionTime: () => {
    const { userData } = get();
    if (!userData) return 0;
    const sessionStart = userData.sessionStartedAt ?? userData.lastActiveAt;
    return Math.floor((Date.now() - sessionStart) / 1000);
  },
  
  // プレイ時間更新（定期的に呼び出し）
  updatePlayTime: () => {
    const { userData } = get();
    if (!userData) return;
    
    const now = Date.now();
    const sessionStart = userData.sessionStartedAt ?? userData.lastActiveAt;
    const sessionSeconds = Math.floor((now - sessionStart) / 1000);
    
    // 統計更新
    const stats = userData.statistics ?? {
      totalKills: 0,
      totalBossKills: 0,
      totalCoinsEarned: 0,
      totalFloorsCleared: 0,
      totalDeaths: 0,
      totalPotionsUsed: 0,
      totalPlayTimeSeconds: 0,
      totalExpEarned: 0,
    };
    
    const newData = {
      ...userData,
      sessionStartedAt: now, // リセット
      statistics: {
        ...stats,
        totalPlayTimeSeconds: stats.totalPlayTimeSeconds + sessionSeconds,
      },
    };
    
    set({ userData: newData });
    get().syncToServer();
  },
  
  // 放置効率ボーナス取得
  getIdleEfficiencyBonus: () => {
    const { userData, getSkillEffects } = get();
    if (!userData) return { coins: 0, exp: 0, drop: 0 };
    
    const effects = getSkillEffects();
    
    // スキル効果からボーナスを取得
    let coins = effects.idleCoinsBonus ?? 0;
    let exp = effects.idleExpBonus ?? 0;
    let drop = effects.idleDropBonus ?? 0;
    
    // 装備効果からもボーナス取得（将来拡張用）
    // 現在はeffectに文字列を持つ装備があるので、それをパースする
    const equippedIds = [
      userData.equippedWeapon,
      userData.equippedArmor,
      userData.equippedAccessory,
    ].filter(Boolean) as string[];
    
    for (const id of equippedIds) {
      const eq = getEquipmentById(id);
      if (!eq?.effect) continue;
      
      // 文字列から効果をパース
      if (eq.effect.includes('放置コイン')) {
        const match = eq.effect.match(/放置コイン\+(\d+)%/);
        if (match) coins += parseInt(match[1]);
      }
      if (eq.effect.includes('放置ドロップ')) {
        const match = eq.effect.match(/放置ドロップ\+(\d+)%/);
        if (match) drop += parseInt(match[1]);
      }
      if (eq.effect.includes('放置経験値')) {
        const match = eq.effect.match(/放置経験値\+(\d+)%/);
        if (match) exp += parseInt(match[1]);
      }
    }
    
    return { coins, exp, drop };
  },
  
  // ウィークリーチャレンジ進捗更新
  updateWeeklyChallenge: (type: WeeklyChallengeEntry['type'], amount: number) => {
    const { userData } = get();
    if (!userData) return;
    
    // 週のリセットチェック
    let weeklyChallenge = userData.weeklyChallenge;
    if (!weeklyChallenge || isNewWeek(weeklyChallenge.weekStartDate)) {
      weeklyChallenge = {
        weekStartDate: getWeekStartDate(),
        challenges: generateWeeklyChallenges(),
      };
    }
    
    // 進捗更新
    const updatedChallenges = updateChallengeProgress(weeklyChallenge.challenges, type, amount);
    
    const newData = {
      ...userData,
      weeklyChallenge: {
        ...weeklyChallenge,
        challenges: updatedChallenges,
      },
    };
    
    set({ userData: newData });
    // syncToServerはここでは呼ばない（呼び出し元で呼ぶ）
  },
}));
