/// <reference lib="webworker" />
/// <reference path="../types/pokersolver.d.ts" />
import { equityVsRandom } from '@pokergo/engine';
import type { Card } from '@pokergo/shared';

interface EquityRequest {
  id: number;
  hero: [Card, Card];
  board: Card[];
  iterations: number;
}

interface EquityResponse {
  id: number;
  equity: number;
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener('message', (event: MessageEvent<EquityRequest>) => {
  const { id, hero, board, iterations } = event.data;
  const equity = equityVsRandom(hero, board, iterations);
  ctx.postMessage({ id, equity } satisfies EquityResponse);
});
