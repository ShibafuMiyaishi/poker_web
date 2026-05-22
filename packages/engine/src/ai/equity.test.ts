import type { Card } from '@pokergo/shared';
import { describe, expect, test } from 'vitest';
import { seededRng } from '../game/deck';
import { equityVsRandom } from './equity';

describe('equityVsRandom', () => {
  test('AA はランダム 1 人相手に ~85% のエクイティを持つ（誤差 ±3%）', () => {
    const hero: [Card, Card] = ['As', 'Ah'];
    const equity = equityVsRandom(hero, [], 2000, seededRng(11));
    expect(equity).toBeGreaterThan(0.82);
    expect(equity).toBeLessThan(0.88);
  });

  test('72o は ~33% 程度（誤差 ±3%）', () => {
    const hero: [Card, Card] = ['7s', '2h'];
    const equity = equityVsRandom(hero, [], 2000, seededRng(22));
    expect(equity).toBeGreaterThan(0.28);
    expect(equity).toBeLessThan(0.38);
  });

  test('seed が同じなら同じ結果（決定性）', () => {
    const hero: [Card, Card] = ['Kd', 'Qh'];
    const a = equityVsRandom(hero, [], 500, seededRng(7));
    const b = equityVsRandom(hero, [], 500, seededRng(7));
    expect(a).toBe(b);
  });
});
