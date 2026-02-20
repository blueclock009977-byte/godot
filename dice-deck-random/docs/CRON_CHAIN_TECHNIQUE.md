# チェーン式Cron秘術 - AIエージェント自律駆動パターン

> ⚠️ **前提**: cronの基本的な設定方法は **CRON_BASICS.md** を参照してください。
> 本ドキュメントは、その設定を活用した**自律駆動ワークフロー**の解説です。

## 概要

チェーン式Cronは、AIエージェントが**自分で次のcronを設定する**ことで自律駆動を実現する手法。

```
[cron実行] → タスク処理 → [次のcronを設定] → [次のcron実行] → ...
```

通常のcronは固定スケジュールだが、チェーン式は：
- 状況に応じて次のタスクを変えられる
- 終了条件を満たすまで自律的に動き続ける
- 各ステップが小さく、失敗しても途中から再開できる

---

## 核心原則

### 1. ゴールを「成果物」で定義する

❌ 悪い例: 「リファクタリングして」
✅ 良い例: 「重複コードを統合し、テストが通る状態で、変更ログをREPORT.mdに出力する」

### 2. 判断基準を先に渡す

AIが「自分で決めて進む」ために必要。

```
判断基準（優先順）:
1. 既存テストが壊れないこと
2. コードの可読性向上
3. 変更量は最小限
```

### 3. PDCAループを各Phaseに組み込む

```
Plan: 今回やることを確認
Do: 小さいタスク1つ実行
Check: 判断基準で自己採点
Act: 次のPhase決定 or 繰り返し
```

### 4. 不明点は「仮定して進む」

止まらないAIにするルール：
- 不明点は最大3つまで質問
- それ以外は合理的な仮定を置いて進む
- 仮定は状態ファイルに明記

### 5. ログ形式で透明性を確保

各ステップで記録：
- 前提/仮定
- 判断（なぜそうした）
- 次アクション

### 6. 1cronで「了解→作業→完了」報告

各Phase実行時に以下の流れで報告する：

```markdown
## 報告の流れ

1. **了解報告**（作業開始時）
   sessions_sendツールで Discord channel:チャンネルID に報告：
   「📥 Phase N 開始: [これからやること]」

2. **作業実行**
   タスクを実行

3. **完了報告**（作業終了時）
   sessions_sendツールで Discord channel:チャンネルID に報告：
   「✅ Phase N 完了: [やったこと] → 次: [次のPhase]」

4. **次のcronを設定**
   完了報告の後に次Phaseのcronを設定
```

これにより人間がリアルタイムで進捗を把握でき、必要なら介入できる。

**注意**: sessions_sendはcronのisolated sessionから動作する。
サンドボックス内のメインセッションからは使えない場合がある。

### 7. 1回のcronは小さく

- タイムアウト: 30分程度
- 1回で1つの小さいタスク
- 大きいタスクは分割

---

## 状態ファイル設計

チェーン式cronの「記憶」となるファイル。

### ファイル: `chain-state.json`

```json
{
  "taskId": "refactor-2026-02-20",
  "goal": "UserServiceクラスのリファクタリングとテスト追加",
  "completionCriteria": [
    "重複コードが統合されている",
    "全テストがパスする",
    "REPORT.mdに変更ログがある"
  ],
  "judgmentCriteria": [
    "既存テストが壊れない",
    "可読性向上",
    "変更量最小"
  ],
  "constraints": [
    "外部API変更禁止",
    "破壊的変更禁止"
  ],
  "currentPhase": 2,
  "phaseAttempt": 3,
  "maxAttempts": 20,
  "startedAt": "2026-02-20T12:00:00Z",
  "assumptions": [
    "テストフレームワークはJest",
    "ESLint設定は既存を踏襲"
  ],
  "log": [
    {
      "phase": 1,
      "attempt": 1,
      "action": "プロジェクト構造を調査",
      "reasoning": "リファクタ対象を特定するため",
      "result": "UserService.tsに重複3箇所発見",
      "next": "Phase2でリファクタ開始"
    }
  ],
  "findings": [
    "UserService.ts:45-60 と 120-135 が重複",
    "validateUser関数が3箇所で定義"
  ],
  "completed": [
    "validateUser関数を統合"
  ]
}
```

---

## Phase構成テンプレート

### Phase 1: 初期化・調査

**目的**: 現状把握、状態ファイル作成

```markdown
## 起動時の確認手順
1. docs/CRON_CHAIN_TECHNIQUE.md を読んでチェーン式cronの動作を理解
2. chain-state.json があれば読んで現在の状態を把握（なければPhase 1）
3. currentPhase を確認し、該当するPhaseの作業を実行

## 指示内容（Phase 1の場合）

1. **了解報告**: sessions_sendでDiscordに「📥 Phase 1 開始: [これからやること]」
2. 状態ファイル `chain-state.json` を作成
3. プロジェクト構造を調査
4. タスク対象を特定してfindingsに記録
5. **完了報告**: sessions_sendでDiscordに「✅ Phase 1 完了: [結果] → 次: Phase 2」
6. Phase 2のcronを設定

## 完了条件
- 状態ファイルが作成されている
- findingsに調査結果がある
- 了解報告・完了報告が送信済み
- 次Phaseのcronが設定済み
```

### Phase 2-N: 実行フェーズ（繰り返し）

**目的**: 小さいタスクを1つ実行

```markdown
## 起動時の確認手順
1. docs/CRON_CHAIN_TECHNIQUE.md を読んでチェーン式cronの動作を理解
2. chain-state.json を読んで現在の状態を把握
3. currentPhase を確認し、該当するPhaseの作業を実行

## 指示内容（Phase 2-Nの場合）

1. **了解報告**: sessions_sendでDiscordに「📥 Phase N 開始: [これからやること]」
2. findingsから未完了タスクを1つ選ぶ
3. 実行してcompletedに追加
4. ログを記録
5. **完了報告**: sessions_sendでDiscordに「✅ Phase N 完了: [結果] → 次: [継続 or 次Phase]」
6. 次のcronを設定

## Phase遷移の判断

### 人間の指示がある場合
指示に従う（例: 「src/utils/内のコードを全て見て」→ 完了するまでPhase継続）

### 人間の指示がない場合
AIの自己判断で遷移：
- タスクがまだある → 同じPhaseを再設定
- タスクがない → 次フェーズへ
- エラー発生 → ゴール達成までリトライ（ログに記録しつつ）

## 安全チェック（毎回実行）
- session_statusでusage確認（後述）
- 現在モデルが90%超え → 別モデルで次cronを設定
- 全モデルが90%超え → 記録を保存して報告、一時中断
- maxAttempts超え → 報告して終了
```

### Phase Final: 報告・終了

**目的**: 人間に結果を報告

```markdown
## 起動時の確認手順
1. docs/CRON_CHAIN_TECHNIQUE.md を読んでチェーン式cronの動作を理解
2. chain-state.json を読んで現在の状態を把握
3. currentPhase を確認し、該当するPhaseの作業を実行

## 指示内容（Phase Finalの場合）

1. **了解報告**: sessions_sendでDiscordに「📥 Phase Final 開始: 最終報告作成」
2. completedとlogからREPORT.mdを生成
3. 人間にDiscordで報告
4. cronを設定せず終了（チェーン終了）
```

---

## 実践例: リファクタリング + テスト

### 起動コマンド

```bash
openclaw cron add \
  --name "自律リファクタ-init" \
  --agent my-agent \
  --at "1m" \
  --delete-after-run \
  --no-deliver \
  --session isolated \
  --timeout-seconds 1800 \
  --thinking low \
  --message "
## チェーン式タスク開始: リファクタリング + テスト

### ゴール
UserServiceクラスをリファクタリングし、テストカバレッジを上げる

### 完了条件
- 重複コードが統合されている
- テストカバレッジ80%以上
- REPORT.mdに変更ログ

### 判断基準（優先順）
1. 既存テストが壊れない
2. 可読性向上
3. 変更量最小

### 制約
- 外部API変更禁止
- 1回のcronで1タスクのみ

### Phase 1 実行内容
1. chain-state.json を作成（上記内容を含む）
2. src/ 以下を調査し、リファクタ対象を特定
3. findingsに記録
4. 完了したら次のcronを設定:

\`\`\`bash
openclaw cron add \\
  --name \"自律リファクタ-phase2\" \\
  --agent my-agent \\
  --at \"1m\" \\
  --delete-after-run \\
  --no-deliver \\
  --timeout-seconds 1800 \\
  --message \"chain-state.jsonを読み、Phase2を実行。リファクタを1つ行い、完了/findings更新後、状況に応じて次cronを設定。\"
\`\`\`

### 安全ルール
- 不明点は3つまで質問、他は仮定して進む（仮定を記録）
- session_statusでusage確認、残り10%以下なら報告して終了
- 20回以上ループしたら報告して終了
"
```

### Phase 2 の指示テンプレート

```markdown
## Phase 2: リファクタリング実行

1. chain-state.json を読む
2. session_status でusage確認
   - 残り10%以下 → Phase Final へ
3. findingsから未処理の項目を1つ選ぶ
   - なければ → Phase 3（テスト）へ
4. リファクタリング実行
5. テスト実行して確認
6. chain-state.json 更新（log, completed）
7. 次のcronを設定

### 次cron設定
- まだリファクタある → Phase 2 再設定（1m後）
- リファクタ完了 → Phase 3 設定
- エラー/budget超え → Phase Final 設定
```

### Phase 3 の指示テンプレート（テスト追加）

```markdown
## Phase 3: テスト追加

1. chain-state.json を読む
2. session_status でusage確認
   - 残り10%以下 → Phase Final へ
3. テストカバレッジを確認
4. カバレッジが低い箇所を1つ選んでテスト追加
5. テスト実行して確認
6. chain-state.json 更新（log, completed）
7. 次のcronを設定

### 次cron設定
- カバレッジ目標未達 → Phase 3 再設定（1m後）
- カバレッジ目標達成 → Phase Final 設定
- エラー/残り10%以下 → Phase Final 設定
```

---

## 安全機構

### 1. 無限ループ防止

```json
{
  "phaseAttempt": 15,
  "maxAttempts": 20
}
```

毎回チェックして、超えたら強制終了。

### 2. Usage監視（cron登録前に必須）

```markdown
## cron登録前の確認手順

1. session_statusツールで**紐づいている全モデル**のusageを確認
2. 各モデルの残り使用量をチェック
3. 残り10%以上（使用率90%未満）のモデルを選ぶ
4. そのモデルを `--model` オプションで指定してcron登録

## 確認例
session_statusを実行 → 以下のような情報を確認：
- opus: 85%使用 → 残り15% ✅ 使える
- sonnet: 95%使用 → 残り5% ❌ 使えない
- codex: 40%使用 → 残り60% ✅ 使える
→ opus または codex で次cronを登録

## モデル指定の例
# 残り使用量が多いモデルを選んで指定
openclaw cron add \
  --name "タスク-phase2" \
  --agent my-agent \
  --model anthropic/claude-opus-4-5 \  # ← 残り10%以上のモデルを指定
  ...

## 全モデルが90%超えの場合（一時中断）
1. 現在の作業を安全な状態で止める
2. chain-state.jsonに現状を保存（どこまで完了したか、各モデルの使用率）
3. 人間にDiscordで報告
4. cronを設定せず終了
```

※ 報告方法はCRON_BASICS.mdの「Discordへの配信」を参照

### 3. エラー時のリトライ

```markdown
エラーが発生しても、ゴール達成まで諦めない。

## リトライの流れ
1. エラー内容をlogに記録
2. 別のアプローチを試す
3. chain-state.jsonを更新
4. 次のcronを設定して再挑戦

## リトライで解決しない場合
- 同じエラーが3回連続 → 人間に報告して判断を仰ぐ
- 報告方法はCRON_BASICS.mdの「Discordへの配信」を参照
```

### 4. 人間介入ポイント

- Phase 1 完了時: 調査結果レビュー
- 同じエラー3回連続: 報告して判断を仰ぐ
- usage残り10%以下: 一時中断報告
- 最終報告: REPORT.mdで全体確認

### 5. 復旧可能性

chain-state.jsonに全状態が記録されているので、
途中で止まっても「Phase N から再開」が可能。

---

## Cron設定ベストプラクティス

```bash
openclaw cron add \
  --name "タスク名-phaseN" \
  --agent my-agent \
  --at "1m" \                    # 次タスクへの間隔（後述）
  --delete-after-run \           # 実行後に削除（ゴミを残さない）
  --no-deliver \                 # 配信は自分で制御
  --timeout-seconds 1800 \       # 30分（長めに）
  --thinking low \               # 複雑なタスクならmedium
  --session isolated \           # 履歴汚染を防ぐ
  --message "..."
```

### messageの最初に必ず書くこと

isolated sessionは毎回コンテキストがリセットされる。
messageの最初に以下を入れて、チェーン式の動作を理解させる：

```markdown
## 起動時の確認手順
1. docs/CRON_CHAIN_TECHNIQUE.md を読んでチェーン式cronの動作を理解
2. chain-state.json を読んで現在の状態を把握
3. currentPhase を確認し、該当するPhaseの作業を実行
```

これにより、どのPhaseから起動されても正しく動作できる。

### なぜ「1m」間隔なのか

タスクが終わったらすぐ次のタスクに移りたいから。

```
[タスクA: 10分] → [cron設定: 1分後] → [タスクB: 20分] → [cron設定: 1分後] → [タスクC: 5分]
```

- タスク自体の長さは `--timeout-seconds` で制御
- `--at "1m"` は「次のcronを起動するまでの待ち時間」
- 短くすることで、タスク完了後すぐに次へ進める
- 長くする必要があるケース: API制限、レート制限がある場合など

### モデル使い分け

```bash
# 単純作業（ファイル操作、定型処理）
--model anthropic/claude-sonnet-4-20250514

# 判断が必要な作業（設計、レビュー）
--model anthropic/claude-opus-4-5
```

---

## チェーン式の哲学

> 信頼できる自律性 = 適切な制約のある自由

- **小さく**: 1回1タスク、失敗しても被害最小
- **透明に**: 全てログに残す、後から追跡可能
- **安全に**: 終了条件、budget管理、人間介入ポイント
- **継続可能に**: 状態ファイルで途中再開OK

チェーン式cronは「AIに仕事を任せる」のではなく、
「AIが自分で考えて動ける環境を作る」こと。
