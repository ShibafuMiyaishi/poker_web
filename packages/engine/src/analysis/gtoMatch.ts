import { type ChartScenario, loadChart, normalizeHand } from '@pokergo/gto-charts';
import type { Seat } from '@pokergo/shared';
import { derivePosition } from '../ai/decide';
import type { ActionEntry, HandState } from '../game/types';

// entry 時点でのシナリオを推定する。
// open: 自分より前にプリフロ raise が 0 回
// vs-raise: 1 回
// vs-3bet: 2 回以上
function deriveScenario(state: HandState, entry: ActionEntry): ChartScenario {
  const idx = state.actions.indexOf(entry);
  const prior = idx >= 0 ? state.actions.slice(0, idx) : [];
  const raiseCount = prior.filter(
    (a) =>
      a.street === 'preflop' && (a.type === 'raise' || a.type === 'bet' || a.type === 'all_in'),
  ).length;
  if (raiseCount === 0) return 'open';
  if (raiseCount === 1) return 'vs-raise';
  return 'vs-3bet';
}

// プリフロのみ GTO チャートとアクションを照合し、in/out を boolean で返す。
export function gtoMatch(state: HandState, seat: Seat, entry: ActionEntry): boolean | null {
  if (entry.street !== 'preflop') {
    throw new Error('gtoMatch: preflop entry only');
  }
  const scenario = deriveScenario(state, entry);
  const player = state.players.get(seat);
  if (!player) return false;
  const position = derivePosition(state, seat);
  const handStr = normalizeHand(player.holeCards);
  const chart = loadChart(position, scenario);
  const expected = chart[handStr] ?? 'fold';

  if (expected.startsWith('mixed:')) return true;
  if (expected === 'raise') {
    return entry.type === 'raise' || entry.type === 'bet' || entry.type === 'all_in';
  }
  if (expected === 'call') {
    return entry.type === 'call' || entry.type === 'check';
  }
  return entry.type === 'fold';
}
