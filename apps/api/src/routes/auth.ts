import { Hono } from 'hono';
import { upsertGuestUser } from '../db/users';
import type { Env } from '../env';
import { signJwt } from '../lib/jwt';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const authRouter = new Hono<{ Bindings: Env }>();

// ゲストモード: クライアント生成の uuid を受け取り、user 行を upsert して JWT を返す。
// Google OAuth は Phase 3（または Owner の Cloud Console 設定後）に追加。
authRouter.post('/guest', async (c) => {
  const body = await c.req.json().catch(() => null);
  const clientUuid = body && typeof body.clientUuid === 'string' ? body.clientUuid : null;
  if (!clientUuid || !UUID_RE.test(clientUuid)) {
    return c.json(
      { error: { code: 'invalid_uuid', message: 'clientUuid is required (uuid v4)' } },
      400,
    );
  }

  const user = await upsertGuestUser(c.env, clientUuid);
  const secret = c.env.JWT_SECRET ?? 'dev-only-insecure-secret';
  const token = await signJwt({ sub: user.id, handle: user.handle }, secret);
  return c.json({ token, user: { id: user.id, handle: user.handle } });
});
