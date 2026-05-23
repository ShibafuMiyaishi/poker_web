import type { Card, Seat } from '@pokergo/shared';
import { describe, expect, it } from 'vitest';
import { equityVsRandom, equityVsRange } from '../ai/equity';
import type { ActionEntry, HandPlayer, HandState } from '../game/types';
import { analyzeHand } from './handAnalyzer';
import { uniformRange } from './handRange';

function makeState(
  actions: Omit<ActionEntry, 'amount' | 'potBefore' | 'toCallBefore'>[],
): HandState {
  const players = new Map<Seat, HandPlayer>();
  for (const s of [0, 1, 2, 3] as Seat[]) {
    players.set(s, {
      seat: s,
      startStack: 1000,
      stack: 1000,
      holeCards: s === 0 ? ['As', 'Kh'] : ['9c', '9d'],
      status: 'active',
      contribution: 0,
      currentBet: 0,
      hasActedSinceLastRaise: false,
    });
  }
  return {
    handId: 'h1',
    street: 'showdown',
    board: ['Ad', '7c', '2s', '5h', '3d'] as Card[],
    players,
    buttonSeat: 0,
    sb: 5,
    bb: 10,
    pot: 100,
    currentBet: 0,
    minRaise: 10,
    lastRaiser: null,
    toAct: null,
    deck: [],
    actions: actions.map((a) => ({ ...a, amount: 20, potBefore: 30, toCallBefore: 10 })),
  };
}

describe('performance', () => {
  it('1 ハンド分析が 500ms 以内 (range fn 注入)', async () => {
    // 簡単な 1 ハンド: hero が UTG raise / flop bet / turn call
    const state = makeState([
      { seat: 1, street: 'preflop', type: 'call' },
      { seat: 0, street: 'preflop', type: 'raise' },
      { seat: 1, street: 'preflop', type: 'call' },
      { seat: 1, street: 'flop', type: 'check' },
      { seat: 0, street: 'flop', type: 'bet' },
      { seat: 1, street: 'flop', type: 'call' },
      { seat: 1, street: 'turn', type: 'check' },
      { seat: 0, street: 'turn', type: 'check' },
    ]);
    const t0 = performance.now();
    const a = await analyzeHand(
      state,
      0,
      (h, b, n) => Promise.resolve(equityVsRandom(h, b, 300, undefined, n)),
      (h, b, r) => Promise.resolve(equityVsRange(h, b, r, 200)),
    );
    const elapsed = performance.now() - t0;
    expect(a.actions.length).toBeGreaterThan(0);
    // 100ms 目標だが CI noise を考慮して 500ms 上限
    expect(elapsed).toBeLessThan(500);
  });

  it('equityVsRange は 200 iter で 200ms 以内', () => {
    const range = uniformRange(0.4);
    const t0 = performance.now();
    equityVsRange(['As', 'Kh'], ['Ad', '7c', '2s'] as Card[], range, 200);
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(200);
  });
});
