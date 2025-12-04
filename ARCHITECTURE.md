# System Architecture / システム構成

## Overview / 概要
本システムは、ReactベースのSPA (Single Page Application) フロントエンドと、FastAPIベースのRESTful APIバックエンドで構成されています。
AIモデル（YOLO, SAM, Whisper）はバックエンドで動作し、フロントエンドからのリクエストに応じて推論を実行します。

![System Architecture](/home/ohnuma/.gemini/antigravity/brain/452da2aa-a751-479d-bd19-b5e0edcaa7c4/system_architecture_diagram_1764778252943.png)

---

## 1. Frontend (フロントエンド)

ユーザーインターフェースを担当します。モダンなWeb技術スタックを採用し、高速でレスポンシブな操作性を実現しています。

- **Framework**: **React** (v18)
  - コンポーネントベースのUI構築。
  - Hooks (`useState`, `useEffect`) による状態管理。
- **Language**: **TypeScript**
  - 型安全性による堅牢なコードベース。
- **Build Tool**: **Vite**
  - 高速な開発サーバーとビルド。
- **Styling**: **Tailwind CSS**
  - ユーティリティファーストなCSSフレームワークによる迅速なスタイリング。
- **Components**:
  - `LeftSidebar`: 動画選択、各種設定（検出、セグメンテーション、文字起こし）。
  - `MainContent`: 動画フレーム表示（Canvas）、スライダー、アノテーションリスト。
  - `RightSidebar`: 文字起こし結果の表示。

---

## 2. Backend (バックエンド)

AI推論とデータ管理を担当します。Pythonの強力なエコシステムを活用しています。

- **Framework**: **FastAPI**
  - 高速でモダンなWebフレームワーク。
  - 自動生成されるAPIドキュメント (Swagger UI)。
- **Server**: **Uvicorn**
  - 非同期処理に対応したASGIサーバー。
- **AI Models**:
  - **Object Detection (物体検出)**: **YOLOv12n** (Ultralytics)
    - 高速かつ高精度な魚の検出。
  - **Segmentation (領域分割)**: **YOLOv12n-seg** / **SAM (Segment Anything Model)**
    - 魚の形状を正確に切り抜くためのセグメンテーション。
  - **Transcription (文字起こし)**: **OpenAI Whisper** (Local)
    - 動画内の音声をテキスト化。GPUがあれば高速化可能。
- **Data Storage (データ保存)**:
  - **File System**: データベースを使用せず、JSONファイルと画像ファイルとしてローカルに保存します。
    - Annotations: `data/annotations/{video_name}.json`
    - Crops: `data/crops/{video_name}/{crop_id}.jpg`
    - Transcriptions: `data/transcriptions/{video_name}/transcription.json`
