import { describe, expect, test } from 'vitest';
import { compareEv, evCall, evCheck, evFold } from './ev';

describe('evFold/evCall/evCheck', () => {
  test('evFold = 0', () => {
    expect(evFold()).toBe(0);
  });

  test('equity 0.5, call 10, pot 10 → 0.5*10 - 0.5*10 = 0 (breakeven)', () => {
    expect(evCall(0.5, 10, 10)).toBe(0);
  });

  test('equity 0, call 10, pot 10 → -10 (純損)', () => {
    expect(evCall(0, 10, 10)).toBe(-10);
  });

  test('equity 1.0, call 10, pot 10 → +10 (確実勝利でポットを取る)', () => {
    expect(evCall(1, 10, 10)).toBe(10);
  });

  test('evCheck は equity * pot', () => {
    expect(evCheck(0.5, 100)).toBe(50);
  });
});

describe('compareEv', () => {
  test('toCall > 0 で equity 高 → bestAction=call、deviation 0 (採用も call)', () => {
    const d = compareEv('call', 0.6, 10, 10, 10);
    expect(d.bestAction).toBe('call');
    expect(d.deviationBb).toBe(0);
  });

  test('採用 fold だが call が +EV → bestAction=call で deviation > 0', () => {
    const d = compareEv('fold', 0.6, 10, 10, 10);
    expect(d.bestAction).toBe('call');
    expect(d.deviationBb).toBeGreaterThan(0);
  });

  test('採用 call だが equity 低 → bestAction=fold で deviation > 0', () => {
    const d = compareEv('call', 0.1, 10, 10, 10);
    expect(d.bestAction).toBe('fold');
    expect(d.deviationBb).toBeGreaterThan(0);
  });

  test('toCall = 0 のときは check (bestAction) を返す', () => {
    const d = compareEv('check', 0.5, 0, 100, 10);
    expect(d.bestAction).toBe('check');
  });
});
