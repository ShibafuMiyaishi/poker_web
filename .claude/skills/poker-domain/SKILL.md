---
name: poker-domain
description: Texas Hold'em domain vocabulary, positions, action names, hand rankings, and Pokergo-specific naming conventions. Load when working on game engine, analysis engine, GTO charts, CPU AI, or UI labels in this project.
---

# Poker Domain Glossary（Pokergo）

ポーカー用語が出てきたときの共通辞書。仕様書 Appendix A の補強。

## ポジション（8-Max NLHE、BTN を起点に時計回り）

`BTN` → `SB` → `BB` → `UTG` → `UTG+1` → `MP` → `HJ` → `CO` → (BTN)

- アクション順: プリフロップは UTG から、ポストフロップは SB から（生存者のみ）。
- ポジションは `position` カラムに文字列で保存。

## アクション種別

| 値 | 意味 |
|---|---|
| `fold` | 降りる |
| `check` | 賭けずに次へ |
| `call` | 既存ベットに合わせる |
| `bet` | 新規に賭ける（既存ベット 0 のときだけ） |
| `raise` | 既存ベットを上げる |
| `all_in` | スタック全額投入 |

「raise to X」と「raise by X」の表現が混同しがち。**API・DB は常に `amount` = "to X"（最終ベット額）** で統一。

## ハンドランキング（強い順）

1. Royal Flush
2. Straight Flush
3. Four of a Kind (Quads)
4. Full House (Boat)
5. Flush
6. Straight
7. Three of a Kind (Trips/Set)
8. Two Pair
9. One Pair
10. High Card

`pokersolver` の `Hand.solve()` が返す `rank` 数値で比較可。

## カード表記（標準・PokerStars 互換）

- ランク: `2 3 4 5 6 7 8 9 T J Q K A`（10 は **T**）
- スーツ: `s` (♠) `h` (♥) `d` (♦) `c` (♣)
- 例: `Ah Kd 9s 2c 7h`（スペース区切り）

## ハンド正規化（GTO チャート参照用）

- ペア: `AA` `KK` ... `22`
- スーテッド: `AKs` `T9s` ...（高い方が前）
- オフスート: `AKo` `T9o` ...
- 計 169 種類。`s/o` は単独カードでは付けない（カード表記の `s`=スペードと混同しない）。

## 統計指標

| 略語 | 計算 |
|---|---|
| VPIP | プリフロでブラインド以外で自発参加した割合 |
| PFR | プリフロでレイズした割合 |
| 3-bet% | プリフロ 3-bet 率 |
| AF | (Bet + Raise) / Call |
| WTSD | フロップ参加ハンドのうちショウダウン到達率 |
| W$SD | ショウダウン到達ハンドの勝率 |
| bb/100 | 100 ハンド当たりの bb 換算勝ち額 |
| SPR | Stack-to-Pot Ratio |

## Pokergo 内部呼称

- 「卓 / Table」「席 / Seat (0〜7)」「ハンド / Hand（1 周）」「セッション / Session（着席〜退席）」。
- "Pot" は常に「メインポット + 全サイドポットの合計」を指す。サイドポットは `sidePots[]` で別管理。
- 「ストリート」= preflop / flop / turn / river / showdown の 5 状態。
