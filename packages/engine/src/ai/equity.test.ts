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

  test('multiway: 3 opponents 相手だと 1 人相手より equity が下がる', () => {
    const hero: [Card, Card] = ['As', 'Ah'];
    const e1 = equityVsRandom(hero, [], 1000, seededRng(33), 1);
    const e3 = equityVsRandom(hero, [], 1000, seededRng(33), 3);
    expect(e3).toBeLessThan(e1);
    // AA vs 3 random は 60-65% 程度
    expect(e3).toBeGreaterThan(0.55);
    expect(e3).toBeLessThan(0.75);
  });

  test('board 5 枚 (river) でも動作する', () => {
    const hero: [Card, Card] = ['As', 'Ah'];
    const board: Card[] = ['Kc', 'Qd', 'Js', '2h', '3c'];
    const equity = equityVsRandom(hero, board, 500, seededRng(5));
    expect(equity).toBeGreaterThan(0);
    expect(equity).toBeLessThanOrEqual(1);
  });
});
