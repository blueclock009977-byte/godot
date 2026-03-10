import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500 bg-clip-text text-transparent">
            育成モンスターバトル
          </h1>
          <p className="text-xl text-zinc-400 mb-8">
            40体のモンスター × 147種の技 × 8タイプ相性
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/battle"
              className="inline-block bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 shadow-lg"
            >
              ⚔️ vs AI
            </Link>
            <Link
              href="/online"
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 shadow-lg"
            >
              🌐 オンライン対戦
            </Link>
            <Link
              href="/profile"
              className="inline-block bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 shadow-lg"
            >
              📋 プロフィール
            </Link>
            <Link
              href="/settings"
              className="inline-block bg-gradient-to-r from-zinc-600 to-zinc-700 hover:from-zinc-500 hover:to-zinc-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 shadow-lg"
            >
              ⚙️ 設定
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon="🔥"
            title="8タイプ相性"
            description="炎、水、草、電気、岩、風、闇、光 + 無属性。相性を読んで戦略を組み立てよう。"
          />
          <FeatureCard
            icon="⚡"
            title="マナシステム"
            description="毎ターン回復するマナを管理。強力な技ほどコストが高い。いつ切り札を使う？"
          />
          <FeatureCard
            icon="🎯"
            title="状態異常 & 能力変化"
            description="やけど、毒、麻痺、混乱...攻撃だけじゃない戦い方がある。"
          />
        </div>

        {/* Stats */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold mb-8">収録データ</h2>
          <div className="flex justify-center gap-12">
            <StatItem value="40" label="モンスター" />
            <StatItem value="147" label="技" />
            <StatItem value="44" label="特性" />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-zinc-500 mb-4">
            まだα版です。どんどん追加していきます！
          </p>
          <Link
            href="/battle"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            → バトル画面へ
          </Link>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-yellow-400">{value}</div>
      <div className="text-zinc-500">{label}</div>
    </div>
  );
}
