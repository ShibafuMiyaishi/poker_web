# packages/gto-charts

GTO チャート JSON データの置き場。コードはほぼなし、データのみ。

## 構造

```
data/
├── 8max-100bb/
│   ├── open/{POS}.json         例: open/UTG.json
│   ├── vs-raise/{POS}.json
│   └── vs-3bet/{POS}.json
SOURCES.md                       チャート出典・ライセンス記録（必須）
src/index.ts                     JSON ロード用ヘルパ（最小限）
```

## 規約

- 169 ハンド分のキー（`AKs` `T9o` `55` 等の正規化形）を必ず全網羅。欠損ハンドがあるとプロダクトで誤判定の元。
- 値は `"raise" | "call" | "fold" | "mixed:0.30"` の文字列。`mixed:` の後は確率（0.00〜1.00、小数 2 桁）。
- データ追加・修正時は必ず `SOURCES.md` に出典 + ライセンスを追記。
- 仕様 §17 R1 のとおりライセンス確認は Phase 1 着手前に完了させる。

## 検証

`gto-analyst` サブエージェントが整合性チェック（169 ハンド網羅、確率分布、ポジション間整合）を担当。

## v2 拡張

- レンジ推定機能（v2）では villain 側のチャートも参照する。データ形式は同じ。
- 6-Max Fast Fold（v2）導入時は `data/6max-100bb/` を別ツリーで追加。
