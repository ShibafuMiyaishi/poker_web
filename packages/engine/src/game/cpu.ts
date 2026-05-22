import type { Seat } from '@pokergo/shared';
import type { HandState, PlayerAction } from './types';

// Phase 1 のプレースホルダ: Calling Station 戦略。
// 本格 CPU AI（プリフロ GTO チャート + ポストフロップルール）は次タスクで cpu-ai-tuner に委譲する。
export function simpleCpuDecide(state: HandState, seat: Seat): PlayerAction {
  const p = state.players.get(seat);
  if (!p) throw new Error(`simpleCpuDecide: seat ${seat} not in hand`);

  if (p.currentBet === state.currentBet) {
    return { seat, type: 'check' };
  }

  const toCall = state.currentBet - p.currentBet;
  if (toCall <= p.stack) {
    return { seat, type: 'call' };
  }

  return { seat, type: 'all_in' };
}
