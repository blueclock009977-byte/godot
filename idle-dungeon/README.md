# Idle Dungeon 🗡️

見下ろし型2D放置ハクスラRPG

## コンセプト

- **Archeroスタイル** の見下ろし視点
- **完全放置** - 1キャラが自動で戦闘
- **ハクスラ要素** - 装備厳選でビルド構築
- **ランキング** - 到達フロアで競争

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (状態管理)
- Firebase Realtime Database (REST API)

## 開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## 機能

### v0.1.0 (MVP)
- [x] ログイン (ID入力)
- [x] 装備システム (武器/防具/アクセサリー)
- [x] パッシブスキル (4スロット)
- [x] 自動戦闘シミュレーション
- [x] フロア進行
- [x] オフライン進行 (最大8時間)

### v0.2.0 (追加機能)
- [x] Canvas描画による戦闘アニメーション
- [x] グローバルランキング
- [x] 実績・統計システム
- [x] マイルストーン報酬
- [x] フレンド機能
- [x] デイリーログインボーナス
- [x] ウィークリーチャレンジ
- [x] ガチャシステム (天井付き)

## Firebase設定

`src/lib/firebase.ts` のURLを変更：

```typescript
const FIREBASE_URL = 'https://your-project.firebaseio.com';
```

---

Made with ❤️ by SHIGE Jr.
