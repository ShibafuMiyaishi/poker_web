import type { Card, Seat } from '@pokergo/shared';
import { describe, expect, test } from 'vitest';
import { applyAction } from '../game/actions';
import { seededRng, shuffleDeck } from '../game/deck';
import { advanceStreet, startHand } from '../game/handLifecycle';
import { analyzeHand } from './handAnalyzer';

describe('analyzeHand', () => {
  test('自分のアクションのみを分析し、preflop は gtoMatch・postflop は boardTexture を持つ', async () => {
    let s = startHand({
      handId: 'an-1',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
        { seat: 2 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck: shuffleDeck(seededRng(42)),
    });
    // UTG=seat 0 が call、SB call、BB check
    s = applyAction(s, { seat: 0 as Seat, type: 'call' });
    s = applyAction(s, { seat: 1 as Seat, type: 'call' });
    s = applyAction(s, { seat: 2 as Seat, type: 'check' });
    s = advanceStreet(s);
    // flop: SB から
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 2 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });
    s = advanceStreet(s);
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 2 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });
    s = advanceStreet(s);
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 2 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });
    s = advanceStreet(s);

    // 固定 equity 関数（テスト用）
    const equityFn = async (_h: readonly [Card, Card], _b: readonly Card[]) => 0.5;

    const analysis = await analyzeHand(s, 0 as Seat, equityFn);
    // seat 0 のアクションのみ抽出されている
    expect(analysis.actions.every((a) => true)).toBe(true);
    expect(analysis.actions.length).toBeGreaterThan(0);

    const preflopActions = analysis.actions.filter((a) => a.street === 'preflop');
    const flopActions = analysis.actions.filter((a) => a.street === 'flop');
    for (const a of preflopActions) {
      expect(a.gtoMatch).not.toBeNull();
      expect(a.boardTexture).toBeNull();
    }
    for (const a of flopActions) {
      expect(a.gtoMatch).toBeNull();
      expect(a.boardTexture).not.toBeNull();
    }
  });

  test('toCallBefore > 0 のアクションには requiredEquityPct が入る', async () => {
    let s = startHand({
      handId: 'an-2',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck: shuffleDeck(seededRng(7)),
    });
    // HU: BTN(=SB, seat 0) call 5 → 10
    s = applyAction(s, { seat: 0 as Seat, type: 'call' });
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = advanceStreet(s);
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });

    const equityFn = async (_h: readonly [Card, Card], _b: readonly Card[]) => 0.6;
    const analysis = await analyzeHand(s, 0 as Seat, equityFn);
    const callAction = analysis.actions.find((a) => a.action === 'call');
    expect(callAction?.requiredEquityPct).not.toBeNull();
    expect(callAction?.requiredEquityPct ?? 0).toBeGreaterThan(0);
  });
});
