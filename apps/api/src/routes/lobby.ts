import { Hono } from 'hono';
import type { Env } from '../env';

// MVP は 1 卓固定（仕様 F-L-01）。Phase 2 で着席リクエストを実装。
export const lobbyRouter = new Hono<{ Bindings: Env }>();

lobbyRouter.get('/', (c) => {
  return c.json({
    tables: [
      {
        id: 'main',
        name: 'Pokergo Main',
        sb: 5,
        bb: 10,
        maxSeats: 8,
      },
    ],
  });
});

lobbyRouter.post('/:tableId/sit', (c) => {
  return c.json({ error: { code: 'not_implemented', message: 'Phase 2 で実装' } }, 501);
});

lobbyRouter.post('/:tableId/leave', (c) => {
  return c.json({ error: { code: 'not_implemented', message: 'Phase 2 で実装' } }, 501);
});
