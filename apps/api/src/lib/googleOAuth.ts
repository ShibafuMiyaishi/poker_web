// Google OAuth 2.0 Authorization Code フロー。
// Owner が Cloud Console で OAuth クライアントを作成し、GOOGLE_CLIENT_ID/SECRET を
// wrangler secret put したら自動的に有効化される。FRONTEND_URL は env で切替。

export interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export function buildAuthorizeUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: opts.state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export async function exchangeCodeForIdToken(opts: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<GoogleIdTokenPayload> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: opts.code,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      redirect_uri: opts.redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`google token exchange failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error('google response missing id_token');
  return decodeIdTokenPayload(data.id_token);
}

// id_token は JWT。Google からの応答は HTTPS 経由なので署名検証は省略可
// （Authorization Code フローでは TLS で配送される）。payload のみデコードする。
function decodeIdTokenPayload(idToken: string): GoogleIdTokenPayload {
  const parts = idToken.split('.');
  if (parts.length < 2 || !parts[1]) throw new Error('invalid id_token format');
  const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const json = atob(b64 + pad);
  const decoded = JSON.parse(json) as GoogleIdTokenPayload;
  if (!decoded.sub || !decoded.email) throw new Error('id_token missing required fields');
  return decoded;
}

export function generateState(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}
