import type { HandPayload } from '@pokergo/engine';
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
