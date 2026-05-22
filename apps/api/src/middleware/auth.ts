import type { MiddlewareHandler } from 'hono';
import type { Env } from '../env';

// JWT 検証ミドルウェア。Phase 2 で HMAC-SHA256 検証と
// `users` テーブルからの hydration を実装する。
// 現状はパススルー（auth は無効）。
export const jwtMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (_c, next) => {
  await next();
};
