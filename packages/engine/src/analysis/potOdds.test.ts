import { describe, expect, test } from 'vitest';
import { computeRequiredEquity, evaluatePotOdds } from './potOdds';

describe('computeRequiredEquity', () => {
  test('pot 10 に対し call 10 → 10/30 ≈ 0.333', () => {
    expect(computeRequiredEquity(10, 10)).toBeCloseTo(1 / 3, 4);
  });

  test('pot 100 に対し call 20 → 20/140 ≈ 0.143', () => {
    expect(computeRequiredEquity(20, 100)).toBeCloseTo(20 / 140, 4);
  });

  test('callAmount = 0 は 0 を返す', () => {
    expect(computeRequiredEquity(0, 100)).toBe(0);
  });
});

describe('evaluatePotOdds', () => {
  test('equity > 必要勝率 なら +EV', () => {
    const r = evaluatePotOdds(0.5, 10, 10);
    expect(r.isPlusEv).toBe(true);
    expect(r.requiredEquity).toBeCloseTo(1 / 3, 4);
  });

  test('equity < 必要勝率 なら -EV', () => {
    const r = evaluatePotOdds(0.2, 10, 10);
    expect(r.isPlusEv).toBe(false);
  });
});
