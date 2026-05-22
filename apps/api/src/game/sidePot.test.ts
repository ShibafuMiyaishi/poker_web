import type { Seat } from '@pokergo/shared';
import { describe, expect, test } from 'vitest';
import { buildSidePots } from './sidePot';

describe('buildSidePots - 仕様 §8 必須ケース', () => {
  test('サイドポット 3 層: 100 / 200 / 300 のオールイン階層', () => {
    const contributions = new Map<Seat, number>([
      [0, 100],
      [1, 200],
      [2, 300],
      [3, 300],
    ]);
    const pots = buildSidePots(contributions, new Set());

    expect(pots).toHaveLength(3);
    expect(pots[0]).toEqual({ amount: 400, eligibleSeats: [0, 1, 2, 3] });
    expect(pots[1]).toEqual({ amount: 300, eligibleSeats: [1, 2, 3] });
    expect(pots[2]).toEqual({ amount: 200, eligibleSeats: [2, 3] });
  });
});

describe('buildSidePots - エッジケース', () => {
  test('フォールド者の投入額は最下層ポットに吸収され、勝者対象から除外される', () => {
    const contributions = new Map<Seat, number>([
      [0, 100],
      [1, 100],
      [2, 200],
      [3, 300],
    ]);
    const pots = buildSidePots(contributions, new Set<Seat>([0]));

    expect(pots).toHaveLength(3);
    expect(pots[0]).toEqual({ amount: 400, eligibleSeats: [1, 2, 3] });
    expect(pots[1]).toEqual({ amount: 200, eligibleSeats: [2, 3] });
    expect(pots[2]).toEqual({ amount: 100, eligibleSeats: [3] });
  });

  test('全員同額のコールなら単一ポット', () => {
    const contributions = new Map<Seat, number>([
      [0, 50],
      [1, 50],
      [2, 50],
    ]);
    const pots = buildSidePots(contributions, new Set());
    expect(pots).toHaveLength(1);
    expect(pots[0]).toEqual({ amount: 150, eligibleSeats: [0, 1, 2] });
  });

  test('non-folded プレイヤーがいなければ空配列', () => {
    const contributions = new Map<Seat, number>([[0, 50]]);
    const pots = buildSidePots(contributions, new Set<Seat>([0]));
    expect(pots).toEqual([]);
  });

  test('オールイン後にフォールドした参加者の階層が正しく分離される', () => {
    // Seat 0 は 50 入れた状態でフォールド（all-in 状態ではないがフォールド済）
    // Seat 1 は 100 オールイン、Seat 2 は 200 でコール
    const contributions = new Map<Seat, number>([
      [0, 50],
      [1, 100],
      [2, 200],
    ]);
    const pots = buildSidePots(contributions, new Set<Seat>([0]));

    expect(pots).toHaveLength(2);
    expect(pots[0]).toEqual({ amount: 250, eligibleSeats: [1, 2] });
    expect(pots[1]).toEqual({ amount: 100, eligibleSeats: [2] });
  });
});
