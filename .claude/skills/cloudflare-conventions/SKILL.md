---
name: cloudflare-conventions
description: Pokergo conventions for Cloudflare Workers, Durable Objects, D1, Pages, and wrangler. Load when editing apps/api/, wrangler.toml, migrations/, or anything touching Workers runtime, DO state, or D1 schema.
---

# Cloudflare Conventions（Pokergo）

## wrangler.toml の決め事

- `compatibility_date` は実装日に揃え、過去日に戻さない。
- `nodejs_compat` は `pokersolver` を使う限り必要。除去するときはハンド評価ロジック書き換え必須。
- `[observability]` は常時 `enabled = true`。
- env 別バインディングは継承されない: `[env.preview]` `[env.production]` で `d1_databases` / `kv_namespaces` / `durable_objects` を **必ず再宣言**。

## Durable Object: `TableDO`

- ID は `idFromName(tableId)`。`tableId` は v1 では固定値 `main`、v2 で複数卓化。
- 内部状態は `state.storage` に都度 `put`。in-memory `this.state` だけで保持しない（Hibernation で揮発しないが復旧時の堅牢性のため）。
- WebSocket は **Hibernation API** を使う（`acceptWebSocket()` パターン）。`addEventListener` の旧 API は使わない。
- 1 tick あたりの作業を 30 秒以内に。長時間ループは `setAlarm` で分割。

## D1 マイグレーション

- ファイル: `apps/api/migrations/NNNN_<snake>.sql`（4 桁、`0001_init.sql` から開始）。
- 既存 migration は **絶対に編集しない**。変更は新 migration で。
- ローカル: `pnpm -F @pokergo/api db:migrate`
- 本番: `pnpm -F @pokergo/api db:migrate:remote`（手動承認 workflow から）
- スキーマ変更を出したら必ず `wrangler types` で `Env` 型を再生成。

## WebSocket メッセージ規約

- `packages/shared/protocol/` の型を `import type` で使う。
- 送信前に必ず seat-aware フィルタ（`hideOpponentHoleCards(state, targetSeat)`）を通す。
- `type` フィールドは必須、ルートに置く。`payload` 階層は作らない（フラット）。

## Hono ルーティング

- 全ルートは `apps/api/src/routes/` 下、機能別ファイル。
- 認証ミドルウェアは `src/middleware/auth.ts` に集約。`/api/auth/*` 以外は JWT 検証必須。
- エラーは `c.json({ error: { code, message } }, status)` 形式。仕様 §7.2 の WebSocket エラーと整合。

## Workers ランタイム制約

- `setTimeout` は使える（Hibernation 中は止まる）。長時間タイマーは `setAlarm`。
- `crypto.subtle` / `crypto.getRandomValues` 利用可。`Math.random` 禁止（ゲームロジックでの一様性確保）。
- `fetch()` でアウトバウンドはサブリクエスト数制限あり（無料枠 50、有料 1000/req）。

## 秘密の扱い

- JWT シークレット、Google OAuth client secret は `wrangler secret put`。
- `.dev.vars` はローカルのみ、`.gitignore` 済み。
- D1 へのユーザーデータ書き込み時は Google `sub` をハッシュ化しない（OAuth 連携で参照するため）。メアド表示は禁止。
