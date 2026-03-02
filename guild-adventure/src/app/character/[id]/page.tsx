'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { LoadingScreen } from '@/components/LoadingScreen';
import { SkillDetail, PassiveDetail } from '@/components/SkillDisplay';
import { StatsDisplay } from '@/components/StatsDisplay';
import { BattleAISelector } from '@/components/BattleAISelector';
import { races } from '@/lib/data/races';
import { jobs, JOB_DEFAULT_AI } from '@/lib/data/jobs';
import { traits } from '@/lib/data/traits';
import { environments } from '@/lib/data/environments';
import { getLvSkill } from '@/lib/data/lvSkills';
import { getLvBonus } from '@/lib/data/lvStatBonuses';
import { getEquipmentById } from '@/lib/data/equipments';
import { calculateCharacterBonuses, calculateTotalStats } from '@/lib/character/bonuses';
import { getItemById } from '@/lib/data/items';

export default function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { 
    characters, 
    getItemCount, 
    unlockRaceMastery, 
    unlockJobMastery,
    unlockRaceMastery2,
    unlockJobMastery2,
    deleteCharacter,
    coins,
    levelUpCharacter,
    equipments,
    equipItem,
    unequipItem,
    consumeTreasure,
    inventory,
    isLoggedIn,
    isLoading: storeLoading,
    setBattleAI,
  } = useGameStore();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // ローディング中またはログイン前
  if (!isLoggedIn || storeLoading) {
    return <LoadingScreen />;
  }
  
  const character = characters.find(c => c.id === id);
  
  if (!character) {
    return (
      <PageLayout maxWidth="lg">
        <div className="text-center">
          <p>キャラクターが見つかりません</p>
          <Link href="/" className="text-amber-400 hover:underline">ホームに戻る</Link>
        </div>
      </PageLayout>
    );
  }
  
  const raceData = races[character.race];
  const jobData = jobs[character.job];
  const traitData = traits[character.trait];
  const envData = environments[character.environment];
  
  const raceTicketId = `ticket_${character.race}`;
  const jobBookId = `book_${character.job}`;
  const raceTicketCount = getItemCount(raceTicketId);
  const jobBookCount = getItemCount(jobBookId);
  
  const canUnlockRaceMastery = !character.raceMastery && raceTicketCount >= 5;
  const canUnlockJobMastery = !character.jobMastery && jobBookCount >= 5;
  const canUnlockRaceMastery2 = character.raceMastery && !character.raceMastery2 && raceTicketCount >= 10;
  const canUnlockJobMastery2 = character.jobMastery && !character.jobMastery2 && jobBookCount >= 10;
  
  const handleUnlockRaceMastery = async () => {
    if (!canUnlockRaceMastery || isLoading) return;
    setIsLoading(true);
    await unlockRaceMastery(character.id);
    setIsLoading(false);
  };
  
  const handleUnlockJobMastery = async () => {
    if (!canUnlockJobMastery || isLoading) return;
    setIsLoading(true);
    await unlockJobMastery(character.id);
    setIsLoading(false);
  };
  
  const handleUnlockRaceMastery2 = async () => {
    if (!canUnlockRaceMastery2 || isLoading) return;
    setIsLoading(true);
    await unlockRaceMastery2(character.id);
    setIsLoading(false);
  };
  
  const handleUnlockJobMastery2 = async () => {
    if (!canUnlockJobMastery2 || isLoading) return;
    setIsLoading(true);
    await unlockJobMastery2(character.id);
    setIsLoading(false);
  };
  
  const currentLevel = character?.level || 1;
  const levelUpCost = currentLevel < 5 ? (currentLevel === 4 ? 500 : currentLevel * 100) : 0;
  const canLevelUp = currentLevel < 5 && coins >= levelUpCost;
  
  const handleLevelUp = async () => {
    if (!canLevelUp || isLoading) return;
    setIsLoading(true);
    const result = await levelUpCharacter(character.id);
    setIsLoading(false);
    if (result.success && result.skill) {
      const skillName = getLvSkill(result.skill)?.name || result.skill;
      alert(`レベル${result.newLevel}に上がりました！\nスキル「${skillName}」を習得！`);
    } else if (result.success && result.bonus) {
      const bonusData = getLvBonus(result.bonus);
      alert(`レベル${result.newLevel}に上がりました！\n「${bonusData?.name}」獲得！\n${bonusData?.description}`);
    } else if (result.success) {
      alert(`レベル${result.newLevel}に上がりました！`);
    }
  };

  // 回収コイン計算（削除確認用）
  const levelCosts = [0, 0, 100, 300, 600, 1000];
  const refundCoins = 20 + Math.floor((levelCosts[currentLevel] || 0) * 0.1);
  
  const handleDelete = async () => {
    if (!confirm(`${character.name}を削除しますか？\n🪙 ${refundCoins}コイン回収できます`)) return;
    const coins = await deleteCharacter(character.id);
    alert(`${character.name}を削除しました\n🪙 ${coins}コイン回収！`);
    router.push('/');
  };
  
  return (
    <PageLayout maxWidth="lg">
      <PageHeader title={character.name} />
        
        {/* 基本情報 */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-400">種族:</span> {raceData.name}</div>
            <div><span className="text-slate-400">職業:</span> {jobData.name}</div>
            <div><span className="text-slate-400">個性:</span> {traitData.name}</div>
            <div><span className="text-slate-400">環境:</span> {envData.name}</div>
          </div>
        </div>
        
        {/* レベル */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm text-slate-400">レベル</h3>
              <div className="text-2xl font-bold text-amber-400">Lv.{currentLevel}</div>
              {currentLevel < 5 && (
                <div className="text-xs text-slate-400">次: {levelUpCost}コイン</div>
              )}
            </div>
            {currentLevel < 5 ? (
              <button
                onClick={handleLevelUp}
                disabled={!canLevelUp || isLoading}
                className={`px-4 py-2 rounded-lg font-semibold ${canLevelUp ? "bg-amber-600 hover:bg-amber-500" : "bg-slate-600 opacity-50 cursor-not-allowed"}`}
              >
                {isLoading ? "..." : `レベルアップ (${levelUpCost}🪙)`}
              </button>
            ) : (
              <span className="text-green-400 font-semibold">MAX</span>
            )}
          </div>
          {/* Lvボーナス一覧（詳細表示） */}
          <div className="mt-3 pt-3 border-t border-slate-600">
            <h4 className="text-xs text-slate-400 mb-3">🪙 レベルアップボーナス</h4>
            <div className="space-y-4 text-sm">
              {/* Lv2ボーナス */}
              <div className="bg-slate-700/50 rounded p-2">
                <div className="font-semibold text-slate-300 mb-1">Lv2 - ステータスボーナス</div>
                {character.lv2Bonus ? (
                  <div className="text-green-400">
                    ✓ {getLvBonus(character.lv2Bonus)?.name}
                    <div className="text-xs text-green-300 ml-4">{getLvBonus(character.lv2Bonus)?.description}</div>
                  </div>
                ) : currentLevel >= 2 ? (
                  <div className="text-amber-400">未取得</div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-slate-400">
                      <span className="text-blue-400">[{raceData.name}]</span> {getLvBonus(`${character.race}_lv2`)?.name}
                      <div className="text-xs text-slate-500 ml-4">{getLvBonus(`${character.race}_lv2`)?.description}</div>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-purple-400">[{jobData.name}]</span> {getLvBonus(`${character.job}_lv2`)?.name}
                      <div className="text-xs text-slate-500 ml-4">{getLvBonus(`${character.job}_lv2`)?.description}</div>
                    </div>
                    <div className="text-xs text-slate-500 italic">※どちらかがランダムで習得</div>
                  </div>
                )}
              </div>
              
              {/* Lv3スキル */}
              <div className="bg-slate-700/50 rounded p-2">
                <div className="font-semibold text-slate-300 mb-1">Lv3 - スキル</div>
                {character.lv3Skill ? (
                  <div className="text-green-400">
                    ✓ {getLvSkill(character.lv3Skill)?.name}
                    <div className="text-xs text-green-300 ml-4">{getLvSkill(character.lv3Skill)?.description}</div>
                  </div>
                ) : currentLevel >= 3 ? (
                  <div className="text-amber-400">未取得</div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-slate-400">
                      <span className="text-blue-400">[{raceData.name}]</span> {getLvSkill(`${character.race}_lv3`)?.name}
                      <div className="text-xs text-slate-500 ml-4">{getLvSkill(`${character.race}_lv3`)?.description}</div>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-purple-400">[{jobData.name}]</span> {getLvSkill(`${character.job}_lv3`)?.name}
                      <div className="text-xs text-slate-500 ml-4">{getLvSkill(`${character.job}_lv3`)?.description}</div>
                    </div>
                    <div className="text-xs text-slate-500 italic">※どちらかがランダムで習得</div>
                  </div>
                )}
              </div>
              
              {/* Lv4ボーナス */}
              <div className="bg-slate-700/50 rounded p-2">
                <div className="font-semibold text-slate-300 mb-1">Lv4 - ステータスボーナス</div>
                {character.lv4Bonus ? (
                  <div className="text-green-400">
                    ✓ {getLvBonus(character.lv4Bonus)?.name}
                    <div className="text-xs text-green-300 ml-4">{getLvBonus(character.lv4Bonus)?.description}</div>
                  </div>
                ) : currentLevel >= 4 ? (
                  <div className="text-amber-400">未取得</div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-slate-400">
                      <span className="text-blue-400">[{raceData.name}]</span> {getLvBonus(`${character.race}_lv4`)?.name}
                      <div className="text-xs text-slate-500 ml-4">{getLvBonus(`${character.race}_lv4`)?.description}</div>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-purple-400">[{jobData.name}]</span> {getLvBonus(`${character.job}_lv4`)?.name}
                      <div className="text-xs text-slate-500 ml-4">{getLvBonus(`${character.job}_lv4`)?.description}</div>
                    </div>
                    <div className="text-xs text-slate-500 italic">※どちらかがランダムで習得</div>
                  </div>
                )}
              </div>
              
              {/* Lv5スキル */}
              <div className="bg-slate-700/50 rounded p-2">
                <div className="font-semibold text-slate-300 mb-1">Lv5 - スキル（強力）</div>
                {character.lv5Skill ? (
                  <div className="text-green-400">
                    ✓ {getLvSkill(character.lv5Skill)?.name}
                    <div className="text-xs text-green-300 ml-4">{getLvSkill(character.lv5Skill)?.description}</div>
                  </div>
                ) : currentLevel >= 5 ? (
                  <div className="text-amber-400">未取得</div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-slate-400">
                      <span className="text-blue-400">[{raceData.name}]</span> {getLvSkill(`${character.race}_lv5`)?.name}
                      <div className="text-xs text-slate-500 ml-4">{getLvSkill(`${character.race}_lv5`)?.description}</div>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-purple-400">[{jobData.name}]</span> {getLvSkill(`${character.job}_lv5`)?.name}
                      <div className="text-xs text-slate-500 ml-4">{getLvSkill(`${character.job}_lv5`)?.description}</div>
                    </div>
                    <div className="text-xs text-slate-500 italic">※どちらかがランダムで習得</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 戦闘AI設定 */}
        <BattleAISelector
          currentAI={character.battleAI}
          jobDefaultAI={JOB_DEFAULT_AI[character.job]}
          jobName={jobData.name}
          onSelect={async (ai) => {
            setIsLoading(true);
            await setBattleAI(character.id, ai);
            setIsLoading(false);
          }}
          isLoading={isLoading}
        />

{/* 種族マスタリー解放 */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">種族マスタリー: {raceData.name}</h3>
          {/* マスタリー1 */}
          {raceData.masterySkill && (
            <div className="mb-3">
              <div className={`font-semibold ${character.raceMastery ? 'text-amber-400' : 'text-slate-500'}`}>
                ★ {raceData.masterySkill.name}
              </div>
              <div className="text-xs text-slate-400">{raceData.masterySkill.description}</div>
            </div>
          )}
          {character.raceMastery ? (
            <div className="text-green-400 text-sm mb-3">✓ 解放済み</div>
          ) : (
            <div className="mb-3">
              <div className="text-xs text-slate-400 mb-2">
                必要: {raceData.name}の血統書 ×5 (所持: {raceTicketCount})
              </div>
              <button
                onClick={handleUnlockRaceMastery}
                disabled={!canUnlockRaceMastery || isLoading}
                className={`w-full py-2 rounded text-sm font-semibold ${
                  canUnlockRaceMastery
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? '...' : '解放する'}
              </button>
            </div>
          )}
          
          {/* マスタリー2 */}
          {raceData.masterySkill2 && (
            <>
              <div className="border-t border-slate-600 my-3"></div>
              <div className="mb-3">
                <div className={`font-semibold ${character.raceMastery2 ? 'text-purple-400' : 'text-slate-500'}`}>
                  ★★ {raceData.masterySkill2.name}
                </div>
                <div className="text-xs text-slate-400">{raceData.masterySkill2.description}</div>
              </div>
              {character.raceMastery2 ? (
                <div className="text-green-400 text-sm">✓ 解放済み</div>
              ) : !character.raceMastery ? (
                <div className="text-xs text-slate-500">※マスタリー1を先に解放</div>
              ) : (
                <div>
                  <div className="text-xs text-slate-400 mb-2">
                    必要: {raceData.name}の血統書 ×10 (所持: {raceTicketCount})
                  </div>
                  <button
                    onClick={handleUnlockRaceMastery2}
                    disabled={!canUnlockRaceMastery2 || isLoading}
                    className={`w-full py-2 rounded text-sm font-semibold ${
                      canUnlockRaceMastery2
                        ? 'bg-purple-600 hover:bg-purple-500'
                        : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? '...' : '解放する'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

{/* 職業マスタリー解放 */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">職業マスタリー: {jobData.name}</h3>
          {/* マスタリー1 */}
          {jobData.masterySkill && (
            <div className="mb-3">
              <div className={`font-semibold ${character.jobMastery ? 'text-amber-400' : 'text-slate-500'}`}>
                ★ {jobData.masterySkill.name}
              </div>
              <div className="text-xs text-slate-400">{jobData.masterySkill.description}</div>
            </div>
          )}
          {character.jobMastery ? (
            <div className="text-green-400 text-sm mb-3">✓ 解放済み</div>
          ) : (
            <div className="mb-3">
              <div className="text-xs text-slate-400 mb-2">
                必要: {jobData.name}の指南書 ×5 (所持: {jobBookCount})
              </div>
              <button
                onClick={handleUnlockJobMastery}
                disabled={!canUnlockJobMastery || isLoading}
                className={`w-full py-2 rounded text-sm font-semibold ${
                  canUnlockJobMastery
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? '...' : '解放する'}
              </button>
            </div>
          )}
          
          {/* マスタリー2 */}
          {jobData.masterySkill2 && (
            <>
              <div className="border-t border-slate-600 my-3"></div>
              <div className="mb-3">
                <div className={`font-semibold ${character.jobMastery2 ? 'text-purple-400' : 'text-slate-500'}`}>
                  ★★ {jobData.masterySkill2.name}
                </div>
                <div className="text-xs text-slate-400">{jobData.masterySkill2.description}</div>
              </div>
              {character.jobMastery2 ? (
                <div className="text-green-400 text-sm">✓ 解放済み</div>
              ) : !character.jobMastery ? (
                <div className="text-xs text-slate-500">※マスタリー1を先に解放</div>
              ) : (
                <div>
                  <div className="text-xs text-slate-400 mb-2">
                    必要: {jobData.name}の指南書 ×10 (所持: {jobBookCount})
                  </div>
                  <button
                    onClick={handleUnlockJobMastery2}
                    disabled={!canUnlockJobMastery2 || isLoading}
                    className={`w-full py-2 rounded text-sm font-semibold ${
                      canUnlockJobMastery2
                        ? 'bg-purple-600 hover:bg-purple-500'
                        : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? '...' : '解放する'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 秘宝セクション */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-3">💎 秘宝（レア）</h3>
          
          {/* 使用済み秘宝の表示 */}
          <div className="mb-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">種族秘宝:</span>
              {character.raceTreasureBonus ? (
                <span className="text-purple-400">✓ 全ステ+{character.raceTreasureBonus}</span>
              ) : (
                <span className="text-slate-500">未使用</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">職業秘宝:</span>
              {character.jobTreasureBonus ? (
                <span className="text-purple-400">✓ 全ステ+{character.jobTreasureBonus}</span>
              ) : (
                <span className="text-slate-500">未使用</span>
              )}
            </div>
          </div>
          
          {/* 使用可能な秘宝 */}
          {(() => {
            const raceTreasureId = `treasure_${character.race}`;
            const jobTreasureId = `treasure_${character.job}`;
            const hasRaceTreasure = (inventory[raceTreasureId] || 0) > 0;
            const hasJobTreasure = (inventory[jobTreasureId] || 0) > 0;
            const canUseRace = hasRaceTreasure && !character.raceTreasureBonus;
            const canUseJob = hasJobTreasure && !character.jobTreasureBonus;
            
            if (!canUseRace && !canUseJob) {
              return (
                <p className="text-xs text-slate-500">
                  {character.raceTreasureBonus && character.jobTreasureBonus
                    ? '両方の秘宝を使用済みです'
                    : '使用可能な秘宝がありません（探索でレアドロップ）'}
                </p>
              );
            }
            
            return (
              <div className="space-y-2">
                {canUseRace && (
                  <div className="flex justify-between items-center bg-purple-900/30 rounded p-2 border border-purple-700">
                    <div>
                      <span className="text-purple-300">{getItemById(raceTreasureId)?.name}</span>
                      <span className="text-xs text-slate-400 ml-2">x{inventory[raceTreasureId]}</span>
                    </div>
                    <button
                      onClick={async () => {
                        setIsLoading(true);
                        const result = await consumeTreasure(character.id, raceTreasureId);
                        setIsLoading(false);
                        if (result.success) {
                          alert('秘宝を使用しました！全ステータス+10！');
                        } else {
                          alert(result.error || '使用できませんでした');
                        }
                      }}
                      disabled={isLoading}
                      className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm"
                    >
                      使用
                    </button>
                  </div>
                )}
                {canUseJob && (
                  <div className="flex justify-between items-center bg-purple-900/30 rounded p-2 border border-purple-700">
                    <div>
                      <span className="text-purple-300">{getItemById(jobTreasureId)?.name}</span>
                      <span className="text-xs text-slate-400 ml-2">x{inventory[jobTreasureId]}</span>
                    </div>
                    <button
                      onClick={async () => {
                        setIsLoading(true);
                        const result = await consumeTreasure(character.id, jobTreasureId);
                        setIsLoading(false);
                        if (result.success) {
                          alert('秘宝を使用しました！全ステータス+10！');
                        } else {
                          alert(result.error || '使用できませんでした');
                        }
                      }}
                      disabled={isLoading}
                      className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm"
                    >
                      使用
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* 装備セクション */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-3">🎒 持ち物</h3>
          
          {/* 現在の装備 */}
          {character.equipmentId ? (
            <div className="mb-4">
              <div className="text-xs text-slate-400 mb-1">装備中:</div>
              {(() => {
                const eq = getEquipmentById(character.equipmentId);
                return eq ? (
                  <div className={`p-3 rounded border ${eq.rarity === 'rare' ? 'bg-yellow-900/30 border-yellow-600' : 'bg-slate-700 border-slate-600'}`}>
                    <div className={`font-semibold ${eq.rarity === 'rare' ? 'text-yellow-300' : 'text-white'}`}>
                      {eq.name}
                    </div>
                    <div className="text-xs text-slate-300 mt-1">{eq.description}</div>
                    <button
                      onClick={async () => {
                        setIsLoading(true);
                        await unequipItem(character.id);
                        setIsLoading(false);
                      }}
                      disabled={isLoading}
                      className="mt-2 text-xs text-red-400 hover:text-red-300"
                    >
                      外す
                    </button>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div className="text-slate-500 text-sm mb-4">装備なし</div>
          )}
          
          {/* 所持装備一覧 */}
          <div className="text-xs text-slate-400 mb-2">所持装備から選択:</div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {Object.entries(equipments).filter(([, count]) => count > 0).length === 0 ? (
              <div className="text-slate-500 text-sm">装備アイテムがありません</div>
            ) : (
              Object.entries(equipments)
                .filter(([, count]) => count > 0)
                .map(([eqId, count]) => {
                  const eq = getEquipmentById(eqId);
                  if (!eq) return null;
                  
                  // 既に装備中のキャラ数をカウント
                  const equippedCount = characters.filter(c => c.equipmentId === eqId).length;
                  const available = count - equippedCount;
                  const isCurrentlyEquipped = character.equipmentId === eqId;
                  
                  return (
                    <div 
                      key={eqId}
                      className={`p-2 rounded border ${eq.rarity === 'rare' ? 'bg-yellow-900/20 border-yellow-700' : 'bg-slate-700/50 border-slate-600'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`text-sm ${eq.rarity === 'rare' ? 'text-yellow-300' : 'text-white'}`}>
                            {eq.name}
                          </div>
                          <div className="text-xs text-slate-400">{eq.description}</div>
                          <div className="text-xs text-slate-500">所持: {count} / 空き: {available}</div>
                        </div>
                        {!isCurrentlyEquipped && available > 0 && (
                          <button
                            onClick={async () => {
                              setIsLoading(true);
                              await equipItem(character.id, eqId);
                              setIsLoading(false);
                            }}
                            disabled={isLoading}
                            className="text-xs bg-amber-600 hover:bg-amber-500 px-2 py-1 rounded"
                          >
                            装備
                          </button>
                        )}
                        {isCurrentlyEquipped && (
                          <span className="text-xs text-green-400">装備中</span>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
        
        {/* 生物改造 */}
        <Link
          href={`/bio-modification/${character.id}`}
          className="block bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 rounded-lg p-4 mb-4 border border-emerald-600 text-center"
        >
          <div className="text-lg font-semibold text-emerald-300">🧬 生物改造</div>
          <div className="text-xs text-emerald-400 mt-1">
            {(character.modificationSlots ?? 0) > 0 
              ? `${character.modifications?.length || 0} / ${character.modificationSlots}枠 使用中`
              : '改造枠を解放してボーナスを獲得'}
          </div>
        </Link>

        {/* ステータス（総合） */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <StatsDisplay stats={calculateTotalStats(character)} title="総合ステータス" />
          <div className="text-xs text-slate-500 mt-2">
            ※ 基本ステータス + Lvボーナス + 装備ボーナス
          </div>
        </div>
        
        {/* 総合ボーナス */}
        {(() => {
          const bonuses = calculateCharacterBonuses(character);
          const hasCombatBonuses = bonuses.physicalBonus > 0 || bonuses.magicBonus > 0 || 
            bonuses.critBonus > 0 || bonuses.critDamage > 0 || bonuses.evasionBonus > 0 ||
            bonuses.damageReduction > 0 || bonuses.healBonus > 0 || bonuses.hpRegen > 0 ||
            bonuses.mpRegen > 0 || bonuses.hpSteal > 0 || bonuses.firstStrikeBonus > 0 ||
            bonuses.accuracyBonus > 0 || bonuses.bonusHits > 0;
          const hasTreasureBonuses = bonuses.dropBonus > 0 || bonuses.coinBonus > 0 ||
            bonuses.rareDropBonus > 0 || bonuses.explorationSpeedBonus > 0;
          
          if (!hasCombatBonuses && !hasTreasureBonuses) return null;
          
          return (
            <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-3">📊 総合ボーナス</h3>
              
              {/* 戦闘系 */}
              {hasCombatBonuses && (
                <div className="mb-3">
                  <div className="text-xs text-slate-500 mb-1">⚔️ 戦闘</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {bonuses.physicalBonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">物理威力</span>
                        <span className="text-red-400">+{bonuses.physicalBonus}%</span>
                      </div>
                    )}
                    {bonuses.magicBonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">魔法威力</span>
                        <span className="text-blue-400">+{bonuses.magicBonus}%</span>
                      </div>
                    )}
                    {bonuses.critBonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">クリ率</span>
                        <span className="text-orange-400">+{bonuses.critBonus}%</span>
                      </div>
                    )}
                    {bonuses.critDamage > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">クリダメ</span>
                        <span className="text-orange-400">+{bonuses.critDamage}%</span>
                      </div>
                    )}
                    {bonuses.evasionBonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">回避率</span>
                        <span className="text-cyan-400">+{bonuses.evasionBonus}%</span>
                      </div>
                    )}
                    {bonuses.damageReduction > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">被ダメ軽減</span>
                        <span className="text-green-400">-{bonuses.damageReduction}%</span>
                      </div>
                    )}
                    {bonuses.healBonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">回復量</span>
                        <span className="text-pink-400">+{bonuses.healBonus}%</span>
                      </div>
                    )}
                    {bonuses.hpRegen > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">HP再生</span>
                        <span className="text-green-400">+{bonuses.hpRegen}/ターン</span>
                      </div>
                    )}
                    {bonuses.mpRegen > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">MP再生</span>
                        <span className="text-blue-400">+{bonuses.mpRegen}/ターン</span>
                      </div>
                    )}
                    {bonuses.hpSteal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">HP吸収</span>
                        <span className="text-purple-400">+{bonuses.hpSteal}%</span>
                      </div>
                    )}
                    {bonuses.firstStrikeBonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">先制率</span>
                        <span className="text-yellow-400">+{bonuses.firstStrikeBonus}%</span>
                      </div>
                    )}
                    {bonuses.accuracyBonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">命中率</span>
                        <span className="text-slate-300">+{bonuses.accuracyBonus}%</span>
                      </div>
                    )}
                    {bonuses.bonusHits > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">追加攻撃</span>
                        <span className="text-red-400">+{bonuses.bonusHits}回</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* トレハン系 */}
              {hasTreasureBonuses && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">🔍 トレハン</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {bonuses.dropBonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">ドロップ率</span>
                        <span className="text-green-400">+{bonuses.dropBonus}%</span>
                      </div>
                    )}
                    {bonuses.rareDropBonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">レア発見</span>
                        <span className="text-purple-400">+{bonuses.rareDropBonus}%</span>
                      </div>
                    )}
                    {bonuses.coinBonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">コイン</span>
                        <span className="text-yellow-400">+{bonuses.coinBonus}%</span>
                      </div>
                    )}
                    {bonuses.explorationSpeedBonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">探索時間</span>
                        <span className="text-cyan-400">-{bonuses.explorationSpeedBonus}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        
        {/* パッシブ一覧 */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">パッシブ効果</h3>
          <div className="space-y-2">
            {/* 種族パッシブ */}
            {raceData.passives.map((passive, i) => (
              <PassiveDetail key={`race-${i}`} passive={passive} label="種族" />
            ))}
            {/* 職業パッシブ */}
            {jobData.passives.map((passive, i) => (
              <PassiveDetail key={`job-${i}`} passive={passive} label="職業" />
            ))}
            {/* 種族マスタリー（パッシブの場合） */}
            {character.raceMastery && raceData.masterySkill?.type === 'passive' && raceData.masterySkill.effects && (
              <PassiveDetail 
                passive={{ name: raceData.masterySkill.name, description: raceData.masterySkill.description, effects: raceData.masterySkill.effects }} 
                label="★種族" 
              />
            )}
            {/* 職業マスタリー（パッシブの場合） */}
            {character.jobMastery && jobData.masterySkill?.type === 'passive' && jobData.masterySkill.effects && (
              <PassiveDetail 
                passive={{ name: jobData.masterySkill.name, description: jobData.masterySkill.description, effects: jobData.masterySkill.effects }} 
                label="★職業" 
              />
            )}
            {/* 種族マスタリー2（パッシブの場合） */}
            {character.raceMastery2 && raceData.masterySkill2?.type === 'passive' && raceData.masterySkill2.effects && (
              <PassiveDetail 
                passive={{ name: raceData.masterySkill2.name, description: raceData.masterySkill2.description, effects: raceData.masterySkill2.effects }} 
                label="★★種族" 
              />
            )}
            {/* 職業マスタリー2（パッシブの場合） */}
            {character.jobMastery2 && jobData.masterySkill2?.type === 'passive' && jobData.masterySkill2.effects && (
              <PassiveDetail 
                passive={{ name: jobData.masterySkill2.name, description: jobData.masterySkill2.description, effects: jobData.masterySkill2.effects }} 
                label="★★職業" 
              />
            )}
          </div>
        </div>
        
        {/* スキル一覧 */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-2">スキル</h3>
          <div className="space-y-2">
            {/* 種族スキル */}
            {raceData.skills?.map(skill => (
              <SkillDetail key={skill.id} skill={skill} label="種族" />
            ))}
            {/* 職業スキル */}
            {jobData.skills.map(skill => (
              <SkillDetail key={skill.id} skill={skill} label="職業" />
            ))}
            {/* マスタリースキル（アクティブのみ） */}
            {character.raceMastery && raceData.masterySkill?.type === 'active' && raceData.masterySkill.skill && (
              <SkillDetail skill={raceData.masterySkill.skill} label="★種族" />
            )}
            {character.jobMastery && jobData.masterySkill?.type === 'active' && jobData.masterySkill.skill && (
              <SkillDetail skill={jobData.masterySkill.skill} label="★職業" />
            )}
            {/* マスタリー2スキル（アクティブのみ） */}
            {character.raceMastery2 && raceData.masterySkill2?.type === 'active' && raceData.masterySkill2.skill && (
              <SkillDetail skill={raceData.masterySkill2.skill} label="★★種族" />
            )}
            {character.jobMastery2 && jobData.masterySkill2?.type === 'active' && jobData.masterySkill2.skill && (
              <SkillDetail skill={jobData.masterySkill2.skill} label="★★職業" />
            )}
          </div>
        </div>
        

        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          className="w-full py-2 rounded text-sm text-red-400 border border-red-400 hover:bg-red-400/20"
        >
          キャラクターを削除（🪙{refundCoins}回収）
        </button>
    </PageLayout>
  );
}
