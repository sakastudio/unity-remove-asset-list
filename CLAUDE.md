# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Unity Asset Storeから2025年3月31日に削除されるアセット（約2,678件）の情報を収集・保存するスクレイピングツール群。TypeScript + ES Modules構成。

## コマンド

```bash
# セットアップ（依存関係 + Playwrightブラウザ）
npm run setup

# URL解決スクリプトの実行
npm start                        # find-asset-urls.mts を実行
npx tsx find-asset-urls.mts      # 同上

# 詳細スクレイピングの実行
npx tsx scrape-asset-details.mts
```

テスト・リント・ビルドの設定はない。`tsx`で直接TypeScriptを実行する。

## アーキテクチャ

### 2つの主要スクリプト（順番に実行）

1. **`find-asset-urls.mts`** — アセットURL解決
   - Playwrightでブラウザを起動し、Unity Asset Storeの**Coveo検索APIセッション**（認証トークン）をリクエストインターセプトで取得
   - パブリッシャー単位でバッチ検索 → 個別検索 → ファジー検索と多段階フォールバックでマッチング
   - タイトルの類似度は**正規化Jaccard類似度**で判定（閾値: 0.7、ファジー: 0.85）
   - Greedy 1:1マッチングでURL重複割当を防止
   - 入力: `assets_being_removed_march_31st.json` → 出力: `results.json`

2. **`scrape-asset-details.mts`** — メタデータ・サムネイル取得
   - 並列ワーカープール（同時5リクエスト）でアセットページをスクレイピング
   - JSON-LD → React SSRパターン → DOM → 正規表現の優先順位でメタデータ抽出
   - サムネイルを`thumbnails/`にダウンロード（packageIdベースのファイル名）
   - 出力: `asset-details.json`

### 共通パターン

- **レジューム機能**: `progress.json` / `scrape-progress.json` にチェックポイント保存。中断しても途中から再開可能
- **リトライ + 指数バックオフ**: レート制限やネットワークエラーに対応
- **SIGINT graceful shutdown**: Ctrl+Cで安全に中断・保存

## データファイル

| ファイル | 内容 |
|---------|------|
| `assets_being_removed_march_31st.json` | 入力: `[{ asset, publisher }, ...]` |
| `results.json` | URL解決結果: `[{ asset, publisher, url }, ...]` |
| `asset-details.json` | 全メタデータ（価格, 評価, カテゴリ, 技術仕様等） |
| `thumbnails/` | サムネイル画像（`{packageId}.jpg`） |
| `progress.json` | URL解決の進捗（.gitignore対象） |

## 注意事項

- コミットメッセージは日本語で記述する
- `progress.json`と`scrape-progress.json`は`.gitignore`対象（一時ファイル）
- Coveoセッショントークンは動的に取得されるため、APIキーの管理は不要
