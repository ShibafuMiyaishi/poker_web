import { Hono } from 'hono';
import { getHandDetail, listHandsForUser } from '../db/hands';
import { type Period, computeGraphPoints, computeStats } from '../db/stats';
import type { Env } from '../env';
import type { AuthVariables } from '../middleware/auth';

function parsePeriod(q: string | undefined): Period {
  if (q === 'month' || q === 'week') return q;
  return 'all';
}

export const historyRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

historyRouter.get('/hands', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: { code: 'unauthorized' } }, 401);
  const limit = Math.max(1, Math.min(100, Number.parseInt(c.req.query('limit') ?? '20', 10) || 20));
  const offset = Math.max(0, Number.parseInt(c.req.query('offset') ?? '0', 10) || 0);
  const rows = await listHandsForUser(c.env, user.id, limit, offset);
  return c.json({ hands: rows, limit, offset });
});

historyRouter.get('/hands/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: { code: 'unauthorized' } }, 401);
  const detail = await getHandDetail(c.env, c.req.param('id'));
  if (!detail) return c.json({ error: { code: 'not_found' } }, 404);
  // 自分が参加していないハンドは詳細を返さない
  const me = detail.players.find((p) => p.user_id === user.id);
  if (!me) return c.json({ error: { code: 'forbidden' } }, 403);
  // ホールカードのマスキング (§12.3 ホールカードを他者に漏らさない)。
  // 自席のカードは常に開示。他席のカードは went_to_showdown=1 のみ開示。
  const maskedPlayers = detail.players.map((p) => {
    const visible = p.seat_no === me.seat_no || p.went_to_showdown === 1;
    return { ...p, hole_cards: visible ? p.hole_cards : '?? ??' };
  });
  return c.json({ ...detail, players: maskedPlayers });
});

historyRouter.get('/stats', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: { code: 'unauthorized' } }, 401);
  const period = parsePeriod(c.req.query('period'));
  const stats = await computeStats(c.env, user.id, period);
  return c.json(stats);
});

historyRouter.get('/graph', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: { code: 'unauthorized' } }, 401);
  const period = parsePeriod(c.req.query('period'));
  const points = await computeGraphPoints(c.env, user.id, period);
  return c.json({ points });
});
