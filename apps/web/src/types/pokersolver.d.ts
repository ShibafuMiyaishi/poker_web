// pokersolver は CJS で型を持たないので、apps/web 側にも同等のシムを置く。
// packages/engine/src/game/pokersolver.d.ts と内容を同期させること。
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
