import { Hono } from 'hono';
import type { Env } from '../env';

// WebSocket upgrade を Durable Object へルーティングする。
// Phase 3 で TableDO 側の messageDispatcher が実装される。
export const wsRouter = new Hono<{ Bindings: Env }>();

wsRouter.get('/table/:tableId', async (c) => {
  if (c.req.header('Upgrade') !== 'websocket') {
    return c.text('Expected WebSocket upgrade', 400);
  }
  const tableId = c.req.param('tableId');
  const id = c.env.TABLE.idFromName(tableId);
  const stub = c.env.TABLE.get(id);
  return stub.fetch(c.req.raw);
});
