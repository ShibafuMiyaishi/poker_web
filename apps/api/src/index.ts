import { Hono } from 'hono';
import type { Env } from './env';
import { lobbyRouter } from './routes/lobby';
import { wsRouter } from './routes/ws';

export { TableDO } from './durable/TableDO';

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.text('Pokergo API: scaffold (Phase 2/3 で本実装)'));
app.get('/api/me', (c) =>
  c.json({ error: { code: 'not_implemented', message: 'Phase 2 で実装' } }, 501),
);
app.route('/api/lobby', lobbyRouter);
app.route('/ws', wsRouter);

app.notFound((c) => c.json({ error: { code: 'not_found', message: c.req.path } }, 404));
app.onError((err, c) => {
  console.error('api error:', err);
  return c.json({ error: { code: 'internal', message: err.message } }, 500);
});

export default app;
