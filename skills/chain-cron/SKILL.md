# チェーン式Cron秘術スキル

AIエージェントが自律的にタスクを実行するためのチェーン式cronパターン。

## 概要

チェーン式Cronは、AIエージェントが**自分で次のcronを設定する**ことで自律駆動を実現する手法。

```
[cron実行] → タスク処理 → [次のcronを設定] → [次のcron実行] → ...
```

## 🚨 絶対ルール

**このスキルを使うときは、必ず `openclaw cron add` コマンドを使うこと。**

### やってはいけないこと

- ❌ 「sessions_sendが使えないから別の方法で実行する」
- ❌ 「メインセッションから直接タスクを実行する」
- ❌ 「cronを使わずにループを組む」

### 正しい対応

- ✅ sessions_sendが使えない → cronで実行（cronのisolated sessionからは使える）
- ✅ メインセッションでは「cronを設定する」だけ
- ✅ 実際のタスク実行は必ずcron経由

## 使用手順

### 1. ドキュメントを読む

まず以下の2つのドキュメントを確認:

1. **CRON_BASICS.md** - cronの基本設定（このスキルの `docs/` 内）
2. **CRON_CHAIN_TECHNIQUE.md** - チェーン式の詳細パターン（このスキルの `docs/` 内）

### 2. 状態ファイルを設計

`chain-state.json` を作成して状態を管理:

```json
{
  "taskId": "task-2026-03-02",
  "goal": "タスクの目標",
  "completionCriteria": ["完了条件1", "完了条件2"],
  "currentPhase": 1,
  "phaseAttempt": 1,
  "maxAttempts": 20,
  "log": [],
  "findings": [],
  "completed": []
}
```

### 3. Phase 1のcronを設定

```bash
openclaw cron add \
  --name "タスク-phase1" \
  --agent <agent-id> \
  --at "1m" \
  --delete-after-run \
  --no-deliver \
  --session isolated \
  --timeout-seconds 1800 \
  --model anthropic/claude-opus-4-5 \
  --message "
## 起動時の確認手順
1. スキル chain-cron の docs/CRON_CHAIN_TECHNIQUE.md を読む
2. chain-state.json を読んで状態把握（なければ作成）
3. currentPhase のタスクを実行

## Phase 1: 初期化
1. sessions_sendでDiscordに「📥 Phase 1 開始」
2. 状態ファイル作成
3. タスク対象を調査
4. sessions_sendでDiscordに「✅ Phase 1 完了」
5. Phase 2のcronを設定
"
```

### 4. 各Phaseの実行フロー

1. **了解報告**: sessions_sendで「📥 Phase N 開始: [これからやること]」
2. **作業実行**: 小さいタスクを1つ実行
3. **完了報告**: sessions_sendで「✅ Phase N 完了: [結果] → 次cron: [設定した/しなかった]」
4. **次のcron設定**: 状況に応じて次Phaseのcronを設定

### 5. 安全チェック（毎回実行）

- `session_status` でusage確認
- 現在モデルが90%超え → 別モデルで次cronを設定
- 全モデルが90%超え → 記録を保存して報告、一時中断
- maxAttempts超え → 報告して終了

### 6. 終了条件

- 完了条件を全て満たした → Phase Finalで報告して終了
- usage不足 → 状態を保存して一時中断
- エラー3回連続 → 報告して判断を仰ぐ

## cron設定のベストプラクティス

```bash
openclaw cron add \
  --name "タスク名-phaseN" \
  --agent <agent-id> \
  --at "1m" \                    # 次タスクへの間隔
  --delete-after-run \           # 実行後に削除
  --no-deliver \                 # 配信は自分で制御
  --session isolated \           # 履歴汚染を防ぐ
  --timeout-seconds 1800 \       # 30分
  --model anthropic/claude-opus-4-5 \  # モデルを明示
  --message "..."
```

### messageの最初に必ず書くこと

```markdown
## 起動時の確認手順
1. スキル chain-cron の docs/CRON_CHAIN_TECHNIQUE.md を読んでチェーン式cronの動作を理解
2. chain-state.json を読んで現在の状態を把握
3. currentPhase を確認し、該当するPhaseの作業を実行
```

## トラブルシューティング

### sessions_sendが使えない

メインセッション（サンドボックス内）からは使えない場合がある。
→ **cronで実行する**（cronのisolated sessionからは動作する）

### OAuthトークンエラー

```
FailoverError: OAuth token refresh failed
```
→ 別のプロバイダーのモデルを `--model` で指定

### モデルが見つからない

```
model not allowed: xxx
```
→ `session_status` で使えるモデルを確認

## 詳細ドキュメント

このスキルの `docs/` ディレクトリ内:
- **CRON_BASICS.md** - cron基本設定
- **CRON_CHAIN_TECHNIQUE.md** - チェーン式の詳細

## 哲学

> 信頼できる自律性 = 適切な制約のある自由

- **小さく**: 1回1タスク、失敗しても被害最小
- **透明に**: 全てログに残す、後から追跡可能
- **安全に**: 終了条件、usage管理、人間介入ポイント
- **継続可能に**: 状態ファイルで途中再開OK
