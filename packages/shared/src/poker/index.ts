// ポーカー定数。値だけ。ロジックは apps 側に置く。

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
export const SUITS = ['s', 'h', 'd', 'c'] as const;

export const ALL_52_CARDS: string[] = RANKS.flatMap((r) => SUITS.map((s) => `${r}${s}`));

export const HAND_RANK_NAMES = [
  'High Card',
  'One Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush',
] as const;
