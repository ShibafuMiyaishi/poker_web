# Pokergo

「Ten-Four の手軽さ + GTO Wizard の学習体験」を統合したテキサスホールデム Web アプリ。
**唯一の真実は `@docs/poker-webapp-spec.md`**。本書はそこから派生する「Claude Code が実装中に絶えず守るべき事柄」だけを置く。コードと仕様が矛盾したら仕様書を更新してから着手する。

@docs/poker-webapp-spec.md

---

## 絶対ルール（Owner 指定）

1. **思考は英語、ユーザーへの返答・説明は日本語**。コード内コメントが必要なときも日本語で良いが、コメントは原則書かない（CLAUDE.md ルートの「コメント方針」も参照）。
2. **コミットメッセージは日本語の簡潔な 1 文を、変更ファイルごとに分かるように書く**。1 つのコミットに複数ファイルが含まれる場合は本文に箇条書きで `- path/to/file: 〜を追加` のように列挙する。詳しくは `.claude/skills/commit-jp/SKILL.md`。
3. **テストコード・ログ・E2E スクショ・実験スクリプトは `tmp/` 配下に置く**。本番コード（`apps/`, `packages/`）に test 関数や過度な console.log / debug 出力を残さない。`tmp/` は `.gitignore` 済み。一時的に必要な検証コードもここに作る。
4. **ドキュメント・メモリは適宜更新する**。古い記述は迷わず消す。メモリ（`~/.claude/projects/.../memory/`）はコンテキストを圧迫しないよう短く保つ。CLAUDE.md も「この行を消したら Claude がミスをするか」基準で削る。

---

## モノレポ構成（pnpm workspaces）

```
apps/web         React + Vite + TS + Tailwind + Zustand（in-browser engine 駆動）
apps/api         Cloudflare Workers + Hono + Durable Objects + D1
packages/engine  ゲームエンジン + CPU AI（apps/web と apps/api の双方が使う）
packages/shared  両 app から import する型 / 定数 / プロトコル
packages/gto-charts  GTO チャート（ヒューリスティック生成、将来は実データ）
docs/            仕様書（poker-webapp-spec.md が source of truth）
tmp/             テスト・ログ・スクショ・実験スクリプト（gitignore）
```

各ワークスペースには専用の `CLAUDE.md` がある。**そのディレクトリで作業を始めると遅延ロードされる**。横断的な事柄だけ本ファイルに置く。

---

## 開発コマンド（pnpm）

```bash
pnpm install                       # 依存解決（workspace:* リンク）
pnpm -F @pokergo/web dev           # フロント開発サーバー
pnpm -F @pokergo/api dev           # wrangler dev（ローカル Workers）
pnpm -r typecheck                  # 全 workspace の型チェック
pnpm -r test                       # 全 workspace のテスト（Vitest）
pnpm lint                          # Biome（lint + format）
pnpm -F @pokergo/api db:migrate    # D1 マイグレーション適用
```

実装が走っていない初期段階では上記コマンドはまだ存在しないので、Phase 0 で各 `package.json` のスクリプトを揃える。

---

## Cloudflare スタックの落とし穴（Claude が外しがちな点）

- `wrangler.toml` の `compatibility_date` を明示すること。`nodejs_compat` フラグは現状必要なら付ける（`pokersolver` 等が node API を呼ぶか確認）。
- Durable Object に `migrations` ブロックは必須。SQLite-backed DO を使うなら `new_sqlite_classes`。
- DO 内では `state.storage.put` を都度実行する（hibernation で揮発しない）。
- **ホールカードを絶対にクライアントへ送らない**。WebSocket メッセージは seat ごとに分岐し、サーバーで該当プレイヤー以外を伏せる。`packages/shared/protocol` の型でフィールド可視性を縛る。
- 乱数は `crypto.getRandomValues` のみ。`Math.random` は禁止（デッキ予測リスク）。

---

## コメント・抽象化方針

- コメントはデフォルトで書かない。`Why` が非自明なときだけ 1 行で書く。
- バグ修正で「やったこと」をコメントに残さない（コミットメッセージ側に残る）。
- 将来の拡張を見越した抽象化は禁止。三度繰り返したら共通化検討。
- 後方互換シム / 未使用フラグ / `// removed` などの遺物を残さない。

---

## 専門領域はサブエージェント / スキルへ委譲

| 領域 | 委譲先 |
|---|---|
| ゲームエンジン（役判定・ポット・ベッティングラウンド）レビュー | `poker-engine-reviewer` サブエージェント |
| Workers / DO / D1 周りの実装・wrangler 設定 | `cloudflare-stack-specialist` サブエージェント、`cloudflare-conventions` スキル |
| GTO チャート・分析エンジン・エクイティ計算 | `gto-analyst` サブエージェント、`gto-chart-format` スキル |
| 卓画面 UI / レスポンシブ / Ten-Four 風デザイン | `react-table-ui` サブエージェント |
| CPU AI ロジック・シミュレーション | `cpu-ai-tuner` サブエージェント |
| ポーカー用語・ポジション・アクション語彙 | `poker-domain` スキル（背景知識） |
| 日本語コミットメッセージ生成 | `commit-jp` スキル |

サブエージェント定義は `.claude/agents/`、スキルは `.claude/skills/`、MCP サーバーは `.mcp.json` を参照。

---

## 進行中のフェーズ

現在 **Phase 0（準備）**。仕様書・本ファイル・スキャフォールドが揃った状態。次は Phase 1（シングルプレイで動くポーカー）。
