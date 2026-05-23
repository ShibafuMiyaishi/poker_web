import { describe, expect, it } from 'vitest';
import { generateVerdict } from './verdict';

describe('generateVerdict', () => {
  it('AA preflop UTG open に対し fold は mistake', () => {
    const r = generateVerdict({
      taken: 'fold',
      bestAction: 'raise',
      deviationBb: 3.0,
      takenEvBb: 0,
      bestEvBb: 3.0,
      gtoMatch: false,
      handCategory: 'pair',
      equityPct: 85,
      equityVsRangePct: 85,
      requiredEquityPct: null,
      foldEquity: null,
      street: 'preflop',
      potBefore: 15,
      toCallBefore: 10,
      bb: 10,
      heroStack: 1000,
      outs: null,
      evBetBb: null,
      evRaiseBb: null,
      impliedOddsBonusBb: 0,
    });
    expect(r.verdict).toBe('mistake');
  });

  it('AKs UTG open raise は optimal', () => {
    const r = generateVerdict({
      taken: 'raise',
      bestAction: 'raise',
      deviationBb: null,
      takenEvBb: null,
      bestEvBb: 2.5,
      gtoMatch: true,
      handCategory: 'air',
      equityPct: 65,
      equityVsRangePct: 65,
      requiredEquityPct: null,
      foldEquity: 0.45,
      street: 'preflop',
      potBefore: 15,
      toCallBefore: 0,
      bb: 10,
      heroStack: 1000,
      outs: null,
      evBetBb: null,
      evRaiseBb: 2.5,
      impliedOddsBonusBb: 0,
    });
    expect(r.verdict === 'optimal' || r.verdict === 'good').toBe(true);
  });

  it('river エクイティ 18% で 80% pot コールは mistake', () => {
    const r = generateVerdict({
      taken: 'call',
      bestAction: 'fold',
      deviationBb: 5.0,
      takenEvBb: -5.0,
      bestEvBb: 0,
      gtoMatch: null,
      handCategory: 'air',
      equityPct: 18,
      equityVsRangePct: 18,
      requiredEquityPct: 31,
      foldEquity: null,
      street: 'river',
      potBefore: 100,
      toCallBefore: 80,
      bb: 10,
      heroStack: 200,
      outs: null,
      evBetBb: null,
      evRaiseBb: null,
      impliedOddsBonusBb: 0,
    });
    expect(r.verdict).toBe('mistake');
    expect(r.reasoning.length).toBeGreaterThan(0);
  });

  it('reasoning は最大 3 件', () => {
    const r = generateVerdict({
      taken: 'call',
      bestAction: 'call',
      deviationBb: 0.05,
      takenEvBb: 0.5,
      bestEvBb: 0.5,
      gtoMatch: true,
      handCategory: 'fd',
      equityPct: 40,
      equityVsRangePct: 40,
      requiredEquityPct: 25,
      foldEquity: null,
      street: 'flop',
      potBefore: 100,
      toCallBefore: 30,
      bb: 10,
      heroStack: 500,
      outs: { clean: 9, weak: 0, blockerAdjusted: 9, rule2equity: 36 },
      evBetBb: null,
      evRaiseBb: null,
      impliedOddsBonusBb: 0.8,
    });
    expect(r.reasoning.length).toBeLessThanOrEqual(3);
    expect(r.verdict === 'optimal' || r.verdict === 'good').toBe(true);
  });
});
