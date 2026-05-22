import { Hono } from 'hono';
import { upsertGoogleUser, upsertGuestUser } from '../db/users';
import type { Env } from '../env';
import { buildAuthorizeUrl, exchangeCodeForIdToken, generateState } from '../lib/googleOAuth';
import { signJwt } from '../lib/jwt';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OAUTH_STATE_COOKIE = 'pokergo_oauth_state';

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

// Google OAuth 開始: state を発行し Google 認可画面へリダイレクト
authRouter.get('/google/start', (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return c.json(
      { error: { code: 'oauth_disabled', message: 'GOOGLE_CLIENT_ID not configured' } },
      503,
    );
  }
  const url = new URL(c.req.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const state = generateState();
  const authorizeUrl = buildAuthorizeUrl({ clientId, redirectUri, state });
  c.header(
    'Set-Cookie',
    `${OAUTH_STATE_COOKIE}=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`,
  );
  return c.redirect(authorizeUrl, 302);
});

// Google OAuth コールバック: code を id_token に交換し JWT を発行 → フロントへ ?jwt= でリダイレクト
authRouter.get('/google/callback', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return c.json({ error: { code: 'oauth_disabled' } }, 503);
  }
  const code = c.req.query('code');
  const state = c.req.query('state');
  const cookies = (c.req.header('Cookie') ?? '').split(/;\s*/);
  const expectedState = cookies
    .find((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.slice(OAUTH_STATE_COOKIE.length + 1);
  if (!code || !state || !expectedState || state !== expectedState) {
    return c.json({ error: { code: 'invalid_state' } }, 400);
  }

  const url = new URL(c.req.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  try {
    const payload = await exchangeCodeForIdToken({ code, clientId, clientSecret, redirectUri });
    const user = await upsertGoogleUser(
      c.env,
      payload.sub,
      payload.email,
      payload.name ?? payload.email.split('@')[0] ?? 'Player',
    );
    const secret = c.env.JWT_SECRET ?? 'dev-only-insecure-secret';
    const jwt = await signJwt({ sub: user.id, handle: user.handle }, secret);
    const frontend = c.env.FRONTEND_URL ?? `${url.origin.replace(/8787$/, '5173')}`;
    const target = new URL(frontend);
    target.searchParams.set('jwt', jwt);
    target.searchParams.set('handle', user.handle);
    target.searchParams.set('uid', user.id);
    // state cookie をクリア
    c.header(
      'Set-Cookie',
      `${OAUTH_STATE_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`,
    );
    return c.redirect(target.toString(), 302);
  } catch (err) {
    console.error('google oauth failed:', err);
    return c.json(
      { error: { code: 'oauth_failed', message: err instanceof Error ? err.message : 'unknown' } },
      500,
    );
  }
});
