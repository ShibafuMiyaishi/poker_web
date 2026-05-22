import type { Seat } from '@pokergo/shared';

export interface SidePot {
  amount: number;
  eligibleSeats: Seat[];
}

export function buildSidePots(
  contributions: ReadonlyMap<Seat, number>,
  foldedSeats: ReadonlySet<Seat>,
): SidePot[] {
  const activeSeats: Seat[] = [];
  for (const seat of contributions.keys()) {
    if (!foldedSeats.has(seat)) activeSeats.push(seat);
  }

  const activeContributions = activeSeats
    .map((s) => contributions.get(s) ?? 0)
    .filter((v) => v > 0);

  const levels = [...new Set(activeContributions)].sort((a, b) => a - b);
  if (levels.length === 0) return [];

  const pots: SidePot[] = [];
  let prevLevel = 0;
  for (const level of levels) {
    let amount = 0;
    for (const contribution of contributions.values()) {
      amount += Math.max(0, Math.min(contribution, level) - prevLevel);
    }
    const eligible = activeSeats.filter((s) => (contributions.get(s) ?? 0) >= level);
    if (amount > 0) {
      pots.push({ amount, eligibleSeats: eligible });
    }
    prevLevel = level;
  }
  return pots;
}
