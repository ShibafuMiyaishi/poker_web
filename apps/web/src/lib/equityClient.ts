import type { HandRange } from '@pokergo/engine';
import type { Card } from '@pokergo/shared';
import EquityWorker from '../workers/equity.worker?worker';

interface EquityResponse {
  id: number;
  equity: number;
}

const REQUEST_TIMEOUT_MS = 15000;

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<
  number,
  {
    resolve: (equity: number) => void;
    reject: (err: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();

function rejectAllPending(err: Error): void {
  for (const [, entry] of pending) {
    clearTimeout(entry.timer);
    entry.reject(err);
  }
  pending.clear();
}

function ensureWorker(): Worker {
  if (worker) return worker;
  const w = new EquityWorker();
  w.addEventListener('message', (event: MessageEvent<EquityResponse>) => {
    const entry = pending.get(event.data.id);
    if (!entry) return;
    pending.delete(event.data.id);
    clearTimeout(entry.timer);
    entry.resolve(event.data.equity);
  });
  w.addEventListener('error', (e) => {
    // Worker クラッシュ時は pending を全て reject し、次の呼び出しで Worker を再生成
    rejectAllPending(new Error(`equity worker error: ${e.message ?? 'unknown'}`));
    worker?.terminate();
    worker = null;
  });
  worker = w;
  return w;
}

function send<T extends Record<string, unknown>>(payload: T): Promise<number> {
  const w = ensureWorker();
  const id = nextId++;
  return new Promise<number>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`equity worker timeout (>${REQUEST_TIMEOUT_MS}ms)`));
    }, REQUEST_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });
    w.postMessage({ id, ...payload });
  });
}

export function computeEquity(
  hero: readonly [Card, Card],
  board: readonly Card[],
  iterations = 10000,
  numOpponents = 1,
): Promise<number> {
  return send({ hero, board: [...board], iterations, numOpponents });
}

export function computeEquityVsRange(
  hero: readonly [Card, Card],
  board: readonly Card[],
  range: HandRange,
  iterations = 500,
): Promise<number> {
  return send({ kind: 'range', hero, board: [...board], range, iterations });
}
