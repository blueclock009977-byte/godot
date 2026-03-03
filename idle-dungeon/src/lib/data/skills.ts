import { Skill } from '../types';

export const skills: Skill[] = [
  // 攻撃系
  {
    id: 'crit_rate_1',
    name: 'クリティカルI',
    description: 'クリティカル率+5%',
    effect: { critRate: 5 }
  },
  {
    id: 'crit_rate_2',
    name: 'クリティカルII',
    description: 'クリティカル率+10%',
    effect: { critRate: 10 }
  },
  {
    id: 'crit_damage_1',
    name: '会心ダメージI',
    description: 'クリティカルダメージ+20%',
    effect: { critDamage: 20 }
  },
  {
    id: 'atk_boost_1',
    name: '攻撃強化I',
    description: 'ATK+10%',
    effect: { atkPercent: 10 }
  },
  {
    id: 'atk_boost_2',
    name: '攻撃強化II',
    description: 'ATK+20%',
    effect: { atkPercent: 20 }
  },
  
  // 防御系
  {
    id: 'def_boost_1',
    name: '防御強化I',
    description: 'DEF+10%',
    effect: { defPercent: 10 }
  },
  {
    id: 'def_boost_2',
    name: '防御強化II',
    description: 'DEF+20%',
    effect: { defPercent: 20 }
  },
  {
    id: 'hp_regen_1',
    name: 'HP再生I',
    description: '戦闘後HP2%回復',
    effect: { hpRegen: 2 }
  },
  {
    id: 'hp_regen_2',
    name: 'HP再生II',
    description: '戦闘後HP5%回復',
    effect: { hpRegen: 5 }
  },
  {
    id: 'dodge_1',
    name: '回避I',
    description: '回避率+3%',
    effect: { dodgeRate: 3 }
  },
  {
    id: 'dodge_2',
    name: '回避II',
    description: '回避率+7%',
    effect: { dodgeRate: 7 }
  },
];

export function getSkillById(id: string): Skill | undefined {
  return skills.find(s => s.id === id);
}

export function getRandomSkill(): Skill {
  return skills[Math.floor(Math.random() * skills.length)];
}
