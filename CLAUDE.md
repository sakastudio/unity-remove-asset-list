# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Unity Asset Storeから2025年3月31日に削除されたアセット（約2,678件）の情報をWebビューワーで閲覧できるようにするプロジェクト。

- **Webビューワー**: React 19 + Vite + Tailwind CSS（`viewer/`）

## コマンド

```bash
cd viewer
npm install
npm run prepare-data             # publicにデータのシンボリックリンク作成
npm run dev                      # 開発サーバー起動（port 5174）
npm run build                    # tsc -b && vite build → dist/
npm run preview                  # ビルド結果プレビュー
npm run lint                     # ESLint
```

## アーキテクチャ

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
| `asset-details.json` | 全メタデータ（価格, 評価, カテゴリ, 技術仕様等） |
| `thumbnails/` | サムネイル画像（`{packageId}.jpg`）約2,675件 |

## 注意事項

- コミットメッセージは日本語で記述する
