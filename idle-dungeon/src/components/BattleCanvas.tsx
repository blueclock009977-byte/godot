'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { EnemyType, selectRandomEnemy, selectBoss, calculateEnemyStats, isBossFloor } from '@/data/enemies';
import { SkillEffect } from '@/lib/types';

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
  // スキル効果
  critRate: number;
  critDamage: number;
  dodgeRate: number;
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
  value: number | string;  // 数値または"MISS"などの文字
  color: string;
  createdAt: number;
  isCrit?: boolean;        // クリティカル表示
  isMiss?: boolean;        // 回避表示
}

interface BattleCanvasProps {
  playerStats: {
    maxHp: number;
    hp: number;  // 現在HP
    atk: number;
    def: number;
    speed: number;
  };
  skillEffects: SkillEffect;  // スキル効果を受け取る
  floor: number;
  potionCount: number;        // ポーション所持数
  autoBattle?: boolean;       // オートバトルモード
  onFloorClear: () => void;
  onPlayerDeath: () => void;
  onBossKill?: (bonusCoins: number) => void;
  onEnemyKill?: (isBoss: boolean) => void; // 敵撃破時（統計記録用）
  onUsePotion?: () => boolean; // ポーション使用（成功時true）
  onHpChange?: (newHp: number) => void; // HP変化通知
  onAutoNextFloor?: () => void; // オートバトル時の次フロア開始
}

export function BattleCanvas({ playerStats, skillEffects, floor, potionCount, autoBattle, onFloorClear, onPlayerDeath, onBossKill, onEnemyKill, onUsePotion, onHpChange, onAutoNextFloor }: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'clear' | 'dead'>('playing');
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const isBoss = isBossFloor(floor);
  const enemiesPerFloor = isBoss ? 1 : 5 + Math.floor(floor / 5) * 2;
  
  // スキル効果を適用したステータス計算
  const atkBonus = 1 + (skillEffects.atkPercent || 0) / 100;
  const defBonus = 1 + (skillEffects.defPercent || 0) / 100;
  const critRate = skillEffects.critRate || 0;
  const critDamage = 150 + (skillEffects.critDamage || 0); // 基礎150% + スキル効果
  const dodgeRate = skillEffects.dodgeRate || 0;
  
  // ゲーム状態をrefで管理（アニメーションループ内で使用）
  const playerRef = useRef<Player>({
    x: 200,
    y: 300,
    hp: playerStats.hp,  // 現在HPから開始
    maxHp: playerStats.maxHp,
    atk: Math.floor(playerStats.atk * atkBonus),
    def: Math.floor(playerStats.def * defBonus),
    speed: playerStats.speed,
    attackRange: 120, // 攻撃範囲
    attackCooldown: 1000, // ms
    lastAttackTime: 0,
    critRate,
    critDamage,
    dodgeRate,
  });
  
  // ポーション使用
  const handleUsePotion = useCallback(() => {
    if (!onUsePotion) return;
    const success = onUsePotion();
    if (success) {
      // HP回復（50%）
      const healAmount = Math.floor(playerRef.current.maxHp * 0.5);
      playerRef.current.hp = Math.min(
        playerRef.current.maxHp,
        playerRef.current.hp + healAmount
      );
    }
  }, [onUsePotion]);
  
  const enemiesRef = useRef<Enemy[]>([]);
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const nextEnemyIdRef = useRef(0);
  const nextDamageIdRef = useRef(0);
  const killedCountRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);
  
  // 敵をスポーン
  const spawnEnemy = useCallback(() => {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    
    // ボスフロアならボスを生成
    const enemyType = isBoss ? selectBoss(floor) : selectRandomEnemy(floor);
    const stats = calculateEnemyStats(enemyType, floor);
    
    // ボスは変動なし、通常敵は±10%のランダム変動
    const hpVariance = isBoss ? 1 : 1 + (Math.random() - 0.5) * 0.2;
    const atkVariance = isBoss ? 1 : 1 + (Math.random() - 0.5) * 0.2;
    
    const enemy: Enemy = {
      id: nextEnemyIdRef.current++,
      type: enemyType,
      x: side === 'left' ? -30 : 430,
      y: isBoss ? 200 : 150 + Math.random() * 200, // ボスは中央
      hp: Math.floor(stats.hp * hpVariance),
      maxHp: Math.floor(stats.hp * hpVariance),
      atk: Math.floor(stats.atk * atkVariance),
      speed: stats.speed,
      size: stats.size,
    };
    enemiesRef.current.push(enemy);
  }, [floor, isBoss]);
  
  // ボス用の王冠を描画
  const drawBossCrown = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.save();
    ctx.fillStyle = '#fbbf24'; // 金色
    
    // 王冠の土台
    const crownWidth = size * 0.8;
    const crownHeight = size * 0.4;
    const crownY = y - size - crownHeight;
    
    ctx.beginPath();
    ctx.moveTo(x - crownWidth / 2, crownY + crownHeight);
    ctx.lineTo(x - crownWidth / 2, crownY + crownHeight * 0.4);
    ctx.lineTo(x - crownWidth * 0.25, crownY + crownHeight * 0.6);
    ctx.lineTo(x, crownY);
    ctx.lineTo(x + crownWidth * 0.25, crownY + crownHeight * 0.6);
    ctx.lineTo(x + crownWidth / 2, crownY + crownHeight * 0.4);
    ctx.lineTo(x + crownWidth / 2, crownY + crownHeight);
    ctx.closePath();
    ctx.fill();
    
    // 宝石
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x, crownY + crownHeight * 0.5, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }, []);
  
  // ボス用のオーラエフェクト
  const drawBossAura = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number, time: number) => {
    ctx.save();
    
    // パルスするオーラ
    const pulse = Math.sin(time * 0.003) * 0.2 + 0.8;
    const auraSize = size * 1.5 * pulse;
    
    const gradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, auraSize);
    gradient.addColorStop(0, 'rgba(220, 38, 38, 0.3)');
    gradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.2)');
    gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, auraSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }, []);
  
  // 敵描画関数（タイプ別）
  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) => {
    const { type, x, y, size } = enemy;
    
    ctx.save();
    
    // ボスならオーラを描画
    if (type.isBoss) {
      drawBossAura(ctx, x, y, size, time);
    }
    
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
    
    // ボスなら王冠を描画
    if (type.isBoss) {
      drawBossCrown(ctx, x, y, size);
    }
    
    ctx.restore();
  }, [drawBossCrown, drawBossAura]);
  
  // ダメージ数字を追加
  const addDamageNumber = useCallback((
    x: number, 
    y: number, 
    value: number | string, 
    color: string,
    options?: { isCrit?: boolean; isMiss?: boolean }
  ) => {
    damageNumbersRef.current.push({
      id: nextDamageIdRef.current++,
      x,
      y,
      value,
      color,
      createdAt: Date.now(),
      isCrit: options?.isCrit,
      isMiss: options?.isMiss,
    });
  }, []);
  
  // クリティカルエフェクト描画
  const drawCritEffect = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save();
    
    // 放射状のスターバースト
    const spokes = 8;
    const innerRadius = 10;
    const outerRadius = 30 + Math.sin(time * 0.01) * 5;
    
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    for (let i = 0; i < spokes * 2; i++) {
      const angle = (i * Math.PI) / spokes;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      if (i === 0) {
        ctx.moveTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      } else {
        ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      }
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }, []);
  
  // ゲームループ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let lastTime = 0;
    let critEffectTarget: { x: number; y: number; endTime: number } | null = null;
    
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
            // 回避判定
            if (Math.random() * 100 < player.dodgeRate) {
              // 回避成功！
              addDamageNumber(player.x, player.y - 20, 'MISS', '#60a5fa', { isMiss: true });
            } else {
              // ダメージを受ける
              const damage = Math.max(1, enemy.atk - player.def);
              player.hp -= damage;
              addDamageNumber(player.x, player.y - 20, damage, '#ff6b6b');
            }
          }
        }
        
        // 敵描画（タイプに応じた見た目）
        drawEnemy(ctx, enemy, currentTime);
        
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
        // クリティカル判定
        const isCrit = Math.random() * 100 < player.critRate;
        const damageMultiplier = isCrit ? player.critDamage / 100 : 1;
        const damage = Math.floor(player.atk * damageMultiplier);
        
        nearestEnemy.hp -= damage;
        
        if (isCrit) {
          // クリティカル時は金色で「CRIT!」+ ダメージ
          addDamageNumber(nearestEnemy.x, nearestEnemy.y - 30, 'CRIT!', '#fbbf24', { isCrit: true });
          addDamageNumber(nearestEnemy.x, nearestEnemy.y - 10, damage, '#fbbf24', { isCrit: true });
          critEffectTarget = { x: nearestEnemy.x, y: nearestEnemy.y, endTime: currentTime + 300 };
        } else {
          addDamageNumber(nearestEnemy.x, nearestEnemy.y - 20, damage, '#fbbf24');
        }
        
        player.lastAttackTime = currentTime;
        
        // 攻撃エフェクト（線）
        ctx.strokeStyle = isCrit ? '#fbbf24' : '#fbbf24';
        ctx.lineWidth = isCrit ? 5 : 3;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(nearestEnemy.x, nearestEnemy.y);
        ctx.stroke();
        
        // 敵死亡チェック
        if (nearestEnemy.hp <= 0) {
          const isBoss = nearestEnemy.type.isBoss;
          
          // ボス撃破時の特別報酬
          if (isBoss && onBossKill) {
            const bonusCoins = 50 + floor * 10; // ボス報酬: 基本50 + フロア×10
            onBossKill(bonusCoins);
          }
          
          // 敵撃破を統計に記録（ボスでない場合）
          if (!isBoss && onEnemyKill) {
            onEnemyKill(false);
          }
          
          enemiesRef.current = enemies.filter(e => e.id !== nearestEnemy!.id);
          killedCountRef.current++;
          setEnemiesKilled(killedCountRef.current);
        }
      }
      
      // クリティカルエフェクト描画
      if (critEffectTarget && currentTime < critEffectTarget.endTime) {
        drawCritEffect(ctx, critEffectTarget.x, critEffectTarget.y, currentTime);
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
        
        // クリティカル時は大きめのフォント + 揺れ
        if (dn.isCrit) {
          const shake = Math.sin(age * 0.05) * 2;
          ctx.font = 'bold 28px sans-serif';
          ctx.textAlign = 'center';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          ctx.strokeText(String(dn.value), dn.x + shake, dn.y - offsetY);
          ctx.fillText(String(dn.value), dn.x + shake, dn.y - offsetY);
        } else if (dn.isMiss) {
          // MISS時は斜めにフェードアウト
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeText(String(dn.value), dn.x + age * 0.03, dn.y - offsetY);
          ctx.fillText(String(dn.value), dn.x + age * 0.03, dn.y - offsetY);
        } else {
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(dn.value), dn.x, dn.y - offsetY);
        }
        
        ctx.globalAlpha = 1;
      }
      
      // UI: フロア情報
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      
      if (isBoss) {
        // ボスフロア表示
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`👑 BOSS Floor ${floor}`, 10, 25);
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`⚔️ BOSS BATTLE!`, 10, 45);
      } else {
        ctx.fillText(`Floor ${floor}`, 10, 25);
        ctx.fillText(`Enemies: ${killedCountRef.current}/${enemiesPerFloor}`, 10, 45);
      }
      
      // UI: プレイヤーHP
      ctx.fillStyle = '#333';
      ctx.fillRect(10, 55, 150, 10);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(10, 55, 150 * (player.hp / player.maxHp), 10);
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText(`HP: ${Math.max(0, Math.floor(player.hp))}/${player.maxHp}`, 10, 80);
      
      // UI: スキル効果表示（右上）
      ctx.textAlign = 'right';
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#94a3b8';
      let skillY = 20;
      if (player.critRate > 0) {
        ctx.fillText(`CRIT: ${player.critRate}%`, canvas.width - 10, skillY);
        skillY += 14;
      }
      if (player.dodgeRate > 0) {
        ctx.fillText(`回避: ${player.dodgeRate}%`, canvas.width - 10, skillY);
        skillY += 14;
      }
      ctx.textAlign = 'left';
      
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
  }, [floor, playerStats, skillEffects, spawnEnemy, addDamageNumber, drawEnemy, drawCritEffect, onFloorClear, onPlayerDeath, onBossKill, onEnemyKill, enemiesPerFloor, isBoss, atkBonus, defBonus, critRate, critDamage, dodgeRate]);
  
  // 現在のプレイヤーHPを取得するためのstate（UI更新用）
  const [displayHp, setDisplayHp] = useState(playerStats.hp);
  
  // 定期的にHPを同期
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayHp(Math.max(0, Math.floor(playerRef.current.hp)));
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  // オートバトル: クリア後に自動で次のフロアへ
  useEffect(() => {
    if (gameState === 'clear' && autoBattle && onAutoNextFloor) {
      const timer = setTimeout(() => {
        onAutoNextFloor();
      }, 1500); // 1.5秒後に次のフロアへ
      return () => clearTimeout(timer);
    }
  }, [gameState, autoBattle, onAutoNextFloor]);

  return (
    <div className="relative">
      {/* スキル効果パネル */}
      <div className="mb-2 p-2 bg-slate-700 rounded-lg flex flex-wrap gap-2 text-xs">
        <span className="text-slate-400">スキル効果:</span>
        {critRate > 0 && (
          <span className="px-2 py-0.5 bg-amber-600/30 rounded text-amber-300">
            CRIT +{critRate}%
          </span>
        )}
        {skillEffects.critDamage && skillEffects.critDamage > 0 && (
          <span className="px-2 py-0.5 bg-orange-600/30 rounded text-orange-300">
            CRIT威力 +{skillEffects.critDamage}%
          </span>
        )}
        {dodgeRate > 0 && (
          <span className="px-2 py-0.5 bg-blue-600/30 rounded text-blue-300">
            回避 +{dodgeRate}%
          </span>
        )}
        {skillEffects.atkPercent && skillEffects.atkPercent > 0 && (
          <span className="px-2 py-0.5 bg-red-600/30 rounded text-red-300">
            ATK +{skillEffects.atkPercent}%
          </span>
        )}
        {skillEffects.defPercent && skillEffects.defPercent > 0 && (
          <span className="px-2 py-0.5 bg-green-600/30 rounded text-green-300">
            DEF +{skillEffects.defPercent}%
          </span>
        )}
        {skillEffects.hpRegen && skillEffects.hpRegen > 0 && (
          <span className="px-2 py-0.5 bg-emerald-600/30 rounded text-emerald-300">
            HP回復 +{skillEffects.hpRegen}%
          </span>
        )}
        {Object.keys(skillEffects).length === 0 && (
          <span className="text-slate-500">なし</span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="rounded-lg border-2 border-slate-600"
      />
      
      {/* ポーション使用ボタン */}
      {gameState === 'playing' && (
        <button
          onClick={handleUsePotion}
          disabled={potionCount <= 0 || displayHp >= playerStats.maxHp}
          className={`absolute bottom-3 right-3 px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-1 ${
            potionCount > 0 && displayHp < playerStats.maxHp
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-600 text-slate-400 cursor-not-allowed'
          }`}
        >
          🧪 {potionCount}
        </button>
      )}
      
      {gameState === 'clear' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">
              {isBoss ? '👑 BOSS DEFEATED!' : '🎉 Floor Clear!'}
            </div>
            {isBoss && (
              <div className="text-lg text-yellow-300 mt-2">
                💰 Bonus Coins +{50 + floor * 10}!
              </div>
            )}
          </div>
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
