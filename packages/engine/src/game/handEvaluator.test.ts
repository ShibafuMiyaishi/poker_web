import { describe, expect, test } from 'vitest';
import { compareHands, evaluateHand } from './handEvaluator';

describe('evaluateHand', () => {
  test('4 カードを判定できる', () => {
    const result = evaluateHand(['As', 'Ah', 'Ad', 'Ac', 'Ks', 'Qd', 'Jc']);
    expect(result.name).toBe('Four of a Kind');
  });

  test('5 枚未満は例外', () => {
    expect(() => evaluateHand(['As', 'Ah'])).toThrow();
  });

  test('8 枚以上は例外', () => {
    expect(() => evaluateHand(['As', 'Ah', 'Ad', 'Ac', 'Ks', 'Qd', 'Jc', 'Th'])).toThrow();
  });
});

describe('compareHands - 仕様 §8 必須ケース', () => {
  test('ストレートフラッシュがクアッズに勝つ', () => {
    const quads: import('@pokergo/shared').Card[] = ['As', 'Ah', 'Ad', 'Ac', 'Ks', 'Qd', 'Jc'];
    const straightFlush: import('@pokergo/shared').Card[] = [
      '9h',
      '8h',
      '7h',
      '6h',
      '5h',
      'Ad',
      'Kc',
    ];
    const winners = compareHands([quads, straightFlush]);
    expect(winners).toEqual([1]);
  });

  test('スプリットポット: 同役・同ケッカーで両者勝者', () => {
    // 共通ボード As Ks Qd Jh 2c に対して
    // P1: Ah Kh / P2: Ad Kc → 両者 AA-KK ツーペア + Q キッカーで引き分け
    const p1: import('@pokergo/shared').Card[] = ['Ah', 'Kh', 'As', 'Ks', 'Qd', 'Jh', '2c'];
    const p2: import('@pokergo/shared').Card[] = ['Ad', 'Kc', 'As', 'Ks', 'Qd', 'Jh', '2c'];
    const winners = compareHands([p1, p2]);
    expect(winners).toEqual([0, 1]);
  });

  test('ケッカー比較: 同役なら高いケッカーが勝つ', () => {
    // 両者ワンペア K、P1 のキッカーは A、P2 は Q → P1 勝ち
    const p1: import('@pokergo/shared').Card[] = ['Ks', 'Kh', 'As', 'Qd', '9c', '7h', '3s'];
    const p2: import('@pokergo/shared').Card[] = ['Kc', 'Kd', 'Qs', 'Jh', '9d', '7c', '4s'];
    const winners = compareHands([p1, p2]);
    expect(winners).toEqual([0]);
  });

  test('compareHands も 5 枚未満は例外', () => {
    expect(() =>
      compareHands([
        ['As', 'Ah'],
        ['Kd', 'Kh'],
      ]),
    ).toThrow();
  });

  test('compareHands も 8 枚以上は例外', () => {
    const tooMany: import('@pokergo/shared').Card[] = [
      'As',
      'Ah',
      'Ad',
      'Ac',
      'Ks',
      'Qd',
      'Jc',
      'Th',
    ];
    expect(() => compareHands([tooMany])).toThrow();
  });
});
