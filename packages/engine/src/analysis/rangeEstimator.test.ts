import type { Card, Seat } from '@pokergo/shared';
import { describe, expect, it } from 'vitest';
import type { ActionEntry, HandPlayer, HandState } from '../game/types';
import { allHandKeys } from './handRange';
import { estimateVillainRange } from './rangeEstimator';

function makeState(opts: {
  buttonSeat: Seat;
  playerSeats: Seat[];
  villainHole: [Card, Card];
  board: Card[];
  actions: Omit<ActionEntry, 'amount' | 'potBefore' | 'toCallBefore'>[];
}): HandState {
  const players = new Map<Seat, HandPlayer>();
  for (const s of opts.playerSeats) {
    players.set(s, {
      seat: s,
      startStack: 1000,
      stack: 1000,
      holeCards: opts.villainHole,
      status: 'active',
      contribution: 0,
      currentBet: 0,
      hasActedSinceLastRaise: false,
    });
  }
  return {
    handId: 'h1',
    street: 'flop',
    board: opts.board,
    players,
    buttonSeat: opts.buttonSeat,
    sb: 5,
    bb: 10,
    pot: 0,
    currentBet: 0,
    minRaise: 10,
    lastRaiser: null,
    toAct: null,
    deck: [],
    actions: opts.actions.map((a) => ({ ...a, amount: 10, potBefore: 15, toCallBefore: 10 })),
  };
}

describe('estimateVillainRange', () => {
  it('UTG open raise → 強いハンドに weight が偏る', () => {
    // BTN=0, SB=1, BB=2, UTG=3
    const state = makeState({
      buttonSeat: 0,
      playerSeats: [0, 1, 2, 3],
      villainHole: ['As', 'Ks'],
      board: [],
      actions: [{ seat: 3, street: 'preflop', type: 'raise' }],
    });
    const range = estimateVillainRange(state, 3, []);
    expect(range.AA).toBeGreaterThan(0.9);
    expect(range.KK).toBeGreaterThan(0.9);
    expect(range['72o']).toBe(0);
  });

  it('BTN open raise → UTG open より広い', () => {
    // 4 人席: BTN=0, SB=1, BB=2, UTG=3
    const utgState = makeState({
      buttonSeat: 0,
      playerSeats: [0, 1, 2, 3],
      villainHole: ['As', 'Ks'],
      board: [],
      actions: [{ seat: 3, street: 'preflop', type: 'raise' }],
    });
    const btnState = makeState({
      buttonSeat: 0,
      playerSeats: [0, 1, 2, 3],
      villainHole: ['As', 'Ks'],
      board: [],
      actions: [{ seat: 0, street: 'preflop', type: 'raise' }],
    });
    const utgRange = estimateVillainRange(utgState, 3, []);
    const btnRange = estimateVillainRange(btnState, 0, []);
    const utgCombos = allHandKeys().reduce((sum, k) => sum + (utgRange[k] ?? 0), 0);
    const btnCombos = allHandKeys().reduce((sum, k) => sum + (btnRange[k] ?? 0), 0);
    expect(btnCombos).toBeGreaterThan(utgCombos);
  });

  it('履歴がない場合は uniform(0.3) フォールバック', () => {
    const state = makeState({
      buttonSeat: 0,
      playerSeats: [0, 1],
      villainHole: ['As', 'Ks'],
      board: [],
      actions: [],
    });
    const range = estimateVillainRange(state, 1, []);
    expect(range.AA).toBeCloseTo(0.3, 1);
    expect(range['72o']).toBeCloseTo(0.3, 1);
  });
});
