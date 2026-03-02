'use client';

import { useState } from 'react';
import { DungeonData, Monster } from '@/lib/types';
import { getDropRate } from '@/lib/data/items';
import { getEquipmentDropRate } from '@/lib/data/equipments';
import { formatDuration, speciesNames, elementNames } from '@/lib/utils';
import { DifficultyStars } from './DifficultyStars';
import { Modal } from './Modal';
import { MonsterIcon } from './MonsterIcon';

// 属性耐性/弱点の表示
function ElementModifierDisplay({ modifier }: { modifier?: Partial<Record<string, number>> }) {
  if (!modifier || Object.keys(modifier).length === 0) return null;
  
  const entries = Object.entries(modifier).filter(([_, v]) => v !== undefined && v !== 0) as [string, number][];
  if (entries.length === 0) return null;
  
  return (
    <div className="text-xs space-y-0.5">
      {entries.map(([elem, value]) => (
        <div key={elem} className={value > 0 ? 'text-blue-300' : 'text-red-300'}>
          {value > 0 ? '🛡️' : '⚡'} {elementNames[elem as keyof typeof elementNames] || elem}
          {value > 0 ? `耐性+${value}%` : `弱点${value}%`}
        </div>
      ))}
    </div>
  );
}

// モンスター詳細カード
function MonsterDetailCard({ monster, isBoss = false }: { monster: Monster; isBoss?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div 
      className={`rounded-lg p-3 cursor-pointer transition-colors ${
        isBoss 
          ? 'bg-red-900/50 border border-red-700 hover:bg-red-900/70' 
          : 'bg-slate-600 hover:bg-slate-500'
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <MonsterIcon monsterId={monster.id} size={48} isBoss={isBoss} />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              {isBoss && <span className="text-red-400 text-xs">🔴 BOSS</span>}
              <div className="font-semibold">{monster.name}</div>
              <div className="text-xs text-slate-300">
                {speciesNames[monster.species] || monster.species}
                {monster.element && monster.element !== 'none' && (
                  <span className="ml-2">{elementNames[monster.element]}</span>
                )}
              </div>
            </div>
            <div className="text-xs text-right">
              <div>HP {monster.stats.hp}</div>
              <div>ATK {monster.stats.atk}</div>
              <span className="text-slate-500">{expanded ? '▲' : '▼'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 展開時の詳細 */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-500 space-y-2">
          {/* 全ステータス */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>HP: <span className="text-green-400">{monster.stats.hp}</span></div>
            <div>MP: <span className="text-blue-400">{monster.stats.mp}</span></div>
            <div>ATK: <span className="text-red-400">{monster.stats.atk}</span></div>
            <div>DEF: <span className="text-yellow-400">{monster.stats.def}</span></div>
            <div>AGI: <span className="text-purple-400">{monster.stats.agi}</span></div>
            <div>MAG: <span className="text-pink-400">{monster.stats.mag}</span></div>
          </div>
          
          {/* 物理/魔法耐性 */}
          {(monster.physicalResist || monster.magicResist) && (
            <div className="text-xs">
              <div className="text-slate-400 mb-1">耐性:</div>
              {monster.physicalResist !== undefined && monster.physicalResist !== 0 && (
                <div className={monster.physicalResist > 0 ? 'text-blue-300' : 'text-red-300'}>
                  🛡️ 物理{monster.physicalResist > 0 ? `耐性+${monster.physicalResist}%` : `弱点${monster.physicalResist}%`}
                </div>
              )}
              {monster.magicResist !== undefined && monster.magicResist !== 0 && (
                <div className={monster.magicResist > 0 ? 'text-blue-300' : 'text-red-300'}>
                  🛡️ 魔法{monster.magicResist > 0 ? `耐性+${monster.magicResist}%` : `弱点${monster.magicResist}%`}
                </div>
              )}
            </div>
          )}
          
          {/* 属性耐性/弱点 */}
          {monster.elementModifier && Object.keys(monster.elementModifier).length > 0 && (
            <div className="text-xs">
              <div className="text-slate-400 mb-1">属性耐性/弱点:</div>
              <ElementModifierDisplay modifier={monster.elementModifier} />
            </div>
          )}
          
          {/* 系統特攻/耐性 */}
          {(monster.speciesKiller || monster.speciesResist) && (
            <div className="text-xs">
              <div className="text-slate-400 mb-1">系統補正:</div>
              {monster.speciesKiller?.map((k, i) => (
                <div key={`k-${i}`} className="text-red-300">
                  ⚔️ {speciesNames[k.species]}特攻 +{k.multiplier}%
                </div>
              ))}
              {monster.speciesResist?.map((r, i) => (
                <div key={`r-${i}`} className="text-blue-300">
                  🛡️ {speciesNames[r.species]}耐性 -{r.multiplier}%
                </div>
              ))}
            </div>
          )}
          
          {/* スキル */}
          {monster.skills && monster.skills.length > 0 && (
            <div className="text-xs">
              <div className="text-slate-400 mb-1">スキル:</div>
              {monster.skills.map((skill, i) => (
                <div key={i} className="pl-2">
                  <span className="text-amber-400">{skill.name}</span>
                  <span className="text-slate-400 ml-1">{skill.description}</span>
                  {skill.element && skill.element !== 'none' && (
                    <span className="text-xs ml-1 text-purple-400">[{elementNames[skill.element]}]</span>
                  )}
                  <span className="text-slate-500 ml-1">
                    x{skill.multiplier} MP{skill.mpCost}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DungeonDetailModal({ 
  dungeon, 
  onClose 
}: { 
  dungeon: DungeonData; 
  onClose: () => void;
}) {
  return (
    <Modal title={dungeon.name} onClose={onClose}>
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* 基本情報 */}
        <div className="bg-slate-700 rounded-lg p-3">
          <h3 className="text-sm text-slate-400 mb-2">基本情報</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>難易度: <DifficultyStars level={dungeon.difficulty} /></div>
            <div>探索時間: {formatDuration(dungeon.durationSeconds)}</div>
            <div>推奨人数: {dungeon.recommendedPlayers}人</div>
            <div>遭遇回数: {dungeon.encounterCount}回</div>
            <div className="text-amber-400">📜 書: {getDropRate(dungeon.id)}% ×4</div>
            <div className="text-green-400">🎒 装備: {getEquipmentDropRate(dungeon.durationSeconds, dungeon.id).toFixed(1)}% ×4</div>
            <div className="text-amber-400 col-span-2">🪙 勝利報酬: {dungeon.coinReward}コイン</div>
          </div>
        </div>
        
        {/* 出現モンスター（クリックで詳細展開） */}
        <div className="bg-slate-700 rounded-lg p-3">
          <h3 className="text-sm text-slate-400 mb-2">👹 出現モンスター <span className="text-xs">(クリックで詳細)</span></h3>
          <div className="space-y-2">
            {dungeon.monsters.map((spawn, idx) => (
              <MonsterDetailCard key={idx} monster={spawn.monster} />
            ))}
          </div>
        </div>
        
        {/* ボス */}
        {dungeon.boss && (
          <div className="bg-slate-700 rounded-lg p-3">
            <h3 className="text-sm text-red-400 mb-2">🔴 ボス <span className="text-xs text-slate-400">(クリックで詳細)</span></h3>
            <MonsterDetailCard monster={dungeon.boss} isBoss />
          </div>
        )}
        
        {/* 有利な種族ヒント */}
        {dungeon.boss && (
          <div className="bg-slate-700 rounded-lg p-3">
            <h3 className="text-sm text-slate-400 mb-2">💡 攻略ヒント</h3>
            <div className="text-sm text-slate-300 space-y-1">
              {dungeon.boss.species === 'dragon' && (
                <p>・ドラゴニュートの「竜殺し」が有効！</p>
              )}
              {dungeon.boss.species === 'demon' && (
                <p>・エルフやジェナシの「悪魔特攻」が有効！</p>
              )}
              {dungeon.boss.species === 'undead' && (
                <p>・アアシマールの「不死狩り」やパラディンが有効！</p>
              )}
              {dungeon.boss.species === 'beast' && (
                <p>・オークの「獣殺し」が有効！</p>
              )}
              {dungeon.boss.species === 'humanoid' && (
                <p>・ハーフリングやティーフリングの「人型特攻」が有効！</p>
              )}
              {/* 属性弱点のヒント */}
              {dungeon.boss.elementModifier && Object.entries(dungeon.boss.elementModifier).map(([elem, value]) => {
                if (typeof value === 'number' && value < 0) {
                  return (
                    <p key={elem}>・{elementNames[elem as keyof typeof elementNames]}属性が弱点（{Math.abs(value)}%ダメージ増）！</p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
