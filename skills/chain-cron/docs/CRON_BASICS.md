# OpenClaw Cron 基本設定ガイド

## 概要

OpenClawのcronは、AIエージェントにスケジュールされたタスクを実行させる仕組み。
Gatewayが管理し、指定時刻にエージェントセッションを起動してメッセージを送る。

## 基本構文

```bash
openclaw cron add \
  --name "ジョブ名" \
  --agent <agent-id> \
  --cron "分 時 日 月 曜日" \
  --tz "Asia/Tokyo" \
  --message "エージェントへの指示"
```

## 必須オプション

| オプション | 説明 | 例 |
|-----------|------|-----|
| `--name` | ジョブの識別名 | `"朝の挨拶"` |
| `--agent` | 実行するエージェントID | `shige-jr-test` |
| `--message` | エージェントに送る指示 | `"天気を教えて"` |

## スケジュール指定（いずれか1つ）

| オプション | 説明 | 例 |
|-----------|------|-----|
| `--cron` | cron式（5フィールド） | `"0 9 * * *"` (毎日9時) |
| `--every` | 間隔実行 | `"30m"` (30分ごと) |
| `--at` | 一回だけ実行 | `"2026-02-20T15:00:00"` or `"5m"` |

## 重要オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--tz` | タイムゾーン | UTC |
| `--session` | `main` or `isolated` | isolated |
| `--timeout-seconds` | タイムアウト秒数 | 30 |
| `--no-deliver` | 結果をメインセッションに送らない | false |
| `--model` | モデル指定 | エージェントのデフォルト |
| `--thinking` | 思考レベル | off |

## Cron式クイックリファレンス

```
┌───────────── 分 (0-59)
│ ┌───────────── 時 (0-23)
│ │ ┌───────────── 日 (1-31)
│ │ │ ┌───────────── 月 (1-12)
│ │ │ │ ┌───────────── 曜日 (0-6, 0=日曜)
│ │ │ │ │
* * * * *
```

| 式 | 意味 |
|-----|------|
| `0 9 * * *` | 毎日9:00 |
| `0 */2 * * *` | 2時間ごと |
| `30 9 * * 1-5` | 平日9:30 |
| `0 9,18 * * *` | 毎日9:00と18:00 |

## ⚠️ 注意事項・落とし穴

### 1. `--agent` は必ず指定する
省略すると `main` エージェントにフォールバックし、意図しない動作になる。

### 2. タイムゾーンを明示する
`--tz "Asia/Tokyo"` を忘れるとUTC扱いになり、9時間ずれる。

### 3. Discord配信方法（テスト済み・2026年2月）

以下の3つの方法が動作確認済み：

**方法A: sessions_send（prompt内指示）** ← おすすめ
```bash
--no-deliver \
--message "...完了したら sessions_send ツールで Discord channel:チャンネルID に報告して"
```
エージェントが柔軟に報告内容を決められる。チェーン式cronに最適。

**方法B: --announce --to**
```bash
--announce \
--to "channel:1471449101999538208"
```
エージェントの最終応答を自動配信。

**方法C: --to のみ**
```bash
--to "channel:1471449101999538208"
```
`--to` 指定で自動的にannounceモードになる。

### 4. `--to` には `channel:` プレフィックスが必須
Discordチャンネルに配信する場合、IDだけでなくプレフィックスが必要：
```bash
# ❌ 間違い
--to "1471449101999538208"

# ✅ 正しい
--to "channel:1471449101999538208"
```

### 5. `--no-deliver` の使いどころ
結果をメインセッションに報告する必要がない場合に指定。
配信先を自分で制御する場合はこれをつける。

### 6. テストは `--at` で
```bash
openclaw cron add --name "テスト" --agent my-agent --at "1m" --message "テスト"
```
`cron run` より `--at "1m"` の方が実際の動作に近い。

### 7. Gateway接続オプション
リモートGatewayに接続する場合：
```bash
--url "$OPENCLAW_GATEWAY_URL" --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 管理コマンド

```bash
# 一覧
openclaw cron list

# 削除
openclaw cron rm <job-id>

# 有効化/無効化
openclaw cron enable <job-id>
openclaw cron disable <job-id>

# 手動実行（デバッグ用）
openclaw cron run <job-id>

# 実行履歴
openclaw cron runs <job-id>
```

## 実践例

### 毎日の定時タスク
```bash
openclaw cron add \
  --name "朝の天気" \
  --agent my-agent \
  --cron "0 7 * * *" \
  --tz "Asia/Tokyo" \
  --timeout-seconds 60 \
  --message "今日の天気を教えて"
```

### 30分ごとのチェック
```bash
openclaw cron add \
  --name "メールチェック" \
  --agent my-agent \
  --every "30m" \
  --session main \
  --message "未読メールをチェックして、重要なものがあれば教えて"
```

### 一回限りのリマインダー
```bash
openclaw cron add \
  --name "会議リマインド" \
  --agent my-agent \
  --at "2h" \
  --delete-after-run \
  --message "14時から会議だよ！"
```

## 高度なオプション

あまり使わないが、知っておくと便利：

| オプション | 説明 |
|-----------|------|
| `--stagger` | 実行時刻を少しずらす（例: `30s`で0〜30秒ランダム遅延） |
| `--exact` | staggerを無効化し、正確な時刻に実行 |
| `--wake` | `now`（即座）or `next-heartbeat`（次回ハートビート時） |
| `--expect-final` | エージェントの最終応答を待つ |
| `--best-effort-deliver` | 配信失敗してもジョブを失敗扱いにしない |
| `--keep-after-run` | 一回限りジョブを実行後も残す |

## トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| 実行されない | タイムゾーン間違い | `--tz` を確認 |
| 間違ったエージェントが動く | `--agent` 未指定 | 明示的に指定 |
| 配信されない | 配信先設定の問題 | メッセージ内でsessions_send指示 |
| タイムアウト | 処理が長い | `--timeout-seconds` を増やす |

### NO_REPLY履歴の蓄積問題

**症状**: cronが実行されるが、エージェントが応答をスキップする

**原因**: `--session main` でcronを実行すると、メインセッションの履歴にNO_REPLYが溜まっていく。
これが続くと、エージェントが「また同じパターンだ」と判断して応答をスキップしがち。

**対処**:
- `--session isolated` を使う（デフォルト）
- メインセッションを使う必要がある場合は、定期的に履歴をクリアするか、明確に異なる指示を出す

### sessionKeyの不一致

**症状**: cronは動いているが、期待したエージェントと違う場所で実行される

**原因**: `--agent` を省略すると `main` エージェントが使われ、sessionKeyが `agent:main:cron:xxx` になる。
期待したエージェント（例: `agent:shige-jr-test:cron:xxx`）とは別のコンテキストで実行される。

**対処**:
- `--agent` を必ず明示的に指定する
- `openclaw cron list` でジョブの設定を確認
- `openclaw cron runs <job-id>` で実行履歴とsessionKeyを確認

### ⚠️ モデル・トークンエラー（重要！）

cronを設定しても、モデルやOAuthトークンの問題で実行時にエラーになることがある。
**設定前に必ず確認し、設定後も実行結果を確認すること！**

#### よくあるエラー

**1. model not allowed**
```
"error": "model not allowed: anthropic/claude-sonnet-4"
```
**原因**: 指定したモデル名が間違っている、またはそのモデルへのアクセス権がない
**対処**: `session_status`で現在使えるモデルを確認し、正しいモデル名を使う

**2. OAuth token refresh failed**
```
"error": "FailoverError: OAuth token refresh failed for openai-codex"
```
**原因**: OAuthトークンが期限切れ
**対処**: `openclaw auth` で再認証するか、別のプロバイダーのモデルを使う

#### 設定前の確認手順

1. **session_status** でモデル情報を確認
   - 現在使えるモデル名をメモ
   - OAuth認証状態を確認（🔑 oauth があるか）

2. 確認できたモデルを `--model` で指定

#### 設定後の確認手順

登録後、必ず実行結果を確認する：

```bash
# 1. ジョブIDを確認
openclaw cron list

# 2. 実行履歴を確認（1-2分待ってから）
openclaw cron runs --id <job-id>
```

`"status": "ok"` なら成功、`"status": "error"` ならエラー内容を確認して修正。

#### 安全なモデル選択

- 現在のセッションで動いているモデルを使うのが最も安全
- 別モデルを使う場合は、先にそのモデルで何か実行してみて動作確認
