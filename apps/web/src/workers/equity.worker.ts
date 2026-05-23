/// <reference lib="webworker" />
/// <reference path="../types/pokersolver.d.ts" />
import { equityVsRandom, equityVsRange } from '@pokergo/engine';
import type { HandRange } from '@pokergo/engine';
import type { Card } from '@pokergo/shared';

interface RandomReq {
  id: number;
  kind?: 'random';
  hero: [Card, Card];
  board: Card[];
  iterations: number;
  numOpponents?: number;
}
interface RangeReq {
  id: number;
  kind: 'range';
  hero: [Card, Card];
  board: Card[];
  iterations: number;
  range: HandRange;
}
type EquityRequest = RandomReq | RangeReq;

interface EquityResponse {
  id: number;
  equity: number;
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener('message', (event: MessageEvent<EquityRequest>) => {
  const req = event.data;
  let equity: number;
  if (req.kind === 'range') {
    equity = equityVsRange(req.hero, req.board, req.range, req.iterations);
  } else {
    equity = equityVsRandom(req.hero, req.board, req.iterations, undefined, req.numOpponents ?? 1);
  }
  ctx.postMessage({ id: req.id, equity } satisfies EquityResponse);
});
