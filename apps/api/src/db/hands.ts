import type { HandAnalysis, HandPayload } from '@pokergo/engine';
import type { Env } from '../env';

// D1 batch で hand / hand_players / actions をアトミックに挿入する。
export async function insertHand(env: Env, payload: HandPayload): Promise<void> {
  const { hand, players, actions } = payload;
  const stmts = [
    env.DB.prepare(
      `INSERT INTO hands
        (id, table_id, hand_no, started_at, ended_at, sb, bb, button_seat, board, pot_total, rake, pokerstars_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      hand.id,
      hand.tableId,
      hand.handNo,
      hand.startedAt,
      hand.endedAt,
      hand.sb,
      hand.bb,
      hand.buttonSeat,
      hand.board,
      hand.potTotal,
      hand.rake,
      hand.pokerstarsText,
    ),
    ...players.map((p) =>
      env.DB.prepare(
        `INSERT INTO hand_players
          (hand_id, user_id, cpu_name, seat_no, position, hole_cards, stack_start, stack_end, net_chips, went_to_showdown, won)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        hand.id,
        p.userId,
        p.cpuName,
        p.seatNo,
        p.position,
        p.holeCards,
        p.stackStart,
        p.stackEnd,
        p.netChips,
        p.wentToShowdown ? 1 : 0,
        p.won ? 1 : 0,
      ),
    ),
    ...actions.map((a) =>
      env.DB.prepare(
        `INSERT INTO actions
          (id, hand_id, street, seat_no, order_no, action_type, amount, pot_before, stack_before, ts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        a.id,
        hand.id,
        a.street,
        a.seatNo,
        a.orderNo,
        a.actionType,
        a.amount,
        a.potBefore,
        a.stackBefore,
        a.ts,
      ),
    ),
  ];
  await env.DB.batch(stmts);
}

export interface HandListRow {
  id: string;
  started_at: number;
  ended_at: number;
  sb: number;
  bb: number;
  button_seat: number;
  board: string;
  pot_total: number;
  seat_no: number;
  position: string;
  hole_cards: string;
  net_chips: number;
  won: number;
}

export async function listHandsForUser(
  env: Env,
  userId: string,
  limit: number,
  offset: number,
): Promise<HandListRow[]> {
  const result = await env.DB.prepare(
    `SELECT h.id, h.started_at, h.ended_at, h.sb, h.bb, h.button_seat, h.board, h.pot_total,
            hp.seat_no, hp.position, hp.hole_cards, hp.net_chips, hp.won
       FROM hand_players hp
       JOIN hands h ON h.id = hp.hand_id
      WHERE hp.user_id = ?
      ORDER BY h.started_at DESC
      LIMIT ? OFFSET ?`,
  )
    .bind(userId, limit, offset)
    .all<HandListRow>();
  return result.results ?? [];
}

export interface HandDetailRow {
  hand: {
    id: string;
    table_id: string;
    hand_no: number;
    started_at: number;
    ended_at: number;
    sb: number;
    bb: number;
    button_seat: number;
    board: string;
    pot_total: number;
    rake: number;
    pokerstars_text: string;
  };
  players: Array<{
    user_id: string | null;
    cpu_name: string | null;
    seat_no: number;
    position: string;
    hole_cards: string;
    stack_start: number;
    stack_end: number;
    net_chips: number;
    went_to_showdown: number;
    won: number;
  }>;
  actions: Array<{
    id: string;
    street: string;
    seat_no: number;
    order_no: number;
    action_type: string;
    amount: number;
    pot_before: number;
    ts: number;
  }>;
}

// ハンド終了後に Web Worker で算出した分析を actions 行に書き戻す。
// (hand_id, seat_no, order_no) で 1 行を一意特定する。
export async function updateActionAnalysis(
  env: Env,
  handId: string,
  yourSeat: number,
  analysis: HandAnalysis,
): Promise<{ updated: number }> {
  if (analysis.actions.length === 0) return { updated: 0 };
  const stmts = analysis.actions.map((a) =>
    env.DB.prepare(
      `UPDATE actions
          SET equity_pct = ?,
              pot_odds_pct = ?,
              ev_action_bb = ?,
              ev_best_bb = ?,
              best_action = ?,
              deviation_bb = ?,
              gto_match = ?
        WHERE hand_id = ? AND seat_no = ? AND order_no = ?`,
    ).bind(
      a.equityPct,
      a.requiredEquityPct,
      a.takenEvBb,
      a.bestEvBb,
      a.bestAction,
      a.deviationBb,
      a.gtoMatch === null ? null : a.gtoMatch ? 1 : 0,
      handId,
      yourSeat,
      a.orderNo,
    ),
  );
  await env.DB.batch(stmts);
  return { updated: stmts.length };
}

// 自分が参加しているハンドかどうか確認する（403 ガード用）。
export async function isHandParticipant(
  env: Env,
  handId: string,
  userId: string,
): Promise<boolean> {
  const row = await env.DB.prepare(
    'SELECT 1 AS ok FROM hand_players WHERE hand_id = ? AND user_id = ? LIMIT 1',
  )
    .bind(handId, userId)
    .first<{ ok: number }>();
  return !!row;
}

export async function getHandDetail(env: Env, handId: string): Promise<HandDetailRow | null> {
  const hand = await env.DB.prepare('SELECT * FROM hands WHERE id = ?')
    .bind(handId)
    .first<HandDetailRow['hand']>();
  if (!hand) return null;
  const players =
    (
      await env.DB.prepare(
        'SELECT user_id, cpu_name, seat_no, position, hole_cards, stack_start, stack_end, net_chips, went_to_showdown, won FROM hand_players WHERE hand_id = ? ORDER BY seat_no',
      )
        .bind(handId)
        .all<HandDetailRow['players'][number]>()
    ).results ?? [];
  const actions =
    (
      await env.DB.prepare(
        'SELECT id, street, seat_no, order_no, action_type, amount, pot_before, ts FROM actions WHERE hand_id = ? ORDER BY order_no',
      )
        .bind(handId)
        .all<HandDetailRow['actions'][number]>()
    ).results ?? [];
  return { hand, players, actions };
}
