'use client';

import { DungeonData } from '@/lib/types';
import { getDropRate } from '@/lib/data/items';
import { getEquipmentDropRate } from '@/lib/data/equipments';
import { formatDuration, speciesNames, elementNames } from '@/lib/utils';
import { DifficultyStars } from './DifficultyStars';
import { Modal } from './Modal';

export function DungeonDetailModal({ 
  dungeon, 
  onClose 
}: { 
  dungeon: DungeonData; 
  onClose: () => void;
}) {
  return (
    <Modal title={dungeon.name} onClose={onClose}>
      <div className="p-4 space-y-4">
        {/* 基本情報 */}
        <div className="bg-slate-700 rounded-lg p-3">
          <h3 className="text-sm text-slate-400 mb-2">基本情報</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>難易度: <DifficultyStars level={dungeon.difficulty} /></div>
            <div>探索時間: {formatDuration(dungeon.durationSeconds)}</div>
            <div>推奨人数: {dungeon.recommendedPlayers}人</div>
            <div>遭遇回数: {dungeon.encounterCount}回</div>
            <div className="text-amber-400">📜 書ドロップ: {getDropRate(dungeon.id)}% ×4回</div>
            <div className="text-green-400">🎒 装備ドロップ: {getEquipmentDropRate(dungeon.durationSeconds).toFixed(1)}% ×4回</div>
            <div className="text-slate-400 col-span-2 text-xs">※4回抽選して1つでも成功すればドロップ</div>
            <div className="text-amber-400 col-span-2">🪙 勝利報酬: {dungeon.coinReward}コイン</div>
          </div>
        </div>
        
        {/* 出現モンスター */}
        <div className="bg-slate-700 rounded-lg p-3">
          <h3 className="text-sm text-slate-400 mb-2">👹 出現モンスター</h3>
          <div className="space-y-2">
            {dungeon.monsters.map((spawn, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-600 rounded p-2">
                <div>
                  <span className="font-semibold">{spawn.monster.name}</span>
                  <div className="text-xs text-slate-300">
                    {speciesNames[spawn.monster.species] || spawn.monster.species}
                    {spawn.monster.element && spawn.monster.element !== 'none' && (
                      <span className="ml-2">{elementNames[spawn.monster.element]}</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  HP{spawn.monster.stats.hp} ATK{spawn.monster.stats.atk}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* ボス */}
        {dungeon.boss && (
          <div className="bg-red-900/50 rounded-lg p-3 border border-red-700">
            <h3 className="text-sm text-red-400 mb-2">🔴 ボス</h3>
            <div className="bg-slate-700 rounded p-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-lg">{dungeon.boss.name}</span>
                  <div className="text-sm text-slate-300">
                    {speciesNames[dungeon.boss.species] || dungeon.boss.species}
                    {dungeon.boss.element && dungeon.boss.element !== 'none' && (
                      <span className="ml-2">{elementNames[dungeon.boss.element]}</span>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div>HP {dungeon.boss.stats.hp}</div>
                  <div>ATK {dungeon.boss.stats.atk}</div>
                </div>
              </div>
              
              {/* ボスの系統特攻/耐性 */}
              {(dungeon.boss.speciesKiller || dungeon.boss.speciesResist) && (
                <div className="mt-2 text-xs space-y-1">
                  {dungeon.boss.speciesKiller?.map((k, i) => (
                    <div key={i} className="text-red-300">
                      ⚔️ {speciesNames[k.species]}特攻 +{k.multiplier}%
                    </div>
                  ))}
                  {dungeon.boss.speciesResist?.map((r, i) => (
                    <div key={i} className="text-blue-300">
                      🛡️ {speciesNames[r.species]}耐性 -{r.multiplier}%被ダメ
                    </div>
                  ))}
                </div>
              )}
              
              {/* ボスのスキル */}
              {dungeon.boss.skills && dungeon.boss.skills.length > 0 && (
                <div className="mt-2 border-t border-slate-600 pt-2">
                  <div className="text-xs text-slate-400">スキル:</div>
                  {dungeon.boss.skills.map((skill, i) => (
                    <div key={i} className="text-sm">
                      <span className="text-amber-400">{skill.name}</span>
                      <span className="text-slate-400 text-xs ml-2">{skill.description}</span>
                      {skill.element && skill.element !== 'none' && (
                        <span className="text-xs ml-1">{elementNames[skill.element]}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 有利な種族ヒント */}
        {dungeon.boss && (
          <div className="bg-slate-700 rounded-lg p-3">
            <h3 className="text-sm text-slate-400 mb-2">💡 攻略ヒント</h3>
            <div className="text-sm text-slate-300">
              {dungeon.boss.species === 'dragon' && (
                <p>・ドラゴニュートの「竜殺し」が有効！</p>
              )}
              {dungeon.boss.species === 'demon' && (
                <p>・エルフやエンジェルの「悪魔特攻」が有効！</p>
              )}
              {dungeon.boss.species === 'undead' && (
                <p>・フェアリーの「聖光」やパラディンが有効！</p>
              )}
              {dungeon.boss.species === 'beast' && (
                <p>・オークの「獣殺し」が有効！</p>
              )}
              {dungeon.boss.species === 'humanoid' && (
                <p>・ハーフリングやゴブリンの「人型特攻」が有効！</p>
              )}
              {dungeon.boss.element === 'fire' && (
                <p>・水属性スキルで1.3倍ダメージ！</p>
              )}
              {dungeon.boss.element === 'water' && (
                <p>・地属性スキルで1.3倍ダメージ！</p>
              )}
              {dungeon.boss.element === 'wind' && (
                <p>・火属性スキルで1.3倍ダメージ！</p>
              )}
              {dungeon.boss.element === 'earth' && (
                <p>・風属性スキルで1.3倍ダメージ！</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
