interface DifficultyStarsProps {
  level: number;
  maxStars?: number;
}

/**
 * 難易度を星で表示するコンポーネント
 * ★: 達成済み、☆: 未達成
 */
export function DifficultyStars({ level, maxStars = 8 }: DifficultyStarsProps) {
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(level)}{'☆'.repeat(maxStars - level)}
    </span>
  );
}
