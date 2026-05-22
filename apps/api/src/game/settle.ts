import type { Card, Seat } from '@pokergo/shared';
import { compareHands } from './handEvaluator';
import { buildSidePots } from './sidePot';
import type { HandState, WinAllocation } from './types';

export function settleHand(state: HandState): WinAllocation[] {
  const contributions = new Map<Seat, number>();
  const foldedSeats = new Set<Seat>();
  for (const p of state.players.values()) {
    contributions.set(p.seat, p.contribution);
    if (p.status === 'folded') foldedSeats.add(p.seat);
  }

  const pots = buildSidePots(contributions, foldedSeats);
  if (pots.length === 0) return [];

  const allocations: WinAllocation[] = [];
  const nonFolded = [...state.players.values()].filter((p) => p.status !== 'folded');

  // 残り 1 人 → 各ポットを全額授与
  if (nonFolded.length === 1) {
    const winner = nonFolded[0];
    if (!winner) return [];
    pots.forEach((pot, i) => {
      allocations.push({
        seat: winner.seat,
        amount: pot.amount,
        potLabel: potLabel(i, pots.length),
      });
    });
    return allocations;
  }

  // showdown: 各サイドポットで eligible のハンドを比較し奇数チップ分配
  pots.forEach((pot, i) => {
    if (pot.eligibleSeats.length === 0) return;
    if (pot.eligibleSeats.length === 1) {
      const seat = pot.eligibleSeats[0];
      if (seat === undefined) return;
      allocations.push({ seat, amount: pot.amount, potLabel: potLabel(i, pots.length) });
      return;
    }

    const hands: { seat: Seat; cards: Card[] }[] = [];
    for (const seat of pot.eligibleSeats) {
      const player = state.players.get(seat);
      if (!player) continue;
      hands.push({ seat, cards: [...player.holeCards, ...state.board] });
    }
    if (hands.length === 0) return;

    const winnerIdx = compareHands(hands.map((h) => h.cards));
    const winners = winnerIdx.map((j) => hands[j]?.seat).filter((s): s is Seat => s !== undefined);
    if (winners.length === 0) return;

    const share = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount - share * winners.length;

    // 奇数チップは BTN+1 から時計回りで最初の勝者へ
    const orderedWinners = orderWinnersFromButton(winners, state.buttonSeat);
    orderedWinners.forEach((seat, j) => {
      allocations.push({
        seat,
        amount: share + (j < remainder ? 1 : 0),
        potLabel: potLabel(i, pots.length),
      });
    });
  });

  return allocations;
}

function potLabel(idx: number, total: number): string {
  if (total === 1) return 'main pot';
  if (idx === 0) return 'main pot';
  return `side pot ${idx}`;
}

function orderWinnersFromButton(winners: Seat[], buttonSeat: Seat): Seat[] {
  const set = new Set(winners);
  const ordered: Seat[] = [];
  for (let i = 1; i <= 8; i++) {
    const s = ((buttonSeat + i) % 8) as Seat;
    if (set.has(s)) ordered.push(s);
  }
  return ordered;
}
