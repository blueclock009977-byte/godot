# Game Plan: ツムパズル (Tsum Puzzle)

## Game Description

ディズニーツムツム風のパズルゲーム。画面内にランダムに積み重なったカラフルな丸いキャラクター（ツム）を指でなぞって同じ色同士をチェーンで繋げて消すスコアアタック型パズル。

**コア仕様:**
- 2D、モバイルポートレート (540x960)
- 5色のツム (赤・青・緑・黄・紫) が物理演算で積み重なる
- 同色のツムを3つ以上ドラッグで繋げて消す（距離100px以内、BFSで接続可能ツムをハイライト）
- 制限時間60秒のスコアアタック
- コンボシステム（2秒以内に連続チェーンでコンボ倍率UP）
- フィーバーモード（ゲージ満タンで発動、10秒間スコア2倍）
- パーティシステム（5人編成: リーダー1 + スキル2 + パッシブ2）
- キャラクタースキル（画面消去、変換、時間停止など）
- 10キャラクター（各色2体ずつ、固有スキル付き）

## 1. Core Puzzle Mechanics
- **Status:** done
- **Targets:** scripts/game_manager.gd, scripts/game_field.gd, scripts/tsum.gd, scripts/ui_manager.gd, scripts/main.gd, scripts/title.gd, scenes/main.tscn, scenes/title.tscn, scenes/tsum.tscn, scenes/game_field.tscn
- **Depends on:** (none)
- **Goal:** ツムの物理配置、チェーン検出、消去、補充、スコアリング、タイマー、コンボ、フィーバーを含む完全なゲームプレイループを実装する。
- **Requirements:**
  - 5色のツムがRigidBody2Dとして物理演算で画面内（480x600のフィールド）に積み重なる
  - ツムは丸い形状（CircleShape2D, 半径30px）で、各色に対応したグラデーションビジュアル
  - タッチ/マウスドラッグで同色ツムを繋げるチェーン操作（最小3つ、距離100px以内）
  - BFSで現在のチェーン末端から接続可能な同色ツムをハイライト表示
  - チェーン完了時にツムが消え、スコア加算（100 + (n-3)*50 + (n-3)*(n-2)*10）
  - 消えた分だけ新しいツムが上から補充される
  - 60秒のゲームタイマーとスコア表示のHUD
  - コンボシステム（2秒以内の連続チェーンで倍率加算 +10%/コンボ）
  - フィーバーゲージ（チェーンで溜まり、満タンで10秒間スコア2倍）
  - ゲームオーバー画面（最終スコア表示、リトライボタン）
  - タイトル画面（スタートボタン）
- **Assets needed:** 5色のツムスプライト（丸いかわいいキャラ）、背景画像、UIアイコン
- **Verify:** ツムが物理演算で積み重なり、同色をドラッグで繋げて消せる。消えた後に補充される。HUDにスコア・タイマー・コンボ・フィーバーゲージが表示され、時間経過でゲームオーバー画面が出る。

## 2. Party System & Character Skills
- **Status:** done
- **Targets:** scripts/data/characters.gd, scripts/party_manager.gd, scripts/party_edit.gd, scripts/skills/skill_executor.gd, scripts/game_manager.gd, scripts/ui_manager.gd, scenes/party_edit.tscn, scenes/main.tscn
- **Depends on:** 1
- **Goal:** パーティ編成画面とキャラクタースキルシステムを実装し、ゲームプレイに組み込む。
- **Requirements:**
  - 10キャラクターのデータベース（各色2体、リーダースキル・キャラスキル・パッシブスキル付き）
  - パーティ編成画面（5枠: リーダー1 + アクティブスキル2 + パッシブ2）
  - リーダースキル（スコアブースト、時間延長、フィーバーブースト等）がゲーム全体に効果
  - アクティブスキル（ゲージ制、ツム消去でゲージ蓄積、満タンでボタンタップ発動）
  - スキル効果: 中央消去、横ライン消去、縦ライン消去、ランダム消去、色変換、時間停止、大爆発、スコアバースト、即フィーバー、チェーン距離拡張
  - パッシブスキル（スコアUP、ゲージ加速、フィーバー延長、コンボボーナス、ドロップ運）
  - タイトル画面にパーティ編集ボタン追加
- **Verify:** パーティ編成画面でキャラを選択でき、ゲーム内でリーダースキル効果が反映され、スキルボタンをタップしてアクティブスキルが発動する。パッシブ効果もスコアやゲージに反映されている。

## 3. Presentation Video
- **Status:** pending
- **Targets:** test/presentation.gd, screenshots/presentation/gameplay.mp4
- **Depends on:** 1, 2
- **Goal:** Create a ~30-second cinematic video showcasing the completed game.
- **Requirements:**
  - Write test/presentation.gd — a SceneTree script (extends SceneTree)
  - Showcase representative gameplay via simulated input or scripted animations
  - ~900 frames at 30 FPS (30 seconds)
  - Use Video Capture from godot-capture (AVI via --write-movie, convert to MP4 with ffmpeg)
  - Output: screenshots/presentation/gameplay.mp4
  - **2D games:** camera pans and smooth scrolling, zoom transitions between overview and close-up, trigger representative gameplay sequences, tight viewport framing
- **Verify:** A smooth MP4 video showing polished gameplay with no visual glitches.
