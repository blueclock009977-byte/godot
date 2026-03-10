import Link from 'next/link';

/**
 * トップページ
 * まずは「すぐ触れる」ことを優先して、バトル画面への導線を用意
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-2xl mx-auto pt-12">
        <h1 className="text-4xl font-bold mb-3">育成モンスターバトル</h1>
        <p className="text-gray-300 mb-8">
          まずはテストバトルをすぐ遊べる入口を用意したよ。
        </p>

        <div className="grid gap-3">
          <Link
            href="/battle"
            className="block w-full rounded-xl bg-green-600 hover:bg-green-500 transition-colors px-5 py-4 text-lg font-bold text-center"
          >
            ⚔️ テストバトルをはじめる
          </Link>

          <p className="text-sm text-gray-400">
            ※ 現在は AI 戦のテストモード（3vs3）
          </p>
        </div>
      </div>
    </main>
  );
}
