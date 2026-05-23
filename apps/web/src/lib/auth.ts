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

// API 通信失敗時のオフラインゲスト。client_uuid を ID 化し、卓ローカル機能だけ動かす。
function offlineGuest(): PokergoUser {
  const clientUuid = getOrCreateClientUuid();
  return {
    id: `offline-${clientUuid}`,
    handle: `Guest-${clientUuid.slice(0, 6)}`,
  };
}

// 3 秒タイムアウト付きのゲスト認証。API オフライン時は offlineGuest にフォールバック。
// 旧版は失敗で永久に「認証中…」スタックしていた問題を fail-open に。
export async function loginAsGuest(timeoutMs = 3000): Promise<PokergoUser> {
  const clientUuid = getOrCreateClientUuid();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/api/auth/guest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clientUuid }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`auth failed: ${res.status}`);
    const data = (await res.json()) as { token: string; user: PokergoUser };
    localStorage.setItem(JWT_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  } catch {
    clearTimeout(timer);
    // API オフライン: ローカル専用ゲストにフォールバック。JWT は保存しない。
    const guest = offlineGuest();
    localStorage.setItem(USER_KEY, JSON.stringify(guest));
    return guest;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(JWT_KEY);
  localStorage.removeItem(USER_KEY);
}

// Google OAuth 開始: API の /api/auth/google/start にリダイレクトする。
export function startGoogleLogin(): void {
  window.location.href = `${API_BASE}/api/auth/google/start`;
}

// ページロード時に ?jwt=... を消費して localStorage に保存し、URL を綺麗にする。
export function consumeJwtFromUrl(): PokergoUser | null {
  const params = new URLSearchParams(window.location.search);
  const jwt = params.get('jwt');
  const handle = params.get('handle');
  const uid = params.get('uid');
  if (!jwt || !handle || !uid) return null;
  localStorage.setItem(JWT_KEY, jwt);
  const user: PokergoUser = { id: uid, handle };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  params.delete('jwt');
  params.delete('handle');
  params.delete('uid');
  const cleaned = params.toString();
  const newUrl = window.location.pathname + (cleaned ? `?${cleaned}` : '');
  window.history.replaceState({}, '', newUrl);
  return user;
}

export { API_BASE };
