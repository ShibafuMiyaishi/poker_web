---
name: commit-jp
description: Pokergo の git コミット規約。日本語の簡潔な 1 文を、変更ファイルごとに何を変更したか分かる形で書く。Load when preparing or writing a git commit for this repository.
---

# 日本語コミット規約（Pokergo）

Owner の絶対ルール: **コミットメッセージは日本語の簡潔な 1 文で、変更ファイルごとに何を変更したか分かるように書く**。

## 1 ファイル / 1 コミットの場合

サブジェクト 1 行（推奨 50 字以内）で完結:

```
TableDO の WebSocket Hibernation 接続処理を追加
```

主語は省略、述語は体言止め or 動詞終止形。「〜した」「〜します」は不要。

## 複数ファイル / 1 コミットの場合

サブジェクトに変更の総称、本文にファイルごとの 1 行リスト:

```
ハンド履歴 API の初期実装

- apps/api/src/routes/history.ts: GET /api/history/hands を追加
- apps/api/src/db/hands.ts: ハンド一覧クエリを追加
- packages/shared/protocol/history.ts: レスポンス型を追加
```

ファイルパスはリポジトリルートからの相対パス。1 行 1 ファイル、コロンで区切って何を変えたか。

## 動詞のテンプレ

| 種類 | 用例 |
|---|---|
| 新規 | `〜を追加`, `〜を新規作成` |
| 変更 | `〜を更新`, `〜の挙動を変更` |
| 修正 | `〜のバグを修正`, `〜のクラッシュを修正` |
| 削除 | `〜を削除`, `〜の不要コードを削除` |
| 整理 | `〜をリファクタ`, `〜の構成を整理` |
| 文書 | `〜のドキュメントを追記` |
| 依存 | `〜の依存を追加`, `〜を 1.2.3 にアップデート` |

## やらないこと

- 「fix bug」「update」など内容のないメッセージ。
- 英語と日本語の混在（コードシンボル名はそのまま英語可だが、文は日本語で統一）。
- `Co-Authored-By:` などの自動付与は CLI 側で必要な場合のみ。

## 自動運用

`git commit` 直前に staged ファイル一覧（`git diff --cached --name-only`）と `git diff --cached` を確認し、上のテンプレに従って構成する。HEREDOC で渡す:

```bash
git commit -m "$(cat <<'EOF'
ハンド履歴 API の初期実装

- apps/api/src/routes/history.ts: GET /api/history/hands を追加
- apps/api/src/db/hands.ts: ハンド一覧クエリを追加
EOF
)"
```
