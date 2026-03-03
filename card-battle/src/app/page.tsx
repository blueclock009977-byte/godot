'use client';

import { useState, useMemo } from 'react';
import Card from '@/components/Card';
import { Card as CardType, Player } from '@/types/card';
import { ALL_CARDS } from '@/data/cards';
import { createPlayer, resolveBattle, refreshHand, calculateTotalPower } from '@/lib/gameLogic';
import { selectNPCCards } from '@/lib/npcAI';

type Phase = 'select' | 'reveal' | 'result';

// 初期プレイヤーを作成する関数
const createInitialPlayers = (): { player: Player; npc: Player } => {
  const playerDeck = ALL_CARDS.filter(c => 
    ['fire-1', 'fire-2', 'fire-3', 'water-2', 'water-3', 'wind-2'].includes(c.id)
  );
  const npcDeck = ALL_CARDS.filter(c => 
    ['water-1', 'water-2', 'water-3', 'fire-2', 'fire-3', 'wind-3'].includes(c.id)
  );
  return {
    player: createPlayer('player', 'あなた', playerDeck),
    npc: createPlayer('npc', 'NPC', npcDeck)
  };
};

export default function Home() {
  // useMemoで初期値を遅延生成（SSR互換性のため）
  const initialPlayers = useMemo(() => createInitialPlayers(), []);
  
  const [player, setPlayer] = useState<Player>(() => initialPlayers.player);
  const [npc, setNpc] = useState<Player>(() => initialPlayers.npc);
  const [turn, setTurn] = useState(1);
  const [phase, setPhase] = useState<Phase>('select');
  const [playerSelected, setPlayerSelected] = useState<CardType[]>([]);
  const [npcSelected, setNpcSelected] = useState<CardType[]>([]);
  const [battleResult, setBattleResult] = useState<string>('');
  const [winner, setWinner] = useState<string | null>(null);

  const maxCost = Math.min(turn, 5);

  const getTotalCost = (cards: CardType[]) => cards.reduce((sum, c) => sum + c.cost, 0);

  const handleCardClick = (card: CardType) => {
    if (phase !== 'select') return;
    
    if (playerSelected.find(c => c.id === card.id)) {
      setPlayerSelected(playerSelected.filter(c => c.id !== card.id));
    } else if (getTotalCost([...playerSelected, card]) <= maxCost) {
      setPlayerSelected([...playerSelected, card]);
    }
  };

  const handleConfirm = () => {
    if (phase !== 'select') return;
    
    // NPCのカード選択
    const npcCards = selectNPCCards(npc, maxCost);
    setNpcSelected(npcCards);
    
    // バトル解決
    const result = resolveBattle(playerSelected, npcCards);
    setBattleResult(result.description);
    
    setPlayer(prev => ({ ...prev, life: prev.life - result.p1Damage }));
    setNpc(prev => ({ ...prev, life: prev.life - result.p2Damage }));
    
    setPhase('reveal');
  };

  const handleNextTurn = () => {

    // 勝敗チェック
    if (player.life <= 0) {
      setWinner('NPC');
      return;
    }
    if (npc.life <= 0) {
      setWinner('あなた');
      return;
    }

    // 手札補充
    setPlayer(refreshHand(player, playerSelected));
    setNpc(refreshHand(npc, npcSelected));

    // 次のターンへ
    setTurn(turn + 1);
    setPhase('select');
    setPlayerSelected([]);
    setNpcSelected([]);
    setBattleResult('');
  };

  if (winner) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            {winner === 'あなた' ? '🎉 勝利！' : '😢 敗北...'}
          </h1>
          <p className="text-xl mb-4">{winner} の勝ち！</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            もう一度遊ぶ
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4">
      {/* ヘッダー */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">⚔️ カードバトル</h1>
        <p className="text-lg">ターン {turn} ｜ コスト上限: {maxCost}</p>
      </div>

      {/* NPC情報 */}
      <div className="bg-gray-800 rounded-lg p-3 mb-4 text-center">
        <p className="text-lg">🤖 NPC: ❤️ {npc.life}/10</p>
        <p className="text-sm text-gray-400">手札: {npc.hand.length}枚</p>
      </div>

      {/* バトル結果 */}
      {phase === 'reveal' && (
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-xl font-bold mb-2 text-center">⚔️ バトル結果</h2>
          
          <div className="flex justify-center gap-8 mb-4">
            <div className="text-center">
              <p className="mb-2">あなた</p>
              <div className="flex gap-2 justify-center">
                {playerSelected.length > 0 ? playerSelected.map((card, i) => (
                  <Card key={card.id} card={card} isSupport={i > 0} />
                )) : <p className="text-gray-500">パス</p>}
              </div>
              {playerSelected.length > 0 && (
                <p className="mt-2">パワー: {calculateTotalPower(playerSelected).power}</p>
              )}
            </div>
            
            <div className="text-4xl self-center">VS</div>
            
            <div className="text-center">
              <p className="mb-2">🤖 NPC</p>
              <div className="flex gap-2 justify-center">
                {npcSelected.length > 0 ? npcSelected.map((card, i) => (
                  <Card key={card.id} card={card} isSupport={i > 0} />
                )) : <p className="text-gray-500">パス</p>}
              </div>
              {npcSelected.length > 0 && (
                <p className="mt-2">パワー: {calculateTotalPower(npcSelected).power}</p>
              )}
            </div>
          </div>
          
          <p className="text-xl font-bold text-yellow-400 text-center">{battleResult}</p>
          
          <div className="text-center">
            <button
              onClick={handleNextTurn}
              className="mt-4 bg-green-500 px-6 py-2 rounded-lg hover:bg-green-600"
            >
              次のターンへ
            </button>
          </div>
        </div>
      )}

      {/* プレイヤー情報 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-lg">👤 あなた: ❤️ {player.life}/10</p>
          <p className="text-lg">
            コスト: {getTotalCost(playerSelected)} / {maxCost}
          </p>
        </div>
        
        <div className="flex justify-center gap-4 mb-4">
          {player.hand.map(card => (
            <Card
              key={card.id}
              card={card}
              onClick={() => handleCardClick(card)}
              selected={playerSelected.some(c => c.id === card.id)}
              disabled={
                phase !== 'select' ||
                (!playerSelected.some(c => c.id === card.id) &&
                getTotalCost([...playerSelected, card]) > maxCost)
              }
            />
          ))}
        </div>
        
        {phase === 'select' && (
          <div className="text-center">
            <button
              onClick={handleConfirm}
              className="bg-blue-500 px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              決定！
            </button>
          </div>
        )}
      </div>

      {/* 相性表 */}
      <div className="mt-4 text-center text-sm text-gray-400">
        <p>属性相性: 🔥火 → 🌪️風 → 💧水 → 🔥火（有利で+2）</p>
      </div>
    </main>
  );
}
