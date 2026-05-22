import { Hono } from 'hono';
import { getHandDetail, listHandsForUser } from '../db/hands';
import type { Env } from '../env';
import type { AuthVariables } from '../middleware/auth';

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
  const isParticipant = detail.players.some((p) => p.user_id === user.id);
  if (!isParticipant) return c.json({ error: { code: 'forbidden' } }, 403);
  return c.json(detail);
});
