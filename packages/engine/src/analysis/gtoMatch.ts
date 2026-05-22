import { loadChart, normalizeHand } from '@pokergo/gto-charts';
import type { Seat } from '@pokergo/shared';
import { derivePosition } from '../ai/decide';
import type { ActionEntry, HandState } from '../game/types';

// プリフロのみ GTO チャートとアクションを照合し、in/out を boolean で返す。
// mixed:X は両方の選択肢が許容されるため true 扱い。
// チャートが 'open' シナリオのみ対応している点に留意（vs-raise / vs-3bet は将来）。
export function gtoMatch(state: HandState, seat: Seat, entry: ActionEntry): boolean {
  if (entry.street !== 'preflop') {
    throw new Error('gtoMatch: preflop entry only');
  }
  const player = state.players.get(seat);
  if (!player) return false;
  const position = derivePosition(state, seat);
  const handStr = normalizeHand(player.holeCards);
  const chart = loadChart(position, 'open');
  const expected = chart[handStr] ?? 'fold';

  if (expected.startsWith('mixed:')) return true;
  if (expected === 'raise') {
    return entry.type === 'raise' || entry.type === 'bet' || entry.type === 'all_in';
  }
  if (expected === 'call') {
    return entry.type === 'call' || entry.type === 'check';
  }
  // fold
  return entry.type === 'fold';
}
