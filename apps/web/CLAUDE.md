# apps/web

Pokergo フロントエンド。React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Zustand。
詳細仕様は `@../../docs/poker-webapp-spec.md` §11、ルートルールは `@../../CLAUDE.md`。

## ディレクトリ

```
src/
├── pages/        ルーティング先（Lobby, Table, History, Stats）
├── components/   再利用 UI（shadcn/ui ベース）
├── stores/       Zustand（tableStore, historyStore, meStore）
├── lib/          socket.ts（WebSocket 1 か所集約）, api.ts, gtoChart.ts
└── workers/      Web Worker（equity.ts: Monte Carlo エクイティ計算）
```

## 必ず守ること

- WebSocket クライアントは `src/lib/socket.ts` のみ。コンポーネントから `new WebSocket()` 禁止。
- エクイティ計算は Web Worker（UI スレッド非ブロック）。
- ホールカードは「自分の 2 枚」だけ表示。サーバーが伏せて送ってくるが、防御的に UI 側でも seat チェック。
- ブレークポイント 768px。スマホは縦持ち専用、卓画面は縦長楕円。
- ボタン最小タップ 44×44px。
- shadcn/ui を優先採用。独自実装は理由をコミットメッセージに残す。
- `console.log` を残さない。デバッグは React DevTools / Network パネルで。

## 状態管理

- `tableStore`: 卓状態（席、ボード、ポット、自分のホールカード、現アクター、deadline）
- `historyStore`: 履歴一覧と詳細キャッシュ
- `meStore`: 自分の認証情報・ハンドル名・統計サマリ
- グローバル状態は Zustand のみ。Context API を別途立てない。

## 開発コマンド

```bash
pnpm -F @pokergo/web dev          # Vite dev server
pnpm -F @pokergo/web build        # tsc -b && vite build
pnpm -F @pokergo/web typecheck
pnpm -F @pokergo/web test
```

## 専任レビュアー

UI / 卓画面 / レスポンシブの判断は `react-table-ui` サブエージェントへ。
