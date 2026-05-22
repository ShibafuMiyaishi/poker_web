import type { Env } from '../env';

export type Period = 'all' | 'month' | 'week';

export interface StatsSummary {
  period: Period;
  handsPlayed: number;
  totalNetChips: number;
  bbPer100: number;
  vpip: number; // 0-1
  pfr: number;
  threeBetPct: number;
  af: number; // > 0
  wtsd: number;
  wDollarSd: number;
  // 内訳（debug 用）
  detail: {
    vpipHands: number;
    pfrHands: number;
    threeBetOpportunities: number;
    threeBetHands: number;
    sawFlopHands: number;
    showdownHands: number;
    winsAtShowdown: number;
    postflopAggressive: number;
    postflopCalls: number;
  };
}

function periodStartUnix(period: Period): number {
  if (period === 'all') return 0;
  const now = new Date();
  if (period === 'week') {
    // 直近 7 日（仕様 F-H-06 の "今週" を粗く満たす）
    return Math.floor(now.getTime() / 1000) - 7 * 24 * 60 * 60;
  }
  // month: 30 日
  return Math.floor(now.getTime() / 1000) - 30 * 24 * 60 * 60;
}

interface Row {
  cnt: number | null;
}
interface SummaryRow {
  total_hands: number | null;
  total_net_chips: number | null;
  avg_bb: number | null;
  showdowns: number | null;
  wins_at_showdown: number | null;
  saw_flop_hands: number | null;
}
interface AfRow {
  aggressive: number | null;
  calls: number | null;
}

// 仕様 §3.1.3 F-H-04 の各指標を D1 で集計する。
// hand_players.user_id でフィルタし、JOIN actions で per-action 系を出す。
// started_at は Unix 秒（D1 のミリ秒/秒は schema 上は INTEGER で揺れがあるため、
// payload 側は ms epoch だが API/db 層では秒換算しない方が安全。startedAt は ms のまま比較）。
export async function computeStats(
  env: Env,
  userId: string,
  period: Period,
): Promise<StatsSummary> {
  const sinceMs = periodStartUnix(period) * 1000;
  const tsClause = sinceMs > 0 ? 'AND h.started_at >= ?' : '';
  const tsBindings = sinceMs > 0 ? [sinceMs] : [];

  const summary = await env.DB.prepare(
    `SELECT
       COUNT(*) AS total_hands,
       COALESCE(SUM(hp.net_chips), 0) AS total_net_chips,
       AVG(h.bb) AS avg_bb,
       SUM(CASE WHEN hp.went_to_showdown = 1 THEN 1 ELSE 0 END) AS showdowns,
       SUM(CASE WHEN hp.went_to_showdown = 1 AND hp.won = 1 THEN 1 ELSE 0 END) AS wins_at_showdown,
       SUM(CASE WHEN NOT EXISTS (
         SELECT 1 FROM actions a
          WHERE a.hand_id = hp.hand_id
            AND a.seat_no = hp.seat_no
            AND a.street = 'preflop'
            AND a.action_type = 'fold'
       ) THEN 1 ELSE 0 END) AS saw_flop_hands
       FROM hand_players hp
       JOIN hands h ON h.id = hp.hand_id
      WHERE hp.user_id = ? ${tsClause}`,
  )
    .bind(userId, ...tsBindings)
    .first<SummaryRow>();

  const vpipRow = await env.DB.prepare(
    `SELECT COUNT(DISTINCT a.hand_id) AS cnt
       FROM actions a
       JOIN hand_players hp ON a.hand_id = hp.hand_id AND a.seat_no = hp.seat_no
       JOIN hands h ON h.id = hp.hand_id
      WHERE hp.user_id = ?
        AND a.street = 'preflop'
        AND a.action_type IN ('call', 'bet', 'raise', 'all_in')
        ${tsClause}`,
  )
    .bind(userId, ...tsBindings)
    .first<Row>();

  const pfrRow = await env.DB.prepare(
    `SELECT COUNT(DISTINCT a.hand_id) AS cnt
       FROM actions a
       JOIN hand_players hp ON a.hand_id = hp.hand_id AND a.seat_no = hp.seat_no
       JOIN hands h ON h.id = hp.hand_id
      WHERE hp.user_id = ?
        AND a.street = 'preflop'
        AND a.action_type IN ('bet', 'raise')
        ${tsClause}`,
  )
    .bind(userId, ...tsBindings)
    .first<Row>();

  // 3-bet: 自分の preflop raise の前に「他席の raise/bet/all_in」があったハンド数
  const threeBetRow = await env.DB.prepare(
    `SELECT COUNT(DISTINCT user_action.hand_id) AS cnt
       FROM actions user_action
       JOIN hand_players hp ON user_action.hand_id = hp.hand_id AND user_action.seat_no = hp.seat_no
       JOIN hands h ON h.id = hp.hand_id
      WHERE hp.user_id = ?
        AND user_action.street = 'preflop'
        AND user_action.action_type IN ('raise', 'all_in')
        AND EXISTS (
          SELECT 1 FROM actions prior
           WHERE prior.hand_id = user_action.hand_id
             AND prior.street = 'preflop'
             AND prior.order_no < user_action.order_no
             AND prior.action_type IN ('bet', 'raise', 'all_in')
        )
        ${tsClause}`,
  )
    .bind(userId, ...tsBindings)
    .first<Row>();

  // 3-bet opportunities: 自分の preflop アクション直前に他席の raise があった機会数
  // 簡略化: 自分が preflop で fold/call/raise/all_in した時点で既に raise があったハンド数
  const threeBetOppRow = await env.DB.prepare(
    `SELECT COUNT(DISTINCT user_action.hand_id) AS cnt
       FROM actions user_action
       JOIN hand_players hp ON user_action.hand_id = hp.hand_id AND user_action.seat_no = hp.seat_no
       JOIN hands h ON h.id = hp.hand_id
      WHERE hp.user_id = ?
        AND user_action.street = 'preflop'
        AND EXISTS (
          SELECT 1 FROM actions prior
           WHERE prior.hand_id = user_action.hand_id
             AND prior.street = 'preflop'
             AND prior.order_no < user_action.order_no
             AND prior.action_type IN ('bet', 'raise', 'all_in')
        )
        ${tsClause}`,
  )
    .bind(userId, ...tsBindings)
    .first<Row>();

  const afRow = await env.DB.prepare(
    `SELECT
       SUM(CASE WHEN a.action_type IN ('bet', 'raise') THEN 1 ELSE 0 END) AS aggressive,
       SUM(CASE WHEN a.action_type = 'call' THEN 1 ELSE 0 END) AS calls
       FROM actions a
       JOIN hand_players hp ON a.hand_id = hp.hand_id AND a.seat_no = hp.seat_no
       JOIN hands h ON h.id = hp.hand_id
      WHERE hp.user_id = ?
        AND a.street != 'preflop'
        ${tsClause}`,
  )
    .bind(userId, ...tsBindings)
    .first<AfRow>();

  const handsPlayed = summary?.total_hands ?? 0;
  const totalNet = summary?.total_net_chips ?? 0;
  const avgBb = summary?.avg_bb ?? 10;
  const showdowns = summary?.showdowns ?? 0;
  const winsSd = summary?.wins_at_showdown ?? 0;
  const sawFlop = summary?.saw_flop_hands ?? 0;
  const vpipHands = vpipRow?.cnt ?? 0;
  const pfrHands = pfrRow?.cnt ?? 0;
  const threeBetHands = threeBetRow?.cnt ?? 0;
  const threeBetOpps = threeBetOppRow?.cnt ?? 0;
  const aggressive = afRow?.aggressive ?? 0;
  const calls = afRow?.calls ?? 0;

  return {
    period,
    handsPlayed,
    totalNetChips: totalNet,
    bbPer100: handsPlayed > 0 ? (totalNet / avgBb / handsPlayed) * 100 : 0,
    vpip: handsPlayed > 0 ? vpipHands / handsPlayed : 0,
    pfr: handsPlayed > 0 ? pfrHands / handsPlayed : 0,
    threeBetPct: threeBetOpps > 0 ? threeBetHands / threeBetOpps : 0,
    af: calls > 0 ? aggressive / calls : aggressive > 0 ? Number.POSITIVE_INFINITY : 0,
    wtsd: sawFlop > 0 ? showdowns / sawFlop : 0,
    wDollarSd: showdowns > 0 ? winsSd / showdowns : 0,
    detail: {
      vpipHands,
      pfrHands,
      threeBetOpportunities: threeBetOpps,
      threeBetHands,
      sawFlopHands: sawFlop,
      showdownHands: showdowns,
      winsAtShowdown: winsSd,
      postflopAggressive: aggressive,
      postflopCalls: calls,
    },
  };
}

export interface GraphPoint {
  handNo: number;
  startedAt: number;
  cumulativeNetChips: number;
  cumulativeNetBb: number;
}

interface GraphRow {
  id: string;
  started_at: number;
  bb: number;
  net_chips: number;
}

export async function computeGraphPoints(
  env: Env,
  userId: string,
  period: Period,
): Promise<GraphPoint[]> {
  const sinceMs = periodStartUnix(period) * 1000;
  const tsClause = sinceMs > 0 ? 'AND h.started_at >= ?' : '';
  const tsBindings = sinceMs > 0 ? [sinceMs] : [];

  const result = await env.DB.prepare(
    `SELECT h.id, h.started_at, h.bb, hp.net_chips
       FROM hand_players hp
       JOIN hands h ON h.id = hp.hand_id
      WHERE hp.user_id = ? ${tsClause}
      ORDER BY h.started_at ASC, h.id ASC`,
  )
    .bind(userId, ...tsBindings)
    .all<GraphRow>();

  const rows = result.results ?? [];
  let cumNet = 0;
  let cumBb = 0;
  return rows.map((r, i) => {
    cumNet += r.net_chips;
    const bb = r.bb || 10;
    cumBb += r.net_chips / bb;
    return {
      handNo: i + 1,
      startedAt: r.started_at,
      cumulativeNetChips: cumNet,
      cumulativeNetBb: cumBb,
    };
  });
}
