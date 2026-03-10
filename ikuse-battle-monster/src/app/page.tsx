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
          モンスターを集めて育てて、オンラインバトルで競おう！
        </p>

        <div className="grid gap-3">
          {/* 御三家選択（新規プレイヤー向け） */}
          <Link
            href="/starter"
            className="block w-full rounded-xl bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-500 hover:to-orange-400 transition-colors px-5 py-4 text-lg font-bold text-center"
          >
            🎮 ゲームスタート（御三家選択）
          </Link>

          <Link
            href="/battle"
            className="block w-full rounded-xl bg-green-600 hover:bg-green-500 transition-colors px-5 py-4 text-lg font-bold text-center"
          >
            ⚔️ テストバトルをはじめる
          </Link>

          <Link
            href="/profile"
            className="block w-full rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors px-5 py-4 text-lg font-bold text-center"
          >
            👤 プロフィール・パーティ編成
          </Link>

          <p className="text-sm text-gray-400 mt-2">
            ※ 初めての方は「ゲームスタート」から御三家を選んでください。<br />
            ※ バトルに勝って卵をゲット → 孵化して新モンスター獲得！
          </p>
        </div>
      </div>
    </main>
  );
}
