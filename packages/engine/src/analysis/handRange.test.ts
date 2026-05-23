import { describe, expect, it } from 'vitest';
import {
  combosForHand,
  countCombos,
  createRange,
  intersectRanges,
  sampleFromRange,
  uniformRange,
} from './handRange';

describe('handRange', () => {
  it('combosForHand: ペアは 6 通り', () => {
    expect(combosForHand('AA')).toHaveLength(6);
  });
  it('combosForHand: suited は 4 通り', () => {
    expect(combosForHand('AKs')).toHaveLength(4);
  });
  it('combosForHand: offsuit は 12 通り', () => {
    expect(combosForHand('AKo')).toHaveLength(12);
  });

  it('uniformRange は 169 全ハンドに 1 を設定', () => {
    const r = uniformRange(1);
    expect(Object.keys(r).length).toBe(169);
    expect(r.AA).toBe(1);
    expect(r['2c'] ?? r['72o']).toBeDefined();
  });

  it('createRange は未指定キーを 0 にする', () => {
    const r = createRange({ AA: 1, KK: 0.5 });
    expect(r.AA).toBe(1);
    expect(r.KK).toBe(0.5);
    expect(r['72o']).toBe(0);
  });

  it('intersectRanges は min を取る', () => {
    const a = createRange({ AA: 1, KK: 0.5 });
    const b = createRange({ AA: 0.3, KK: 0.8 });
    const c = intersectRanges(a, b);
    expect(c.AA).toBe(0.3);
    expect(c.KK).toBe(0.5);
  });

  it('countCombos: uniform で全 1326 コンボ', () => {
    const r = uniformRange(1);
    expect(countCombos(r, [])).toBe(1326);
  });

  it('countCombos: AA だけのレンジは 6 コンボ', () => {
    const r = createRange({ AA: 1 });
    expect(countCombos(r, [])).toBe(6);
  });

  it('countCombos: deadCards で減る', () => {
    const r = createRange({ AA: 1 });
    expect(countCombos(r, ['As'])).toBe(3); // As を含む 3 コンボが除外
  });

  it('sampleFromRange: deadCards のカードを含まない', () => {
    const r = createRange({ AA: 1 });
    const rng = () => 0.5;
    const combo = sampleFromRange(r, ['As', 'Ah'], rng);
    expect(combo).not.toBeNull();
    if (combo) {
      expect(combo[0]).not.toBe('As');
      expect(combo[0]).not.toBe('Ah');
      expect(combo[1]).not.toBe('As');
      expect(combo[1]).not.toBe('Ah');
    }
  });

  it('sampleFromRange: 空レンジは null', () => {
    const r = createRange({});
    expect(sampleFromRange(r, [], Math.random)).toBeNull();
  });
});
