# Fish Annotation Tool

魚類動画のアノテーション作業を効率化するためのWebアプリケーションです。
YOLOv12による物体検出、SAMによるセグメンテーション、Whisperによる文字起こし機能を統合し、動画からのデータセット作成を支援します。

## 主な機能

### 1. 動画管理・フレーム抽出
- 指定ディレクトリ内の動画ファイルを自動読み込み
- 動画からフレーム画像を抽出して表示（水中映像特有の低コントラストにも対応）
- スライダーによるフレーム移動

### 2. 自動検出 (Auto Detection)
- **YOLOv12n** モデルを使用した魚の自動検出
- **Min Size Ratio**: 画像短辺に対する比率（0.0 - 1.0）で最小サイズを指定可能
- 検出された領域（バウンディングボックス）のクロップ画像を一覧表示
- **自動クリーンアップ**: 生成された一時ファイル（クロップ画像）は1時間経過後に自動削除されます

### 3. 自動セグメンテーション (Auto Segmentation)
- **YOLOv12n-seg** または **SAM (Segment Anything Model)** を使用したセグメンテーション
- 検出された魚の領域を正確に切り抜き、背景を除去

### 4. アノテーション保存
- 検出された魚を選択し、ラベル（魚種名）を付けて保存
- **ドラッグ選択**: 複数の画像をドラッグ操作でまとめて選択可能
- 保存されたアノテーションの確認と削除
- アノテーションデータのZIPエクスポート機能

### 5. 音声文字起こし (Transcription)
- **Whisper** モデルを使用した動画の音声文字起こし
- 文字起こし結果のタイムスタンプをクリックして該当フレームへジャンプ
- 「Auto Transcription」機能により、動画選択時に自動で文字起こしを実行可能

### 6. リモートアクセス (Tailscale)
- Tailscaleを導入することで、ローカルネットワーク外からも安全にアクセス可能
- サーバー側設定変更なしで利用可能（`--host 0.0.0.0` で稼働中）

## 使い方

1. **起動**: `start_server.sh` を実行してサーバーを立ち上げます。
2. **ブラウザでアクセス**:
    - ローカル: `http://localhost:5173` または `http://<Server-IP>:5173`
    - Tailscale: `http://<Tailscale-IP>:5173`
3. **動画選択**: 左サイドバーのプルダウンから動画を選択します。
4. **設定**: 必要に応じて検出、セグメンテーション、文字起こしの設定を調整します。
5. **アノテーション**:
    - 自動検出された魚（Detected Fish）から、保存したいものをクリックまたはドラッグで選択します。
    - ラベル名を入力し、「Save Annotation」ボタンを押します。
6. **エクスポート**: 「Export Annotations」ボタンから、アノテーションデータをZIP形式でダウンロードできます。

### バックグラウンド処理 (Preprocessing)

動画の読み込み時間を短縮するために、事前にフレーム抽出と文字起こしを行っておくことができます。
以下のコマンドを実行すると、`VIDEO_DIR` 内の全動画をチェックし、未処理のものに対して処理を実行します。

```bash
./preprocess.sh
```
※ 文字起こしには `large` モデルが使用されます。

## ディレクトリ構成とデータ

- **`backend/data/`**: システムが生成する一時ファイル（検出クロップなど）が保存されます。これらは自動的に再生成・削除されるため、Git管理外です。
- **`/mnt/datasets/AnnotationTool/`**: 本番データ（フレーム画像、アノテーション結果、文字起こしデータ）の保存先です。

## インストール・セットアップ

### 前提条件
- Linux (Ubuntu等)
- Python 3.10+ (Anaconda推奨)
- Node.js 18+

### セットアップ手順

1. **リポジトリのクローン**
   ```bash
   git clone <repository_url>
   cd 20251202_AnnotationTool
   ```

2. **バックエンド環境構築**
   ```bash
   conda create -n fish_annotation python=3.10
   conda activate fish_annotation
   cd backend
   pip install -r requirements.txt
   ```
   ※ PyTorch, Ultralytics, Whisper等の依存ライブラリが必要です。

3. **フロントエンド環境構築**
   ```bash
   cd frontend
   npm install
   ```

4. **起動**
   ```bash
   ./start_server.sh
   ```

## 自動起動設定 (Systemd)

サーバー再起動時などに自動的にアプリを立ち上げるには、systemdを使用します。

1. `fish_annotation.service` ファイルを `~/.config/systemd/user/` に配置します。
2. 以下のコマンドで有効化します。
   ```bash
   systemctl --user enable --now fish_annotation
   ```
