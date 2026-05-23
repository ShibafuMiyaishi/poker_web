import type { MiddlewareHandler } from 'hono';
import type { Env } from '../env';
import { type JwtPayload, verifyJwt } from '../lib/jwt';
import { requireJwtSecret } from '../lib/secrets';

export interface AuthVariables {
  user: { id: string; handle: string };
}

// Authorization: Bearer <jwt> を検証し、c.get('user') に { id, handle } をセット。
// 未提示・無効ならば 401。
export const jwtMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: AuthVariables;
}> = async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ error: { code: 'unauthorized', message: 'Bearer token required' } }, 401);
  }
  const token = auth.slice('Bearer '.length).trim();
  const secret = requireJwtSecret(c.env);
  const payload = await verifyJwt(token, secret);
  if (!payload) {
    return c.json({ error: { code: 'invalid_token', message: 'JWT invalid or expired' } }, 401);
  }
  c.set('user', { id: (payload as JwtPayload).sub, handle: (payload as JwtPayload).handle });
  await next();
};
