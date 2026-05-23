import type { HandRange } from '@pokergo/engine';
import type { Card } from '@pokergo/shared';
import EquityWorker from '../workers/equity.worker?worker';

interface EquityResponse {
  id: number;
  equity: number;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, (equity: number) => void>();

function ensureWorker(): Worker {
  if (worker) return worker;
  const w = new EquityWorker();
  w.addEventListener('message', (event: MessageEvent<EquityResponse>) => {
    const cb = pending.get(event.data.id);
    if (!cb) return;
    pending.delete(event.data.id);
    cb(event.data.equity);
  });
  worker = w;
  return w;
}

export function computeEquity(
  hero: readonly [Card, Card],
  board: readonly Card[],
  iterations = 10000,
  numOpponents = 1,
): Promise<number> {
  const w = ensureWorker();
  const id = nextId++;
  return new Promise<number>((resolve) => {
    pending.set(id, resolve);
    w.postMessage({ id, hero, board: [...board], iterations, numOpponents });
  });
}

export function computeEquityVsRange(
  hero: readonly [Card, Card],
  board: readonly Card[],
  range: HandRange,
  iterations = 500,
): Promise<number> {
  const w = ensureWorker();
  const id = nextId++;
  return new Promise<number>((resolve) => {
    pending.set(id, resolve);
    w.postMessage({ id, kind: 'range', hero, board: [...board], range, iterations });
  });
}
