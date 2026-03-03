import { PotionType } from '@/lib/types';

// ポーション定義
export const POTIONS: { [key: string]: PotionType } = {
  health_potion: {
    id: 'health_potion',
    name: 'ヒールポーション',
    description: 'HPを50%回復する',
    healPercent: 50,
    price: 100,
    emoji: '🧪',
  },
};

// デフォルトポーション（現時点ではヒールポーションのみ）
export const DEFAULT_POTION = POTIONS.health_potion;

export function getPotionById(id: string): PotionType | undefined {
  return POTIONS[id];
}
