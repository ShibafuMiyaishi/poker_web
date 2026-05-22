import { loadChart, normalizeHand } from '@pokergo/gto-charts';
import type { Seat } from '@pokergo/shared';
import { derivePosition } from '../ai/decide';
import type { ActionEntry, HandState } from '../game/types';

// プリフロのみ GTO チャートとアクションを照合し、in/out を boolean で返す。
// open シナリオしか持たないため、対象アクション以前に raise/bet/all_in があった場合は
// 評価不能として null を返す（誤判定回避）。
export function gtoMatch(state: HandState, seat: Seat, entry: ActionEntry): boolean | null {
  if (entry.street !== 'preflop') {
    throw new Error('gtoMatch: preflop entry only');
  }
  // vs-raise / vs-3bet の判定: entry より前のプリフロアクションに raise 系があったら null
  const idx = state.actions.indexOf(entry);
  const prior = idx >= 0 ? state.actions.slice(0, idx) : [];
  const facedRaise = prior.some(
    (a) =>
      a.street === 'preflop' && (a.type === 'raise' || a.type === 'bet' || a.type === 'all_in'),
  );
  if (facedRaise) return null;

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
  return entry.type === 'fold';
}
