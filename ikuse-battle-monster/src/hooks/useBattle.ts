'use client';

/**
 * バトル用React Hook
 * ゲームループとUIの橋渡し
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  BattleState,
  BattleAction,
  Skill,
  MonsterSpecies,
  MonsterInstance,
} from '@/lib/types';
import {
  GameState,
  createGameState,
  startBattle,
  submitAction,
  executeTurn,
  submitForcedSwitch,
  getAvailableActions,
  selectAIAction,
  selectAIForcedSwitch,
  getBattleResult,
  surrender as surrenderAction,
  pickPartyMember,
  confirmPicking,
  transitionToBattle,
  autoPickForAI,
  BattleResult,
  AvailableActions,
} from '@/lib/battle/gameLoop';
import { skillMap } from '@/lib/data/skills';
import { getActiveMonster } from '@/lib/battle/state';

// ============================================
// 型定義
// ============================================

export interface UseBattleOptions {
  player1: {
    id: string;
    name: string;
    party: { instance: MonsterInstance; species: MonsterSpecies }[];
  };
  player2: {
    id: string;
    name: string;
    party: { instance: MonsterInstance; species: MonsterSpecies }[];
  };
  isPlayer2AI?: boolean;
  aiDelay?: number; // AI行動の遅延（ms）
}

export interface UseBattleReturn {
  // 状態
  gameState: GameState;
  battleState: BattleState;
  isPlayerTurn: boolean;
  status: GameState['status'];
  winner: 0 | 1 | null;
  result: BattleResult | null;
  messages: string[];
  
  // プレイヤー情報
  playerMonster: ReturnType<typeof getActiveMonster>;
  opponentMonster: ReturnType<typeof getActiveMonster>;
  playerMana: number;
  opponentMana: number;
  
  // 選出フェーズ
  fullParty: { instance: MonsterInstance; species: MonsterSpecies }[];
  selectedIndices: number[];
  
  // 行動選択
  availableActions: AvailableActions;
  selectedAction: BattleAction | null;
  
  // アクション
  startGame: () => void;
  selectSkill: (skillId: string) => void;
  selectSwitch: (index: number) => void;
  selectWait: () => void;
  confirmAction: () => void;
  submitForcedSwitch: (index: number) => void;
  surrender: () => void;
  
  // 選出アクション
  togglePick: (index: number) => void;
  confirmPicks: () => void;
  
  // ユーティリティ
  getSkill: (skillId: string) => Skill | undefined;
  isLoading: boolean;
}

// ============================================
// Hook本体
// ============================================

export function useBattle(options: UseBattleOptions): UseBattleReturn {
  const { player1, player2, isPlayer2AI = true, aiDelay = 800 } = options;
  
  // ゲーム状態
  const [gameState, setGameState] = useState<GameState>(() =>
    createGameState(player1, player2)
  );
  const [selectedAction, setSelectedAction] = useState<BattleAction | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // スキルマップ
  const skills = useMemo(() => skillMap, []);
  
  // 派生状態
  const battleState = gameState.battle;
  const status = gameState.status;
  const winner = gameState.winner;
  const isPlayerTurn = status === 'selecting' || status === 'forced_switch' || status === 'picking';
  
  // 選出フェーズ用
  const fullParty = gameState.fullParty[0];
  const selectedIndices = gameState.selectedIndices[0];
  
  // バトル中の状態（選出フェーズ中はダミー）
  const playerMonster = status !== 'picking' 
    ? getActiveMonster(battleState.players[0])
    : null as unknown as ReturnType<typeof getActiveMonster>;
  const opponentMonster = status !== 'picking'
    ? getActiveMonster(battleState.players[1])
    : null as unknown as ReturnType<typeof getActiveMonster>;
  const playerMana = status !== 'picking' ? battleState.players[0].mana : 0;
  const opponentMana = status !== 'picking' ? battleState.players[1].mana : 0;
  
  const availableActions = useMemo(
    () => getAvailableActions(gameState, 0, skills),
    [gameState, skills]
  );
  
  const result = useMemo(
    () => getBattleResult(gameState),
    [gameState]
  );
  
  // ============================================
  // ゲーム開始
  // ============================================
  
  const startGame = useCallback(() => {
    const newState = createGameState(player1, player2);
    
    // 選出フェーズの場合はAIの選出を自動で行う
    if (newState.status === 'picking' && isPlayer2AI) {
      autoPickForAI(newState, 1);
    }
    
    // 3体以下のパーティなら直接バトル開始
    if (newState.status !== 'picking') {
      const { messages: startMessages, state } = startBattle(newState);
      setGameState(state);
      setMessages(startMessages);
    } else {
      setGameState(newState);
      setMessages(['6体の中から3体を選出してください']);
    }
    
    setSelectedAction(null);
  }, [player1, player2, isPlayer2AI]);
  
  // ============================================
  // 選出フェーズ
  // ============================================
  
  const togglePick = useCallback((index: number) => {
    if (gameState.status !== 'picking') return;
    
    const result = pickPartyMember(gameState, 0, index);
    if (result.success) {
      setGameState({ ...gameState });
      setMessages([result.message]);
    } else {
      setMessages([result.message]);
    }
  }, [gameState]);
  
  const confirmPicks = useCallback(() => {
    if (gameState.status !== 'picking' || isLoading) return;
    
    const result = confirmPicking(gameState, 0);
    if (!result.success) {
      setMessages([result.message]);
      return;
    }
    
    if (!result.bothReady) {
      setMessages(['選出を確定しました。相手の選出を待っています...']);
      return;
    }
    
    // 両者選出完了 → バトル開始
    setIsLoading(true);
    
    const transResult = transitionToBattle(gameState, player1.name, player2.name);
    if (!transResult.success) {
      setMessages([transResult.message]);
      setIsLoading(false);
      return;
    }
    
    // バトル開始
    const { messages: startMessages, state } = startBattle(gameState);
    setGameState(state);
    setMessages(startMessages);
    setIsLoading(false);
  }, [gameState, isLoading, player1.name, player2.name]);
  
  // ============================================
  // 行動選択
  // ============================================
  
  const selectSkill = useCallback((skillId: string) => {
    setSelectedAction({ type: 'skill', skillId });
  }, []);
  
  const selectSwitch = useCallback((index: number) => {
    setSelectedAction({ type: 'switch', switchTo: index });
  }, []);
  
  const selectWait = useCallback(() => {
    setSelectedAction({ type: 'wait' });
  }, []);
  
  // ============================================
  // 行動確定
  // ============================================
  
  const confirmAction = useCallback(() => {
    if (!selectedAction || isLoading) return;
    
    setIsLoading(true);
    
    // プレイヤーの行動を送信
    const result = submitAction(gameState, 0, selectedAction, skills);
    
    if (!result.success) {
      setMessages(prev => [...prev, result.message]);
      setIsLoading(false);
      return;
    }
    
    // AI戦の場合、AIの行動も決定
    if (isPlayer2AI) {
      const aiAction = selectAIAction(gameState, 1, skills);
      submitAction(gameState, 1, aiAction, skills);
    }
    
    // 両方揃ったらターン実行
    setTimeout(() => {
      const turnResult = executeTurn(gameState, skills);
      setGameState({ ...turnResult.state });
      setMessages(turnResult.messages);
      setSelectedAction(null);
      setIsLoading(false);
    }, aiDelay);
  }, [selectedAction, gameState, skills, isPlayer2AI, aiDelay, isLoading]);
  
  // ============================================
  // 強制交代
  // ============================================
  
  const handleForcedSwitch = useCallback((index: number) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // プレイヤーの強制交代
    const result = submitForcedSwitch(gameState, 0, index);
    
    if (!result.success) {
      setMessages(prev => [...prev, ...result.messages]);
      setIsLoading(false);
      return;
    }
    
    setMessages(prev => [...prev, ...result.messages]);
    setGameState({ ...result.state });
    setIsLoading(false);
  }, [gameState, isLoading]);
  
  // ============================================
  // AI強制交代の自動処理
  // ============================================
  
  useEffect(() => {
    if (
      status === 'forced_switch' &&
      isPlayer2AI &&
      gameState.forcedSwitchPending.includes(1) &&
      !isLoading
    ) {
      // 次のレンダリングサイクルで処理を行う
      const timeoutId = setTimeout(() => {
        setIsLoading(true);
        
        setTimeout(() => {
          const switchTo = selectAIForcedSwitch(gameState, 1);
          const result = submitForcedSwitch(gameState, 1, switchTo);
          
          setMessages(prev => [...prev, ...result.messages]);
          setGameState({ ...result.state });
          setIsLoading(false);
        }, aiDelay);
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [status, isPlayer2AI, gameState, aiDelay, isLoading]);
  
  // ============================================
  // ユーティリティ
  // ============================================
  
  const handleSurrender = useCallback(() => {
    if (status === 'ended' || status === 'picking') return;
    const result = surrenderAction(gameState, 0);
    setGameState(result.state);
    setMessages(result.messages);
  }, [gameState, status]);

  const getSkill = useCallback((skillId: string) => {
    return skills.get(skillId);
  }, [skills]);
  
  // ============================================
  // 返り値
  // ============================================
  
  return {
    // 状態
    gameState,
    battleState,
    isPlayerTurn,
    status,
    winner,
    result,
    messages,
    
    // プレイヤー情報
    playerMonster,
    opponentMonster,
    playerMana,
    opponentMana,
    
    // 選出フェーズ
    fullParty,
    selectedIndices,
    
    // 行動選択
    availableActions,
    selectedAction,
    
    // アクション
    startGame,
    selectSkill,
    selectSwitch,
    selectWait,
    confirmAction,
    submitForcedSwitch: handleForcedSwitch,
    surrender: handleSurrender,
    
    // 選出アクション
    togglePick,
    confirmPicks,
    
    // ユーティリティ
    getSkill,
    isLoading,
  };
}
