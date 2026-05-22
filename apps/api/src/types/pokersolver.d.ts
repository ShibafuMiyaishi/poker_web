// pokersolver は CJS で型を持たないので apps/api 側にもシムを置く。
// packages/engine/src/game/pokersolver.d.ts と同期。
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
    compare(other: Hand): number;
    static solve(cards: readonly string[], game?: string, canDisqualify?: boolean): Hand;
    static winners(hands: readonly Hand[]): Hand[];
  }
}
