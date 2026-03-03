'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { EnemyType, selectRandomEnemy, calculateEnemyStats } from '@/data/enemies';

interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
}

interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  size: number;
}

interface DamageNumber {
  id: number;
  x: number;
  y: number;
  value: number;
  color: string;
  createdAt: number;
}

interface BattleCanvasProps {
  playerStats: {
    maxHp: number;
    atk: number;
    def: number;
    speed: number;
  };
  floor: number;
  onFloorClear: () => void;
  onPlayerDeath: () => void;
}

export function BattleCanvas({ playerStats, floor, onFloorClear, onPlayerDeath }: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'clear' | 'dead'>('playing');
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const enemiesPerFloor = 5 + Math.floor(floor / 5) * 2;
  
  // ゲーム状態をrefで管理（アニメーションループ内で使用）
  const playerRef = useRef<Player>({
    x: 200,
    y: 300,
    hp: playerStats.maxHp,
    maxHp: playerStats.maxHp,
    atk: playerStats.atk,
    def: playerStats.def,
    speed: playerStats.speed,
    attackRange: 120, // 攻撃範囲
    attackCooldown: 1000, // ms
    lastAttackTime: 0,
  });
  
  const enemiesRef = useRef<Enemy[]>([]);
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const nextEnemyIdRef = useRef(0);
  const nextDamageIdRef = useRef(0);
  const killedCountRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);
  
  // 敵をスポーン
  const spawnEnemy = useCallback(() => {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const enemyType = selectRandomEnemy(floor);
    const stats = calculateEnemyStats(enemyType, floor);
    
    // ±10%のランダム変動
    const hpVariance = 1 + (Math.random() - 0.5) * 0.2;
    const atkVariance = 1 + (Math.random() - 0.5) * 0.2;
    
    const enemy: Enemy = {
      id: nextEnemyIdRef.current++,
      type: enemyType,
      x: side === 'left' ? -30 : 430,
      y: 150 + Math.random() * 200,
      hp: Math.floor(stats.hp * hpVariance),
      maxHp: Math.floor(stats.hp * hpVariance),
      atk: Math.floor(stats.atk * atkVariance),
      speed: stats.speed,
      size: stats.size,
    };
    enemiesRef.current.push(enemy);
  }, [floor]);
  
  // 敵描画関数（タイプ別）
  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    const { type, x, y, size } = enemy;
    
    ctx.save();
    
    switch (type.id) {
      case 'slime':
        // スライム: ぷよぷよした楕円
        ctx.fillStyle = type.color;
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.1, size, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        // ハイライト
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.3, y - size * 0.2, size * 0.2, size * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fill();
        // 目
        ctx.fillStyle = type.secondaryColor;
        ctx.beginPath();
        ctx.arc(x - size * 0.3, y, size * 0.15, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'goblin':
        // ゴブリン: 角ばった体
        ctx.fillStyle = type.color;
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.8, y - size * 0.3);
        ctx.lineTo(x + size * 0.6, y + size);
        ctx.lineTo(x - size * 0.6, y + size);
        ctx.lineTo(x - size * 0.8, y - size * 0.3);
        ctx.closePath();
        ctx.fill();
        // 耳
        ctx.beginPath();
        ctx.moveTo(x - size * 0.8, y - size * 0.3);
        ctx.lineTo(x - size * 1.2, y - size * 0.6);
        ctx.lineTo(x - size * 0.5, y - size * 0.5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + size * 0.8, y - size * 0.3);
        ctx.lineTo(x + size * 1.2, y - size * 0.6);
        ctx.lineTo(x + size * 0.5, y - size * 0.5);
        ctx.fill();
        // 目
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.2, size * 0.12, 0, Math.PI * 2);
        ctx.arc(x + size * 0.25, y - size * 0.2, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'skeleton':
        // スケルトン: 骸骨っぽい
        ctx.fillStyle = type.color;
        // 頭蓋骨
        ctx.beginPath();
        ctx.arc(x, y - size * 0.3, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        // 顎
        ctx.fillRect(x - size * 0.4, y + size * 0.1, size * 0.8, size * 0.4);
        // 目（穴）
        ctx.fillStyle = type.secondaryColor;
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.35, size * 0.18, 0, Math.PI * 2);
        ctx.arc(x + size * 0.25, y - size * 0.35, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
        // 鼻穴
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x - size * 0.1, y + size * 0.1);
        ctx.lineTo(x + size * 0.1, y + size * 0.1);
        ctx.closePath();
        ctx.fill();
        // 歯
        ctx.fillStyle = type.color;
        for (let i = -2; i <= 2; i++) {
          ctx.fillRect(x + i * size * 0.15 - size * 0.05, y + size * 0.15, size * 0.1, size * 0.2);
        }
        break;
        
      case 'orc':
        // オーク: 大きくて筋肉質
        ctx.fillStyle = type.color;
        // 体
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        // 牙
        ctx.fillStyle = '#e5e5e5';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.4, y + size * 0.2);
        ctx.lineTo(x - size * 0.3, y - size * 0.2);
        ctx.lineTo(x - size * 0.2, y + size * 0.2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + size * 0.4, y + size * 0.2);
        ctx.lineTo(x + size * 0.3, y - size * 0.2);
        ctx.lineTo(x + size * 0.2, y + size * 0.2);
        ctx.fill();
        // 目
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x - size * 0.35, y - size * 0.25, size * 0.12, 0, Math.PI * 2);
        ctx.arc(x + size * 0.35, y - size * 0.25, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        // 眉毛（怒り）
        ctx.strokeStyle = type.secondaryColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.5, y - size * 0.5);
        ctx.lineTo(x - size * 0.2, y - size * 0.35);
        ctx.moveTo(x + size * 0.5, y - size * 0.5);
        ctx.lineTo(x + size * 0.2, y - size * 0.35);
        ctx.stroke();
        break;
        
      default:
        // フォールバック
        ctx.fillStyle = type.color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
  }, []);
  
  // ダメージ数字を追加
  const addDamageNumber = useCallback((x: number, y: number, value: number, color: string) => {
    damageNumbersRef.current.push({
      id: nextDamageIdRef.current++,
      x,
      y,
      value,
      color,
      createdAt: Date.now(),
    });
  }, []);
  
  // ゲームループ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let lastTime = 0;
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      const player = playerRef.current;
      const enemies = enemiesRef.current;
      const damageNumbers = damageNumbersRef.current;
      
      // 背景クリア
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // グリッド描画（床）
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // 敵スポーン
      if (currentTime - lastSpawnTimeRef.current > 2000 && 
          enemies.length < 3 && 
          killedCountRef.current < enemiesPerFloor) {
        spawnEnemy();
        lastSpawnTimeRef.current = currentTime;
      }
      
      // 敵更新・描画
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // プレイヤーに向かって移動
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 40) {
          enemy.x += (dx / dist) * enemy.speed * deltaTime * 0.1;
          enemy.y += (dy / dist) * enemy.speed * deltaTime * 0.1;
        } else {
          // 近接攻撃（簡易）
          if (Math.random() < 0.01) {
            const damage = Math.max(1, enemy.atk - player.def);
            player.hp -= damage;
            addDamageNumber(player.x, player.y - 20, damage, '#ff6b6b');
          }
        }
        
        // 敵描画（タイプに応じた見た目）
        drawEnemy(ctx, enemy);
        
        // 敵HP
        const hpWidth = enemy.size * 2;
        const hpHeight = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - hpWidth / 2, enemy.y - enemy.size - 10, hpWidth, hpHeight);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(enemy.x - hpWidth / 2, enemy.y - enemy.size - 10, hpWidth * (enemy.hp / enemy.maxHp), hpHeight);
      }
      
      // 最も近い敵を探す
      let nearestEnemy: Enemy | null = null;
      let nearestDist = Infinity;
      
      for (const enemy of enemies) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      }
      
      // プレイヤー自動移動（攻撃範囲外なら敵に向かって移動）
      if (nearestEnemy && nearestDist > player.attackRange * 0.8) {
        const dx = nearestEnemy.x - player.x;
        const dy = nearestEnemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const moveSpeed = player.speed * 0.03 * deltaTime;
        
        player.x += (dx / dist) * moveSpeed;
        player.y += (dy / dist) * moveSpeed;
        
        // 画面内に収める
        player.x = Math.max(30, Math.min(canvas.width - 30, player.x));
        player.y = Math.max(30, Math.min(canvas.height - 30, player.y));
      }
      
      // 攻撃範囲の視覚表示（薄い円）
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.attackRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // 攻撃範囲内の敵がいる場合、より濃い円
      if (nearestEnemy && nearestDist <= player.attackRange) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.attackRange, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // プレイヤー攻撃
      if (currentTime - player.lastAttackTime > player.attackCooldown && nearestEnemy && nearestDist <= player.attackRange) {
        const damage = player.atk;
        nearestEnemy.hp -= damage;
        addDamageNumber(nearestEnemy.x, nearestEnemy.y - 20, damage, '#fbbf24');
        player.lastAttackTime = currentTime;
        
        // 攻撃エフェクト（線）
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(nearestEnemy.x, nearestEnemy.y);
        ctx.stroke();
        
        // 敵死亡チェック
        if (nearestEnemy.hp <= 0) {
          enemiesRef.current = enemies.filter(e => e.id !== nearestEnemy!.id);
          killedCountRef.current++;
          setEnemiesKilled(killedCountRef.current);
        }
      }
      
      // プレイヤー描画
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // プレイヤー顔
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(player.x - 8, player.y - 5, 4, 0, Math.PI * 2);
      ctx.arc(player.x + 8, player.y - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(player.x, player.y + 5, 8, 0, Math.PI);
      ctx.stroke();
      
      // ダメージ数字更新・描画
      const now = Date.now();
      for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const dn = damageNumbers[i];
        const age = now - dn.createdAt;
        
        if (age > 1000) {
          damageNumbers.splice(i, 1);
          continue;
        }
        
        const alpha = 1 - age / 1000;
        const offsetY = age * 0.05;
        
        ctx.fillStyle = dn.color;
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(dn.value), dn.x, dn.y - offsetY);
        ctx.globalAlpha = 1;
      }
      
      // UI: フロア情報
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Floor ${floor}`, 10, 25);
      ctx.fillText(`Enemies: ${killedCountRef.current}/${enemiesPerFloor}`, 10, 45);
      
      // UI: プレイヤーHP
      ctx.fillStyle = '#333';
      ctx.fillRect(10, 55, 150, 10);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(10, 55, 150 * (player.hp / player.maxHp), 10);
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText(`HP: ${Math.max(0, Math.floor(player.hp))}/${player.maxHp}`, 10, 80);
      
      // ゲーム終了判定
      if (player.hp <= 0) {
        setGameState('dead');
        onPlayerDeath();
        return;
      }
      
      if (killedCountRef.current >= enemiesPerFloor && enemies.length === 0) {
        setGameState('clear');
        onFloorClear();
        return;
      }
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    // 初期敵スポーン
    spawnEnemy();
    animationId = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [floor, playerStats, spawnEnemy, addDamageNumber, onFloorClear, onPlayerDeath, enemiesPerFloor]);
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="rounded-lg border-2 border-slate-600"
      />
      {gameState === 'clear' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-2xl font-bold text-amber-400">🎉 Floor Clear!</div>
        </div>
      )}
      {gameState === 'dead' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-2xl font-bold text-red-400">💀 Game Over</div>
        </div>
      )}
    </div>
  );
}
