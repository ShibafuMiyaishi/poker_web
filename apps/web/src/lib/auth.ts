// ゲストモード認証クライアント。
// 1. localStorage から client_uuid を取得（無ければ新規生成）
// 2. POST /api/auth/guest で JWT 取得
// 3. JWT を localStorage 保存し、以後 Authorization: Bearer で送る

const CLIENT_UUID_KEY = 'pokergo_client_uuid';
const JWT_KEY = 'pokergo_jwt';
const USER_KEY = 'pokergo_user';

export interface PokergoUser {
  id: string;
  handle: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';

function getOrCreateClientUuid(): string {
  let uuid = localStorage.getItem(CLIENT_UUID_KEY);
  if (!uuid) {
    uuid = crypto.randomUUID();
    localStorage.setItem(CLIENT_UUID_KEY, uuid);
  }
  return uuid;
}

export function getStoredJwt(): string | null {
  return localStorage.getItem(JWT_KEY);
}

export function getStoredUser(): PokergoUser | null {
  const s = localStorage.getItem(USER_KEY);
  if (!s) return null;
  try {
    return JSON.parse(s) as PokergoUser;
  } catch {
    return null;
  }
}

export async function loginAsGuest(): Promise<PokergoUser> {
  const clientUuid = getOrCreateClientUuid();
  const res = await fetch(`${API_BASE}/api/auth/guest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ clientUuid }),
  });
  if (!res.ok) throw new Error(`auth failed: ${res.status}`);
  const data = (await res.json()) as { token: string; user: PokergoUser };
  localStorage.setItem(JWT_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export function clearAuth(): void {
  localStorage.removeItem(JWT_KEY);
  localStorage.removeItem(USER_KEY);
}

export { API_BASE };
