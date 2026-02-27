import { SkillData, PassiveSkill, SkillEffect } from '@/lib/types';
import { elementNames } from '@/lib/utils';

/**
 * パッシブ効果の表示用フォーマット
 */
export function formatEffect(effect: { type: string; value: number }): string {
  const effectMap: Record<string, string> = {
    critBonus: 'クリ率',
    evasionBonus: '回避',
    damageBonus: 'ダメージ',
    dropBonus: 'ドロップ率',
    magicBonus: '魔法ダメ',
    physicalBonus: '物理ダメ',
    firstStrikeBonus: '先制率',
    mpRegen: 'MP回復/T',
    hpRegen: 'HP回復/T',
    damageReduction: '被ダメ',
    poisonResist: '毒耐性',
    statusResist: '状態異常耐性',
    healBonus: '回復量',
    healReceived: '被回復',
    hpSteal: 'HP吸収',
    critDamage: 'クリダメ',
    allyDefense: '味方被ダメ',
    allyAtkBonus: '味方ATK',
    intimidate: '敵ATK',
    mpReduction: 'MP消費',
    accuracyBonus: '命中',
    cover: '庇う確率',
    counterRate: '反撃確率',
    perfectEvasion: '完全回避',
    allStats: '全ステ',
    lowHpBonus: 'HP30%以下ATK',
    allyCountBonus: '味方1人につきダメ',
    followUp: '追撃確率',
    revive: '蘇生HP',
    autoRevive: '自動蘇生回数',
    doublecast: '2回発動',
    attackStack: '攻撃毎ATK累積',
    debuffBonus: 'デバフ成功率',
    summonUndead: '召喚確率',
  };
  
  // 系統特攻/耐性
  if (effect.type.startsWith('speciesKiller_')) {
    const species = effect.type.replace('speciesKiller_', '');
    const speciesMap: Record<string, string> = {
      humanoid: '人型', beast: '獣', undead: '不死', demon: '悪魔', dragon: '竜',
    };
    return `${speciesMap[species] || species}特攻+${effect.value}%`;
  }
  if (effect.type.startsWith('speciesResist_')) {
    const species = effect.type.replace('speciesResist_', '');
    const speciesMap: Record<string, string> = {
      humanoid: '人型', beast: '獣', undead: '不死', demon: '悪魔', dragon: '竜',
    };
    return `${speciesMap[species] || species}耐性-${effect.value}%被ダメ`;
  }
  
  const name = effectMap[effect.type] || effect.type;
  const sign = effect.value >= 0 ? '+' : '';
  return `${name}${sign}${effect.value}%`;
}

/**
 * スキル効果のフォーマット
 */
function formatSkillEffect(effect: SkillEffect): string {
  const value = effect.value ?? 0;
  const duration = effect.duration ?? 0;
  const effectStr = effect.type === 'atkUp' ? `ATK+${value}%` :
    effect.type === 'defUp' ? `DEF+${value}%` :
    effect.type === 'agiUp' ? `AGI+${value}%` :
    effect.type === 'statDown' ? `ステ-${value}%` :
    effect.type === 'atkDown' ? `ATK-${value}%` :
    effect.type === 'agiDown' ? `AGI-${value}%` :
    `${effect.type}+${value}`;
  return `${effectStr}(${duration}T)`;
}

const targetMap: Record<string, string> = {
  single: '単体',
  all: '全体',
  self: '自身',
  ally: '味方1人',
  allAllies: '味方全体',
};

const typeMap: Record<string, string> = {
  attack: '物理',
  magic: '魔法',
  heal: '回復',
  buff: 'バフ',
  debuff: 'デバフ',
};

/**
 * ラベルに応じたTailwindカラークラスを返す
 * @param label ラベル文字列（種族/職業など）
 * @returns Tailwindのtext-color クラス
 */
function getLabelColor(label?: string): string {
  if (label === '種族' || label === '★種族') return 'text-purple-300';
  if (label === '職業' || label === '★職業') return 'text-blue-300';
  return 'text-amber-400';
}

interface SkillDetailProps {
  skill: SkillData;
  /** ラベル（種族/職業など）、指定すると色分け */
  label?: string;
}

/**
 * スキル詳細表示コンポーネント
 */
export function SkillDetail({ skill, label }: SkillDetailProps) {
  const labelColor = getLabelColor(label);
  
  return (
    <div className="bg-slate-700 rounded p-2 text-xs">
      <div className="flex justify-between items-start">
        <div>
          <span className={`font-semibold ${labelColor}`}>
            {label && `[${label}] `}{skill.name}
          </span>
          {skill.element && skill.element !== 'none' && (
            <span className="ml-1">{elementNames[skill.element]}</span>
          )}
        </div>
        <span className="text-blue-200">MP{skill.mpCost}</span>
      </div>
      <div className="text-slate-300 mt-1">
        {typeMap[skill.type] || skill.type} / {targetMap[skill.target] || skill.target}
        {skill.multiplier > 0 && ` / ${skill.multiplier}倍`}
        {skill.effect && (
          <span className="text-green-300"> / {formatSkillEffect(skill.effect)}</span>
        )}
      </div>
      <div className="text-slate-400">{skill.description}</div>
    </div>
  );
}

interface PassiveDetailProps {
  passive: PassiveSkill;
  /** ラベル（種族/職業など）、指定すると色分け */
  label?: string;
}

/**
 * パッシブスキル詳細表示コンポーネント
 */
export function PassiveDetail({ passive, label }: PassiveDetailProps) {
  const labelColor = getLabelColor(label);
  
  return (
    <div className="bg-slate-700 rounded p-2 text-xs">
      <div className={`font-semibold ${labelColor}`}>
        {label && `[${label}] `}{passive.name}
      </div>
      <div className="text-green-300">
        {passive.effects.map((e, i) => (
          <span key={i}>
            {i > 0 && ', '}
            {formatEffect(e)}
          </span>
        ))}
      </div>
      <div className="text-slate-400">{passive.description}</div>
    </div>
  );
}
