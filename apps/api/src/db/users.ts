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
// 並行 INSERT を防ぐため ON CONFLICT で原子的に処理し、最後に SELECT で確定行を返す。
export async function upsertGuestUser(env: Env, clientUuid: string): Promise<UserRow> {
  const googleSub = `${GUEST_SUB_PREFIX}${clientUuid}`;
  const now = Math.floor(Date.now() / 1000);
  const id = crypto.randomUUID();
  const handle = `Guest-${clientUuid.slice(0, 6)}`;
  const email = `${id}@guest.pokergo.local`;

  // INSERT OR IGNORE + UPDATE last_seen_at の代替として ON CONFLICT 利用。
  await env.DB.prepare(
    `INSERT INTO users (id, google_sub, email, handle, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(google_sub) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
  )
    .bind(id, googleSub, email, handle, now, now)
    .run();

  const row = await env.DB.prepare(
    'SELECT id, google_sub, email, handle, created_at, last_seen_at FROM users WHERE google_sub = ?',
  )
    .bind(googleSub)
    .first<UserRow>();
  if (!row) throw new Error('upsertGuestUser: insert succeeded but row not found');
  return row;
}

export async function findUserById(env: Env, id: string): Promise<UserRow | null> {
  return env.DB.prepare(
    'SELECT id, google_sub, email, handle, created_at, last_seen_at FROM users WHERE id = ?',
  )
    .bind(id)
    .first<UserRow>();
}

// Google OAuth sub (subject) で user を upsert。ON CONFLICT で並行安全に。
export async function upsertGoogleUser(
  env: Env,
  sub: string,
  email: string,
  name: string,
): Promise<UserRow> {
  const now = Math.floor(Date.now() / 1000);
  const id = crypto.randomUUID();
  const handle = name || email.split('@')[0] || `User-${id.slice(0, 6)}`;
  await env.DB.prepare(
    `INSERT INTO users (id, google_sub, email, handle, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(google_sub) DO UPDATE SET
         last_seen_at = excluded.last_seen_at,
         email = excluded.email,
         handle = excluded.handle`,
  )
    .bind(id, sub, email, handle, now, now)
    .run();
  const row = await env.DB.prepare(
    'SELECT id, google_sub, email, handle, created_at, last_seen_at FROM users WHERE google_sub = ?',
  )
    .bind(sub)
    .first<UserRow>();
  if (!row) throw new Error('upsertGoogleUser: insert succeeded but row not found');
  return row;
}
