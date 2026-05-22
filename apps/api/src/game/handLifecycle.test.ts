import type { Seat } from '@pokergo/shared';
import { describe, expect, test } from 'vitest';
import { applyAction } from './actions';
import { seededRng, shuffleDeck } from './deck';
import { advanceStreet, clockwiseSeats, isHandOver, startHand } from './handLifecycle';
import { settleHand } from './settle';

describe('clockwiseSeats', () => {
  test('8 人卓で BTN=7 でも各座席は 1 度だけ登場し BTN は末尾', () => {
    const seats = new Set<Seat>([0, 1, 2, 3, 4, 5, 6, 7] as Seat[]);
    const result = clockwiseSeats(seats, 7 as Seat);
    expect(result).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(result).toHaveLength(8);
    expect(result.filter((s) => s === 7)).toHaveLength(1);
  });

  test('HU BTN=0 で [BB, BTN] の順', () => {
    const seats = new Set<Seat>([0, 1] as Seat[]);
    expect(clockwiseSeats(seats, 0 as Seat)).toEqual([1, 0]);
  });

  test('3p BTN=0 で [SB, BB, BTN] の順', () => {
    const seats = new Set<Seat>([0, 1, 2] as Seat[]);
    expect(clockwiseSeats(seats, 0 as Seat)).toEqual([1, 2, 0]);
  });

  test('座席が飛んでいる場合（0,2,5,7）でも順序が保たれる', () => {
    const seats = new Set<Seat>([0, 2, 5, 7] as Seat[]);
    expect(clockwiseSeats(seats, 2 as Seat)).toEqual([5, 7, 0, 2]);
  });
});

describe('startHand', () => {
  test('HU では BTN=SB が先頭、ポット = SB + BB', () => {
    const s = startHand({
      handId: 'h1',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck: shuffleDeck(seededRng(1)),
    });
    expect(s.pot).toBe(15);
    expect(s.toAct).toBe(0); // BTN/SB がプリフロ先頭
    expect(s.currentBet).toBe(10);
  });

  test('3+ では UTG が先頭、SB は BTN+1、BB は SB+1', () => {
    const s = startHand({
      handId: 'h2',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
        { seat: 2 as Seat, stack: 1000 },
        { seat: 3 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck: shuffleDeck(seededRng(2)),
    });
    expect(s.pot).toBe(15);
    expect(s.toAct).toBe(3); // UTG = BB(seat 2)+1 = seat 3
    expect(s.players.get(1 as Seat)?.currentBet).toBe(5); // SB
    expect(s.players.get(2 as Seat)?.currentBet).toBe(10); // BB
  });

  test('2 人未満は throw、9 人以上は throw、buttonSeat 不在は throw', () => {
    expect(() =>
      startHand({
        handId: 'x',
        participants: [{ seat: 0 as Seat, stack: 1000 }],
        buttonSeat: 0 as Seat,
        sb: 5,
        bb: 10,
      }),
    ).toThrow();

    expect(() =>
      startHand({
        handId: 'x',
        participants: [
          { seat: 0 as Seat, stack: 1000 },
          { seat: 1 as Seat, stack: 1000 },
        ],
        buttonSeat: 7 as Seat,
        sb: 5,
        bb: 10,
      }),
    ).toThrow();
  });
});

describe('walk (preflop everyone folds to BB)', () => {
  test('BB がブラインド全部を獲得する', () => {
    let s = startHand({
      handId: 'walk',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
        { seat: 2 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck: shuffleDeck(seededRng(3)),
    });
    // 3p では UTG = seat 0(BTN+SB+BB 順で UTG = BTN), 順序は UTG(0)→SB(1)→BB(2)
    expect(s.toAct).toBe(0);
    s = applyAction(s, { seat: 0 as Seat, type: 'fold' });
    s = applyAction(s, { seat: 1 as Seat, type: 'fold' });
    expect(isHandOver(s)).toBe(true);

    const alloc = settleHand(s);
    const total = alloc.reduce((a, b) => a + b.amount, 0);
    expect(total).toBe(15);
    expect(alloc[0]?.seat).toBe(2); // BB が勝者
  });
});

describe('full hand to showdown', () => {
  test('プリフロ全員コール → flop/turn/river 全 check → ショウダウンで勝者へ', () => {
    let s = startHand({
      handId: 'sh',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
        { seat: 2 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck: shuffleDeck(seededRng(123)),
    });
    // preflop
    s = applyAction(s, { seat: 0 as Seat, type: 'call' }); // UTG=0
    s = applyAction(s, { seat: 1 as Seat, type: 'call' }); // SB
    s = applyAction(s, { seat: 2 as Seat, type: 'check' }); // BB option
    expect(s.toAct).toBeNull();
    s = advanceStreet(s);
    expect(s.street).toBe('flop');
    expect(s.board).toHaveLength(3);

    // flop: SB から
    expect(s.toAct).toBe(1);
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 2 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });
    s = advanceStreet(s);
    expect(s.street).toBe('turn');
    expect(s.board).toHaveLength(4);

    // turn
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 2 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });
    s = advanceStreet(s);
    expect(s.street).toBe('river');
    expect(s.board).toHaveLength(5);

    // river
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 2 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });
    s = advanceStreet(s);
    expect(s.street).toBe('showdown');
    expect(isHandOver(s)).toBe(true);

    const alloc = settleHand(s);
    const total = alloc.reduce((a, b) => a + b.amount, 0);
    expect(total).toBe(s.pot);
    // 全 3 名がコール 10 ずつなので pot = 30
    expect(s.pot).toBe(30);
  });
});

describe('HU full hand to showdown', () => {
  test('HU で全ストリート check-down して showdown 到達', () => {
    let s = startHand({
      handId: 'hu-sh',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck: shuffleDeck(seededRng(77)),
    });
    // preflop: BTN/SB(=0) が先頭、call (5 → 10)
    expect(s.toAct).toBe(0);
    s = applyAction(s, { seat: 0 as Seat, type: 'call' });
    // BB option
    expect(s.toAct).toBe(1);
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = advanceStreet(s);
    expect(s.street).toBe('flop');
    expect(s.board).toHaveLength(3);

    // postflop: BB(=1) が先頭（BTN+1）
    expect(s.toAct).toBe(1);
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });
    s = advanceStreet(s);
    expect(s.street).toBe('turn');

    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });
    s = advanceStreet(s);
    expect(s.street).toBe('river');

    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });
    s = advanceStreet(s);
    expect(s.street).toBe('showdown');
    expect(s.board).toHaveLength(5);

    const alloc = settleHand(s);
    const total = alloc.reduce((a, b) => a + b.amount, 0);
    expect(total).toBe(s.pot);
    expect(s.pot).toBe(20); // 各自 10 ずつ
  });
});

describe('side pot with all-in', () => {
  test('3 人それぞれ異なる all-in → 階層サイドポットで分配', () => {
    let s = startHand({
      handId: 'sidepot',
      participants: [
        { seat: 0 as Seat, stack: 300 }, // BTN
        { seat: 1 as Seat, stack: 100 }, // SB → all-in 最小
        { seat: 2 as Seat, stack: 200 }, // BB
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck: shuffleDeck(seededRng(99)),
    });
    // 3p preflop: UTG=BTN=seat 0
    s = applyAction(s, { seat: 0 as Seat, type: 'all_in' }); // seat 0: 300
    s = applyAction(s, { seat: 1 as Seat, type: 'all_in' }); // seat 1: 100 total
    s = applyAction(s, { seat: 2 as Seat, type: 'all_in' }); // seat 2: 200 total
    expect(s.toAct).toBeNull();

    // 進行: ボードを最後まで配って showdown へ
    while (s.street !== 'showdown') {
      s = advanceStreet(s);
    }
    expect(s.board).toHaveLength(5);

    const alloc = settleHand(s);
    const total = alloc.reduce((a, b) => a + b.amount, 0);
    // 全員投入: 100 + 200 + 300 = 600。uncalled 部分（seat 0 の上 100）が返却済→ contribution 200ずつ → pot 600?
    // 実際: seat 1=100, seat 2=200, seat 0 は seat 2 に call 200 までで refund 100 → contribution 200
    // pot total = 100 + 200 + 200 = 500
    expect(s.pot).toBe(500);
    expect(total).toBe(500);
  });
});
