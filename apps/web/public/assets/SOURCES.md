# UI Assets — sources, licenses, and decisions

Pokergo は Ten-Four 風のミニマルデザイン方針に合わせ、**プログラマティック SVG（React コンポーネントで生成）** をデフォルト採用する。本ファイルは調査済みの外部素材を将来差し替え用に記録する。

---

## 採用方針

- **トランプ・チップ**: プログラマティック SVG（`apps/web/src/components/Card.tsx`, `Chip.tsx`）
  - 利点: 軽量、Tailwind カラーと統合、ライセンス非依存
- **フェルト背景**: CSS `radial-gradient` で生成
- **アイコン**: Heroicons / Lucide-React も自由ライセンスだが現状は文字記号と minimal SVG で済ませる

## 候補素材（調査済み・未採用）

### トランプ SVG

| 名称 | 取得元 | ライセンス | 備考 |
|---|---|---|---|
| Byron Knoll Vector Playing Cards | https://github.com/notpeter/Vector-Playing-Cards | Public Domain / WTFPL | 52 枚 + Joker + back、商用可。トラディショナルなデザイン |
| OpenGameArt Classic 4-Color Poker Deck | https://opengameart.org/comment/112049 | CC0 | 4 色配色（♠ 黒 / ♥ 赤 / ♦ 青 / ♣ 緑）、HUD 視認性に特化 |
| David Bellot SVG-cards | https://github.com/htdebeer/SVG-cards | LGPL | 高品質だが LGPL 系のため改変・再配布時の制約あり |
| Wikimedia Commons SVG cards | https://commons.wikimedia.org/wiki/Category:SVG_playing_cards | 個別 (PD/CC0/CC-BY-SA) | ファイル単位で要確認 |

### ポーカーチップ SVG

| 名称 | 取得元 | ライセンス |
|---|---|---|
| SVG Repo poker-chip | https://www.svgrepo.com/svg/4886/poker-chip | CC0 |
| OpenGameArt Playing Card Assets (52+Chips) | https://opengameart.org/content/playing-card-assets-52-cards-deck-chips | CC0、PNG |

### フェルト背景

ライセンスフリーのフェルトテクスチャ素材は調査範囲では確認できず。Tailwind の `radial-gradient` + SVG `<feTurbulence>` フィルターで自前生成する方が小さく実用的。

### デザインインスピレーション（出典のみ）

- Ten-Four: https://tenfour-poker.com/
- GTO Wizard Trainer: https://help.gtowizard.com/how-to-use-the-trainer/
- Chips of Fury "Poker UI Comparison": https://chipsoffury.com/blog/poker-ui-comparison/

## 差し替えタイミング

将来、ミニマル路線から「写実カジノ風」へ転換する場合は **Byron Knoll セット（PD）** を `apps/web/public/assets/cards/` に丸ごと配置し、`Card.tsx` を 1 行差し替えで切替可能にする想定。
