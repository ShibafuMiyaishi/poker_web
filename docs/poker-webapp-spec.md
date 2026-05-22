# ポーカーWebアプリ「(仮称) Pokergo」要件定義書・基本設計書

| 項目 | 内容 |
|---|---|
| **Version** | 1.0 |
| **作成日** | 2026-05-22 |
| **Owner** | Fumiya(個人プロジェクト、業務外) |
| **想定読者** | Claude Code(本書を実装の唯一の真実とする)、共同開発者(友達3人) |
| **本書の位置付け** | 要件定義書と基本設計書を統合した一次資料。本書からClaude Codeが直接実装に着手できる粒度。 |

---

## 0. 文書の使い方

- 本書は Claude Code が実装するための「source of truth」。コードと矛盾が出たら本書を更新し、Claude Code に再度本書を読ませる。
- 各章末の **[Claude Code 指示]** ブロックは実装着手時の具体的アクションを示す。
- 章番号は安定。新規追加は末尾に「Appendix」として追記する。

---

## 1. プロジェクト概要

### 1.1 ビジョン

「**Ten-Four の手軽さ + GTO Wizard の学習体験**」を1つのWebアプリに統合する。
ポーカーで遊びながら、各アクションが確率的に正しかったかを自動でフィードバックされる。プレイすればするほど上達する設計。

### 1.2 解決する課題

- Ten-Four のユーザーは ChatGPT/Gemini に手動でハンド履歴をコピペして分析を依頼している。これをアプリ内で自動化する。
- 友達と気軽にポーカーしたいが、人数が足りないと成立しない。CPU で常に8人卓を成立させる。
- GTO Wizard や PokerSnowie は分析特化で、実戦と切り離されている。プレイと学習をシームレスに統合する。

### 1.3 ターゲット

- **一次ターゲット(MVP)**: Owner と友達数名(2〜7名)。ポーカー好きで成長意欲のあるアマチュア。
- **二次ターゲット(v2 以降)**: 日本のアマチュアポーカープレイヤー全般。Ten-Four ユーザー層と重複。

### 1.4 KSF(Key Success Factor)

| # | 指標 | 目標 |
|---|---|---|
| KSF1 | 1ハンドあたりの平均プレイ時間 | 60秒以内(Ten-Four並) |
| KSF2 | ハンド終了後の分析表示までの遅延 | 1秒以内 |
| KSF3 | 月額運用コスト(MVP・友達卓段階) | 1,000円以内 |
| KSF4 | 月額運用コスト(v2・公開モード MAU 1万人想定) | 30,000円以内 |
| KSF5 | 役判定の正確性 | 100%(バグゼロ、テスト網羅率高) |

---

## 2. 競合・参考アプリ分析

### 2.1 Ten-Four (https://tenfour-poker.com/)

| 項目 | 内容 |
|---|---|
| 形式 | 6-Max NLHE Fast Fold |
| スタック | 100bb auto-rebuy |
| 課金 | 完全無料(サポーター制度のみ) |
| 強み | 待ち時間ゼロ、ハンド履歴がショウダウン直後に相手のハンドと共に見れる、Win Rate(bb/100)グラフ、スマホ対応 |
| 弱み | アクションの正誤フィードバックなし、CPU 非搭載で人数集まらないと動かない、複数卓・観戦なし |

### 2.2 GTO Wizard / PokerSnowie

| 項目 | 内容 |
|---|---|
| 形式 | スタンドアロンの分析ツール(ゲーム本体は別) |
| 強み | 本格GTOソルバー、レンジ分析、トレーニングモード |
| 弱み | 実戦と切り離されている、学習コストが高い、月額課金で高額 |

### 2.3 本アプリの差別化ポジショニング

> **「Ten-Four の対戦体験 + GTO Wizard の学習体験 + 友達と CPU 混在卓の柔軟さ」**

- Ten-Four にない要素: アクションの自動フィードバック、CPU 混在による即時プレイ、観戦モード、複数卓、エクスポート
- GTO Wizard にない要素: 実戦中の自然な学習、無料、ソーシャル要素

---

## 3. 機能要件

### 3.1 MVP (v1) スコープ

#### 3.1.1 ゲームプレイ

| ID | 機能 | 仕様 |
|---|---|---|
| F-G-01 | テキサスホールデム No-Limit | キャッシュゲーム形式 |
| F-G-02 | 卓サイズ | 8人(8-Max)固定 |
| F-G-03 | プレイヤー構成 | 人間 1〜8人(可変)+ CPU(8-人間数)で常時8人を維持 |
| F-G-04 | ブラインド構造 | SB/BB = 5/10(仮想チップ単位)、アンティなし |
| F-G-05 | 初期スタック | 100bb (= 1,000 チップ) auto-rebuy |
| F-G-06 | アクション制限時間 | 10秒固定(Ten-Four 型) |
| F-G-07 | ベットサイズプリセット | 1/3 pot, 1/2 pot, 2/3 pot, pot, all-in のクイックボタン |
| F-G-08 | サイドポット | 標準ルール(オールイン時に正しく分配) |
| F-G-09 | ショウダウン | 自動公開。フォールド勝ちでもオプションでカード公開可能(Show/Muck 選択) |
| F-G-10 | ハンド間インターバル | 3秒(次ハンドへ自動進行) |

#### 3.1.2 切断・AFK 処理

| ID | 機能 | 仕様 |
|---|---|---|
| F-D-01 | ハンド中の切断/タイムアウト | そのアクションは自動 Fold。残りのハンドはスキップ |
| F-D-02 | 連続不在の閾値 | 60秒以上アクションなしまたは WebSocket 切断状態 → 自動退席 |
| F-D-03 | 退席後の補充 | 即座に CPU を着席させ、8人を維持 |
| F-D-04 | 再接続時 | ハンドル名 + Google アカウント一致なら同卓に空席があれば再着席可能 |

#### 3.1.3 ハンド履歴・統計

| ID | 機能 | 仕様 |
|---|---|---|
| F-H-01 | ハンド単位履歴 | 全プレイヤーのアクション、ベット額、ボード、ショウダウン結果を完全保存 |
| F-H-02 | 履歴永続化 | D1 に全ハンド保存。チップ残高はセッション終了時にリセット |
| F-H-03 | ハンドリプレイ | 履歴画面で1ハンドを選ぶと、ストリート別(プリフロップ→フロップ→ターン→リバー)に再生可能 |
| F-H-04 | 統計指標 | VPIP, PFR, 3-bet%, AF(Aggression Factor), Win Rate(bb/100), WTSD(Went to Showdown)%, W$SD(Won $ at Showdown)% |
| F-H-05 | グラフ表示 | 累計勝ち額(実損益)と EV 勝ち額の二重線グラフ(Ten-Four 緑黄線グラフ準拠) |
| F-H-06 | 期間絞り込み | 全期間/今月/今週/直近 N ハンド |
| F-H-07 | ハンド絞り込み | ホールカード、ポジション、結果(勝ち/負け)、参加ストリートで絞り込み |

#### 3.1.4 ハンド分析(ルールベース、AI 不使用)

| ID | 機能 | 仕様 |
|---|---|---|
| F-A-01 | エクイティ計算 | 各ストリートで自分のハンド vs 残存プレイヤーランダムレンジのエクイティを Monte Carlo で計算(1万試行) |
| F-A-02 | ポットオッズ判定 | コール/フォールド時に「必要勝率 X% vs 実勝率 Y%」を表示。+EV/-EV を○✗で評価 |
| F-A-03 | EV 計算 | 各アクションの期待値を bb 単位で表示(例: Call +0.8bb / Fold 0.0bb / Raise -1.2bb) |
| F-A-04 | プリフロップGTOチャート比較 | ポジション×ハンドの GTO オープンレンジテーブルを内蔵し、「このアクションはチャート内/外」を判定 |
| F-A-05 | ボードテクスチャ分類 | フロップを「ドライ/ウェット/ペアボード/モノトーン」等にタグ付け |
| F-A-06 | 分析の表示タイミング | **ハンド終了後のみ**(プレイ中は対戦の公平性を保つため非表示) |
| F-A-07 | 後追い再生 | 履歴画面から任意ハンドを選び、各アクション時点の分析を見直せる |

#### 3.1.5 ロビー・観戦

| ID | 機能 | 仕様 |
|---|---|---|
| F-L-01 | ロビー構成 | MVP は **1卓固定**(8-Max NLHE 5/10) |
| F-L-02 | 入室 | ロビーから「着席」ボタン。空席があれば次ハンドから着席、満席なら観戦 |
| F-L-03 | 観戦 | 卓の全プレイヤーのアクション・ベット額・ボードを見れる。ホールカードはショウダウン後のみ公開 |
| F-L-04 | 退席 | 任意のタイミングで退席可能。次ハンドから CPU で補充 |

#### 3.1.6 認証

| ID | 機能 | 仕様 |
|---|---|---|
| F-AU-01 | 認証方式 | Google OAuth 2.0 必須 |
| F-AU-02 | プロフィール | Google アカウント名 + ハンドル名(初回設定、後から変更可) |
| F-AU-03 | セッション | JWT(Cloudflare Workers で発行・検証)、有効期限7日 |

#### 3.1.7 エクスポート

| ID | 機能 | 仕様 |
|---|---|---|
| F-E-01 | テキストエクスポート | 任意ハンドを PokerStars 互換形式でクリップボードコピー |
| F-E-02 | 用途 | ユーザーが ChatGPT/Gemini/Claude 等の LLM に貼って手動分析できる |

#### 3.1.8 広告

| ID | 機能 | 仕様 |
|---|---|---|
| F-AD-01 | 配置場所 | ロビー画面、ハンド履歴画面のみ |
| F-AD-02 | 配置形式 | Google AdSense ディスプレイ広告(レスポンシブ) |
| F-AD-03 | プレイ画面 | **広告非表示**(集中力を保つため) |

### 3.2 v2 拡張スコープ(MVP 完成後の優先順)

| 優先度 | 機能 | 概要 |
|---|---|---|
| ★★★ | 複数卓作成 | ユーザーが任意の卓を作成し、招待リンクで友達を招集 |
| ★★★ | 公開ロビー | 誰でも参加できる公開卓のリスト表示 |
| ★★★ | Ten-Four 型 Fast Fold(6-Max) | プールマッチング、フォールド即移動、人気卓に集まる設計 |
| ★★ | Claude API による AI 分析 | 「詳しく解説」ボタンで Claude API 呼び出し。月額制 Pro tier 連動 |
| ★★ | Pro tier 課金 | Stripe 連携、月額 500〜1,000円、AI 分析無制限+広告削除+高度統計 |
| ★★ | ハンドリプレイ URL 共有 | ハンドごとに URL 発行、X 等で共有しバイラル可能性 |
| ★ | ランキング・ハンドル名ソート | Win Rate(bb/100) 全体ランキング、Expert ランク等 |
| ★ | レンジ推定機能 | 相手の過去アクションからレンジを推定して分析に反映 |
| ★ | スタディモード | 自分の手番だけリアルタイム EV 表示(マルチ対戦と分離した練習用) |
| ★ | サポーター制度 | Buy Me a Coffee / Patreon 連携、Ten-Four 方式 |

### 3.3 対象外(明示的に作らないもの)

- リアルマネー賭博・換金機能(賭博法違反のため絶対NG)
- 9-Max 以上の卓
- ポットリミット(PLO)等の他種ポーカー
- トーナメント形式
- チャット機能(MVP では不要、v2 でスタンプ程度の検討余地あり)
- iOS / Android ネイティブアプリ(PWA 対応で代替)

---

## 4. 非機能要件

### 4.1 パフォーマンス

| 指標 | 目標 | 備考 |
|---|---|---|
| アクション反映遅延 | 200ms 以内 | ボタン押下 → 卓画面更新 |
| エクイティ計算時間 | 100ms 以内(クライアント) | Monte Carlo 1万試行を Web Worker で並列 |
| 統計画面の表示 | 2秒以内 | 1万ハンド分の集計クエリ含む |
| 同時接続数 | MVP: 8人/卓 × 1卓、v2: 100卓 × 6〜8人 = 600〜800人 | Durable Objects は卓ごとに独立スケール |

### 4.2 可用性

- 99% 稼働(Cloudflare のデフォルト依存)
- 計画的メンテナンス時はロビーで事前告知

### 4.3 コスト

- MVP 段階: **月 0〜500円**(Cloudflare 無料枠で完結を目標)
- v2 段階(MAU 1万): **月 30,000円以内**

詳細は §15 コスト試算参照。

### 4.4 セキュリティ

- ホールカードは絶対にクライアントに渡さない(該当プレイヤー以外)
- WebSocket 通信は WSS 必須
- レート制限(Cloudflare 標準機能)
- 不正検知(同一 Google アカウントで複数席着座禁止)

### 4.5 国際化

- MVP は日本語のみ。i18n フレームワーク導入だけ最初から(後で文言差し替えれるように)。

---

## 5. システムアーキテクチャ

### 5.1 全体構成図(テキスト)

```
[Browser (PC/Mobile)]
    │
    │ HTTPS / WSS
    ▼
[Cloudflare Pages]  ← 静的アセット(HTML/JS/CSS)
    │
    │ Workers Router
    ▼
[Cloudflare Workers]
    ├── /api/auth/*        → Google OAuth, JWT 発行
    ├── /api/lobby         → 卓一覧、着席リクエスト
    ├── /api/history/*     → ハンド履歴・統計 API
    ├── /api/export/*      → PokerStars 形式エクスポート
    └── /ws/table/{id}     → Durable Object へルーティング
                                    │
                                    ▼
                          [Durable Object: TableDO]
                              ├── テーブル状態(メモリ)
                              ├── WebSocket Hibernation
                              ├── ゲームエンジン
                              ├── CPU AI 駆動
                              └── ハンド終了時に D1 へ flush
                                    │
                                    ▼
                          [D1 (SQLite)]
                              ├── users
                              ├── hands
                              ├── actions
                              └── stats_cache
```

### 5.2 各レイヤーの責務

| レイヤー | 責務 | 技術選定 |
|---|---|---|
| フロントエンド | UI 描画、ユーザー入力、WebSocket クライアント、エクイティ計算(Web Worker) | React + Vite + TypeScript + Tailwind |
| エッジルーティング | リクエスト受け付け、認証、Durable Object へのルーティング | Cloudflare Workers + Hono |
| 卓状態管理 | ゲーム進行、CPU 駆動、WebSocket、アクション検証、サーバー権威のカード配布 | Cloudflare Durable Objects |
| 永続化 | ハンド履歴、ユーザー情報、統計キャッシュ | Cloudflare D1 (SQLite) |
| 静的配信 | フロント資産配信、AdSense | Cloudflare Pages |

### 5.3 なぜこの構成か

| 選択 | 理由 |
|---|---|
| Durable Objects | 1卓 = 1 DO で状態とWebSocketを一元管理。シングルスレッド保証で競合制御不要。WebSocket Hibernation でアイドル時の課金ゼロ |
| D1 | SQLite ベースで Cloudflare 内に完結、無料枠が大きい(1日500万行読み取り、10万行書き込み) |
| Pages | 静的配信無料、CDN 自動 |
| React | エコシステム最大、Claude Code との相性も良い、Owner の他プロジェクトとも整合 |

### 5.4 ディレクトリ構成(推奨)

```
pokergo/
├── apps/
│   ├── web/                  # フロントエンド(React)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── stores/       # Zustand
│   │   │   ├── lib/          # equity calc, gto chart
│   │   │   └── workers/      # Web Worker(エクイティ計算)
│   │   └── package.json
│   └── api/                  # Cloudflare Workers
│       ├── src/
│       │   ├── routes/       # Hono ルーター
│       │   ├── durable/      # Durable Object: TableDO
│       │   ├── game/         # ゲームエンジン
│       │   ├── ai/           # CPU AI ロジック
│       │   ├── analysis/     # 分析エンジン
│       │   └── db/           # D1 アクセス層
│       ├── wrangler.toml
│       └── package.json
├── packages/
│   ├── shared/               # 型定義、定数、共通ロジック
│   │   ├── types/
│   │   ├── poker/            # ハンド評価、レンジ表、定数
│   │   └── protocol/         # WebSocket メッセージ型
│   └── gto-charts/           # GTO チャートデータ(JSON)
├── docs/
│   └── poker-webapp-spec.md  # 本書
└── package.json              # pnpm workspaces
```

**[Claude Code 指示]**
- pnpm workspaces で初期化
- `packages/shared` は web/api 両方から import 可能にする
- TypeScript の strict mode を有効化

---

## 6. データモデル

### 6.1 D1 スキーマ

```sql
-- ユーザー
CREATE TABLE users (
  id              TEXT PRIMARY KEY,         -- UUID
  google_sub      TEXT UNIQUE NOT NULL,     -- Google OAuth sub
  email           TEXT NOT NULL,
  handle          TEXT NOT NULL,            -- 表示名
  created_at      INTEGER NOT NULL,         -- Unix epoch
  last_seen_at    INTEGER NOT NULL
);
CREATE INDEX idx_users_handle ON users(handle);

-- セッション(着席ログ、統計の母集団)
CREATE TABLE sessions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  table_id        TEXT NOT NULL,
  seat_no         INTEGER NOT NULL,         -- 0〜7
  started_at      INTEGER NOT NULL,
  ended_at        INTEGER                   -- 退席時刻、NULL=進行中
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- ハンド(1ハンド単位の親レコード)
CREATE TABLE hands (
  id              TEXT PRIMARY KEY,         -- UUID
  table_id        TEXT NOT NULL,
  hand_no         INTEGER NOT NULL,         -- 卓内通し番号
  started_at      INTEGER NOT NULL,
  ended_at        INTEGER NOT NULL,
  sb              INTEGER NOT NULL,         -- ブラインド額(チップ)
  bb              INTEGER NOT NULL,
  button_seat     INTEGER NOT NULL,
  board           TEXT NOT NULL,            -- "Ah Kd 9s 2c 7h" 形式
  pot_total       INTEGER NOT NULL,
  rake            INTEGER NOT NULL DEFAULT 0,
  pokerstars_text TEXT NOT NULL             -- エクスポート用 PokerStars 形式全文
);
CREATE INDEX idx_hands_table_time ON hands(table_id, started_at);

-- ハンド参加者
CREATE TABLE hand_players (
  hand_id         TEXT NOT NULL REFERENCES hands(id),
  user_id         TEXT,                     -- NULL=CPU
  cpu_name        TEXT,                     -- CPU の場合の表示名
  seat_no         INTEGER NOT NULL,
  position        TEXT NOT NULL,            -- "BTN", "SB", "BB", "UTG", "UTG+1", "MP", "HJ", "CO"
  hole_cards      TEXT NOT NULL,            -- "Ah Kd"
  stack_start     INTEGER NOT NULL,
  stack_end       INTEGER NOT NULL,
  net_chips       INTEGER NOT NULL,         -- 損益(end - start)
  went_to_showdown INTEGER NOT NULL,        -- 0/1
  won             INTEGER NOT NULL,         -- 0/1
  PRIMARY KEY (hand_id, seat_no)
);
CREATE INDEX idx_hand_players_user ON hand_players(user_id);

-- アクション(ハンド内の全アクション、時系列)
CREATE TABLE actions (
  id              TEXT PRIMARY KEY,
  hand_id         TEXT NOT NULL REFERENCES hands(id),
  street          TEXT NOT NULL,            -- "preflop"/"flop"/"turn"/"river"
  seat_no         INTEGER NOT NULL,
  order_no        INTEGER NOT NULL,         -- ハンド内通し
  action_type     TEXT NOT NULL,            -- "fold"/"check"/"call"/"bet"/"raise"/"all_in"
  amount          INTEGER NOT NULL DEFAULT 0,
  pot_before      INTEGER NOT NULL,
  stack_before    INTEGER NOT NULL,
  ts              INTEGER NOT NULL,         -- ms epoch
  -- 分析結果(ハンド終了時に計算してキャッシュ)
  equity_pct      REAL,                     -- そのアクション時点のエクイティ
  pot_odds_pct    REAL,                     -- 必要勝率
  ev_action_bb    REAL,                     -- 採用アクションのEV(bb単位)
  ev_best_bb      REAL,                     -- 最善アクションのEV
  best_action     TEXT,                     -- 最善アクション種別
  deviation_bb    REAL,                     -- ベスト-採用の差(bb)
  gto_match       INTEGER                   -- プリフロのみ、0/1
);
CREATE INDEX idx_actions_hand ON actions(hand_id, order_no);

-- 統計キャッシュ(集計コスト削減)
CREATE TABLE stats_cache (
  user_id         TEXT NOT NULL REFERENCES users(id),
  period          TEXT NOT NULL,            -- "all"/"month"/"week"
  hands_played    INTEGER NOT NULL,
  vpip            REAL,
  pfr             REAL,
  three_bet_pct   REAL,
  af              REAL,
  wtsd            REAL,
  w_dollar_sd     REAL,
  bb_per_100      REAL,
  ev_bb_per_100   REAL,
  updated_at      INTEGER NOT NULL,
  PRIMARY KEY (user_id, period)
);
```

### 6.2 Durable Object Storage(TableDO)

DO 内のストレージは「進行中のハンド」のみ保持。ハンド終了時に D1 へ flush して DO ストレージはクリア。

```typescript
// TableDO の保持データ
interface TableState {
  tableId: string;
  config: { sb: number; bb: number; maxSeats: 8 };
  seats: Array<{
    seatNo: number;
    occupiedBy: { type: "human"; userId: string; handle: string } | { type: "cpu"; cpuId: string; name: string } | null;
    stack: number;
    sittingOut: boolean;
    lastActionAt: number;
  }>;
  currentHand: HandState | null;
  buttonSeat: number;
  handNo: number;
  spectators: Array<{ userId: string; handle: string }>;
}

interface HandState {
  handId: string;
  street: "preflop" | "flop" | "turn" | "river" | "showdown";
  deck: string[];                   // 残り山札(サーバー専用、絶対クライアントに送らない)
  holeCards: Map<number, [string, string]>;  // seat → 2枚
  board: string[];                  // 公開カード
  pot: number;
  sidePots: Array<{ amount: number; eligibleSeats: number[] }>;
  currentBet: number;               // 現ストリートの最大ベット
  toAct: number;                    // 次のアクション席
  actions: ActionRecord[];
  deadline: number;                 // 現在アクター期限(ms epoch)
}
```

### 6.3 KV / R2 用途

- **KV**: GTO チャート JSON のキャッシュ(初回ロード後はクライアントで保持)、Pro tier フラグなど軽量データ
- **R2**: MVP では不使用。v2 でハンドリプレイの動画生成等で使う可能性

**[Claude Code 指示]**
- D1 マイグレーションは `apps/api/migrations/0001_init.sql` から番号付け
- DO ストレージは `state.storage.put("tableState", state)` で都度永続化(復帰時の損失防止)

---

## 7. API 設計

### 7.1 REST API(Hono)

| Method | Path | 用途 | 認証 |
|---|---|---|---|
| GET | `/api/auth/google/start` | OAuth 開始、Google にリダイレクト | 不要 |
| GET | `/api/auth/google/callback` | OAuth コールバック、JWT 発行 | 不要 |
| POST | `/api/auth/logout` | ログアウト | JWT |
| GET | `/api/me` | 自分のプロフィール | JWT |
| PATCH | `/api/me` | ハンドル名変更 | JWT |
| GET | `/api/lobby` | 卓一覧(MVPは固定1卓) | JWT |
| POST | `/api/lobby/:tableId/sit` | 着席リクエスト | JWT |
| POST | `/api/lobby/:tableId/leave` | 退席 | JWT |
| GET | `/api/history/hands` | ハンド一覧(ページング、フィルタ) | JWT |
| GET | `/api/history/hands/:id` | ハンド詳細(アクション全部+分析) | JWT |
| GET | `/api/history/stats` | 統計サマリ(VPIP/PFR/etc) | JWT |
| GET | `/api/history/graph` | 累計勝ち額グラフ用データ | JWT |
| GET | `/api/export/hand/:id` | PokerStars 形式テキスト返却 | JWT |

### 7.2 WebSocket プロトコル

エンドポイント: `wss://[domain]/ws/table/:tableId?token=<JWT>`

メッセージは JSON、ルートに `type` フィールド。

#### 7.2.1 クライアント → サーバー

```typescript
// 着席後、卓の現状を取得
{ type: "subscribe" }

// アクション送信
{ type: "action", action: "fold" | "check" | "call" | "bet" | "raise" | "all_in", amount?: number }

// 観戦から着席リクエスト
{ type: "sit", seatNo: number }

// 退席
{ type: "leave" }

// ハートビート
{ type: "ping" }
```

#### 7.2.2 サーバー → クライアント

```typescript
// 卓全体の状態スナップショット(着席直後)
{
  type: "state",
  state: {
    seats: [...],         // 各席の情報(ホールカードは自分のだけ)
    handState: {...},
    yourSeat: 3
  }
}

// 差分更新(アクションごと)
{
  type: "action",
  seatNo: number,
  action: string,
  amount: number,
  newPot: number,
  toAct: number,
  deadline: number
}

// ストリート進行
{ type: "street", street: "flop", board: ["Ah", "Kd", "9s"] }

// ハンド開始
{ type: "hand_start", handId, button, sb, bb, yourCards: ["Ah", "Kd"] }

// ハンド終了(分析結果を含む)
{
  type: "hand_end",
  winners: [{ seatNo, amount }],
  showdown: [{ seatNo, cards: [...], handRank: "Two Pair" }],
  analysis: {  // 自分の各アクションの分析
    actions: [
      { street, action, equityPct, potOddsPct, evActionBb, evBestBb, bestAction }
    ]
  }
}

// エラー・タイムアウト等
{ type: "error", code: string, message: string }
```

**[Claude Code 指示]**
- WebSocket メッセージ型は `packages/shared/protocol/` に定義し web/api 両方で import
- `hand_end` の分析は重い処理なので非同期で計算し、計算完了後に追送信する選択肢もあり

---

## 8. ゲームロジック設計

### 8.1 ハンドの状態遷移

```
[Waiting]
   │ プレイヤーが2人以上着席
   ▼
[Hand Start] ─→ ブラインド徴収 → ホールカード配布
   │
   ▼
[Preflop Betting]
   │ 全員のベット額が揃う or 1人を残してフォールド
   ▼
[Flop] (3枚オープン)
   ▼
[Flop Betting]
   ▼
[Turn] (1枚)
   ▼
[Turn Betting]
   ▼
[River] (1枚)
   ▼
[River Betting]
   ▼
[Showdown] (残存全プレイヤーがハンド公開、勝者にポット分配)
   ▼
[Hand End] ─→ 履歴を D1 に flush → 3秒後に [Hand Start] へ
```

### 8.2 ベッティングラウンドのロジック

```typescript
function processBettingRound(state: HandState) {
  while (true) {
    const actor = state.toAct;
    if (allPlayersActed(state) && allBetsEqual(state)) break;
    if (onlyOneActivePlayer(state)) return goToShowdown(state);

    const action = await waitForAction(actor, timeoutMs = 10000);
    applyAction(state, actor, action);
    state.toAct = nextActiveSeat(state, actor);
  }
}
```

タイムアウト時:
- 賭けるべき額が 0 → 自動 check
- 賭けるべき額が 0 でない → 自動 fold

### 8.3 ポット計算とサイドポット

- 各プレイヤーが投入した総額を `contribution[seat]` で記録
- ショウダウン時に、最小オールイン額から段階的にメインポット/サイドポットを構築
- 役判定は `pokersolver` ライブラリを使用(信頼性高い、JSで動く)

### 8.4 デッキとシャッフル

```typescript
// 各ハンド開始時に新規デッキを Fisher-Yates でシャッフル
function shuffleDeck(): string[] {
  const deck = [...ALL_52_CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
```

- `crypto.getRandomValues` を使用(Cloudflare Workers で利用可能)
- デッキは Durable Object 内のみ保持、クライアントには絶対送らない

**[Claude Code 指示]**
- 役判定は `pokersolver` (npm) を使用
- テストケースは「ストレートフラッシュ vs クアッズ」「スプリットポット」「ケッカー比較」「サイドポット3層」を最低カバー

---

## 9. CPU AI 設計(GTO 寄り)

### 9.1 設計方針

完全な GTO ソルバーは現実的でないため、以下の段階的な近似で「GTO 寄りで強い」を実現:

1. **プリフロップ**: ポジション別 GTO オープン/コール/3-bet チャート(プリ計算済み JSON)
2. **ポストフロップ**: ハンド強度 + ボードテクスチャ + SPR(Stack-to-Pot Ratio)に基づくルール
3. **ベットサイジング**: ポット比率の最適化(2/3 pot を中心にランダム化)
4. **ランダム性**: 同じハンド・同じ状況でも 10% は別アクションを取る(エクスプロイト防止)

### 9.2 プリフロップ AI

```typescript
function decidePreflop(
  hand: [Card, Card],
  position: Position,
  facingAction: "open" | "raise" | "3bet" | "limp",
  potOdds: number
): Action {
  const chart = GTO_CHARTS[position][facingAction];
  const handStr = normalizeHand(hand);  // "AKs", "T9o", "55"
  const recommendation = chart[handStr];  // "raise" | "call" | "fold" | "mixed:0.3"

  if (recommendation.startsWith("mixed:")) {
    return Math.random() < parseFloat(recommendation.slice(6)) ? "raise" : "fold";
  }
  return recommendation;
}
```

GTO チャート JSON は `packages/gto-charts/` に格納。8-Max NLHE 100bb の主要シチュエーション(UTG open、BTN vs CO 3bet、BB vs BTN call 等)を網羅。

### 9.3 ポストフロップ AI

```typescript
function decidePostflop(state: HandState, seatNo: number): Action {
  const equity = calculateEquityVsRange(state, seatNo);  // Monte Carlo 5000
  const potOdds = state.currentBet / (state.pot + state.currentBet);
  const spr = state.stack / state.pot;
  const boardType = classifyBoard(state.board);

  // 簡略化ロジック(実装時はもっと複雑)
  if (equity > 0.7) return aggressiveAction(state, spr);
  if (equity > 0.5) return valueAction(state, boardType);
  if (equity > potOdds + 0.05) return "call";
  if (canBluff(state, boardType)) return bluffRaise(state);
  return state.currentBet === 0 ? "check" : "fold";
}
```

### 9.4 CPU の個性

MVP では 5体とも同じロジックだが、以下のパラメータで微妙な個性を出す:

| CPU 名 | アグレッシブ係数 | ブラフ頻度 | コール下限エクイティ |
|---|---|---|---|
| Alpha | 1.1 | 0.15 | 0.45 |
| Bravo | 1.0 | 0.10 | 0.48 |
| Charlie | 0.9 | 0.08 | 0.50 |
| Delta | 1.05 | 0.12 | 0.46 |
| Echo | 1.15 | 0.18 | 0.42 |

### 9.5 思考時間の演出

人間らしさを出すため、CPU は 1〜4秒のランダム遅延後にアクションを返す(完全即時だと不自然)。

**[Claude Code 指示]**
- GTO チャートは「ポーカー GTO open range 8-max 100bb」で検索して公開済みデータをベースに JSON 化
- 完全自前で生成は不可能。GTO Wizard / Upswing Poker のチャートを参考に手動で作成 or オープンソースの GTO ソリューションを利用
- ライセンスは要確認

---

## 10. ハンド分析エンジン

### 10.1 エクイティ計算

**Monte Carlo シミュレーション**(クライアント側、Web Worker)

```typescript
function calculateEquity(
  hero: [Card, Card],
  villainRange: Card[][] | "random",
  board: Card[],
  iterations: number = 10000
): number {
  let wins = 0;
  const deck = getRemainingDeck(hero, board);

  for (let i = 0; i < iterations; i++) {
    const villainHand = villainRange === "random"
      ? sample2FromDeck(deck)
      : sampleFromRange(villainRange);
    const remainingBoard = sampleRemainingBoard(deck, board, villainHand);
    const heroRank = evaluateHand([...hero, ...board, ...remainingBoard]);
    const villainRank = evaluateHand([...villainHand, ...board, ...remainingBoard]);
    if (heroRank > villainRank) wins += 1;
    else if (heroRank === villainRank) wins += 0.5;
  }
  return wins / iterations;
}
```

MVPでは villain は "random"(残存カードからランダムな2枚)。v2 でレンジ推定を導入。

### 10.2 ポットオッズ判定

```typescript
function evaluateCallDecision(equity: number, callAmount: number, potBefore: number): {
  requiredEquity: number;
  isPlus EV: boolean;
  evBb: number;
} {
  const requiredEquity = callAmount / (potBefore + callAmount * 2);
  return {
    requiredEquity,
    isPlus EV: equity > requiredEquity,
    evBb: ((potBefore + callAmount) * equity - callAmount * (1 - equity)) / state.bb
  };
}
```

### 10.3 各アクションの EV 比較

ハンド終了時に、自分の各アクションについて以下を計算:

```
EV(Fold) = 0
EV(Check/Call) = 上記式
EV(Raise to X) = ※相手のフォールド/コール率の推定が必要(MVP では簡略化)
```

最善アクションと採用アクションを比較し、`deviation_bb = EV(best) - EV(taken)` を計算。

### 10.4 プリフロップ GTO 比較

各プリフロップアクションは GTO チャートと照合し、`gto_match: 0/1` を記録。

### 10.5 ボードテクスチャ分類

```typescript
type BoardType =
  | "monotone"          // 同スーツ3枚
  | "two_tone"          // 同スーツ2枚
  | "rainbow"           // 全部別スーツ
  | "paired"            // ペアあり
  | "connected"         // 3枚連続
  | "high_card"         // ハイカード中心
  | "low"               // 全部9以下
  | "dynamic"           // 多くのドロー可能
  | "dry";              // ドロー少ない
```

**[Claude Code 指示]**
- エクイティ計算は重い処理なので Web Worker で動かす
- `pokersolver` の `Hand.solve()` でハンド評価
- 1万試行で 100ms 程度を目標(処理性能ベンチマークを最初に取る)

---

## 11. UI/UX 設計

### 11.1 画面遷移

```
[Landing/Login]
    │ Google ログイン
    ▼
[Lobby]
    ├── [Hand History]
    ├── [Stats Dashboard]
    └── [Table View] ←→ [Spectator]
```

### 11.2 主要画面

#### 11.2.1 ロビー画面

- ヘッダー: ハンドル名、累計ハンド数、bb/100、ログアウト
- メインエリア: 卓カード(MVPは1卓)
  - 卓名、ブラインド、現在の参加人数(人間/CPU)、自分の席ステータス
  - 「着席」「観戦」ボタン
- サイドバー: AdSense
- フッター: 履歴/統計画面へのリンク

#### 11.2.2 卓画面

```
+--------------------------------------------------+
|              [CPU2]    [CPU3]                    |
|        [CPU1]                  [HUMAN A]         |
|                                                  |
|                  [BOARD: Ah Kd 9s]               |
|                  Pot: 240                        |
|                                                  |
|         [YOU]                  [CPU4]            |
|              [HUMAN B]   [CPU5]                  |
|                                                  |
|       Your Hole: [Qh] [Jh]    Stack: 980         |
|                                                  |
|  [FOLD]  [CHECK/CALL 20]  [RAISE]                |
|         Pot pre-fill: 1/3  1/2  2/3  pot  AI     |
+--------------------------------------------------+
```

- 楕円卓レイアウト(レスポンシブ、スマホでは縦長楕円)
- 自分は常に下中央
- アクション中の席はハイライト + 残り時間プログレスバー
- ポットサイズ、ベット額をチップビジュアルで表示
- ハンド開始時にホールカードのアニメーション

#### 11.2.3 ハンド履歴画面

- 上部: フィルタ(期間、ポジション、結果)
- リスト: 1行1ハンド、ホールカード/ボード/結果/EV損益
- 行クリックで詳細パネル展開
- 詳細パネル: ストリート別タイムライン、各アクションの分析(EV、ポットオッズ、最善手)、「リプレイ」「テキストエクスポート」ボタン

#### 11.2.4 統計画面

- 上部カード: 累計ハンド数、VPIP/PFR、bb/100、ROI(EV)
- メイン: 累計勝ち額グラフ(実線=実損益、点線=EV損益、Ten-Four 緑黄線スタイル)
- 下部: ポジション別 / ストリート別 / ハンドカテゴリ別の統計表

### 11.3 スマホ対応方針

- ブレークポイント: 768px 未満をスマホとみなす
- 卓画面: 縦持ち専用、CPU は上部に小さく、自分の手番が見やすく
- ボタンは指タップ用に最低 44px
- 横スワイプで席間を見渡せる(8人卓は狭いので)
- PWA 対応(ホーム画面追加可、オフライン時は履歴閲覧のみ)

### 11.4 デザイントーン

- ダーク基調(目に優しい、ゲーム集中力高い)
- アクセントカラー: Ten-Four 似の青系 + 緑(勝ち)/赤(負け)
- カードはミニマル(写実的カジノ風は避ける、視認性優先)
- アニメーションは最小限(快適さ優先、Ten-Four を踏襲)

**[Claude Code 指示]**
- まず `frontend-design` スキルを読んでから着手
- shadcn/ui + Tailwind で組む
- 状態管理は Zustand(Redux は重い)
- WebSocket クライアントは `apps/web/src/lib/socket.ts` で集約

---

## 12. 認証・セキュリティ

### 12.1 Google OAuth フロー

1. `/api/auth/google/start` で `state` トークン発行、Google 同意画面へリダイレクト
2. コールバックで `code` を Google に送り `id_token` 取得
3. `id_token` 検証 → `users` テーブルに upsert
4. JWT 発行(payload: `{ userId, handle, exp }`, 有効期限 7日)
5. JWT は HTTPOnly + Secure + SameSite=Lax の Cookie で保存

### 12.2 JWT 検証

全 `/api/*` および `/ws/*` の入口で JWT を検証。署名は HMAC-SHA256、シークレットは Cloudflare の環境変数。

### 12.3 不正対策

| リスク | 対策 |
|---|---|
| 他人のホールカードを覗く | サーバーは該当プレイヤーにしか hole_cards を送らない。WebSocket メッセージレベルで分岐 |
| 自動操作(bot) | レート制限(1秒5アクション以上で警告、10で切断) |
| 同一ユーザーの複数席着座 | 着席リクエスト時に `users.id` で既存席チェック |
| クライアント改ざんで「強制勝ち」要求 | 全アクションはサーバー側で正当性検証(ベット額の妥当性、自分の手番か、等) |
| デッキ予測 | crypto.getRandomValues 使用、シード非公開、ハンド終了まで未使用カード非開示 |

### 12.4 個人情報

- 保存するのは Google `sub`、メアド、ハンドル名のみ
- メアドは表示しない(他ユーザーには見えない)
- 削除リクエスト時は users + hand_players の user_id を NULL 化(統計用に hand 自体は残す)

---

## 13. 広告配置

### 13.1 AdSense 統合

- AdSense アカウントを Owner で取得(個人ブログ等の運営実績があると審査通りやすい)
- 配置箇所:
  - ロビー画面: 右サイドバー(デスクトップ) / 下部(モバイル)
  - 履歴画面: ハンドリスト下部
  - 統計画面: グラフ下部
- プレイ画面・卓画面・観戦画面: **広告なし**

### 13.2 配置時の注意

- AdSense ポリシー: ゲームプレイを「賭博」と誤認させないコンテンツ作り
  - 「仮想チップのみ、リアルマネー一切なし」をフッターと利用規約に明記
  - 換金・ギャンブル要素は完全に排除
- 子供向けではないので Family ad filter は不要だが、ギャンブル広告は除外設定

### 13.3 v2 での Pro tier

- Stripe Checkout で月額 500〜1,000円
- 特典: AI 分析(Claude API)無制限、AdSense 削除、高度統計、レンジ推定
- 実装は v2 以降、MVP では考慮のみ

---

## 14. デプロイ・運用

### 14.1 環境

| 環境 | 用途 | ドメイン例 |
|---|---|---|
| local | 開発(wrangler dev) | localhost:8787 |
| preview | PR ごとのプレビュー | pokergo-pr-N.pages.dev |
| production | 本番 | pokergo.app(独自ドメイン取得想定) |

### 14.2 CI/CD

- GitHub Actions
- main ブランチ push で本番自動デプロイ
- PR で preview デプロイ
- D1 マイグレーションは別 workflow で手動承認

### 14.3 監視

- Cloudflare Analytics(無料、リクエスト数・エラー率)
- Logpush は MVP では不要、v2 で BetterStack or Axiom 連携
- アラート: エラー率 1% 超え、レスポンス遅延 1s 超えで Discord 通知

### 14.4 バックアップ

- D1 は Cloudflare 内で自動バックアップ
- 週次で `wrangler d1 export` を実行し R2 に保管(v2 から)

---

## 15. コスト試算

### 15.1 MVP(友達卓のみ、想定 月間 1,000ハンド × 8人 = 8,000ハンド消化)

| 項目 | 月額 |
|---|---|
| Cloudflare Workers リクエスト | 無料枠(10万/日)内 |
| Durable Objects | 無料枠(月100万リクエスト)内 |
| D1 読み書き | 無料枠内 |
| Pages | 無料 |
| ドメイン | 約1,500円/年 = 125円/月 |
| **合計** | **約 125円/月** |

### 15.2 v2(MAU 1,000人、月間 100万ハンド想定)

| 項目 | 月額 |
|---|---|
| Workers Paid Plan(必須) | $5 |
| Durable Objects(月3,000万リクエスト) | 約 $15 |
| D1(書き込み多め) | 約 $5 |
| Claude API(Pro tier 100人 × 月平均 50回呼び出し) | 約 $20 |
| **合計** | **約 $45 ≒ 7,000円/月** |

AdSense 収益と Pro tier 課金で黒字化可能。

---

## 16. 開発フェーズ計画

### Phase 0: 準備(1週間)

- リポジトリ作成、pnpm workspaces 初期化
- Cloudflare アカウント、D1、Pages、Workers 設定
- GitHub Actions 設定
- ドメイン取得(任意)
- 本書を `docs/` に配置、Claude Code が参照できる状態に

### Phase 1: シングルプレイで動くポーカー(2〜3週間)

- ゲームエンジン実装(役判定、ベッティングラウンド、サイドポット)
- フロント: 卓画面のみ、自分 + CPU 7体の8人卓
- CPU AI 基礎(プリフロップ GTO チャート + 簡易ポストフロップ)
- ハンド進行のローカル動作確認
- **マイルストーン**: localhost で1人 vs 7CPU が遊べる

### Phase 2: 認証・履歴・統計(2週間)

- Google OAuth 実装
- D1 スキーマ migration
- ハンド終了時に D1 へ flush
- 履歴画面、統計画面(VPIP/PFR/bb100 グラフ)
- PokerStars 形式エクスポート
- **マイルストーン**: 自分のプレイデータが永続化され、ブラウザ閉じても続きから

### Phase 3: マルチプレイ + Durable Objects(2週間)

- TableDO 実装、WebSocket Hibernation 設定
- 着席・退席・観戦
- AFK/切断処理
- 招待リンク(MVPは Google ログイン経由なので不要、誰でも来れる)
- **マイルストーン**: 友達3人と CPU 5体で実プレイ

### Phase 4: 分析エンジン強化(2週間)

- エクイティ計算 Web Worker 化
- ポットオッズ判定、EV 計算
- プリフロップ GTO 比較
- ハンドリプレイ画面
- **マイルストーン**: ハンド終了後に「あのコールは +0.8bb / あのフォールドは -0.3bb」と表示される

### Phase 5: 仕上げ・公開準備(2週間)

- スマホ対応(レスポンシブ、PWA 設定)
- AdSense 統合
- ベータテスト(友達3人)
- バグ修正、パフォーマンスチューニング
- 利用規約・プライバシーポリシー
- **マイルストーン**: 公開 URL でログイン → 友達と遊べる(MVP 完成)

### Phase 6 以降(v2): 複数卓・Fast Fold・Pro tier

優先順は §3.2 参照。

---

## 17. 残課題・将来検討

| # | 課題 | 対応時期 |
|---|---|---|
| R1 | GTO チャートデータのライセンス確認(自前作成 or 公開データ利用) | Phase 1 着手前 |
| R2 | pokersolver vs poker-evaluator の性能比較 | Phase 1 着手時 |
| R3 | Cloudflare の WebSocket Hibernation 実挙動確認(切断扱いになる閾値) | Phase 3 着手時 |
| R4 | スマホ卓画面の8人レイアウト試作(縦持ち専用で本当に成り立つか) | Phase 5 |
| R5 | 賭博法・利用規約のリーガル確認 | 公開前 |
| R6 | レンジ推定の精度評価方法 | v2 |
| R7 | Pro tier の価格・特典の最終確定 | v2 |
| R8 | Fast Fold モード時の CPU 配置設計(プールに CPU を混ぜるか純粋人対人か) | v2 設計時 |

---

## Appendix A: 用語集

| 用語 | 意味 |
|---|---|
| bb | Big Blind(ベット単位の基準) |
| bb/100 | 100ハンドあたりの bb 換算勝ち額(Win Rate 指標) |
| VPIP | Voluntarily Put $ In Pot 率(プリフロでブラインド以外で参加した割合) |
| PFR | Pre-Flop Raise 率 |
| 3-bet% | プリフロップ 3ベット率 |
| AF | Aggression Factor(積極性指標 = (Bet + Raise) / Call) |
| WTSD | Went To ShowDown 率(フロップ参加ハンドのうちショウダウンまで行った割合) |
| W$SD | Won $ at ShowDown 率(ショウダウンに行ったハンドの勝率) |
| SPR | Stack-to-Pot Ratio |
| GTO | Game Theory Optimal(エクスプロイトされにくい均衡戦略) |
| EV | Expected Value(期待値) |
| エクイティ | あるカード状況での勝率 |
| Fast Fold | フォールド即別卓移動の高速形式(Ten-Four / Zoom Poker) |

## Appendix B: PokerStars 形式エクスポートの仕様

サンプル:

```
PokerStars Hand #2026052201-001: Hold'em No Limit (5/10) - 2026/05/22 10:00:00 JST
Table 'Pokergo Main' 8-max Seat #4 is the button
Seat 1: Alpha (1000 in chips)
Seat 2: Bravo (1000 in chips)
Seat 3: Charlie (1000 in chips)
Seat 4: HumanA (1000 in chips)
Seat 5: Fumiya (1000 in chips)
Seat 6: Delta (1000 in chips)
Seat 7: Echo (1000 in chips)
Seat 8: HumanB (1000 in chips)
Alpha: posts small blind 5
Bravo: posts big blind 10
*** HOLE CARDS ***
Dealt to Fumiya [Ah Kd]
Charlie: folds
HumanA: raises 20 to 30
Fumiya: calls 30
...
*** SUMMARY ***
Total pot 240 | Rake 0
Board [Ah Kd 9s 2c 7h]
Seat 5: Fumiya showed [Ah Kd] and won (240) with Pair of Aces
```

実装時の注意:
- 時刻は JST 表示
- カード表記は標準("As", "Kd", "Qh", "Jc", "Tc"... ※10 は T)
- アクション動詞は英語固定(LLM が認識しやすい)

---

**本書は v1.0。次回更新時はバージョン上げて改訂履歴に追記すること。**
