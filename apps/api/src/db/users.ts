import type { Env } from '../env';

export interface UserRow {
  id: string;
  google_sub: string;
  email: string;
  handle: string;
  created_at: number;
  last_seen_at: number;
}

const GUEST_SUB_PREFIX = 'guest-';

// クライアント生成 uuid からゲストユーザーを upsert する。
// google_sub = 'guest-' + clientUuid で他の OAuth ユーザーと衝突しない。
export async function upsertGuestUser(env: Env, clientUuid: string): Promise<UserRow> {
  const googleSub = `${GUEST_SUB_PREFIX}${clientUuid}`;
  const now = Math.floor(Date.now() / 1000);

  const existing = await env.DB.prepare(
    'SELECT id, google_sub, email, handle, created_at, last_seen_at FROM users WHERE google_sub = ?',
  )
    .bind(googleSub)
    .first<UserRow>();

  if (existing) {
    await env.DB.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?')
      .bind(now, existing.id)
      .run();
    return { ...existing, last_seen_at: now };
  }

  const id = crypto.randomUUID();
  const handle = `Guest-${clientUuid.slice(0, 6)}`;
  const email = `${id}@guest.pokergo.local`;
  await env.DB.prepare(
    'INSERT INTO users (id, google_sub, email, handle, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, googleSub, email, handle, now, now)
    .run();
  return { id, google_sub: googleSub, email, handle, created_at: now, last_seen_at: now };
}

export async function findUserById(env: Env, id: string): Promise<UserRow | null> {
  return env.DB.prepare(
    'SELECT id, google_sub, email, handle, created_at, last_seen_at FROM users WHERE id = ?',
  )
    .bind(id)
    .first<UserRow>();
}
