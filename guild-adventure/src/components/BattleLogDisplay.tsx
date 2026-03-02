import { getLogClassName } from '@/lib/utils';
import { Character, Monster } from '@/lib/types';
import { CharacterIcon } from './CharacterIcon';
import { MonsterIcon } from './MonsterIcon';
import { useMemo } from 'react';

interface BattleLogDisplayProps {
  logs: string[];
  emptyMessage?: string;
  /** パーティのキャラクター（アイコン表示用） */
  characters?: (Character | null)[];
  /** 遭遇モンスター（アイコン表示用） */
  monsters?: Monster[];
}

// 名前→アイコン情報のマッピング型
interface IconInfo {
  type: 'character' | 'monster';
  character?: Character;
  monster?: Monster;
}

export default function BattleLogDisplay({ 
  logs, 
  emptyMessage = "探索中...",
  characters,
  monsters 
}: BattleLogDisplayProps) {
  // 名前→アイコン情報のマップを構築
  const nameToIcon = useMemo(() => {
    const map = new Map<string, IconInfo>();
    
    // キャラクター名をマップに追加
    if (characters) {
      for (const char of characters) {
        if (char) {
          map.set(char.name, { type: 'character', character: char });
        }
      }
    }
    
    // モンスター名をマップに追加
    if (monsters) {
      for (const monster of monsters) {
        map.set(monster.name, { type: 'monster', monster });
      }
    }
    
    return map;
  }, [characters, monsters]);

  // ログ行をパースしてアイコン付きで表示
  const renderLogLine = (log: string, index: number) => {
    // アイコン情報がない場合は通常表示
    if (nameToIcon.size === 0) {
      return (
        <div key={index} className={getLogClassName(log)}>{log}</div>
      );
    }

    // 名前を検出するパターン（「○○は」「○○が」「○○の」「○○を」など）
    const names = Array.from(nameToIcon.keys());
    if (names.length === 0) {
      return (
        <div key={index} className={getLogClassName(log)}>{log}</div>
      );
    }

    // 名前部分を検出して分割
    const escapedNames = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const namePattern = new RegExp(`(${escapedNames.join('|')})`, 'g');
    
    const parts = log.split(namePattern);
    
    return (
      <div key={index} className={`${getLogClassName(log)} flex flex-wrap items-center gap-0.5`}>
        {parts.map((part, i) => {
          const iconInfo = nameToIcon.get(part);
          if (iconInfo) {
            return (
              <span key={i} className="inline-flex items-center gap-0.5">
                {iconInfo.type === 'character' && iconInfo.character && (
                  <CharacterIcon 
                    race={iconInfo.character.race} 
                    job={iconInfo.character.job} 
                    size={20} 
                    className="inline-block"
                  />
                )}
                {iconInfo.type === 'monster' && iconInfo.monster && (
                  <MonsterIcon 
                    monsterId={iconInfo.monster.id} 
                    size={20} 
                    className="inline-block"
                  />
                )}
                <span>{part}</span>
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  if (logs.length === 0) {
    return <div className="text-slate-500 text-sm animate-pulse">{emptyMessage}</div>;
  }
  
  return (
    <div className="space-y-1 text-sm font-mono">
      {logs.map((log, i) => renderLogLine(log, i))}
    </div>
  );
}
