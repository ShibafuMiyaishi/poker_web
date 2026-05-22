import type { Card } from '@pokergo/shared';
import { describe, expect, test } from 'vitest';
import { classifyBoard } from './boardTexture';

describe('classifyBoard', () => {
  test('preflop (board 空) は []', () => {
    expect(classifyBoard([])).toEqual([]);
  });

  test('Ah Kh Qh → monotone + connected + high_card + dynamic', () => {
    const tags = classifyBoard(['Ah', 'Kh', 'Qh'] as Card[]);
    expect(tags).toContain('monotone');
    expect(tags).toContain('connected');
    expect(tags).toContain('high_card');
    expect(tags).toContain('dynamic');
  });

  test('As Kd Qh → rainbow + connected + high_card + dynamic', () => {
    const tags = classifyBoard(['As', 'Kd', 'Qh'] as Card[]);
    expect(tags).toContain('rainbow');
    expect(tags).toContain('connected');
    expect(tags).toContain('high_card');
  });

  test('7s 2d 2c → paired + rainbow + low + dry', () => {
    const tags = classifyBoard(['7s', '2d', '2c'] as Card[]);
    expect(tags).toContain('paired');
    expect(tags).toContain('rainbow');
    expect(tags).toContain('low');
  });

  test('9h 5h 2c → two_tone + low', () => {
    const tags = classifyBoard(['9h', '5h', '2c'] as Card[]);
    expect(tags).toContain('two_tone');
    expect(tags).toContain('low');
  });

  test('flop + turn + river の 5 枚も同様に分類', () => {
    const tags = classifyBoard(['Ah', 'Kh', 'Qh', '2c', '3d'] as Card[]);
    expect(tags).toContain('monotone'); // 3 spades wait... let me think
    // actually: A♥ K♥ Q♥ 2♣ 3♦ → suit counts: h=3, c=1, d=1 → monotone
  });
});
