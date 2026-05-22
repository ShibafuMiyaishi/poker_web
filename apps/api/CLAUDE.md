# apps/api

Pokergo バックエンド。Cloudflare Workers + Hono + Durable Objects (`TableDO`) + D1。
詳細仕様は `@../../docs/poker-webapp-spec.md` §5〜§9、ルートルールは `@../../CLAUDE.md`。Workers/DO/D1 規約は skill `cloudflare-conventions`。

## ディレクトリ

```
src/
├── index.ts          Workers エントリ（Hono app + DO export）
├── routes/           Hono ルーター（auth, lobby, history, export）
├── middleware/       認証 (JWT), レート制限
├── durable/          TableDO 実装
├── analysis/         分析エンジン（エクイティ・EV・ポットオッズ・GTO 比較）
└── db/               D1 アクセス層（クエリ集約）
migrations/           D1 マイグレーション（0001_init.sql から）
wrangler.toml
```

ゲームエンジンと CPU AI は `@pokergo/engine`（`packages/engine/`）に移設済み。本パッケージはエンジンを **import して** Workers / DO / Hono レイヤーを実装する。役判定・state 機械は engine を再利用、apps/api では永続化と通信のみ担う。

## 必ず守ること

- **ホールカードを WebSocket で他席に絶対送らない**。送信前に seat-aware フィルタ層を通す。
- 乱数は `crypto.getRandomValues` のみ。`Math.random` 禁止。
- DO 状態は `state.storage.put` で都度永続化。
- D1 migration は新ファイルで追加。既存編集は禁止。
- 全 `/api/*` `/ws/*` は入口で JWT 検証。`/api/auth/*` のみ除外。
- 役判定や state 機械の変更は `@pokergo/engine` を直接編集する。仕様 §8 のテストケース（ストフラ vs クアッズ、スプリットポット、ケッカー比較、サイドポット 3 層）は `packages/engine/src/game/*.test.ts` に常設済（`tmp/` 配置禁止、`console.log` 残し禁止）。
- `console.log` をプロダクションコードに残さない。観測は `[observability]` + `wrangler tail`。

## 開発コマンド

```bash
pnpm -F @pokergo/api dev                # wrangler dev
pnpm -F @pokergo/api db:migrate         # ローカル D1 migration
pnpm -F @pokergo/api db:migrate:remote  # 本番 D1 migration（手動）
pnpm -F @pokergo/api cf-typegen         # wrangler types で Env 型再生成
pnpm -F @pokergo/api typecheck
pnpm -F @pokergo/api test               # @cloudflare/vitest-pool-workers
```

## デプロイ

- `pnpm -F @pokergo/api wrangler deploy --env preview` でプレビュー。
- 本番は GitHub Actions の手動承認 workflow 経由のみ。CLI から直接 `wrangler deploy` しない（settings.json で deny 済）。

## 専任エージェント

Workers/DO/D1 全般は `cloudflare-stack-specialist`、ゲームエンジン変更レビューは `poker-engine-reviewer`、CPU AI は `cpu-ai-tuner`、分析エンジンは `gto-analyst` に委譲。
