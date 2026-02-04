# Claude Code 設定

## Superpowers スキル

会話開始時およびタスク実行時に、該当するsuperpowersスキルを自動的に起動すること。

主要なスキル:
- `superpowers:brainstorming` - 新機能作成・設計前に使用
- `superpowers:writing-plans` - 実装計画作成時に使用
- `superpowers:subagent-driven-development` - 計画実行時に使用
- `superpowers:test-driven-development` - 機能実装時に使用
- `superpowers:systematic-debugging` - バグ修正時に使用
- `superpowers:verification-before-completion` - 完了前の検証に使用
- `superpowers:finishing-a-development-branch` - ブランチ完了時に使用

**1%でも該当する可能性があればスキルを起動すること。**

## 自動許可ルール

一度ユーザーが許可したBashコマンドは、`.claude/settings.local.json`の`permissions.allow`配列に追加し、次回以降は自動的に実行できるようにすること。

例：
```json
{
  "permissions": {
    "allow": [
      "Bash(git status:*)",
      "Bash(npm install:*)"
    ]
  }
}
```

許可パターンの書き方：
- `Bash(command:*)` - 特定コマンドの全引数を許可
- `Bash(command -flag:*)` - 特定フラグ付きコマンドを許可
