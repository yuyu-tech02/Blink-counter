# 瞬きカウンター (Blink Counter)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF.svg)

スマートフォンやPCを使用している際に減少しがちな「瞬き回数」を定量的に可視化するWebアプリケーションです。MediaPipe Face Landmarkerを使用してリアルタイムで瞬きを検出し、すべての処理は端末内で完結します。

## ✨ 特徴

- 🔒 **完全プライベート**: すべての処理が端末内で完結し、データは一切送信されません
- 📱 **レスポンシブデザイン**: PC・スマートフォン両対応
- 🎯 **高精度検出**: MediaPipe Face Landmarkerによる高精度な瞬き検出
- 🛡️ **セキュリティ重視**: 測定中は通信APIを自動遮断
- 🌙 **ダークモード対応**: ライト・ダークテーマ切り替え可能
- ⏰ **カスタマイズ可能**: 測定時間を自由に設定（10秒〜600秒）
- 📊 **リアルタイム統計**: 瞬き回数・瞬き/分・経過時間をリアルタイム表示

## 🚀 デモ

[デモサイト](https://your-demo-url.com) (準備中)

## 📸 スクリーンショット

![瞬きカウンター](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Blink+Counter+Demo)

## 🛠️ 技術スタック

### フロントエンド
- **React 18.3.1** - UI フレームワーク
- **TypeScript 5.6.3** - 型安全性
- **Vite 7.1.7** - ビルドツール
- **Tailwind CSS 4.1.14** - スタイリング
- **Radix UI** - アクセシブルなUIコンポーネント
- **Framer Motion** - アニメーション
- **Wouter** - 軽量ルーティング

### AI/ML
- **MediaPipe Face Landmarker** - 顔認識・瞬き検出
- **@mediapipe/tasks-vision** - MediaPipe JavaScript API

### バックエンド
- **Express.js** - サーバー
- **Node.js** - ランタイム

### 開発ツール
- **ESBuild** - 高速バンドラー
- **Prettier** - コードフォーマッター
- **pnpm** - パッケージマネージャー

## 🚀 クイックスタート

### 前提条件
- Node.js 18.0.0 以上
- pnpm 10.4.1 以上
- カメラアクセス権限

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/yuyutech02/Blink-counter.git
cd Blink-counter

# 依存関係をインストール
pnpm install

# 開発サーバーを起動
pnpm dev
```

### 本番ビルド

```bash
# プロダクションビルド
pnpm build

# 本番サーバーを起動
pnpm start
```

## 📖 使用方法

1. **カメラアクセス許可**: 初回起動時にカメラアクセスを許可してください
2. **測定時間設定**: 測定時間を設定（推奨: 60秒）
3. **測定開始**: 「測定開始」ボタンをクリック
4. **リアルタイム監視**: 瞬き回数と瞬き/分をリアルタイムで確認
5. **結果確認**: 測定完了後に結果を確認

## 🔧 設定

### 瞬き検出の調整

`client/src/hooks/useBlinkDetector.ts`で以下のパラメータを調整できます：

```typescript
const options = {
  smoothingWindow: 3,      // 平滑化ウィンドウサイズ
  blinkThreshold: 0.3,     // 瞬き検出閾値
};
```

### テーマ設定

`client/src/contexts/ThemeContext.tsx`でテーマをカスタマイズできます：

```typescript
<ThemeProvider
  defaultTheme="light"  // "light" | "dark"
  switchable           // テーマ切り替えの有効/無効
>
```

## 🏗️ プロジェクト構造

```
blink-counter/
├── client/                 # フロントエンド
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── pages/          # ページコンポーネント
│   │   └── contexts/       # Reactコンテキスト
│   └── index.html
├── server/                 # バックエンド
│   └── index.ts
├── shared/                 # 共有コード
└── patches/               # パッチファイル
```

## 🔒 プライバシー・セキュリティ

- **完全ローカル処理**: すべての顔認識・瞬き検出は端末内で実行
- **データ送信なし**: 映像・音声・統計データは一切送信されません
- **通信遮断**: 測定中はネットワーク通信を自動的にブロック
- **データ保持なし**: 測定終了時にすべてのデータが破棄されます

## 🐛 トラブルシューティング

### よくある問題

**Q: カメラが起動しない**
A: ブラウザのカメラアクセス権限を確認してください。HTTPS環境での実行が必要な場合があります。

**Q: 瞬きが検出されない**
A: 十分な照明とカメラの位置を確認してください。顔がカメラに正しく向いている必要があります。

**Q: 誤検出が多い**
A: `blinkThreshold`の値を調整するか、頭の動きを最小限にしてください。

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🙏 謝辞

- [MediaPipe](https://mediapipe.dev/) - 顔認識・瞬き検出技術
- [Radix UI](https://www.radix-ui.com/) - アクセシブルなUIコンポーネント
- [Tailwind CSS](https://tailwindcss.com/) - ユーティリティファーストCSS

## 📞 サポート

問題や質問がある場合は、[Issues](https://github.com/yuyutech02/Blink-counter/issues)で報告してください。

---

**注意**: このアプリケーションは研究・教育・ヘルスケア目的で安全にご利用いただけます。医療診断や治療の代替として使用しないでください。
# Blink-counter
