import { describe, expect, test } from 'vitest';
import { computeRequiredEquity, evaluatePotOdds } from './potOdds';

describe('computeRequiredEquity', () => {
  test('pot 10 に対し call 10 → 10/20 = 0.5 (breakeven)', () => {
    expect(computeRequiredEquity(10, 10)).toBeCloseTo(0.5, 4);
  });

  test('pot 100 に対し call 20 → 20/120 ≈ 0.167', () => {
    expect(computeRequiredEquity(20, 100)).toBeCloseTo(20 / 120, 4);
  });

  test('pot 100 に対し call 50 → 50/150 ≈ 0.333 (1/3)', () => {
    expect(computeRequiredEquity(50, 100)).toBeCloseTo(1 / 3, 4);
  });

  test('callAmount = 0 は 0 を返す', () => {
    expect(computeRequiredEquity(0, 100)).toBe(0);
  });
});

describe('evaluatePotOdds', () => {
  test('equity = 必要勝率 なら +EV ではない (境界)', () => {
    const r = evaluatePotOdds(0.5, 10, 10);
    expect(r.requiredEquity).toBeCloseTo(0.5, 4);
    expect(r.isPlusEv).toBe(false); // 等しい時は厳格に判定
  });

  test('equity > 必要勝率 なら +EV', () => {
    const r = evaluatePotOdds(0.6, 10, 10);
    expect(r.isPlusEv).toBe(true);
  });

  test('equity < 必要勝率 なら -EV', () => {
    const r = evaluatePotOdds(0.2, 10, 10);
    expect(r.isPlusEv).toBe(false);
  });
});
