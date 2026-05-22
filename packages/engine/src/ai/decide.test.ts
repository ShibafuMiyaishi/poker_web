import type { Card, Seat } from '@pokergo/shared';
import { describe, expect, test } from 'vitest';
import { applyAction } from '../game/actions';
import { seededRng, shuffleDeck } from '../game/deck';
import { advanceStreet, isHandOver, startHand } from '../game/handLifecycle';
import { settleHand } from '../game/settle';
import type { HandState } from '../game/types';
import { decideAction, derivePosition } from './decide';
import { CPU_PROFILES } from './profile';

function startSimple(participants: { seat: Seat; stack: number }[], deckSeed = 100) {
  return startHand({
    handId: 'ai-test',
    participants,
    buttonSeat: 0 as Seat,
    sb: 5,
    bb: 10,
    deck: shuffleDeck(seededRng(deckSeed)),
  });
}

describe('derivePosition', () => {
  test('8 人卓: BTN=0 のとき各 seat に正しいポジションが割り当てられる', () => {
    const participants = Array.from({ length: 8 }, (_, i) => ({
      seat: i as Seat,
      stack: 1000,
    }));
    const s = startSimple(participants);
    expect(derivePosition(s, 0 as Seat)).toBe('BTN');
    expect(derivePosition(s, 1 as Seat)).toBe('SB');
    expect(derivePosition(s, 2 as Seat)).toBe('BB');
    expect(derivePosition(s, 3 as Seat)).toBe('UTG');
    expect(derivePosition(s, 4 as Seat)).toBe('UTG+1');
    expect(derivePosition(s, 5 as Seat)).toBe('MP');
    expect(derivePosition(s, 6 as Seat)).toBe('HJ');
    expect(derivePosition(s, 7 as Seat)).toBe('CO');
  });

  test('HU: BTN=0 → seat 0 は BTN、seat 1 は BB', () => {
    const s = startSimple([
      { seat: 0 as Seat, stack: 1000 },
      { seat: 1 as Seat, stack: 1000 },
    ]);
    expect(derivePosition(s, 0 as Seat)).toBe('BTN');
    expect(derivePosition(s, 1 as Seat)).toBe('BB');
  });
});

describe('decideAction', () => {
  test('合法アクションのみを返す（fold/check/call/bet/raise/all_in）', () => {
    let s = startSimple([
      { seat: 0 as Seat, stack: 1000 },
      { seat: 1 as Seat, stack: 1000 },
      { seat: 2 as Seat, stack: 1000 },
    ]);
    const rng = seededRng(5);
    for (let i = 0; i < 20 && s.toAct !== null; i++) {
      const seat = s.toAct;
      const profile = CPU_PROFILES.Bravo;
      const action = decideAction(s, seat, profile, rng);
      expect(['fold', 'check', 'call', 'bet', 'raise', 'all_in']).toContain(action.type);
      s = applyAction(s, action);
    }
  });

  test('プリフロで UTG にゴミハンドを持たせると fold する', () => {
    // 7-handed UTG with 72o
    const deck = [
      // UTG=seat 6 (BTN+1=SB(1), BB(2), UTG(3)? 7-handed)
      // Actually with 7 players (seats 0-6) and BTN=0: order = [1,2,3,4,5,6,0]
      // SB=1, BB=2, UTG=3
      // So seat 3 gets first 2 cards in dealing order
      // Let me just structure deck so seat 3 gets 7s/2h, others irrelevant
      // 7 players × 2 hole = 14 cards. seat 3 is 5th in deal order so cards 8,9
      // Actually deal order = [BTN+1, BTN+2, ..., BTN] = [1,2,3,4,5,6,0]
      // seat 1 → deck[0..1], seat 2 → deck[2..3], seat 3 → deck[4..5]
      'Ac',
      'Kd', // seat 1
      'Qh',
      'Js', // seat 2
      '7s',
      '2h', // seat 3 (UTG)
      '5d',
      '6c', // seat 4
      '8d',
      '9c', // seat 5
      'Tc',
      'Th', // seat 6
      '3d',
      '4d', // seat 0 (BTN)
      // 残りはボード等
      'As',
      'Ad',
      'Ah',
      'Kc',
      'Kh',
      'Ks',
      'Qc',
      'Qd',
      'Qs',
      'Jc',
      'Jd',
      'Jh',
      '9d',
      '9h',
      '9s',
      '8c',
      '8h',
      '8s',
      '7c',
      '7d',
      '7h',
      '6d',
      '6h',
      '6s',
      '5c',
      '5h',
      '5s',
      '4c',
      '4h',
      '4s',
      '3c',
      '3h',
      '3s',
      '2c',
      '2d',
      '2s',
    ] as Card[];
    const s = startHand({
      handId: 'utg-72o',
      participants: [
        { seat: 0 as Seat, stack: 1000 },
        { seat: 1 as Seat, stack: 1000 },
        { seat: 2 as Seat, stack: 1000 },
        { seat: 3 as Seat, stack: 1000 },
        { seat: 4 as Seat, stack: 1000 },
        { seat: 5 as Seat, stack: 1000 },
        { seat: 6 as Seat, stack: 1000 },
      ],
      buttonSeat: 0 as Seat,
      sb: 5,
      bb: 10,
      deck,
    });
    // 7-handed: order = [1,2,3,4,5,6,0]、UTG が toAct
    expect(s.toAct).toBe(3);
    const actor = s.toAct;
    if (actor === null) throw new Error('actor expected');
    const action = decideAction(s, actor, CPU_PROFILES.Bravo, seededRng(1));
    expect(action.type).toBe('fold');
  });
});

describe('AI integration (3 ハンド)', () => {
  test('5 人卓で 3 ハンド回し例外なし + チップ保存', () => {
    const TOTAL = 5 * 1000;
    const stacks = new Map<Seat, number>();
    for (let i = 0; i < 5; i++) stacks.set(i as Seat, 1000);

    let buttonSeat: Seat = 0;
    const profiles = [
      CPU_PROFILES.Alpha,
      CPU_PROFILES.Bravo,
      CPU_PROFILES.Charlie,
      CPU_PROFILES.Delta,
      CPU_PROFILES.Echo,
    ];

    for (let h = 0; h < 3; h++) {
      const participants: { seat: Seat; stack: number }[] = [];
      for (let i = 0; i < 5; i++) {
        const stack = stacks.get(i as Seat) ?? 0;
        if (stack >= 10) participants.push({ seat: i as Seat, stack });
      }
      if (participants.length < 2) break;

      let state: HandState = startHand({
        handId: `int-${h}`,
        participants,
        buttonSeat,
        sb: 5,
        bb: 10,
      });
      const rng = seededRng(h * 13 + 1);

      let steps = 0;
      while (!isHandOver(state) && steps < 300) {
        if (state.toAct === null) state = advanceStreet(state);
        else {
          const profile = profiles[state.toAct] ?? CPU_PROFILES.Bravo;
          const action = decideAction(state, state.toAct, profile, rng);
          state = applyAction(state, action);
        }
        steps++;
      }
      while (state.street !== 'showdown') state = advanceStreet(state);

      for (const p of state.players.values()) stacks.set(p.seat, p.stack);
      for (const a of settleHand(state)) {
        stacks.set(a.seat, (stacks.get(a.seat) ?? 0) + a.amount);
      }
      const sum = [...stacks.values()].reduce((acc, v) => acc + v, 0);
      expect(sum).toBe(TOTAL);

      for (let i = 1; i <= 5; i++) {
        const cand = ((buttonSeat + i) % 5) as Seat;
        if ((stacks.get(cand) ?? 0) >= 10) {
          buttonSeat = cand;
          break;
        }
      }
    }
  });
});
