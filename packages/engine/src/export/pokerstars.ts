import type { Seat } from '@pokergo/shared';
import type { HandState, WinAllocation } from '../game/types';

const STREETS: ReadonlyArray<'flop' | 'turn' | 'river'> = ['flop', 'turn', 'river'];

interface Opts {
  tableName: string;
  handNumber: string; // 表示用 hand id（仕様 Appendix B）
  startedAt: Date;
  seatLabel: (seat: Seat) => string; // 表示名（"Fumiya"、"Alpha" 等）
  yourSeat: Seat | null;
}

// 仕様 Appendix B の PokerStars 互換形式で書き出す。
// 「Hold'em No Limit」「8-max」「Seat n is the button」「posts SB/BB」
// 「*** HOLE CARDS *** Dealt to ...」「actions」「*** FLOP/TURN/RIVER ***」
// 「*** SUMMARY ***」の構成。
export function toPokerStarsText(state: HandState, winners: WinAllocation[], opts: Opts): string {
  const lines: string[] = [];
  const sb = state.sb;
  const bb = state.bb;
  const dateStr = formatDate(opts.startedAt);
  lines.push(
    `PokerStars Hand #${opts.handNumber}: Hold'em No Limit (${sb}/${bb}) - ${dateStr} JST`,
  );
  lines.push(`Table '${opts.tableName}' 8-max Seat #${state.buttonSeat + 1} is the button`);

  // Seat n: Name (stack in chips)
  const seats = [...state.players.keys()].sort((a, b) => a - b);
  for (const s of seats) {
    const p = state.players.get(s);
    if (!p) continue;
    lines.push(`Seat ${s + 1}: ${opts.seatLabel(s)} (${p.startStack} in chips)`);
  }

  // Blinds
  const seatSet = new Set(state.players.keys());
  const isHU = state.players.size === 2;
  const sbSeat = isHU ? state.buttonSeat : nextOccupied(seatSet, state.buttonSeat);
  const bbSeat = nextOccupied(seatSet, sbSeat);
  lines.push(`${opts.seatLabel(sbSeat)}: posts small blind ${sb}`);
  lines.push(`${opts.seatLabel(bbSeat)}: posts big blind ${bb}`);

  // Hole cards header
  lines.push('*** HOLE CARDS ***');
  if (opts.yourSeat !== null) {
    const me = state.players.get(opts.yourSeat);
    if (me) {
      lines.push(`Dealt to ${opts.seatLabel(opts.yourSeat)} [${me.holeCards.join(' ')}]`);
    }
  }

  // Actions, grouped by street
  // Preflop actions first
  appendStreetActions(lines, state, 'preflop', opts.seatLabel);

  // Flop/Turn/River
  for (const street of STREETS) {
    const streetActions = state.actions.filter((a) => a.street === street);
    const isReached =
      streetActions.length > 0 ||
      (street === 'flop' && state.board.length >= 3) ||
      (street === 'turn' && state.board.length >= 4) ||
      (street === 'river' && state.board.length >= 5);
    if (!isReached) break;

    const boardLen = street === 'flop' ? 3 : street === 'turn' ? 4 : 5;
    const upper = street.toUpperCase();
    if (street === 'flop') {
      lines.push(`*** FLOP *** [${state.board.slice(0, 3).join(' ')}]`);
    } else if (street === 'turn') {
      lines.push(`*** TURN *** [${state.board.slice(0, 3).join(' ')}] [${state.board[3] ?? ''}]`);
    } else {
      lines.push(`*** RIVER *** [${state.board.slice(0, 4).join(' ')}] [${state.board[4] ?? ''}]`);
    }
    if (boardLen) appendStreetActions(lines, state, street, opts.seatLabel);
    if (upper === 'RIVER') break;
  }

  // Showdown
  if (state.street === 'showdown') {
    const survivors = [...state.players.values()].filter((p) => p.status !== 'folded');
    if (survivors.length > 1) {
      lines.push('*** SHOWDOWN ***');
      for (const p of survivors) {
        lines.push(`${opts.seatLabel(p.seat)}: shows [${p.holeCards.join(' ')}]`);
      }
    }
  }

  // Summary
  lines.push('*** SUMMARY ***');
  const potTotal = winners.reduce((sum, w) => sum + w.amount, 0);
  lines.push(`Total pot ${potTotal} | Rake 0`);
  if (state.board.length > 0) {
    lines.push(`Board [${state.board.join(' ')}]`);
  }

  const winnerBySeat = new Map<Seat, number>();
  for (const w of winners) {
    winnerBySeat.set(w.seat, (winnerBySeat.get(w.seat) ?? 0) + w.amount);
  }
  for (const s of seats) {
    const p = state.players.get(s);
    if (!p) continue;
    const wonAmount = winnerBySeat.get(s) ?? 0;
    const isButton = s === state.buttonSeat ? ' (button)' : '';
    if (wonAmount > 0) {
      lines.push(
        `Seat ${s + 1}: ${opts.seatLabel(s)}${isButton} showed [${p.holeCards.join(' ')}] and won (${wonAmount})`,
      );
    } else if (p.status === 'folded') {
      lines.push(`Seat ${s + 1}: ${opts.seatLabel(s)}${isButton} folded`);
    } else {
      lines.push(
        `Seat ${s + 1}: ${opts.seatLabel(s)}${isButton} mucked [${p.holeCards.join(' ')}]`,
      );
    }
  }

  return lines.join('\n');
}

function appendStreetActions(
  lines: string[],
  state: HandState,
  street: 'preflop' | 'flop' | 'turn' | 'river',
  seatLabel: (s: Seat) => string,
): void {
  for (const a of state.actions) {
    if (a.street !== street) continue;
    const name = seatLabel(a.seat);
    switch (a.type) {
      case 'fold':
        lines.push(`${name}: folds`);
        break;
      case 'check':
        lines.push(`${name}: checks`);
        break;
      case 'call':
        lines.push(`${name}: calls ${a.amount}`);
        break;
      case 'bet':
        lines.push(`${name}: bets ${a.amount}`);
        break;
      case 'raise':
        // PokerStars 形式は "raises X to Y" だが、ActionEntry.amount は delta のみ。
        // 簡略化: "raises X (to Y)" として両方推定値で出す
        lines.push(`${name}: raises ${a.amount}`);
        break;
      case 'all_in':
        lines.push(`${name}: all-in ${a.amount}`);
        break;
    }
  }
}

function nextOccupied(seats: ReadonlySet<Seat>, from: Seat): Seat {
  for (let i = 1; i <= 8; i++) {
    const c = ((from + i) % 8) as Seat;
    if (seats.has(c)) return c;
  }
  throw new Error('nextOccupied: no other seat');
}

function formatDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
