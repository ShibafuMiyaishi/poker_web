import type { Seat } from '@pokergo/shared';
import { describe, expect, test } from 'vitest';
import { seededRng, shuffleDeck } from '../game/deck';
import { startHand } from '../game/handLifecycle';
import { HIDDEN_CARD, filterHandStateForSeat } from './seatFilter';

function makeHand() {
  return startHand({
    handId: 'sf-1',
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
}

describe('filterHandStateForSeat', () => {
  test('自席のホールカードは見える、他席は伏せられる', () => {
    const hand = makeHand();
    const filtered = filterHandStateForSeat(hand, 1 as Seat);
    const mine = filtered.players.get(1 as Seat);
    const opponent = filtered.players.get(0 as Seat);
    expect(mine?.holeCards[0]).not.toBe(HIDDEN_CARD);
    expect(opponent?.holeCards[0]).toBe(HIDDEN_CARD);
    expect(opponent?.holeCards[1]).toBe(HIDDEN_CARD);
  });

  test('観戦者 (viewerSeat=null) は全席のホールカードが伏せられる', () => {
    const hand = makeHand();
    const filtered = filterHandStateForSeat(hand, null);
    for (const p of filtered.players.values()) {
      expect(p.holeCards[0]).toBe(HIDDEN_CARD);
    }
  });

  test('deck はクライアントへ送信されない', () => {
    const hand = makeHand();
    const filtered = filterHandStateForSeat(hand, 0 as Seat);
    expect(filtered.deck).toEqual([]);
  });

  test('ショウダウン時は fold していない全席のホールカードが見える', () => {
    const hand = makeHand();
    const showdownHand = { ...hand, street: 'showdown' as const };
    const filtered = filterHandStateForSeat(showdownHand, null);
    for (const p of filtered.players.values()) {
      if (p.status !== 'folded') {
        expect(p.holeCards[0]).not.toBe(HIDDEN_CARD);
      }
    }
  });
});
