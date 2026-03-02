'use client';

import { Modal } from './Modal';

interface HowToPlayModalProps {
  onClose: () => void;
}

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <Modal title="❓ 遊び方" onClose={onClose} maxWidth="max-w-lg">
      <div className="p-4 space-y-4">
        <div className="text-center mb-4">
          <p className="text-slate-300">
            放置系ビルドRPGへようこそ！<br />
            キャラを作成し、パーティを編成して、ダンジョンを探索しよう！
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-amber-400">🔄 基本の流れ</h3>
          
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <p className="font-semibold text-white">キャラクター作成</p>
                <p className="text-sm text-slate-400">
                  種族・職業・特性・環境を選んで冒険者を雇おう
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <p className="font-semibold text-white">パーティ編成</p>
                <p className="text-sm text-slate-400">
                  前衛・後衛に配置（最大6人まで）
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <p className="font-semibold text-white">ダンジョン探索</p>
                <p className="text-sm text-slate-400">
                  ソロ・マルチ・チャレンジから選んで出発！<br />
                  放置でも探索は進むよ
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">4️⃣</span>
              <div>
                <p className="font-semibold text-white">報酬獲得</p>
                <p className="text-sm text-slate-400">
                  コイン・アイテム・装備・経験値をゲット！
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">5️⃣</span>
              <div>
                <p className="font-semibold text-white">キャラ強化</p>
                <p className="text-sm text-slate-400">
                  レベルアップ・マスタリー・生物改造・装備で強化
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">6️⃣</span>
              <div>
                <p className="font-semibold text-white">より難しいダンジョンへ！</p>
                <p className="text-sm text-slate-400">
                  強くなったら次のダンジョンに挑戦しよう
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <h3 className="text-lg font-bold text-purple-400 mb-2">💡 Tips</h3>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            <li>種族と職業のマスタリーで大幅に強くなれる</li>
            <li>マルチプレイで仲間と協力すると楽！</li>
            <li>チャレンジダンジョンでレアアイテムを狙おう</li>
            <li>ダンジョン一覧で敵の弱点をチェック</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-semibold transition-colors"
        >
          閉じる
        </button>
      </div>
    </Modal>
  );
}
