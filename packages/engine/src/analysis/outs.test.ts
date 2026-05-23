import { describe, expect, it } from 'vitest';
import { uniformRange } from './handRange';
import { countOuts } from './outs';

describe('countOuts', () => {
  const range = uniformRange(0.3);

  it('フロップ: フラッシュドロー 9 outs', () => {
    // hero AsKs, board 7s 2s 9h
    // 残りスペード 9 枚で flush 完成
    const breakdown = countOuts(['As', 'Ks'], ['7s', '2s', '9h'], range, []);
    expect(breakdown.clean).toBeGreaterThanOrEqual(9);
    expect(breakdown.rule2equity).toBeGreaterThanOrEqual(36);
  });

  it('フロップ: OESD 8 outs', () => {
    // hero 9h 8s, board Th 7c 2d → 6 or J で straight
    const breakdown = countOuts(['9h', '8s'], ['Th', '7c', '2d'], range, []);
    // OESD だけなら 8 outs だが、pair 系の改善も clean に含まれるので >= 8
    expect(breakdown.clean).toBeGreaterThanOrEqual(8);
  });

  it('ターン: outs * 2 で rule of 2 適用', () => {
    const breakdown = countOuts(['As', 'Ks'], ['7s', '2s', '9h', '4d'], range, []);
    expect(breakdown.rule2equity).toBeCloseTo(breakdown.clean * 2, 0);
  });

  it('プリフロップ board は空配列を返す', () => {
    const breakdown = countOuts(['As', 'Ks'], [], range, []);
    expect(breakdown.clean).toBe(0);
  });
});
