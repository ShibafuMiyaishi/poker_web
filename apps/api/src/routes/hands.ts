import type { HandAnalysis, HandPayload } from '@pokergo/engine';
import { Hono } from 'hono';
import { insertHand, isHandParticipant, updateActionAnalysis } from '../db/hands';
import type { Env } from '../env';
import type { AuthVariables } from '../middleware/auth';

export const handsRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// 完了ハンドを D1 へ永続化する。クライアントの handDriver.finishHand が呼ぶ。
// payload の user_id がリクエスト主と一致しないものはサーバ側で打ち消す（なりすまし防止）。
handsRouter.post('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: { code: 'unauthorized', message: 'user not found' } }, 401);
  }
  const raw = (await c.req.json().catch(() => null)) as Partial<HandPayload> | null;
  if (!raw || !raw.hand || !raw.players || !raw.actions) {
    return c.json({ error: { code: 'invalid_payload', message: 'hand payload required' } }, 400);
  }
  const payload: HandPayload = {
    hand: raw.hand,
    actions: raw.actions,
    // user_id を強制上書き（client から異なる id が来ても無視、CPU は NULL のまま）
    players: raw.players.map((p) => ({
      ...p,
      userId: p.userId !== null ? user.id : null,
    })),
  };
  try {
    await insertHand(c.env, payload);
    return c.json({ ok: true, handId: payload.hand.id });
  } catch (err) {
    return c.json(
      {
        error: { code: 'insert_failed', message: err instanceof Error ? err.message : 'db error' },
      },
      500,
    );
  }
});

// ハンド分析（Web Worker で算出した equity/EV/deviation/gtoMatch）を actions 行に書き戻す。
// handDriver.finishHand 後の analyzeHand.then で呼ばれる。
handsRouter.post('/:id/analysis', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: { code: 'unauthorized' } }, 401);
  const handId = c.req.param('id');
  if (!(await isHandParticipant(c.env, handId, user.id))) {
    return c.json({ error: { code: 'forbidden' } }, 403);
  }
  const raw = (await c.req.json().catch(() => null)) as Partial<HandAnalysis> | null;
  if (!raw || !raw.actions || typeof raw.yourSeat !== 'number') {
    return c.json(
      { error: { code: 'invalid_payload', message: 'analysis payload required' } },
      400,
    );
  }
  try {
    const result = await updateActionAnalysis(c.env, handId, raw.yourSeat, raw as HandAnalysis);
    return c.json({ ok: true, updated: result.updated });
  } catch (err) {
    return c.json(
      {
        error: { code: 'update_failed', message: err instanceof Error ? err.message : 'db error' },
      },
      500,
    );
  }
});
