import type { Seat } from '@pokergo/shared';
import { describe, expect, test } from 'vitest';
import { applyAction } from '../game/actions';
import { seededRng, shuffleDeck } from '../game/deck';
import { advanceStreet, startHand } from '../game/handLifecycle';
import { settleHand } from '../game/settle';
import { toPokerStarsText } from './pokerstars';

describe('toPokerStarsText', () => {
  test('3 人卓ハンドで仕様 Appendix B のフォーマット要素を含む', () => {
    let s = startHand({
      handId: 'h-001',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
        { seat: 2 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck: shuffleDeck(seededRng(42)),
    });
    s = applyAction(s, { seat: 0 as Seat, type: 'call' });
    s = applyAction(s, { seat: 1 as Seat, type: 'call' });
    s = applyAction(s, { seat: 2 as Seat, type: 'check' });
    s = advanceStreet(s);
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 2 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });
    s = advanceStreet(s);
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 2 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });
    s = advanceStreet(s);
    s = applyAction(s, { seat: 1 as Seat, type: 'check' });
    s = applyAction(s, { seat: 2 as Seat, type: 'check' });
    s = applyAction(s, { seat: 0 as Seat, type: 'check' });
    s = advanceStreet(s);

    const winners = settleHand(s);
    const names: Record<number, string> = { 0: 'You', 1: 'Alpha', 2: 'Bravo' };
    const text = toPokerStarsText(s, winners, {
      tableName: 'Pokergo Main',
      handNumber: '2026052301-001',
      startedAt: new Date(2026, 4, 23, 10, 0, 0),
      seatLabel: (seat) => names[seat] ?? `Seat ${seat}`,
      yourSeat: 0 as Seat,
    });

    expect(text).toContain("PokerStars Hand #2026052301-001: Hold'em No Limit (5/10)");
    expect(text).toContain("Table 'Pokergo Main' 8-max");
    expect(text).toContain('Seat 1: You');
    expect(text).toContain('posts small blind 5');
    expect(text).toContain('posts big blind 10');
    expect(text).toContain('*** HOLE CARDS ***');
    expect(text).toContain('Dealt to You');
    expect(text).toContain('*** FLOP ***');
    expect(text).toContain('*** TURN ***');
    expect(text).toContain('*** RIVER ***');
    expect(text).toContain('*** SUMMARY ***');
    expect(text).toContain('Total pot');
    expect(text).toContain('Board [');
  });

  test('全員フォールド walk もエラーなく書き出せる', () => {
    let s = startHand({
      handId: 'h-walk',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
        { seat: 2 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck: shuffleDeck(seededRng(1)),
    });
    s = applyAction(s, { seat: 0 as Seat, type: 'fold' });
    s = applyAction(s, { seat: 1 as Seat, type: 'fold' });
    const winners = settleHand(s);
    const text = toPokerStarsText(s, winners, {
      tableName: 'Pokergo Main',
      handNumber: 'h-walk',
      startedAt: new Date(2026, 4, 23, 10, 0, 0),
      seatLabel: (seat) => `Seat${seat}`,
      yourSeat: 0 as Seat,
    });
    expect(text).toContain('Seat0: folds');
    expect(text).toContain('Seat1: folds');
    expect(text).toContain('*** SUMMARY ***');
  });
});
