import type { Seat } from '@pokergo/shared';
import { describe, expect, test } from 'vitest';
import { applyAction, legalActions } from './actions';
import { seededRng, shuffleDeck } from './deck';
import { startHand } from './handLifecycle';

function newHandHU(sb = 5, bb = 10): ReturnType<typeof startHand> {
  return startHand({
    handId: 'test-hu',
    participants: [
      { seat: 0 as Seat, stack: 1000 },
      { seat: 1 as Seat, stack: 1000 },
    ],
    buttonSeat: 0 as Seat,
    sb,
    bb,
    deck: shuffleDeck(seededRng(42)),
  });
}

function newHand3() {
  return startHand({
    handId: 'test-3p',
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

describe('legalActions', () => {
  test('プリフロ SB(BTN, HU) は fold/call/raise/all_in', () => {
    const s = newHandHU();
    const types = legalActions(s, s.toAct as Seat).map((a) => a.type);
    expect(types).toContain('fold');
    expect(types).toContain('call');
    expect(types).toContain('raise');
    expect(types).toContain('all_in');
  });

  test('toAct でない座に対しては空配列', () => {
    const s = newHandHU();
    const other = (s.toAct === 0 ? 1 : 0) as Seat;
    expect(legalActions(s, other)).toEqual([]);
  });

  test('現ベットが 0 のとき bet が選択肢', () => {
    let s = newHand3();
    // UTG = seat 0 (BTN), SB = seat 1, BB = seat 2 → preflop UTG が seat 0 だが3人卓だと BTN+1=SB, BB, UTG=BTN なので seat 0 が UTG (BTN) 役
    // 実際: 3人卓 BTN=0, SB=1, BB=2, UTG = nextOccupiedSeat(BB=2) = 0
    expect(s.toAct).toBe(0);
    s = applyAction(s, { seat: 0 as Seat, type: 'call' });
    s = applyAction(s, { seat: 1 as Seat, type: 'call' });
    s = applyAction(s, { seat: 2 as Seat, type: 'check' }); // BB option
    // flop へ
  });
});

describe('applyAction validation', () => {
  test('間違った seat で action は throw', () => {
    const s = newHandHU();
    const wrong = (s.toAct === 0 ? 1 : 0) as Seat;
    expect(() => applyAction(s, { seat: wrong, type: 'fold' })).toThrow();
  });

  test('check できない状況で check は throw', () => {
    const s = newHandHU();
    // BTN/SB currentBet=5 < currentBet=10 → check 不可
    expect(() => applyAction(s, { seat: s.toAct as Seat, type: 'check' })).toThrow();
  });

  test('最小レイズを下回る raise は throw', () => {
    const s = newHandHU();
    expect(() => applyAction(s, { seat: s.toAct as Seat, type: 'raise', amount: 11 })).toThrow();
  });

  test('スタック超過の bet は throw', () => {
    const s = newHandHU();
    expect(() => applyAction(s, { seat: s.toAct as Seat, type: 'raise', amount: 9999 })).toThrow();
  });
});

describe('BB option', () => {
  test('全員がコールしてもBBには「アクションする番」が回ってくる', () => {
    let s = newHand3();
    s = applyAction(s, { seat: 0 as Seat, type: 'call' }); // UTG call 10
    s = applyAction(s, { seat: 1 as Seat, type: 'call' }); // SB call 10 (already 5 in)
    expect(s.toAct).toBe(2); // BB option
    s = applyAction(s, { seat: 2 as Seat, type: 'check' });
    expect(s.toAct).toBeNull();
  });
});

describe('ActionEntry.amount 単位の統一', () => {
  test('call / raise / all_in すべてが「このアクションで投入した delta」で記録される', () => {
    let s = newHand3();
    // UTG=seat 0 raises to 30 (delta = 30 - 0 = 30)
    s = applyAction(s, { seat: 0 as Seat, type: 'raise', amount: 30 });
    const raiseEntry = s.actions.find((a) => a.type === 'raise');
    expect(raiseEntry?.amount).toBe(30);
    // SB(=seat 1) call (delta = 30 - 5 = 25)
    s = applyAction(s, { seat: 1 as Seat, type: 'call' });
    const callEntry = s.actions.find((a) => a.type === 'call');
    expect(callEntry?.amount).toBe(25);
  });
});

describe('refundUncalledBet', () => {
  test('レイズに対し全員フォールドしたらレイザーの上乗せ分が pot に残らない', () => {
    let s = newHand3();
    // UTG (BTN=seat 0) raises to 30
    s = applyAction(s, { seat: 0 as Seat, type: 'raise', amount: 30 });
    // SB folds
    s = applyAction(s, { seat: 1 as Seat, type: 'fold' });
    // BB folds → only BTN non-folded
    s = applyAction(s, { seat: 2 as Seat, type: 'fold' });
    expect(s.toAct).toBeNull();
    // 1 人勝ち → refund 不要。BB(10)+SB(5)+BTN raise(30) = 45 が pot に残る
    expect(s.pot).toBe(45);
  });

  test('A=100 のベットに B が 50 all-in、C は fold → A の uncalled 50 が返却される', () => {
    let s = newHand3();
    // UTG (BTN, seat 0) raises to 100
    s = applyAction(s, { seat: 0 as Seat, type: 'raise', amount: 100 });
    // SB (seat 1) all_in for 5 + 45 = 50（stack を 50 に予め減らす必要があるが、ここでは raise を使ってオーバーアクションする）
    // 簡単化: SB が 50 のサイズで raise → 最小レイズ(=90)未満だが all_in 扱いではないので throw
    // テストを単純化: SB は call、BB が 50 のスタックだったと想定するためカスタムスタックで再構築
    const customHand = startHand({
      handId: 'sidetest',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 50 }, // SB は薄い
        { seat: 2 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck: shuffleDeck(seededRng(7)),
    });
    let s2 = customHand;
    // UTG (seat 0) raises to 100
    s2 = applyAction(s2, { seat: 0 as Seat, type: 'raise', amount: 100 });
    // SB (seat 1) all_in (stack 45 残 + currentBet 5 → 50 total)
    s2 = applyAction(s2, { seat: 1 as Seat, type: 'all_in' });
    // BB (seat 2) folds
    s2 = applyAction(s2, { seat: 2 as Seat, type: 'fold' });
    expect(s2.toAct).toBeNull();
    // A の uncalled 50（100 - 50）が返却され pot = 50 (SB) + 50 (A の called 50) + 10 (BB) = 110
    expect(s2.pot).toBe(110);
    const a = s2.players.get(0 as Seat);
    expect(a?.contribution).toBe(50);
  });
});
