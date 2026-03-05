# シミュレーションモード設計書

## 概要
各ステージのボスと戦闘できるシミュレーションモード。
ドラクエ風のアニメーション戦闘で、ログを1行ずつ表示。

## 要件
1. ホーム画面の「ダンジョン一覧」の下に配置
2. 各ステージボスと戦闘可能
3. ドラクエ風アニメーション戦闘
   - キャラクターがアニメーションする
   - ログは行動に合わせて1行ずつ表示
   - 時間を使ってユーザーに認知させる
4. 結果は一気に表示ではなく、リアルタイム風に進行

## UI設計

### ボス選択画面 (`/simulation`)
- ダンジョン選択 → ボス選択
- パーティ確認
- 「戦闘開始」ボタン

### 戦闘画面 (`/simulation/battle`)
```
┌─────────────────────────────────────┐
│         【ボス名】HP: XXX           │
│         [ボス画像/アイコン]          │
├─────────────────────────────────────┤
│                                     │
│  [味方1] [味方2] [味方3]             │
│  [味方4] [味方5] [味方6]             │
│                                     │
├─────────────────────────────────────┤
│  ログエリア（1行ずつ表示）            │
│  > 戦士の攻撃！ゴブリンに50ダメージ！  │
│  > ゴブリンの反撃！戦士に30ダメージ！  │
└─────────────────────────────────────┘
```

## アニメーション
1. **攻撃時**: キャラが前に出る → 戻る
2. **被ダメージ時**: キャラが揺れる（シェイク）
3. **回復時**: 緑のエフェクト
4. **スキル時**: スキル名表示 + 専用エフェクト
5. **死亡時**: フェードアウト

## 技術実装

### 状態管理
```typescript
interface SimulationState {
  phase: 'select' | 'battle' | 'result';
  selectedDungeon: string | null;
  selectedBoss: string | null;
  battleLogs: BattleLogEntry[];
  currentLogIndex: number;
  characters: CharacterBattleState[];
  boss: BossBattleState;
  isAnimating: boolean;
}
```

### ログ表示タイミング
- 各ログ間: 1.5秒
- アニメーション: 0.5秒
- ターン間: 2秒

## 実装タスク

### Phase 1: 基本UI
- [ ] `/simulation` ページ作成
- [ ] ボス選択UI
- [ ] ホームにリンク追加

### Phase 2: 戦闘画面
- [x] 戦闘レイアウト
- [x] キャラ/ボス表示
- [x] ログエリア
- [x] 戦闘ロジック実行（runBattle使用）

### Phase 3: アニメーション
- [x] 攻撃アニメーション
- [x] 被ダメージアニメーション
- [x] HP変動アニメーション
- [x] ログ1行ずつ表示

### Phase 4: 戦闘ロジック統合
- [ ] 既存battle/engineの結果を使用
- [ ] ログを分解してステップ実行
- [ ] 勝敗判定・結果表示

## ファイル構成
```
src/app/simulation/
  page.tsx           # ボス選択画面
  battle/
    page.tsx         # 戦闘画面
src/components/simulation/
  BattleArena.tsx    # 戦闘フィールド
  CharacterSprite.tsx # キャラアニメーション
  BossSprite.tsx     # ボスアニメーション
  BattleLog.tsx      # ログ表示（1行ずつ）
  HPBar.tsx          # HPバー（アニメーション付き）
```

## 既存コードとの連携
- `src/lib/battle/engine.ts` の戦闘ロジックを使用
- `src/lib/data/dungeons.ts` のボスデータを使用
- `src/store/gameStore.ts` からパーティ情報取得
