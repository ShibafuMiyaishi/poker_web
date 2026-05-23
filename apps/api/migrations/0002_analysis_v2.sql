-- 0002_analysis_v2.sql
-- 行動評価エンジン v2 の分析フィールドを actions テーブルへ追加。

ALTER TABLE actions ADD COLUMN hand_category    TEXT;
ALTER TABLE actions ADD COLUMN equity_vs_range  REAL;
ALTER TABLE actions ADD COLUMN fold_equity      REAL;
ALTER TABLE actions ADD COLUMN ev_bet_bb        REAL;
ALTER TABLE actions ADD COLUMN ev_raise_bb      REAL;
ALTER TABLE actions ADD COLUMN implied_odds_bb  REAL;
ALTER TABLE actions ADD COLUMN verdict          TEXT;
ALTER TABLE actions ADD COLUMN reasoning        TEXT;
