# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Unity Asset Storeから2025年3月31日に削除されるアセット（約2,678件）の情報を収集・保存し、Webビューワーで閲覧できるようにするプロジェクト。

- **スクレイピングツール**: TypeScript + ES Modules（ルート直下）
- **Webビューワー**: React 19 + Vite + Tailwind CSS（`viewer/`）

## コマンド

```bash
# === スクレイピングツール（ルート） ===
npm run setup                    # 依存関係 + Playwrightブラウザインストール
npm start                        # find-asset-urls.mts を実行
npx tsx scrape-asset-details.mts # 詳細スクレイピング

# === Webビューワー（viewer/） ===
cd viewer
npm install
npm run prepare-data             # publicにデータのシンボリックリンク作成
npm run dev                      # 開発サーバー起動（port 5174）
npm run build                    # tsc -b && vite build → dist/
npm run preview                  # ビルド結果プレビュー
npm run lint                     # ESLint
```

## アーキテクチャ

### データパイプライン（ルート・2つのスクリプトを順番に実行）

1. **`find-asset-urls.mts`** — アセットURL解決
   - Playwrightでブラウザを起動し、Unity Asset StoreのCoveo検索APIセッションをリクエストインターセプトで取得
   - パブリッシャー単位でバッチ検索 → 個別検索 → ファジー検索と多段階フォールバックでマッチング
   - タイトル類似度は正規化Jaccard類似度で判定（閾値: 0.7、ファジー: 0.85）
   - 入力: `assets_being_removed_march_31st.json` → 出力: `results.json`

2. **`scrape-asset-details.mts`** — メタデータ・サムネイル取得
   - 並列ワーカープール（同時5リクエスト）でアセットページをスクレイピング
   - JSON-LD → React SSRパターン → DOM → 正規表現の優先順位でメタデータ抽出
   - サムネイルを`thumbnails/`にダウンロード（packageIdベースのファイル名）
   - 出力: `asset-details.json`

共通パターン: レジューム機能（`progress.json` / `scrape-progress.json`）、リトライ+指数バックオフ、SIGINT graceful shutdown

### Webビューワー（`viewer/`）

React SPAで`asset-details.json`を読み込み、検索・フィルタ・ソート・詳細表示を提供。

```
viewer/src/
├── App.tsx                 # メインコンポーネント
├── types.ts                # AssetDetail, Filters, SortConfig等の型定義
├── components/
│   ├── common/             # Badge, StarRating, Thumbnail
│   ├── detail/             # AssetDetail, AssetModal（モーダル詳細表示）
│   ├── filters/            # CategoryFilter, PriceFilter, RatingFilter等
│   ├── grid/               # AssetCard, AssetGrid, Pagination（24件/ページ）
│   └── layout/             # Header, Sidebar, FilterDrawer（レスポンシブ）
├── hooks/
│   ├── useAssets.ts        # メイン状態管理（フィルタ・ソート・ページネーション）
│   ├── useDebounce.ts      # 検索クエリのデバウンス
│   └── useUrlParams.ts     # URLパラメータ同期（ブックマーク可能）
└── data/
    ├── loader.ts           # JSONロード + HTMLエンティティデコード等の前処理
    ├── search.ts           # フィルタ・ソート・全文検索ロジック
    └── categories.ts       # カテゴリツリー構築
```

データファイルは`viewer/public/`からルートへのシンボリックリンクで参照（`npm run prepare-data`で作成）。

## データファイル

| ファイル | 内容 |
|---------|------|
| `assets_being_removed_march_31st.json` | 入力: `[{ asset, publisher }, ...]` |
| `results.json` | URL解決結果: `[{ asset, publisher, url }, ...]` |
| `asset-details.json` | 全メタデータ（価格, 評価, カテゴリ, 技術仕様等） |
| `thumbnails/` | サムネイル画像（`{packageId}.jpg`）約2,675件 |

## 注意事項

- コミットメッセージは日本語で記述する
- `progress.json`と`scrape-progress.json`は`.gitignore`対象（一時ファイル）
- Coveoセッショントークンは動的に取得されるため、APIキーの管理は不要
