import { describe, expect, it } from 'vitest';
import { computeAdvancedEv } from './evAdvanced';

describe('computeAdvancedEv', () => {
  it('FD on flop: foldEquity が高いと bet が good', () => {
    const r = computeAdvancedEv({
      equityVsRange: 0.35,
      toCallBefore: 0,
      potBefore: 100,
      heroStack: 900,
      bb: 10,
      foldEquity: 0.5,
      handCategory: 'fd',
      street: 'flop',
      outs: { clean: 9, weak: 0, blockerAdjusted: 9, rule2equity: 36 },
    });
    expect(r.evBetBb).not.toBeNull();
    if (r.evBetBb !== null && r.evCheckBb !== null) {
      expect(r.evBetBb).toBeGreaterThan(r.evCheckBb);
    }
  });

  it('river エクイティ 0.18 で 80% pot コールは -EV', () => {
    const r = computeAdvancedEv({
      equityVsRange: 0.18,
      toCallBefore: 80,
      potBefore: 100,
      heroStack: 900,
      bb: 10,
      foldEquity: 0,
      handCategory: 'air',
      street: 'river',
      outs: null,
    });
    expect(r.bestAction).toBe('fold');
    if (r.evCallBb !== null) expect(r.evCallBb).toBeLessThan(0);
  });

  it('top-pair on flop: 推奨ベットサイズが pot の 50% 以上', () => {
    const r = computeAdvancedEv({
      equityVsRange: 0.7,
      toCallBefore: 0,
      potBefore: 100,
      heroStack: 900,
      bb: 10,
      foldEquity: 0.3,
      handCategory: 'top-pair',
      street: 'flop',
      outs: null,
    });
    expect(r.suggestedBetAmount).toBeGreaterThanOrEqual(50);
  });

  it('draw + outs: impliedOddsBonus が加算される', () => {
    const r = computeAdvancedEv({
      equityVsRange: 0.35,
      toCallBefore: 50,
      potBefore: 100,
      heroStack: 900,
      bb: 10,
      foldEquity: 0,
      handCategory: 'oesd',
      street: 'flop',
      outs: { clean: 8, weak: 0, blockerAdjusted: 8, rule2equity: 32 },
    });
    expect(r.impliedOddsBonusBb).toBeGreaterThan(0);
  });
});
