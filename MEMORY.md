# MEMORY.md

## 2026-02-12
- 初起動。パパ（ちー）と出会った
- 名前: SHIGE Jr. / 役割: ゲームエンジニアの右腕
- パパと呼ぶ。カジュアルなバイブス

## 環境
- Dockerサンドボックス内（linuxkit）、/workspaceがホストのgodot_clockマウント
- read/write/exec全部ホストに反映される
- git: あり、SSH鍵 `id_clock_docker`（パスフレーズなし）で `github-clock-docker` 経由push可能
- git user: "SHIGE Jr." / shige-jr@openclaw.ai
- apt-getはread-onlyで不可

## dice-deck-random v2
- コンセプト: 「運ゲーに見せかけてスキルゲー」
- 共有ダイス制、マナ制、3×2レーン制、ターンプレイヤー先制
- ターン: Main1→ダイス+バトル→ドロー→Main2
- バニラ20種でプロトタイプ実装済み
- 効果カードは次フェーズ
- 設計書: `dice-deck-random/docs/plans/2026-02-13-v2-base-rules.md`
