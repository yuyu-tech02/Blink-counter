# 瞬きカウンターWebアプリ — ファイル構成説明

本ドキュメントでは、瞬きカウンターWebアプリケーションのファイル構成と各ファイルの役割について説明します。

---

## プロジェクト全体構成

```
blink-counter/
├── client/                    # フロントエンドアプリケーション
├── server/                    # サーバーサイド（静的テンプレートでは未使用）
├── shared/                    # 共有定数・型定義
├── node_modules/              # 依存パッケージ
├── dist/                      # ビルド成果物
├── package.json               # プロジェクト設定・依存関係
├── vite.config.ts             # Viteビルド設定
├── tsconfig.json              # TypeScript設定
├── todo.md                    # 機能・バグ管理リスト
├── DETECTION_ANALYSIS.md      # 瞬き検出の技術解説
└── FILE_STRUCTURE.md          # 本ドキュメント
```

---

## 主要ディレクトリの詳細

### 1. `client/` — フロントエンドアプリケーション

React 19 + TypeScriptで構築されたSPA（Single Page Application）の本体です。

```
client/
├── index.html                 # HTMLエントリーポイント
├── public/                    # 静的アセット（画像、ファビコンなど）
└── src/                       # ソースコード
    ├── main.tsx               # Reactアプリのエントリーポイント
    ├── App.tsx                # ルーティング・グローバルレイアウト
    ├── index.css              # グローバルスタイル・Tailwind設定
    ├── const.ts               # アプリ定数（APP_TITLE, APP_LOGOなど）
    ├── pages/                 # ページコンポーネント
    │   ├── Home.tsx           # メインページ（瞬きカウンター画面）
    │   └── NotFound.tsx       # 404エラーページ
    ├── components/            # 再利用可能なUIコンポーネント
    │   ├── ErrorBoundary.tsx  # エラーバウンダリー
    │   ├── ManusDialog.tsx    # ダイアログコンポーネント
    │   └── ui/                # shadcn/uiコンポーネント群
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── input.tsx
    │       ├── progress.tsx
    │       └── ... (その他UIコンポーネント)
    ├── contexts/              # Reactコンテキスト
    │   └── ThemeContext.tsx   # テーマ管理（ライト/ダークモード）
    ├── hooks/                 # カスタムReactフック
    │   ├── useBlinkDetector.ts    # 瞬き検出のコアロジック
    │   ├── useWakeLock.ts         # 画面スリープ防止
    │   ├── useNetworkBlock.ts     # 通信API遮断
    │   ├── useMobile.tsx          # モバイル判定
    │   ├── useComposition.ts      # IME入力制御
    │   └── usePersistFn.ts        # 関数メモ化ヘルパー
    └── lib/                   # ユーティリティ関数
        └── utils.ts           # 汎用ヘルパー関数
```

#### 主要ファイルの役割

**`client/index.html`**  
アプリケーションのHTMLテンプレート。カメラ権限のPermissions Policyヘッダーを設定し、`main.tsx`をロードします。

**`client/src/main.tsx`**  
Reactアプリケーションのエントリーポイント。`App`コンポーネントをDOMにマウントします。

**`client/src/App.tsx`**  
アプリケーション全体のルーティングとグローバルレイアウトを定義します。ThemeProvider、TooltipProvider、Toasterなどのプロバイダーを設定し、ページ間のナビゲーションを管理します。

**`client/src/pages/Home.tsx`**  
瞬きカウンターのメイン画面です。以下の機能を実装しています。

- カメラプレビュー表示
- 測定時間設定（10秒〜600秒）
- 測定開始/停止ボタン
- リアルタイム統計表示（瞬き回数、瞬き/分、経過時間）
- テーマ切り替えボタン
- プライバシー保護情報の表示

**`client/src/hooks/useBlinkDetector.ts`**  
瞬き検出の中核となるカスタムフックです。MediaPipe Face Landmarkerを使用して以下の処理を行います。

- カメラストリームの取得と管理
- 顔のランドマーク検出
- 目の開閉状態の解析（eyeBlinkLeft/Right blendshapes）
- 誤検出防止ロジック
  - 両目の同期チェック
  - 頭部の動き監視（鼻の位置追跡）
  - 瞬きの持続時間検証（50-500ms）
  - 顔のランドマーク安定性チェック
- リアルタイム統計の更新

**`client/src/hooks/useWakeLock.ts`**  
Screen Wake Lock APIを使用して、測定中に画面がスリープすることを防ぎます。権限がない環境でもエラーを表示せずに動作します。

**`client/src/hooks/useNetworkBlock.ts`**  
測定中にすべての通信APIを無効化するフックです。以下のAPIをオーバーライドします。

- `fetch`
- `XMLHttpRequest`
- `WebSocket`
- `navigator.sendBeacon`

これにより、カメラ映像や測定データが外部に送信されないことを技術的に保証します。

**`client/src/contexts/ThemeContext.tsx`**  
ライトモードとダークモードの切り替えを管理します。ユーザーの選択をlocalStorageに保存し、次回アクセス時にも反映されます。

**`client/src/components/ui/`**  
shadcn/uiライブラリのコンポーネント群です。ボタン、カード、入力フィールド、プログレスバーなど、一貫したデザインシステムを提供します。

---

### 2. `shared/` — 共有定数・型定義

```
shared/
└── const.ts                   # アプリ全体で使用する定数
```

**`shared/const.ts`**  
アプリケーション名（`APP_TITLE`）やロゴ（`APP_LOGO`）などの共有定数を定義します。環境変数から値を取得し、フロントエンドとサーバーサイドで共通利用できます。

---

### 3. `server/` — サーバーサイド（静的テンプレートでは未使用）

```
server/
└── index.ts                   # サーバーエントリーポイント（プレースホルダー）
```

このプロジェクトは静的フロントエンドテンプレートを使用しているため、サーバーサイドのコードは実行されません。将来的にバックエンド機能を追加する際の互換性のために存在します。

---

### 4. ルートディレクトリのファイル

**`package.json`**  
プロジェクトのメタデータと依存関係を定義します。主要な依存パッケージ：

- `react` / `react-dom` — UIフレームワーク
- `@mediapipe/tasks-vision` — 顔検出・瞬き検出
- `wouter` — 軽量ルーティング
- `@tailwindcss/vite` — Tailwind CSS統合
- `@radix-ui/*` — アクセシブルなUIプリミティブ

**`vite.config.ts`**  
Viteビルドツールの設定ファイルです。Reactプラグイン、Tailwind統合、開発サーバーの設定を含みます。

**`tsconfig.json`**  
TypeScriptコンパイラの設定です。パスエイリアス（`@/`）やJSX設定を定義します。

**`todo.md`**  
プロジェクトの機能実装状況とバグ管理リストです。完了した機能は`[x]`、未完了は`[ ]`でマークされます。

**`DETECTION_ANALYSIS.md`**  
瞬き検出の技術的な詳細と誤検出対策について説明したドキュメントです。

---

## 技術スタック

### フロントエンド

- **React 19** — UIフレームワーク
- **TypeScript** — 型安全な開発
- **Tailwind CSS 4** — ユーティリティファーストCSS
- **shadcn/ui** — アクセシブルなUIコンポーネント
- **Wouter** — 軽量ルーティング

### 瞬き検出

- **MediaPipe Face Landmarker** — 顔のランドマーク検出
- **WebRTC getUserMedia** — カメラアクセス
- **Screen Wake Lock API** — 画面スリープ防止

### ビルドツール

- **Vite** — 高速ビルド・開発サーバー
- **pnpm** — 高速パッケージマネージャー

---

## データフロー

1. **ユーザーが「測定開始」をクリック**
   - `useBlinkDetector`フックが`startDetection()`を呼び出す
   - カメラ権限を要求し、ストリームを取得
   - `useNetworkBlock`が通信APIを無効化
   - `useWakeLock`が画面スリープを防止

2. **MediaPipeによる顔検出**
   - カメラ映像を`<video>`要素に表示
   - 毎フレーム（約30fps）で顔のランドマークを検出
   - 目の開閉度（blendshapes）を取得

3. **瞬き判定ロジック**
   - 左右の目のスコアを平滑化（5フレーム移動平均）
   - 閾値（0.3）を下回ったら「目を閉じた」と判定
   - 両目が同期しているか確認
   - 頭部の動きが小さいか確認
   - 瞬きの持続時間が50-500msの範囲内か確認
   - すべての条件を満たしたら瞬きとしてカウント

4. **統計の更新**
   - 瞬き回数をインクリメント
   - 経過時間を計算
   - 瞬き/分を算出（瞬き回数 ÷ 経過分数）
   - UIにリアルタイム表示

5. **測定終了**
   - 設定時間が経過したら自動停止
   - カメラストリームを解放
   - 通信APIの遮断を解除
   - Wake Lockを解放

---

## セキュリティとプライバシー

### 完全ローカル動作

- すべての処理は端末内で完結
- カメラ映像はブラウザのメモリ内でのみ処理
- サーバーへの通信は一切行わない

### 通信遮断

`useNetworkBlock`フックにより、測定中は以下のAPIが無効化されます。

- `fetch()` — HTTP通信
- `XMLHttpRequest` — レガシーHTTP通信
- `WebSocket` — リアルタイム通信
- `navigator.sendBeacon()` — バックグラウンド送信

### データ非保存

- 測定結果はセッション終了時に破棄
- localStorageやIndexedDBへの保存は行わない
- テーマ設定のみlocalStorageに保存（カメラデータは含まない）

---

## 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# プロダクションビルド
pnpm build

# ビルド結果のプレビュー
pnpm preview

# TypeScript型チェック
pnpm tsc
```

---

## 拡張性

このアプリケーションは以下の拡張が可能です。

1. **測定履歴の一時表示** — セッション内のみで過去の測定結果を表示
2. **感度調整機能** — 瞬き検出の閾値をユーザーが調整可能に
3. **統計グラフ表示** — 瞬き回数の時系列グラフを表示
4. **複数人対応** — 複数の顔を同時に検出・カウント

ただし、プライバシー保護の観点から、データの永続化や外部送信は行わない設計を維持します。

---

## まとめ

瞬きカウンターWebアプリは、MediaPipe Face Landmarkerを活用した完全ローカル動作の瞬き検出ツールです。通信遮断・データ非保存の設計により、ユーザーのプライバシーを最大限保護しながら、正確な瞬き計測を実現しています。

