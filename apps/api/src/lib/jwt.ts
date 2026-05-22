// HMAC-SHA256 JWT。Web Crypto API のみ使用（Workers + Node 20+ 双方で動作）。
// Phase 2 ではゲストユーザー用、Phase 3 で Google OAuth と統合予定。

const enc = new TextEncoder();
const dec = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  );
}

export interface JwtPayload {
  sub: string; // user id
  handle: string;
  iat: number; // seconds epoch
  exp: number; // seconds epoch
}

export async function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secret: string,
  ttlSec = 60 * 60 * 24 * 7,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const full: JwtPayload = { ...payload, iat: now, exp: now + ttlSec };
  const header = { alg: 'HS256', typ: 'JWT' };
  const encHeader = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const encPayload = base64UrlEncode(enc.encode(JSON.stringify(full)));
  const data = `${encHeader}.${encPayload}`;
  const key = await importKey(secret, 'sign');
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return `${data}.${base64UrlEncode(new Uint8Array(sig))}`;
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encHeader, encPayload, encSig] = parts;
  if (!encHeader || !encPayload || !encSig) return null;
  const data = `${encHeader}.${encPayload}`;
  const key = await importKey(secret, 'verify');
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecode(encSig).buffer as ArrayBuffer,
    enc.encode(data),
  );
  if (!valid) return null;
  let payload: JwtPayload;
  try {
    payload = JSON.parse(dec.decode(base64UrlDecode(encPayload)));
  } catch {
    return null;
  }
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
