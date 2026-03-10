"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { BattleAction, MonsterInstance, MonsterSpecies } from "@/lib/types";
import { ALL_MONSTERS } from "@/lib/data/monsters";
import { skillMap } from "@/lib/data/skills";
import {
  GameState,
  createGameState,
  startBattle,
  submitAction,
  executeTurn,
  getAvailableActions,
} from "@/lib/battle/gameLoop";
import { getActiveMonster } from "@/lib/battle/state";
import { BattleSync, SyncedAction } from "@/lib/online/sync";
import { listenRoom, RoomData } from "@/lib/firebase/database";
import { generateUserId } from "@/lib/online/room";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";

// モンスターインスタンス生成
function createMonsterInstance(species: MonsterSpecies): MonsterInstance {
  // 技を4つ選択（skillPoolからランダムに4つ）
  const shuffledSkills = [...species.skillPool].sort(() => Math.random() - 0.5);
  const skills = shuffledSkills.slice(0, 4);
  // 特性を1つ選択
  const ability = species.abilities[0] || "none";
  // HP計算（レベル50想定）
  const baseHp = species.baseStats.hp;
  const maxHp = Math.floor((2 * baseHp + 15) * 50 / 100 + 50 + 10);
  
  return {
    id: `${species.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    speciesId: species.id,
    ability,
    skills,
    currentHp: maxHp,
    maxHp,
  };
}

// ランダムパーティ生成
function createRandomParty(): { instance: MonsterInstance; species: MonsterSpecies }[] {
  const shuffled = [...ALL_MONSTERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map(species => ({
    instance: createMonsterInstance(species),
    species,
  }));
}

function OnlineBattleContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room");
  
  const [userId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("onlineUserId");
      if (stored) return stored;
      const newId = generateUserId();
      sessionStorage.setItem("onlineUserId", newId);
      return newId;
    }
    return generateUserId();
  });
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [syncRef, setSyncRef] = useState<BattleSync | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [battleResult, setBattleResult] = useState<{
    eggResult?: 'new' | 'shortened' | 'replaced';
    newRating?: number;
    ratingChange?: number;
  } | null>(null);
  const resultReported = useRef(false);
  
  const { isLoggedIn, reportWin, reportLoss } = useUser();
  
  const playerIndex = isHost ? 0 : 1;
  
  // バトル初期化済みフラグ
  const battleInitialized = useRef(false);
  
  // バトル初期化
  const initBattle = useCallback(async (code: string, host: boolean) => {
    if (battleInitialized.current) return;
    battleInitialized.current = true;
    const p1Party = createRandomParty();
    const p2Party = createRandomParty();
    
    const state = createGameState(
      { id: "host", name: "プレイヤー1", party: p1Party },
      { id: "guest", name: "プレイヤー2", party: p2Party }
    );
    
    // バトル開始
    const result = startBattle(state);
    setMessages(result.messages);
    setGameState(result.state);
    
    // 同期開始
    const sync = new BattleSync(code, userId);
    setSyncRef(sync);
    
    if (host) {
      await sync.initialize();
    }
    
    sync.startSync((actions) => {
      handleActionsReady(actions);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // ルーム監視
  useEffect(() => {
    if (!roomCode) return;
    
    const unsub = listenRoom(roomCode, (r) => {
      if (!r) {
        setError("ルームが削除されました");
        return;
      }
      setRoom(r);
      setIsHost(r.hostId === userId);
      
      // ゲーム開始時にバトル初期化
      if (r.status === "playing" && !gameState) {
        initBattle(roomCode, r.hostId === userId);
      }
    });
    
    return () => unsub();
  }, [roomCode, userId, gameState, initBattle]);
  
  // 両プレイヤーの行動が揃った
  const handleActionsReady = useCallback((actions: SyncedAction[]) => {
    setGameState((prevState) => {
      if (!prevState) return null;
      
      const hostAction = actions.find(a => a.playerId === room?.hostId)?.action as BattleAction | undefined;
      const guestAction = actions.find(a => a.playerId !== room?.hostId)?.action as BattleAction | undefined;
      
      if (!hostAction || !guestAction) return prevState;
      
      // 両方の行動を送信（submitActionはstateを直接変更する）
      submitAction(prevState, 0, hostAction, skillMap);
      submitAction(prevState, 1, guestAction, skillMap);
      
      // ターン実行
      const turnResult = executeTurn(prevState, skillMap);
      setMessages(prev => [...prev, ...turnResult.messages]);
      
      setIsWaiting(false);
      syncRef?.advanceTurn();
      
      return { ...turnResult.state };
    });
  }, [room, syncRef]);
  
  // 行動選択
  const handleAction = async (action: BattleAction) => {
    if (isWaiting || !syncRef || !gameState) return;
    setIsWaiting(true);
    await syncRef.sendAction(action);
  };
  
  // ルームがない場合
  if (!roomCode) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">ルームが見つかりません</p>
          <Link href="/online" className="text-blue-400 hover:underline">
            ロビーに戻る
          </Link>
        </div>
      </div>
    );
  }
  
  // エラー
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <Link href="/online" className="text-blue-400 hover:underline">
            ロビーに戻る
          </Link>
        </div>
      </div>
    );
  }
  
  // 接続中
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-xl">対戦を準備中...</p>
          <p className="text-gray-400 mt-2">ルーム: {roomCode}</p>
        </div>
      </div>
    );
  }
  
  // レート・卵報酬を記録
  useEffect(() => {
    if (gameState?.status !== "ended" || resultReported.current || !isLoggedIn) return;
    resultReported.current = true;
    const isWinner = gameState.winner === playerIndex;
    (async () => {
      if (isWinner) {
        const result = await reportWin();
        if (result) setBattleResult({ eggResult: result.eggResult, newRating: result.newRating, ratingChange: result.ratingChange });
      } else {
        const result = await reportLoss();
        if (result) setBattleResult({ newRating: result.newRating, ratingChange: result.ratingChange });
      }
    })();
  }, [gameState?.status, gameState?.winner, playerIndex, isLoggedIn, reportWin, reportLoss]);

  // 結果画面
  if (gameState.status === "ended") {
    const isWinner = gameState.winner === playerIndex;
    const eggMsg = battleResult?.eggResult === 'new' ? '🥚 新しい卵を獲得！'
      : battleResult?.eggResult === 'shortened' ? '🥚 卵の孵化時間が短縮！'
      : battleResult?.eggResult === 'replaced' ? '🥚 新しい卵に入れ替え！'
      : null;
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">{isWinner ? "🏆" : "😢"}</div>
          <h1 className="text-3xl font-bold mb-4">
            {isWinner ? "勝利！" : "敗北..."}
          </h1>
          {battleResult && (
            <div className="mb-4 space-y-2">
              <p className={`text-lg ${battleResult.ratingChange! >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                レート: {battleResult.newRating} ({battleResult.ratingChange! >= 0 ? '+' : ''}{battleResult.ratingChange})
              </p>
              {eggMsg && <p className="text-yellow-300 text-lg">{eggMsg}</p>}
            </div>
          )}
          {isLoggedIn && !battleResult && (
            <p className="text-gray-400 mb-4">結果を記録中...</p>
          )}
          {!isLoggedIn && (
            <p className="text-gray-500 mb-4 text-sm">ログインするとレート・卵が記録されます</p>
          )}
          <div className="flex gap-4 justify-center">
            <Link
              href="/online"
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg inline-block"
            >
              ロビーに戻る
            </Link>
            <Link
              href="/profile"
              className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg inline-block"
            >
              プロフィール
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // バトル画面
  const myPlayer = gameState.battle.players[playerIndex];
  const oppPlayer = gameState.battle.players[1 - playerIndex as 0 | 1];
  const myMonster = getActiveMonster(myPlayer);
  const oppMonster = getActiveMonster(oppPlayer);
  const availableActions = getAvailableActions(gameState, playerIndex as 0 | 1, skillMap);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4 text-sm">
        <span className="text-gray-400">ルーム: {roomCode}</span>
        <span className={`px-2 py-1 rounded ${isWaiting ? "bg-yellow-600" : "bg-green-600"}`}>
          {isWaiting ? "相手を待機中..." : "行動を選択"}
        </span>
        <span className="text-gray-400">{isHost ? "🏠 ホスト" : "👤 ゲスト"}</span>
      </div>
      
      {/* 相手 */}
      <div className="bg-red-900/30 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">{oppMonster.species.name}</span>
          <span className="text-sm text-gray-400">マナ: {oppPlayer.mana}/10</span>
        </div>
        <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-red-500 h-full transition-all"
            style={{ width: `${(oppMonster.currentHp / oppMonster.maxHp) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-1">
          HP: {oppMonster.currentHp}/{oppMonster.maxHp}
        </p>
      </div>
      
      {/* 自分 */}
      <div className="bg-blue-900/30 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">{myMonster.species.name}</span>
          <span className="text-sm text-gray-400">マナ: {myPlayer.mana}/10</span>
        </div>
        <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all"
            style={{ width: `${(myMonster.currentHp / myMonster.maxHp) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-1">
          HP: {myMonster.currentHp}/{myMonster.maxHp}
        </p>
      </div>
      
      {/* 技選択 */}
      <div className="grid grid-cols-2 gap-2">
        {availableActions.skills.map((skillAction) => {
          const skill = skillAction.skill;
          
          return (
            <button
              key={skillAction.skillId}
              onClick={() => handleAction({ type: "skill", skillId: skillAction.skillId })}
              disabled={isWaiting}
              className={`p-3 rounded-lg text-left ${
                !isWaiting
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-800 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="font-bold">{skill.name}</div>
              <div className="text-sm text-gray-400">
                {skill.power > 0 ? `威力${skill.power}` : "変化"} / マナ{skill.manaCost}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* 交代ボタン */}
      {availableActions.switches.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-gray-400 mb-2">🔄 交代</h3>
          <div className="grid grid-cols-2 gap-2">
            {availableActions.switches.map((switchOpt) => {
              const hpPercent = Math.round((switchOpt.monster.hp / switchOpt.monster.maxHp) * 100);
              return (
                <button
                  key={switchOpt.index}
                  onClick={() => handleAction({ type: "switch", switchTo: switchOpt.index })}
                  disabled={isWaiting}
                  className={`p-3 rounded-lg text-left ${
                    !isWaiting
                      ? "bg-purple-900/50 hover:bg-purple-800/50 border border-purple-700"
                      : "bg-gray-800 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="font-bold">{switchOpt.monster.name}</div>
                  <div className="text-sm text-gray-400">
                    HP: {switchOpt.monster.hp}/{switchOpt.monster.maxHp} ({hpPercent}%)
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* 待機 */}
      <button
        onClick={() => handleAction({ type: "wait" })}
        disabled={isWaiting}
        className="w-full mt-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50"
      >
        待機（マナ+3）
      </button>
      
      {/* ログ */}
      <div className="mt-4 bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto text-sm">
        {messages.slice(-5).map((msg, i) => (
          <p key={i} className="text-gray-300">{msg}</p>
        ))}
      </div>
    </div>
  );
}

export default function OnlineBattlePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    }>
      <OnlineBattleContent />
    </Suspense>
  );
}
