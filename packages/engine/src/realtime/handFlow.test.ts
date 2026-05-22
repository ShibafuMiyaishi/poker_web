import type { Seat } from '@pokergo/shared';
import { describe, expect, test } from 'vitest';
import { isHandOver } from '../game/handLifecycle';
import {
  advanceUntilHumanOrEnd,
  applyHumanAction,
  settleTableHand,
  startTableHand,
} from './handFlow';
import { createInitialTableState, fillEmptySeatsWithCpu, sitDownHuman } from './types';

function tableWith1HumanAnd7Cpu() {
  let state = createInitialTableState('test', 5, 10);
  state = sitDownHuman(state, { seatNo: 0 as Seat, userId: 'u1', handle: 'Alice' });
  state = fillEmptySeatsWithCpu(state);
  return state;
}

describe('startTableHand', () => {
  test('着席 8 人で HandState が生成される', () => {
    const before = tableWith1HumanAnd7Cpu();
    const after = startTableHand(before, { handNo: 1 });
    expect(after.currentHand).not.toBeNull();
    expect(after.currentHand?.players.size).toBe(8);
    expect(after.handNo).toBe(1);
  });

  test('着席 1 人以下では currentHand は null のまま', () => {
    const single = sitDownHuman(createInitialTableState('t', 5, 10), {
      seatNo: 0 as Seat,
      userId: 'u1',
      handle: 'Alice',
    });
    const result = startTableHand(single, { handNo: 1 });
    expect(result.currentHand).toBeNull();
  });
});

describe('advanceUntilHumanOrEnd', () => {
  test('1 human + 7 CPU で CPU 全員のアクション後、human の手番で止まる or ハンド終了', () => {
    let state = tableWith1HumanAnd7Cpu();
    state = startTableHand(state, { handNo: 1 });
    const { state: advanced, events } = advanceUntilHumanOrEnd(state);
    expect(advanced.currentHand).not.toBeNull();
    expect(events.length).toBeGreaterThan(0);
    const toAct = advanced.currentHand?.toAct;
    if (toAct !== null && toAct !== undefined) {
      // 人間の手番で止まっている
      expect(advanced.seats[toAct]?.occupiedBy?.type).toBe('human');
    } else {
      // ハンド終了 (folds/showdown)
      const ch = advanced.currentHand;
      expect(ch !== null && (ch.street === 'showdown' || isHandOver(ch))).toBe(true);
    }
  });
});

describe('applyHumanAction + settleTableHand', () => {
  test('human が fold するとハンドが進む', () => {
    let state = tableWith1HumanAnd7Cpu();
    state = startTableHand(state, { handNo: 1 });
    const r1 = advanceUntilHumanOrEnd(state);
    state = r1.state;
    const toAct = state.currentHand?.toAct;
    if (toAct !== null && toAct !== undefined && state.seats[toAct]?.occupiedBy?.type === 'human') {
      const applied = applyHumanAction(state, toAct, { seat: toAct, type: 'fold' });
      state = applied.state;
      const r2 = advanceUntilHumanOrEnd(state);
      state = r2.state;
    }
    // 必ず showdown に到達
    while (state.currentHand && state.currentHand.street !== 'showdown') {
      const result = advanceUntilHumanOrEnd(state);
      state = result.state;
      if (result.events.length === 0) break;
    }
    const settled = settleTableHand(state);
    expect(settled).not.toBeNull();
    expect(settled?.winners.length).toBeGreaterThan(0);
    expect(settled?.state.currentHand).toBeNull();
  });

  test('settleTableHand 後、ボタンが次の participant に移動する', () => {
    let state = tableWith1HumanAnd7Cpu();
    const initialButton = state.buttonSeat;
    state = startTableHand(state, { handNo: 1 });
    // 全 CPU で showdown まで進める or 人間がいれば fold
    let safety = 0;
    while (state.currentHand && state.currentHand.street !== 'showdown' && safety < 50) {
      safety += 1;
      const r = advanceUntilHumanOrEnd(state);
      state = r.state;
      const toAct = state.currentHand?.toAct;
      if (toAct !== null && toAct !== undefined) {
        const occ = state.seats[toAct]?.occupiedBy;
        if (occ?.type === 'human') {
          const applied = applyHumanAction(state, toAct, { seat: toAct, type: 'fold' });
          state = applied.state;
        }
      }
    }
    const settled = settleTableHand(state);
    expect(settled).not.toBeNull();
    expect(settled?.state.buttonSeat).not.toBe(initialButton);
  });
});
