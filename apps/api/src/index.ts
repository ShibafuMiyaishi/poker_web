import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './env';
import { type AuthVariables, jwtMiddleware } from './middleware/auth';
import { authRouter } from './routes/auth';
import { handsRouter } from './routes/hands';
import { historyRouter } from './routes/history';
import { lobbyRouter } from './routes/lobby';
import { wsRouter } from './routes/ws';

export { TableDO } from './durable/TableDO';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// 開発時の CORS（apps/web の Vite dev server からの呼び出しを許可）。
// 本番で Pages 統合する場合は不要。
app.use(
  '/api/*',
  cors({
    origin: (origin) => origin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);

// 公開エンドポイント
app.get('/', (c) => c.text('Pokergo API'));
app.route('/api/auth', authRouter);

// JWT 保護エンドポイント
app.use('/api/me', jwtMiddleware);
app.use('/api/hands/*', jwtMiddleware);
app.use('/api/history/*', jwtMiddleware);
app.use('/api/lobby/*', jwtMiddleware);
app.use('/ws/*', jwtMiddleware);

app.get('/api/me', (c) => c.json({ user: c.get('user') }));
app.route('/api/hands', handsRouter);
app.route('/api/history', historyRouter);
app.route('/api/lobby', lobbyRouter);
app.route('/ws', wsRouter);

app.notFound((c) => c.json({ error: { code: 'not_found', message: c.req.path } }, 404));
app.onError((err, c) => {
  console.error('api error:', err);
  return c.json({ error: { code: 'internal', message: err.message } }, 500);
});

export default app;
