-- 0001_init.sql
-- Pokergo D1 初期スキーマ。仕様書 §6.1 と同期。
-- 既存 migration は編集しない。変更は新 migration で追加すること。

CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  google_sub      TEXT UNIQUE NOT NULL,
  email           TEXT NOT NULL,
  handle          TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  last_seen_at    INTEGER NOT NULL
);
CREATE INDEX idx_users_handle ON users(handle);

CREATE TABLE sessions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  table_id        TEXT NOT NULL,
  seat_no         INTEGER NOT NULL,
  started_at      INTEGER NOT NULL,
  ended_at        INTEGER
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE hands (
  id              TEXT PRIMARY KEY,
  table_id        TEXT NOT NULL,
  hand_no         INTEGER NOT NULL,
  started_at      INTEGER NOT NULL,
  ended_at        INTEGER NOT NULL,
  sb              INTEGER NOT NULL,
  bb              INTEGER NOT NULL,
  button_seat     INTEGER NOT NULL,
  board           TEXT NOT NULL,
  pot_total       INTEGER NOT NULL,
  rake            INTEGER NOT NULL DEFAULT 0,
  pokerstars_text TEXT NOT NULL
);
CREATE INDEX idx_hands_table_time ON hands(table_id, started_at);

CREATE TABLE hand_players (
  hand_id          TEXT NOT NULL REFERENCES hands(id),
  user_id          TEXT,
  cpu_name         TEXT,
  seat_no          INTEGER NOT NULL,
  position         TEXT NOT NULL,
  hole_cards       TEXT NOT NULL,
  stack_start      INTEGER NOT NULL,
  stack_end        INTEGER NOT NULL,
  net_chips        INTEGER NOT NULL,
  went_to_showdown INTEGER NOT NULL,
  won              INTEGER NOT NULL,
  PRIMARY KEY (hand_id, seat_no)
);
CREATE INDEX idx_hand_players_user ON hand_players(user_id);

CREATE TABLE actions (
  id              TEXT PRIMARY KEY,
  hand_id         TEXT NOT NULL REFERENCES hands(id),
  street          TEXT NOT NULL,
  seat_no         INTEGER NOT NULL,
  order_no        INTEGER NOT NULL,
  action_type     TEXT NOT NULL,
  amount          INTEGER NOT NULL DEFAULT 0,
  pot_before      INTEGER NOT NULL,
  stack_before    INTEGER NOT NULL,
  ts              INTEGER NOT NULL,
  equity_pct      REAL,
  pot_odds_pct    REAL,
  ev_action_bb    REAL,
  ev_best_bb      REAL,
  best_action     TEXT,
  deviation_bb    REAL,
  gto_match       INTEGER
);
CREATE INDEX idx_actions_hand ON actions(hand_id, order_no);

CREATE TABLE stats_cache (
  user_id         TEXT NOT NULL REFERENCES users(id),
  period          TEXT NOT NULL,
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
