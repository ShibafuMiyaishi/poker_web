import type { Seat } from '@pokergo/shared';
import { describe, expect, test } from 'vitest';
import { applyAction } from './actions';
import { simpleCpuDecide } from './cpu';
import { advanceStreet, isHandOver, startHand } from './handLifecycle';
import { settleHand } from './settle';

// Calling Station 8 体で 30 ハンド連続実行し、
// (1) 例外なく完走すること
// (2) チップ総額が保存されること
// (3) ある程度の割合のハンドが showdown まで到達すること
//   を検証する。Engine の重大なリグレッションを早期検知する保険。

describe('engine simulation', () => {
  test('CPU vs CPU 30 ハンド: 例外なし + チップ保存 + showdown 到達', () => {
    const SEATS = 8;
    const STARTING_STACK = 1000;
    const SB = 5;
    const BB = 10;
    const HANDS = 30;
    const TOTAL_CHIPS = SEATS * STARTING_STACK;

    const stacks = new Map<Seat, number>();
    for (let i = 0; i < SEATS; i++) stacks.set(i as Seat, STARTING_STACK);

    let buttonSeat: Seat = 0;
    let showdownCount = 0;

    for (let h = 0; h < HANDS; h++) {
      const participants: { seat: Seat; stack: number }[] = [];
      for (let i = 0; i < SEATS; i++) {
        const s = stacks.get(i as Seat) ?? 0;
        if (s >= BB) participants.push({ seat: i as Seat, stack: s });
      }
      if (participants.length < 2) break;

      if (!participants.some((p) => p.seat === buttonSeat)) {
        buttonSeat = participants[0]?.seat ?? (0 as Seat);
      }

      let state = startHand({
        handId: `sim-${h}`,
        participants,
        buttonSeat,
        sb: SB,
        bb: BB,
      });

      // 上限 200 ステップで防御的に止める
      let steps = 0;
      while (!isHandOver(state) && steps < 200) {
        if (state.toAct === null) {
          state = advanceStreet(state);
        } else {
          const action = simpleCpuDecide(state, state.toAct);
          state = applyAction(state, action);
        }
        steps++;
      }
      expect(steps).toBeLessThan(200);

      // showdown まで残りのストリートを進める
      while (state.street !== 'showdown') {
        state = advanceStreet(state);
      }

      if (state.board.length === 5) showdownCount++;

      // 各プレイヤーの残りスタックは player.stack
      for (const p of state.players.values()) {
        stacks.set(p.seat, p.stack);
      }
      const alloc = settleHand(state);
      for (const a of alloc) {
        stacks.set(a.seat, (stacks.get(a.seat) ?? 0) + a.amount);
      }

      // チップ保存則
      const total = [...stacks.values()].reduce((acc, v) => acc + v, 0);
      expect(total).toBe(TOTAL_CHIPS);

      // 次ハンドのボタン位置を進める
      const seatList = [...stacks.entries()].filter(([, v]) => v >= BB).map(([k]) => k);
      if (seatList.length >= 2) {
        for (let i = 1; i <= SEATS; i++) {
          const cand = ((buttonSeat + i) % SEATS) as Seat;
          if ((stacks.get(cand) ?? 0) >= BB) {
            buttonSeat = cand;
            break;
          }
        }
      }
    }

    // Calling Station なので大半のハンドが showdown まで進む想定
    expect(showdownCount).toBeGreaterThan(HANDS * 0.5);
  });
});
