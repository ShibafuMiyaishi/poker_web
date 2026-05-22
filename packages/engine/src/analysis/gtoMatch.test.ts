import type { Card, Seat } from '@pokergo/shared';
import { describe, expect, test } from 'vitest';
import { applyAction } from '../game/actions';
import { startHand } from '../game/handLifecycle';
import type { ActionEntry } from '../game/types';
import { gtoMatch } from './gtoMatch';

// 既知のホールカード配置でハンド開始するため、決定的なデッキを構築する。
function deckForHands(hands: readonly [Card, Card][]): Card[] {
  // 配布順: BTN+1 から時計回り。HU は [BB, BTN]
  // hands は dealing order に並べる
  const cards: Card[] = [];
  for (const h of hands) {
    cards.push(h[0], h[1]);
  }
  // 残りの 52 - 使用カードを適当に埋める
  const used = new Set(cards);
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const suits = ['s', 'h', 'd', 'c'];
  for (const r of ranks) {
    for (const s of suits) {
      const c = `${r}${s}` as Card;
      if (!used.has(c)) cards.push(c);
    }
  }
  return cards;
}

describe('gtoMatch (open scenario)', () => {
  // 3p with BTN=0: dealing order [SB(1), BB(2), BTN(0)]
  // UTG = BTN = seat 0
  test('UTG が AA で raise → true', () => {
    const deck = deckForHands([
      ['7s', '2h'], // SB
      ['8s', '3d'], // BB
      ['As', 'Ah'], // BTN (UTG in 3p)
    ]);
    const s0 = startHand({
      handId: 'g-1',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
        { seat: 2 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck,
    });
    expect(s0.toAct).toBe(0);
    const s1 = applyAction(s0, { seat: 0 as Seat, type: 'raise', amount: 30 });
    const entry = s1.actions[s1.actions.length - 1] as ActionEntry;
    expect(gtoMatch(s1, 0 as Seat, entry)).toBe(true);
  });

  test('UTG が 72o で fold → true（chart 通り）', () => {
    const deck = deckForHands([
      ['Ks', 'Kh'], // SB
      ['9d', '3c'], // BB
      ['7s', '2h'], // BTN/UTG
    ]);
    const s0 = startHand({
      handId: 'g-2',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
        { seat: 2 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck,
    });
    const s1 = applyAction(s0, { seat: 0 as Seat, type: 'fold' });
    const entry = s1.actions[s1.actions.length - 1] as ActionEntry;
    expect(gtoMatch(s1, 0 as Seat, entry)).toBe(true);
  });

  test('vs-raise シナリオは vs-raise チャートで評価される', () => {
    const deck = deckForHands([
      ['8s', '3h'], // SB: ゴミハンド、vs-raise で fold が正解
      ['9d', '4c'], // BB
      ['As', 'Ah'], // BTN/UTG
    ]);
    const s0 = startHand({
      handId: 'g-3',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
        { seat: 2 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck,
    });
    // UTG (BTN) が raise → SB が fold（vs-raise でゴミハンドの正解）
    const s1 = applyAction(s0, { seat: 0 as Seat, type: 'raise', amount: 30 });
    const s2 = applyAction(s1, { seat: 1 as Seat, type: 'fold' });
    const sbEntry = s2.actions[s2.actions.length - 1] as ActionEntry;
    expect(gtoMatch(s2, 1 as Seat, sbEntry)).toBe(true);
  });

  test('preflop 以外を渡すと throw', () => {
    const deck = deckForHands([
      ['8s', '3h'],
      ['9d', '4c'],
      ['As', 'Ah'],
    ]);
    const s = startHand({
      handId: 'g-4',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
        { seat: 2 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck,
    });
    const fakeEntry: ActionEntry = {
      seat: 0 as Seat,
      street: 'flop',
      type: 'check',
      amount: 0,
      potBefore: 0,
      toCallBefore: 0,
    };
    expect(() => gtoMatch(s, 0 as Seat, fakeEntry)).toThrow();
  });
});
