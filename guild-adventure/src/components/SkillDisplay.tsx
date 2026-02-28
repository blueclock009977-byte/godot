import { SkillData, PassiveSkill, SkillEffect } from '@/lib/types';
import { elementNames } from '@/lib/utils';

/**
 * パッシブ効果の表示用フォーマット
 */
export function formatEffect(effect: { type: string; value: number }): string {
  const { type, value } = effect;
  
  // 系統特攻/耐性
  const speciesMap: Record<string, string> = {
    humanoid: '人型', beast: '獣', undead: '不死', demon: '悪魔', dragon: '竜',
  };
  if (type.startsWith('speciesKiller_')) {
    const species = type.replace('speciesKiller_', '');
    return `${speciesMap[species] || species}特攻+${value}%`;
  }
  if (type.startsWith('speciesResist_')) {
    const species = type.replace('speciesResist_', '');
    return `${speciesMap[species] || species}耐性-${value}%`;
  }
  
  // 属性耐性/弱点
  const elementMap: Record<string, string> = {
    fire: '🔥火', water: '💧水', thunder: '⚡雷', ice: '❄️氷',
    earth: '🪨土', wind: '🌪️風', light: '✨光', dark: '🌑闇',
  };
  if (type.endsWith('Resist') && elementMap[type.replace('Resist', '')]) {
    const elem = type.replace('Resist', '');
    return value >= 0 
      ? `${elementMap[elem]}耐性+${value}%`
      : `${elementMap[elem]}弱点${value}%`;
  }
  if (type.endsWith('Bonus') && elementMap[type.replace('Bonus', '')]) {
    const elem = type.replace('Bonus', '');
    return `${elementMap[elem]}攻撃+${value}%`;
  }
  
  // その他全効果
  const effectMap: Record<string, { name: string; suffix?: string; invert?: boolean }> = {
    // 基本ダメージ
    damageBonus: { name: 'ダメージ' },
    damageReduction: { name: '被ダメ', invert: true },
    physicalBonus: { name: '物理ダメ' },
    magicBonus: { name: '魔法ダメ' },
    physicalResist: { name: '物理耐性' },
    magicResist: { name: '魔法耐性' },
    // クリティカル
    critBonus: { name: 'クリ率' },
    critDamage: { name: 'クリダメ' },
    // 回避・命中
    evasionBonus: { name: '回避' },
    accuracyBonus: { name: '命中' },
    perfectEvasion: { name: '完全回避' },
    backlineEvasion: { name: '後衛回避' },
    // 先制・追撃
    firstStrikeBonus: { name: '先制率' },
    followUp: { name: '追撃確率' },
    // 回復
    healBonus: { name: '回復量' },
    healReceived: { name: '被回復' },
    hpRegen: { name: 'HP/T', suffix: '' },
    mpRegen: { name: 'MP/T', suffix: '' },
    hpSteal: { name: 'HP吸収' },
    // 状態異常
    statusResist: { name: '状態耐性' },
    poisonResist: { name: '毒耐性' },
    stunResist: { name: 'スタン耐性' },
    // MP関連
    mpReduction: { name: 'MP消費', invert: true },
    mpOnKill: { name: '撃破時MP', suffix: '' },
    // 味方支援
    allyDefense: { name: '味方被ダメ', invert: true },
    allyAtkBonus: { name: '味方ATK' },
    allyMagBonus: { name: '味方魔法' },
    allyMpReduction: { name: '味方MP消費', invert: true },
    allyHpRegen: { name: '味方HP/T', suffix: '' },
    allyHitHeal: { name: '味方被弾時HP', suffix: '' },
    allyMagicHitMp: { name: '味方魔法被弾MP', suffix: '' },
    allyCountBonus: { name: '味方1人につき' },
    // 敵弱体
    intimidate: { name: '敵ATK', invert: true },
    debuffBonus: { name: 'デバフ成功率' },
    debuffDuration: { name: 'デバフ延長', suffix: 'T' },
    // 反撃・庇う
    cover: { name: '庇う確率' },
    counterRate: { name: '反撃確率' },
    counterDamageBonus: { name: '反撃ダメ' },
    // 特殊攻撃
    doubleAttack: { name: '2回攻撃' },
    doublecast: { name: '魔法2回発動' },
    attackStack: { name: '攻撃毎ATK累積' },
    atkStackOnKill: { name: '撃破時ATK累積' },
    // ヒット数・連撃
    bonusHits: { name: '追加ヒット', suffix: '回' },
    fixedHits: { name: '固定ヒット', suffix: '回' },
    noDecayHits: { name: '減衰なし', suffix: '回' },
    decayReduction: { name: '減衰緩和' },
    singleHitBonus: { name: '単発ボーナス' },
    // 劣化
    degradationResist: { name: '劣化耐性' },
    degradationBonus: { name: '劣化付与' },
    // 条件付き効果
    lowHpBonus: { name: 'HP30%↓ATK' },
    lowHpDamageBonus: { name: 'HP↓ダメ' },
    lowHpDefense: { name: 'HP↓被ダメ', invert: true },
    lowHpBonusHits: { name: 'HP↓追加ヒット', suffix: '回' },
    fullHpAtkBonus: { name: 'HP満タンATK' },
    frontlineBonus: { name: '前衛3↑ATK' },
    // クリティカル条件
    critAfterEvade: { name: '回避後クリ確定', suffix: '' },
    critOnFirstStrike: { name: '先制クリ確定', suffix: '' },
    firstHitCrit: { name: '初撃クリ確定', suffix: '' },
    extraAttackOnCrit: { name: 'クリ追撃' },
    critFollowUp: { name: 'クリ追撃ダメ' },
    // 追撃系
    physicalFollowUp: { name: '物理追撃確率' },
    debuffFollowUp: { name: 'デバフ追撃確率' },
    // 蘇生・耐久
    revive: { name: '蘇生HP', suffix: '' },
    autoRevive: { name: '自動蘇生', suffix: '回' },
    surviveLethal: { name: '致死耐え', suffix: '回' },
    deathResist: { name: 'HP0耐え確率' },
    // 撃破ボーナス
    hpOnKill: { name: '撃破時HP', suffix: '' },
    // ステータス
    allStats: { name: '全ステ' },
    ignoreDefense: { name: '防御無視' },
    // 探索・ドロップ
    dropBonus: { name: 'ドロップ率' },
    rareDropBonus: { name: 'レア装備率' },
    doubleDropRoll: { name: '2回抽選確率' },
    explorationSpeedBonus: { name: '探索時間', invert: true },
    coinBonus: { name: 'コイン' },
    // 召喚
    summonUndead: { name: '召喚確率' },
    fullRegen: { name: '全回復確率' },
  };
  
  const config = effectMap[type];
  if (config) {
    const suffix = config.suffix !== undefined ? config.suffix : '%';
    const displayValue = config.invert ? -value : value;
    const sign = displayValue >= 0 ? '+' : '';
    return `${config.name}${sign}${displayValue}${suffix}`;
  }
  
  // 未定義のエフェクト（フォールバック）
  const sign = value >= 0 ? '+' : '';
  return `${type}${sign}${value}`;
}

/**
 * 複数のパッシブ効果をフォーマット（物理+魔法が同じ値なら「物魔」にまとめる）
 */
export function formatEffects(effects: { type: string; value: number }[]): string[] {
  const result: string[] = [];
  for (const effect of effects) {
    result.push(formatEffect(effect));
  }
  return result;
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
        {formatEffects(passive.effects).map((text, i) => (
          <span key={i}>
            {i > 0 && ', '}
            {text}
          </span>
        ))}
      </div>
      <div className="text-slate-400">{passive.description}</div>
    </div>
  );
}
