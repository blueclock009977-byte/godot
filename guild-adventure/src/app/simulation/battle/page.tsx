'use client';

import { useEffect, useState, useMemo, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { PageLayout } from '@/components/PageLayout';
import { LoadingScreen } from '@/components/LoadingScreen';
import { CharacterIcon } from '@/components/CharacterIcon';
import { MonsterIcon } from '@/components/MonsterIcon';
import { dungeons } from '@/lib/data/dungeons';
import { DungeonType, BattleResult, Character, Monster } from '@/lib/types';
import { runBossBattle } from '@/lib/battle/engine';
import { getLogClassName } from '@/lib/utils';

// ============================================
// アニメーション定数
// ============================================

const LOG_INTERVAL_BASE_MS = 1500;  // ログ表示間隔（1x速度）
const ANIMATION_DURATION_MS = 300;  // アニメーション時間

// 速度オプション
const SPEED_OPTIONS = [
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '3x', value: 3 },
] as const;

// ============================================
// HPバー コンポーネント（アニメーション対応）
// ============================================

interface HPBarProps {
  current: number;
  max: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

function HPBar({ current, max, showText = true, size = 'md', animated = false }: HPBarProps) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));
  const barColor = percent > 50 ? 'bg-green-500' : percent > 25 ? 'bg-yellow-500' : 'bg-red-500';
  
  const heightClass = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-5' : 'h-3';
  const transitionClass = animated ? 'transition-all duration-500 ease-out' : 'transition-all duration-300';
  
  return (
    <div className="w-full">
      <div className={`${heightClass} bg-slate-700 rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${barColor} ${transitionClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showText && (
        <div className="text-xs text-slate-300 text-center mt-0.5">
          {current} / {max}
        </div>
      )}
    </div>
  );
}

// ============================================
// ボス表示 コンポーネント（アニメーション対応）
// ============================================

interface BossDisplayProps {
  floatingDamage?: number | null;
  boss: Monster;
  currentHp?: number;
  isShaking?: boolean;
}

function BossDisplay({ boss, currentHp, isShaking, floatingDamage }: BossDisplayProps) {
  const hp = currentHp ?? boss.stats.maxHp;
  
  return (
    <div className="bg-gradient-to-r from-red-900/30 to-slate-800 rounded-lg p-2 border border-red-800/50">
      <div className="flex items-center gap-3">
        {/* 左: アイコン */}
        <div 
          className={`flex-shrink-0 transition-transform ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          <MonsterIcon monsterId={boss.id} size={56} isBoss={true} />
          {floatingDamage && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-red-500 font-bold text-lg animate-float-up pointer-events-none z-10">
              -{floatingDamage}
            </div>
          )}
        </div>
        {/* 右: 情報 */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-red-400 mb-1">👹 {boss.name}</div>
          <HPBar current={hp} max={boss.stats.maxHp} size="sm" animated />
          <div className="mt-1 flex gap-2 text-xs">
            <span className="text-orange-400">ATK{boss.stats.atk}</span>
            <span className="text-blue-400">DEF{boss.stats.def}</span>
            <span className="text-green-400">AGI{boss.stats.agi}</span>
            <span className="text-purple-400">MAG{boss.stats.mag}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 味方キャラ表示 コンポーネント（アニメーション対応）
// ============================================

interface CharacterDisplayProps {
  character: Character;
  position: 'front' | 'back';
  currentHp?: number;
  currentMp?: number;
  isAttacking?: boolean;
  isShaking?: boolean;
  floatingDamage?: number | null;
  floatingMp?: number | null;
  floatingHeal?: number | null;
}

function CharacterDisplay({ 
  character, position, currentHp, currentMp, 
  isAttacking, isShaking, floatingDamage, floatingMp, floatingHeal 
}: CharacterDisplayProps) {
  const hp = currentHp ?? character.stats?.maxHp ?? 100;
  const maxHp = character.stats?.maxHp ?? 100;
  const mp = currentMp ?? character.stats?.maxMp ?? 50;
  const maxMp = character.stats?.maxMp ?? 50;
  
  return (
    <div className={`relative bg-slate-800 rounded p-1.5 border-2 ${
      position === 'front' ? 'border-orange-600/70' : 'border-blue-600/70'
    } transition-transform duration-300 ${
      isAttacking ? 'translate-y-[-4px] scale-105' : ''
    } ${
      isShaking ? 'animate-shake' : ''
    }`}>
      {/* フローティングダメージ */}
      {floatingDamage && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-red-500 font-bold text-sm animate-float-up pointer-events-none z-10">
          -{floatingDamage}
        </div>
      )}
      {/* フローティング回復 */}
      {floatingHeal && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-green-400 font-bold text-sm animate-float-up pointer-events-none z-10">
          +{floatingHeal}
        </div>
      )}
      {/* フローティングMP消費 */}
      {floatingMp && (
        <div className="absolute -top-4 right-0 text-blue-400 font-bold text-xs animate-float-up pointer-events-none z-10">
          MP-{floatingMp}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <CharacterIcon race={character.race} job={character.job} size={28} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">{character.name}</div>
          {/* HP バー */}
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-0.5">
            <div 
              className={`h-full transition-all duration-300 ${
                (hp / maxHp) > 0.5 ? 'bg-green-500' : (hp / maxHp) > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%` }}
            />
          </div>
          {/* MP バー */}
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, (mp / maxMp) * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 戦闘ログ表示 コンポーネント
// ============================================

interface BattleLogProps {
  logs: string[];
  characters: (Character | null)[];
  monsters: Monster[];
}

function BattleLogArea({ logs, characters, monsters }: BattleLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);
  
  // 名前→アイコン情報のマップを構築
  const nameToIcon = useMemo(() => {
    const map = new Map<string, { type: 'character' | 'monster'; data: Character | Monster }>();
    
    for (const char of characters) {
      if (char) {
        map.set(char.name, { type: 'character', data: char });
      }
    }
    
    for (const monster of monsters) {
      map.set(monster.name, { type: 'monster', data: monster });
    }
    
    return map;
  }, [characters, monsters]);

  // 新しいログが追加されたら自動スクロール
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  const renderLogLine = (log: string, index: number) => {
    if (nameToIcon.size === 0) {
      return (
        <div key={index} className={`${getLogClassName(log)} animate-fadeIn`}>{log}</div>
      );
    }

    const names = Array.from(nameToIcon.keys());
    if (names.length === 0) {
      return (
        <div key={index} className={`${getLogClassName(log)} animate-fadeIn`}>{log}</div>
      );
    }

    const escapedNames = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const namePattern = new RegExp(`(${escapedNames.join('|')})`, 'g');
    const parts = log.split(namePattern);
    
    return (
      <div key={index} className={`${getLogClassName(log)} flex flex-wrap items-center gap-0.5 animate-fadeIn`}>
        {parts.map((part, i) => {
          const iconInfo = nameToIcon.get(part);
          if (iconInfo) {
            return (
              <span key={i} className="inline-flex items-center gap-0.5">
                {iconInfo.type === 'character' && (
                  <CharacterIcon 
                    race={(iconInfo.data as Character).race} 
                    job={(iconInfo.data as Character).job} 
                    size={18} 
                    className="inline-block"
                  />
                )}
                {iconInfo.type === 'monster' && (
                  <MonsterIcon 
                    monsterId={(iconInfo.data as Monster).id} 
                    size={18} 
                    className="inline-block"
                  />
                )}
                <span className="font-semibold">{part}</span>
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 max-h-[400px] overflow-y-auto">
      <div className="space-y-1 text-sm font-mono">
        {logs.map((log, i) => renderLogLine(log, i))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

// ============================================
// ログパーサー（攻撃者・被攻撃者・ダメージ・回復・バフ/デバフを抽出）
// ============================================

interface ParsedLogInfo {
  attacker?: string;
  target?: string;
  damage?: number;
  heal?: number;
  healTarget?: string;
  isKill?: boolean;
  isBuff?: boolean;
  isDebuff?: boolean;
  isRevive?: boolean;
  reviveTarget?: string;
  mpCost?: number;
  mpCaster?: string;
}

// 名前から絵文字を除去するヘルパー
function stripEmoji(name: string): string {
  return name.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').replace(/^[\d\/]+HIT!?\s*/i, '').trim();
}

function parseLogLine(log: string, knownNames: string[]): ParsedLogInfo {
  const info: ParsedLogInfo = {};
  
  // 攻撃ログ: "⚔️ XXXの攻撃！ → ... YYYに💥NNNダメージ"
  const attackMatch = log.match(/^⚔️ (.+?)の攻撃！/);
  if (attackMatch) {
    info.attacker = attackMatch[1];
  }
  
  // スキル攻撃: "XXXのスキル名！"
  const skillMatch = log.match(/^(.+?)の.+?！.*→/);
  if (skillMatch && knownNames.includes(skillMatch[1])) {
    info.attacker = skillMatch[1];
  }
  // ダメージターゲット解析（複数パターン対応）
  // パターン1: 「→ XXXに💥NNNダメージ」（通常攻撃）
  let damageMatch = log.match(/→\s*(.+?)に[💥🔮]*(\d+)ダメージ/);
  if (!damageMatch) {
    // パターン2: 「！ XXXに💥NNNダメージ」（スキル攻撃）
    damageMatch = log.match(/[！!]\s+(.+?)に[💥🔮]*(\d+)ダメージ/);
  }
  if (damageMatch) {
    info.target = stripEmoji(damageMatch[1]);
    info.damage = parseInt(damageMatch[2], 10);
  }
  
  const skillHealMatch = log.match(/→ (.+?)のHPが💚(\d+)回復/);
  if (skillHealMatch) {
    info.healTarget = stripEmoji(skillHealMatch[1]);
    info.heal = parseInt(skillHealMatch[2], 10);
  }
  
  // 回復ログ（リジェネ等）: "XXXはHPNNN回復（リジェネ）"
  const regenMatch = log.match(/(.+?)はHP(\d+)回復/);
  if (regenMatch) {
    info.healTarget = stripEmoji(regenMatch[1]);
    info.heal = parseInt(regenMatch[2], 10);
  }
  
  // 回復ログ（聖なる加護等）: "聖なる加護がXXXをHPNNN回復！"
  const blessingMatch = log.match(/加護が(.+?)をHP(\d+)回復/);
  if (blessingMatch) {
    info.healTarget = stripEmoji(blessingMatch[1]);
    info.heal = parseInt(blessingMatch[2], 10);
  }
  
  // 回復ログ（命を吸収/魂を吸収）: "XXXは命を吸収しHPNNN回復！"
  const absorbHpMatch = log.match(/(.+?)は[命魂]を吸収しHP(\d+)回復/);
  if (absorbHpMatch) {
    info.healTarget = stripEmoji(absorbHpMatch[1]);
    info.heal = parseInt(absorbHpMatch[2], 10);
  }
  
  // 回復ログ（祝福）: "XXXは祝福によりHPNNN回復"
  const blessingHealMatch = log.match(/(.+?)は祝福によりHP(\d+)回復/);
  if (blessingHealMatch) {
    info.healTarget = stripEmoji(blessingHealMatch[1]);
    info.heal = parseInt(blessingHealMatch[2], 10);
  }
  
  // HP吸収: "XXXはHPNNN吸収！"
  const stealMatch = log.match(/(.+?)はHP(\d+)吸収/);
  if (stealMatch) {
    info.healTarget = stripEmoji(stealMatch[1]);
    info.heal = parseInt(stealMatch[2], 10);
  }
  
  // 再生: "XXXは再生しHPNNN回復！"
  const regenMonsterMatch = log.match(/(.+?)は再生しHP(\d+)回復/);
  if (regenMonsterMatch) {
    info.healTarget = stripEmoji(regenMonsterMatch[1]);
    info.heal = parseInt(regenMonsterMatch[2], 10);
  }
  
  // バフ: "📈 XXXのスキル名！ → ..."
  if (log.startsWith('📈')) {
    info.isBuff = true;
  }
  
  // デバフ: "📉 XXXのスキル名！ → ..."
  if (log.startsWith('📉')) {
    info.isDebuff = true;
  }
  
  // 撃破: "XXXを撃破！💀"
  const killMatch = log.match(/(.+?)を撃破！💀/);
  if (killMatch) {
    info.target = stripEmoji(killMatch[1]);
    info.isKill = true;
  }
  
  // 蘇生: "XXXは不死の力で蘇った！" or "XXXの奇跡の力でYYYが蘇生！"
  const selfReviveMatch = log.match(/(.+?)は不死の力で蘇った/);
  if (selfReviveMatch) {
    info.isRevive = true;
    info.reviveTarget = stripEmoji(selfReviveMatch[1]);
  }
  const allyReviveMatch = log.match(/の奇跡の力で(.+?)が蘇生/);
  if (allyReviveMatch) {
    info.isRevive = true;
    info.reviveTarget = stripEmoji(allyReviveMatch[1]);
  }
  
  // HP1で耐え: "XXXは不屈の精神でHP1で耐えた！" or "XXXは死に抗いHP1で耐えた！"
  const surviveMatch = log.match(/(.+?)は[不屈の精神で|死に抗い]HP1で耐えた/);
  if (surviveMatch) {
    // HPを1に設定するために healTarget として扱う（特殊処理）
    info.healTarget = stripEmoji(surviveMatch[1]);
    info.heal = -999; // 特殊マーカー: HP1にする
  }
  
  
  // MP消費: "（MP-18）" or "(MP-18)"
  const mpMatch = log.match(/[（(]MP-(d+)[）)]/);
  if (mpMatch) {
    info.mpCost = parseInt(mpMatch[1], 10);
    // 技を使った人を特定（"XXXのスキル名！"形式）
    const casterMatch = log.match(/^[✨📈📉🔮⚔️💫]*\s*(.+?)の.+?！/);
    if (casterMatch) {
      info.mpCaster = stripEmoji(casterMatch[1]);
    }
  }
  return info;
}

// 【味方】ログからHP/MPを解析
function parseAllyStatusLine(log: string): { name: string; hp: number; mp: number } | null {
  // 形式: "🐙 ド騎慎山：HP159/205🟢 MP22/40" or "ド騎慎山: HP159/205🟢 MP22/40"
  // 名前部分（アイコン含む可能性）: HPの前まで
  const match = log.match(/^[🐙🏠🗡⚔🛡🎭🔮💀👹🐉🦇🐺🐗🦎🐍🦂🕷🦅🐻🦁🐯🦊🐰🐸🦋🌿🔥💧⚡🌙☀❄\s]*(.+?)[：:]\s*HP(\d+)\/\d+.*MP(\d+)\/\d+/);
  if (!match) return null;
  
  return {
    name: match[1].trim(),
    hp: parseInt(match[2], 10),
    mp: parseInt(match[3], 10),
  };
}

// ログ配列から最新の【味方】ステータスを抽出
function extractLatestAllyStatus(logs: string[]): Record<string, { hp: number; mp: number }> {
  const result: Record<string, { hp: number; mp: number }> = {};
  let inAllySection = false;
  
  for (const log of logs) {
    if (log.includes('【味方】')) {
      inAllySection = true;
      continue;
    }
    if (log.includes('【敵】') || log.includes('⚔️') || log.includes('ターン')) {
      inAllySection = false;
      continue;
    }
    
    if (inAllySection) {
      const status = parseAllyStatusLine(log);
      if (status) {
        result[status.name] = { hp: status.hp, mp: status.mp };
      }
    }
  }
  
  return result;
}

// 【敵】ログからボスのHPを解析
function extractBossHpFromLogs(logs: string[], bossName: string): number | null {
  let inEnemySection = false;
  let lastHp: number | null = null;
  
  for (const log of logs) {
    if (log.includes('【敵】')) {
      inEnemySection = true;
      continue;
    }
    if (log.includes('【味方】') || log.includes('⚔️') || log.includes('ターン')) {
      inEnemySection = false;
      continue;
    }
    
    if (inEnemySection && log.includes(bossName)) {
      // 形式: "👹 イフリート: HP850/1000"
      const match = log.match(/HP(\d+)\/\d+/);
      if (match) {
        lastHp = parseInt(match[1], 10);
      }
    }
  }
  
  return lastHp;
}

// ============================================
// HP推移を事前計算
// ============================================

interface HPState {
  [name: string]: number;
}

function precomputeHPStates(
  logs: string[],
  knownNames: string[],
  initialHPs: Record<string, number>,
  maxHPs: Record<string, number>
): HPState[] {
  const states: HPState[] = [];
  const currentHPs = { ...initialHPs };
  
  // 初期状態を追加
  states.push({ ...currentHPs });
  
  for (const log of logs) {
    const parsed = parseLogLine(log, knownNames);
    
    
    // ダメージ処理
    if (parsed.target && parsed.damage && parsed.damage > 0) {
      if (currentHPs[parsed.target] !== undefined) {
        currentHPs[parsed.target] = Math.max(0, currentHPs[parsed.target] - parsed.damage);
        
      }
    }
    
    // 回復処理
    if (parsed.healTarget && parsed.heal !== undefined) {
      if (currentHPs[parsed.healTarget] !== undefined) {
        const maxHp = maxHPs[parsed.healTarget] || currentHPs[parsed.healTarget];
        if (parsed.heal === -999) {
          // HP1で耐え
          currentHPs[parsed.healTarget] = 1;
        } else {
          currentHPs[parsed.healTarget] = Math.min(maxHp, currentHPs[parsed.healTarget] + parsed.heal);
        }
        
      }
    }
    
    // 撃破処理（念のため）
    if (parsed.isKill && parsed.target) {
      if (currentHPs[parsed.target] !== undefined) {
        currentHPs[parsed.target] = 0;
        
      }
    }
    
    // 蘇生処理
    if (parsed.isRevive && parsed.reviveTarget) {
      if (currentHPs[parsed.reviveTarget] !== undefined) {
        const maxHp = maxHPs[parsed.reviveTarget] || 100;
        // 蘇生時は30%回復（大まかな推定）
        currentHPs[parsed.reviveTarget] = Math.floor(maxHp * 0.3);
        
      }
    }
    
    // 状態を保存
    states.push({ ...currentHPs });
  }
  
  return states;
}

// ============================================
// バトルコンテンツ（useSearchParams使用）
// ============================================

// テスト用パーティデータ
const TEST_PARTY: { front: Character[]; back: Character[] } = {
  front: [
    {
      id: 'test-1',
      name: 'テスト騎士',
      race: 'human',
      job: 'knight',
      level: 10,
      exp: 0,
      trait: 'brave',
      environment: 'grassland',
      stats: { hp: 150, maxHp: 150, mp: 30, maxMp: 30, atk: 20, def: 15, mag: 5, agi: 8 },
    } as Character,
    {
      id: 'test-2',
      name: 'テスト戦士',
      race: 'dwarf',
      job: 'warrior',
      level: 10,
      exp: 0,
      trait: 'stubborn',
      environment: 'mountain',
      stats: { hp: 180, maxHp: 180, mp: 20, maxMp: 20, atk: 25, def: 18, mag: 3, agi: 6 },
    } as Character,
  ],
  back: [
    {
      id: 'test-3',
      name: 'テスト魔法使い',
      race: 'elf',
      job: 'mage',
      level: 10,
      exp: 0,
      trait: 'genius',
      environment: 'forest',
      stats: { hp: 80, maxHp: 80, mp: 100, maxMp: 100, atk: 5, def: 5, mag: 30, agi: 10 },
    } as Character,
    {
      id: 'test-4',
      name: 'テストヒーラー',
      race: 'human',
      job: 'priest',
      level: 10,
      exp: 0,
      trait: 'cautious',
      environment: 'city',
      stats: { hp: 100, maxHp: 100, mp: 80, maxMp: 80, atk: 8, def: 8, mag: 25, agi: 9 },
    } as Character,
  ],
};

function SimulationBattleContent() {
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading, party: storeParty } = useGameStore();
  
  // テストモードかどうか
  const isTestMode = searchParams.get('test') === '1';
  
  // テストモードならテストパーティを使用
  const party = isTestMode ? TEST_PARTY : storeParty;
  
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);
  const [allLogs, setAllLogs] = useState<string[]>([]);
  
  // アニメーション用state
  const [displayedLogIndex, setDisplayedLogIndex] = useState(0);
  const [attackingCharName, setAttackingCharName] = useState<string | null>(null);
  const [shakingCharName, setShakingCharName] = useState<string | null>(null);
  const [floatingDamages, setFloatingDamages] = useState<Record<string, number | null>>({});
  const [floatingMps, setFloatingMps] = useState<Record<string, number | null>>({});
  const [floatingHeals, setFloatingHeals] = useState<Record<string, number | null>>({});
  const [characterHPs, setCharacterHPs] = useState<Record<string, number>>({});
  const [characterMPs, setCharacterMPs] = useState<Record<string, number>>({});
  const [bossHp, setBossHp] = useState<number | null>(null);
  const [bossFloatingDamage, setBossFloatingDamage] = useState<number | null>(null);
  const [battleEnded, setBattleEnded] = useState(false);
  
  // HP推移の事前計算結果
  const [hpStates, setHpStates] = useState<HPState[]>([]);
  
  // 戦闘速度（1, 2, 3）
  const [battleSpeed, setBattleSpeed] = useState(1);
  
  // URLパラメータからダンジョンを取得
  const dungeonId = searchParams.get('dungeon') as DungeonType | null;
  const dungeon = dungeonId ? dungeons[dungeonId] : null;
  
  // パーティメンバーを取得
  const partyMembers = useMemo(() => {
    return [
      ...(party.front || []),
      ...(party.back || []),
    ].filter((c): c is Character => c !== null);
  }, [party]);
  
  // 全キャラ/モンスター名のリスト
  const allNames = useMemo(() => {
    const names = partyMembers.map(c => c.name);
    if (dungeon?.boss) names.push(dungeon.boss.name);
    for (const spawn of dungeon?.monsters || []) {
      if (!names.includes(spawn.monster.name)) {
        names.push(spawn.monster.name);
      }
    }
    return names;
  }, [partyMembers, dungeon]);
  
  // 遭遇するモンスター一覧（ボス + 通常モンスター）
  const monsters = useMemo(() => {
    if (!dungeon) return [];
    const result: Monster[] = [];
    if (dungeon.boss) {
      result.push(dungeon.boss);
    }
    for (const spawn of dungeon.monsters) {
      if (!result.find(m => m.id === spawn.monster.id)) {
        result.push(spawn.monster);
      }
    }
    return result;
  }, [dungeon]);
  
  // 初期HP設定
  const initializeHPs = useCallback(() => {
    const hps: Record<string, number> = {};
    for (const char of partyMembers) {
      hps[char.name] = char.stats?.maxHp || 100;
    }
    setCharacterHPs(hps);
    if (dungeon?.boss) {
      setBossHp(dungeon.boss.stats.maxHp);
    }
  }, [partyMembers, dungeon]);
  
  // 初期HPとmaxHPを計算
  const { initialHPs, maxHPs } = useMemo(() => {
    const initial: Record<string, number> = {};
    const max: Record<string, number> = {};
    for (const char of partyMembers) {
      initial[char.name] = char.stats?.maxHp || 100;
      max[char.name] = char.stats?.maxHp || 100;
    }
    if (dungeon?.boss) {
      initial[dungeon.boss.name] = dungeon.boss.stats.maxHp;
      max[dungeon.boss.name] = dungeon.boss.stats.maxHp;
    }
    return { initialHPs: initial, maxHPs: max };
  }, [partyMembers, dungeon]);
  
  // 戦闘実行
  useEffect(() => {
    if (!battleStarted || !dungeon || partyMembers.length === 0) return;
    
    // initializeHPsはtimerの中で呼ぶ
    
    // 少し待ってから戦闘開始
    const timer = setTimeout(() => {
      initializeHPs();
      const result = runBossBattle(party, dungeonId!);
      setBattleResult(result);
      
      // ログを展開
      const logs: string[] = [];
      for (const logEntry of result.logs) {
        if (logEntry.message) {
          logs.push(...logEntry.message.split('\n').filter(l => l.trim()));
        }
      }
      setAllLogs(logs);
      setDisplayedLogIndex(0);
      
      // HP推移を事前計算
      const states = precomputeHPStates(logs, allNames, initialHPs, maxHPs);
      setHpStates(states);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [battleStarted, dungeon, dungeonId, party, partyMembers.length, initializeHPs, allNames, initialHPs, maxHPs]);
  
  // ログを1行ずつアニメーション表示（HP推移は事前計算済み）
  useEffect(() => {
    if (allLogs.length === 0 || displayedLogIndex >= allLogs.length) {
      if (allLogs.length > 0 && displayedLogIndex >= allLogs.length) {
        setTimeout(() => setBattleEnded(true), 0);
      }
      return;
    }
    
    const intervalMs = LOG_INTERVAL_BASE_MS / battleSpeed;
    const timer = setInterval(() => {
      setDisplayedLogIndex(prev => {
        const nextIndex = prev + 1;
        
        // 現在のログを解析してアニメーション
        if (nextIndex <= allLogs.length) {
          const currentLog = allLogs[nextIndex - 1];
          const parsed = parseLogLine(currentLog, allNames);
          
          // 攻撃アニメーション
          if (parsed.attacker) {
            setAttackingCharName(parsed.attacker);
            setTimeout(() => setAttackingCharName(null), ANIMATION_DURATION_MS);
          
          // MP消費フローティング
          if (parsed.mpCost && parsed.mpCaster) {
            setFloatingMps(prev => ({ ...prev, [parsed.mpCaster!]: parsed.mpCost! }));
            setTimeout(() => {
              setFloatingMps(prev => ({ ...prev, [parsed.mpCaster!]: null }));
            }, 800);
          
          // フローティング回復
          if (parsed.healTarget && parsed.heal && parsed.heal > 0) {
            setFloatingHeals(prev => ({ ...prev, [parsed.healTarget!]: parsed.heal! }));
            setTimeout(() => {
              setFloatingHeals(prev => ({ ...prev, [parsed.healTarget!]: null }));
            }, 800);
          }
          }
          }
          
          // 被ダメージアニメーション + HP直接更新
          if (parsed.target && parsed.damage) {
            setShakingCharName(parsed.target);
            setTimeout(() => setShakingCharName(null), ANIMATION_DURATION_MS);
            
            // フローティングダメージ
            setFloatingDamages(prev => ({ ...prev, [parsed.target!]: parsed.damage! }));
            setTimeout(() => {
              setFloatingDamages(prev => ({ ...prev, [parsed.target!]: null }));
            }, 800);
            
            // ボスへのダメージ
            if (parsed.target === dungeon?.boss?.name) {
              setBossFloatingDamage(parsed.damage!);
              setTimeout(() => setBossFloatingDamage(null), 800);
              // ボスHP直接更新
              setBossHp(prev => Math.max(0, (prev ?? dungeon.boss!.stats.maxHp) - parsed.damage!));
            } else {
              // 味方へのダメージ - HP直接更新
              setCharacterHPs(prev => {
                const currentHp = prev[parsed.target!];
                if (currentHp !== undefined) {
                  return { ...prev, [parsed.target!]: Math.max(0, currentHp - parsed.damage!) };
                }
                return prev;
              });
            }
          }
          
          // フローティング回復 + HP直接更新
          if (parsed.healTarget && parsed.heal && parsed.heal > 0) {
            setFloatingHeals(prev => ({ ...prev, [parsed.healTarget!]: parsed.heal! }));
            setTimeout(() => {
              setFloatingHeals(prev => ({ ...prev, [parsed.healTarget!]: null }));
            }, 800);
            
            // HP直接回復
            const maxHp = partyMembers.find(c => c.name === parsed.healTarget)?.stats?.maxHp ?? 100;
            setCharacterHPs(prev => {
              const currentHp = prev[parsed.healTarget!];
              if (currentHp !== undefined) {
                return { ...prev, [parsed.healTarget!]: Math.min(maxHp, currentHp + parsed.heal!) };
              }
              return prev;
            });
          }
        }
        
        return nextIndex;
      });
    }, intervalMs);
    
    return () => clearInterval(timer);
  }, [allLogs, displayedLogIndex, allNames, dungeon, hpStates, partyMembers, battleSpeed]);
  
  // 表示するログ
  const displayedLogs = allLogs.slice(0, displayedLogIndex);
  
  // 【味方】ログからHP/MPを更新
  useEffect(() => {
    if (displayedLogs.length === 0) return;
    
    const status = extractLatestAllyStatus(displayedLogs);
    if (Object.keys(status).length > 0) {
      const newHPs: Record<string, number> = {};
      const newMPs: Record<string, number> = {};
      
      for (const [name, s] of Object.entries(status)) {
        newHPs[name] = s.hp;
        newMPs[name] = s.mp;
      }
      
      setCharacterHPs(prev => ({ ...prev, ...newHPs }));
      setCharacterMPs(prev => ({ ...prev, ...newMPs }));
    
    // ボスのHP更新
    if (dungeon?.boss) {
      const bossHpFromLog = extractBossHpFromLogs(displayedLogs, dungeon.boss.name);
      if (bossHpFromLog !== null) {
        setBossHp(bossHpFromLog);
      }
    }
    }
  }, [displayedLogs]);
  
  // スキップ機能（事前計算した最終HPを使用）
  const skipToEnd = () => {
    setDisplayedLogIndex(allLogs.length);
    setTimeout(() => setBattleEnded(true), 0);
    
    // 最終HPを反映（事前計算した最終状態を使用）
    if (hpStates.length > 0) {
      const finalState = hpStates[hpStates.length - 1];
      if (dungeon?.boss?.name && finalState[dungeon.boss.name] !== undefined) {
        setBossHp(finalState[dungeon.boss.name]);
      }
      const newCharHPs: Record<string, number> = {};
      for (const char of partyMembers) {
        if (finalState[char.name] !== undefined) {
          newCharHPs[char.name] = finalState[char.name];
        }
      }
      setCharacterHPs(prev => ({ ...prev, ...newCharHPs }));
    }
  };
  
  // リセット機能
  const resetBattle = () => {
    setBattleStarted(false);
    setBattleResult(null);
    setAllLogs([]);
    setDisplayedLogIndex(0);
    setAttackingCharName(null);
    setShakingCharName(null);
    setCharacterHPs({});
    setBossHp(null);
    setBattleEnded(false);
    setHpStates([]);
    setBattleSpeed(1);
  };
  
  // ローディング中またはログイン前
  if (!isLoggedIn || isLoading) {
    return <LoadingScreen />;
  }
  
  // ダンジョン未指定
  if (!dungeonId || !dungeon) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <p className="text-slate-400 mb-4">ダンジョンが選択されていません</p>
          <Link
            href="/simulation"
            className="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-semibold"
          >
            ボス選択に戻る
          </Link>
        </div>
      </PageLayout>
    );
  }
  
  // パーティ未編成（テストモードでない場合のみ）
  if (!isTestMode && partyMembers.length === 0) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <p className="text-slate-400 mb-4">パーティが編成されていません</p>
          <Link
            href="/party"
            className="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-semibold"
          >
            パーティを編成する
          </Link>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">⚔️ {dungeon.name}</h1>
        <Link
          href="/simulation"
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
        >
          ← 戻る
        </Link>
      </div>
      
      {/* 戦闘開始前 */}
      {!battleStarted && (
        <>
          {/* ボス表示 */}
          {dungeon.boss && (
            <div className="mb-4">
              <BossDisplay boss={dungeon.boss} />
            </div>
          )}
          
          {/* 味方パーティ（コンパクト表示） */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {(party.front || []).map((char) => char && (
                <CharacterDisplay key={char.id} character={char} position="front" />
              ))}
              {(party.back || []).map((char) => char && (
                <CharacterDisplay key={char.id} character={char} position="back" />
              ))}
            </div>
          </div>
          {/* 戦闘開始ボタン */}
          <button
            onClick={() => setBattleStarted(true)}
            className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-lg transition-colors"
          >
            ⚔️ 戦闘開始！
          </button>
        </>
      )}
      
      {/* 戦闘中/戦闘後 */}
      {battleStarted && (
        <>
          {/* ボス表示（HP更新あり） */}
          {dungeon.boss && (
            <div className="mb-4">
              <BossDisplay 
                boss={dungeon.boss} 
                currentHp={bossHp ?? dungeon.boss.stats.maxHp}
                isShaking={shakingCharName === dungeon.boss.name}
                floatingDamage={bossFloatingDamage}
              />
            </div>
          )}
          
          {/* 味方パーティ（コンパクト表示） */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {/* 前列 */}
              {(party.front || []).map((char) => char && (
                <CharacterDisplay 
                  key={char.id} 
                  character={char} 
                  position="front"
                  currentHp={characterHPs[char.name] ?? char.stats?.maxHp ?? 100}
                  currentMp={characterMPs[char.name] ?? char.stats?.maxMp ?? 50}
                  isAttacking={attackingCharName === char.name}
                  isShaking={shakingCharName === char.name}
                  floatingDamage={floatingDamages[char.name]}
                  floatingMp={floatingMps[char.name]}
                  floatingHeal={floatingHeals[char.name]}
                />
              ))}
              {/* 後列 */}
              {(party.back || []).map((char) => char && (
                <CharacterDisplay 
                  key={char.id} 
                  character={char} 
                  position="back"
                  currentHp={characterHPs[char.name] ?? char.stats?.maxHp ?? 100}
                  currentMp={characterMPs[char.name] ?? char.stats?.maxMp ?? 50}
                  isAttacking={attackingCharName === char.name}
                  isShaking={shakingCharName === char.name}
                  floatingDamage={floatingDamages[char.name]}
                  floatingMp={floatingMps[char.name]}
                  floatingHeal={floatingHeals[char.name]}
                />
              ))}
            </div>
          </div>
          
          {/* 結果表示（戦闘終了後） */}
          {battleEnded && battleResult && (
            <div className={`mb-4 p-4 rounded-lg text-center ${
              battleResult.victory 
                ? 'bg-green-900/50 border border-green-700' 
                : 'bg-red-900/50 border border-red-700'
            }`}>
              {battleResult.victory ? (
                <div>
                  <div className="text-2xl mb-1">🎉 勝利！ 🎉</div>
                  <div className="text-sm text-slate-300">
                    {dungeon.boss?.name}を撃破した！
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl mb-1">💀 敗北... 💀</div>
                  <div className="text-sm text-slate-300">
                    {battleResult.encountersCleared}/{battleResult.totalEncounters} 遭遇クリア
                  </div>
                  {/* 敗北時の敵HP表示 */}
                  {dungeon.boss && bossHp !== null && bossHp > 0 && (
                    <div className="mt-2 text-orange-400">
                      👹 {dungeon.boss.name}の残りHP: {bossHp}/{dungeon.boss.stats.maxHp}
                      <span className="text-slate-400 ml-2">
                        ({Math.floor((bossHp / dungeon.boss.stats.maxHp) * 100)}%)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* 戦闘ログ */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-400">📜 戦闘ログ</h2>
              <div className="flex items-center gap-2">
                {/* 速度調整 */}
                {!battleEnded && allLogs.length > 0 && (
                  <div className="flex items-center gap-1">
                    {SPEED_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setBattleSpeed(opt.value)}
                        className={`px-2 py-1 text-xs rounded ${
                          battleSpeed === opt.value
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
                {/* スキップ */}
                {!battleEnded && allLogs.length > 0 && (
                  <button
                    onClick={skipToEnd}
                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded"
                  >
                    ⏩ スキップ
                  </button>
                )}
              </div>
            </div>
            {displayedLogs.length > 0 ? (
              <BattleLogArea 
                logs={displayedLogs} 
                characters={partyMembers} 
                monsters={monsters} 
              />
            ) : (
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 text-center">
                <div className="animate-pulse text-slate-400">戦闘中...</div>
              </div>
            )}
          </div>
          
          {/* 再戦・戻るボタン */}
          {battleEnded && battleResult && (
            <div className="flex gap-2">
              <button
                onClick={resetBattle}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-semibold"
              >
                🔄 再戦
              </button>
              <Link
                href="/simulation"
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-center"
              >
                ← ボス選択に戻る
              </Link>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}

// ============================================
// メインページ（Suspenseでラップ）
// ============================================

export default function SimulationBattlePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SimulationBattleContent />
    </Suspense>
  );
}
