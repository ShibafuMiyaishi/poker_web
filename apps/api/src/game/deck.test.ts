import { describe, expect, test } from 'vitest';
import { cryptoRng, seededRng, shuffleDeck } from './deck';

describe('shuffleDeck', () => {
  test('52 枚のユニークなカードを返す', () => {
    const deck = shuffleDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck).size).toBe(52);
  });

  test('seededRng で決定的に同じ順序を再現する', () => {
    const d1 = shuffleDeck(seededRng(42));
    const d2 = shuffleDeck(seededRng(42));
    expect(d1).toEqual(d2);
  });

  test('異なるシードで異なる順序になる', () => {
    const d1 = shuffleDeck(seededRng(1));
    const d2 = shuffleDeck(seededRng(2));
    expect(d1).not.toEqual(d2);
  });

  test('cryptoRng は [0,1) を返す', () => {
    for (let i = 0; i < 100; i++) {
      const v = cryptoRng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
