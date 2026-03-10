"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/auth";
import { setPassword, hasPassword } from "@/lib/save/password";
import { transferData, checkCurrentData } from "@/lib/save/transfer";

type Tab = "password" | "transfer";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("password");
  const [uid, setUid] = useState<string | null>(null);
  const [isPasswordSet, setIsPasswordSet] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const user = getCurrentUser();
      if (user) {
        setUid(user.uid);
        const has = await hasPassword(user.uid);
        setIsPasswordSet(has);
      }
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">⚙️ 設定</h1>
          <Link
            href="/"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ← ホームに戻る
          </Link>
        </div>

        {/* User ID */}
        <div className="bg-zinc-800/50 rounded-lg p-4 mb-8 border border-zinc-700">
          <p className="text-zinc-400 text-sm">あなたのユーザーID</p>
          <p className="font-mono text-sm text-zinc-300 break-all">{uid ?? "不明"}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("password")}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === "password"
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            🔑 パスワード設定
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === "transfer"
                ? "bg-purple-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            📥 データ引き継ぎ
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "password" && (
          <PasswordSection
            uid={uid}
            isPasswordSet={isPasswordSet}
            onPasswordSet={() => setIsPasswordSet(true)}
          />
        )}
        {activeTab === "transfer" && (
          <TransferSection />
        )}
      </main>
    </div>
  );
}

// ========== パスワード設定セクション ==========
function PasswordSection({
  uid,
  isPasswordSet,
  onPasswordSet,
}: {
  uid: string | null;
  isPasswordSet: boolean;
  onPasswordSet: () => void;
}) {
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!uid) {
      setError("ユーザーIDが取得できません");
      return;
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    setLoading(true);
    const result = await setPassword(uid, password);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setPasswordValue("");
      setConfirmPassword("");
      onPasswordSet();
    } else {
      setError(result.error ?? "エラーが発生しました");
    }
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
      <h2 className="text-xl font-bold mb-4">🔑 引き継ぎパスワード設定</h2>
      
      <p className="text-zinc-400 mb-6">
        パスワードを設定すると、別のデバイスやブラウザでデータを引き継げます。
      </p>

      {isPasswordSet && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
          <p className="text-green-400">✅ パスワード設定済み</p>
          <p className="text-zinc-400 text-sm mt-1">
            新しいパスワードを設定すると上書きされます
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-zinc-400 mb-2">パスワード（8文字以上）</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            placeholder="••••••••"
            minLength={8}
            required
          />
        </div>

        <div>
          <label className="block text-zinc-400 mb-2">パスワード（確認）</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            placeholder="••••••••"
            minLength={8}
            required
          />
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
            <p className="text-green-400">✅ パスワードを設定しました</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 text-white font-bold py-3 rounded-lg transition-colors"
        >
          {loading ? "設定中..." : isPasswordSet ? "パスワードを更新" : "パスワードを設定"}
        </button>
      </form>
    </div>
  );
}

// ========== データ引き継ぎセクション ==========
function TransferSection() {
  const [password, setPasswordValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentDataInfo, setCurrentDataInfo] = useState<{
    hasData: boolean;
    monsterCount: number;
    wins: number;
  } | null>(null);

  const handleCheckData = async () => {
    if (password.length < 8) {
      setError("パスワードは8文字以上です");
      return;
    }

    setLoading(true);
    const info = await checkCurrentData();
    setCurrentDataInfo(info);
    setShowConfirm(true);
    setLoading(false);
  };

  const handleTransfer = async () => {
    setLoading(true);
    setError(null);

    const result = await transferData(password);
    setLoading(false);

    if (result.success) {
      // 成功したらリロードして新しいデータを反映
      window.location.href = "/?transferred=1";
    } else {
      setError(result.error ?? "エラーが発生しました");
      setShowConfirm(false);
    }
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
      <h2 className="text-xl font-bold mb-4">📥 データ引き継ぎ</h2>
      
      <p className="text-zinc-400 mb-6">
        別のデバイスで設定したパスワードを入力して、データを引き継ぎます。
      </p>

      <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
        <p className="text-yellow-400 font-bold">⚠️ 注意</p>
        <p className="text-zinc-400 text-sm mt-1">
          引き継ぎを行うと、現在のデータは上書きされます。
          引き継ぎ前に現在のデータのパスワードを設定しておくことをおすすめします。
        </p>
      </div>

      {!showConfirm ? (
        <div className="space-y-4">
          <div>
            <label className="block text-zinc-400 mb-2">引き継ぎパスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="引き継ぎ元で設定したパスワード"
              minLength={8}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleCheckData}
            disabled={loading || password.length < 8}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? "確認中..." : "引き継ぎを開始"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-lg p-4">
            <p className="text-zinc-400 mb-2">現在のデータ</p>
            {currentDataInfo?.hasData ? (
              <div className="text-white">
                <p>モンスター: {currentDataInfo.monsterCount}体</p>
                <p>勝利数: {currentDataInfo.wins}</p>
              </div>
            ) : (
              <p className="text-zinc-500">データなし</p>
            )}
          </div>

          <p className="text-red-400 text-center font-bold">
            本当に引き継ぎますか？現在のデータは失われます。
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 bg-zinc-600 hover:bg-zinc-500 text-white font-bold py-3 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleTransfer}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? "引き継ぎ中..." : "引き継ぎ実行"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
