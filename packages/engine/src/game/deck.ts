import { ALL_52_CARDS } from '@pokergo/shared';
import type { Card } from '@pokergo/shared';

export type Rng = () => number; // returns [0, 1)

export function cryptoRng(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const v = buf[0] ?? 0;
  return v / 0x1_0000_0000;
}

// Fisher-Yates。テストで決定的にしたい場合は seeded rng を注入する。
export function shuffleDeck(rng: Rng = cryptoRng): Card[] {
  const deck = [...ALL_52_CARDS] as Card[];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = deck[i];
    const b = deck[j];
    if (a === undefined || b === undefined) continue;
    deck[i] = b;
    deck[j] = a;
  }
  return deck;
}

// テスト用の決定的 RNG (xorshift32)
export function seededRng(seed: number): Rng {
  let x = seed >>> 0;
  if (x === 0) x = 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0x1_0000_0000;
  };
}
