declare module 'pokersolver' {
  export class Card {
    value: string;
    suit: string;
    rank: number;
    wildValue: string;
    toString(): string;
  }

  export class Hand {
    rank: number;
    name: string;
    descr: string;
    cards: Card[];
    cardPool: Card[];
    /** Returns < 0 if this hand is BETTER than other, > 0 if worse, 0 if tied. */
    compare(other: Hand): number;
    static solve(cards: readonly string[], game?: string, canDisqualify?: boolean): Hand;
    static winners(hands: readonly Hand[]): Hand[];
  }
}
