# packages/shared

`apps/web` と `apps/api` の両方から import される型・定数・プロトコル定義の置き場。

## 原則

- **型と定数のみ**。実行ロジックを置かない（ハンド評価は `apps/api/src/game/`、エクイティ計算は `apps/web/src/workers/`）。
- ブラウザでも Workers でも動くコードに限定。`window` / `document` / Node 専用 API 禁止。
- Pokergo の WebSocket メッセージ型はここで一元定義し、`type` フィールド分岐で両端を縛る。
- 変更は影響範囲を必ず確認（`pnpm -r typecheck` で両 app の型を再チェック）。

## サブモジュール

```
src/
├── types/      汎用型（Card, Seat, Position, ActionType 等）
├── poker/      ポーカー定数（ALL_52_CARDS, ハンドランキング表）
└── protocol/   WebSocket メッセージ型（C→S, S→C）
```

`exports` フィールドで `./poker` `./protocol` `./types` をサブパス公開。

## 専任エージェント

横断的なリファクタや型整理は CodeArchitect / Plan エージェントに任せる。Pokergo 特有のドメイン用語は skill `poker-domain` を参照。
