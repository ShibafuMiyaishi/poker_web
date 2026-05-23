import type { Env } from '../env';

// ENVIRONMENT が 'development' (wrangler dev) のときのみ dev フォールバックを許可する。
// 本番では JWT_SECRET 未設定なら即座に例外を投げ、不正な署名で API が動作するのを防ぐ。
const DEV_FALLBACK = 'dev-only-insecure-secret-DO-NOT-USE-IN-PROD';

export function requireJwtSecret(env: Env): string {
  if (env.JWT_SECRET) return env.JWT_SECRET;
  // wrangler dev は ENVIRONMENT を 'development' に設定する慣習。
  // 環境変数が無い場合はエラーで止める。
  const isDev = (env as unknown as { ENVIRONMENT?: string }).ENVIRONMENT === 'development';
  if (isDev) return DEV_FALLBACK;
  throw new Error('JWT_SECRET is not configured. Run `wrangler secret put JWT_SECRET`.');
}
