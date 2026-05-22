import type { Card, Seat } from '@pokergo/shared';
import { shuffleDeck } from './deck';
import type { HandPlayer, HandState } from './types';

interface Participant {
  seat: Seat;
  stack: number;
}

export interface StartHandOpts {
  handId: string;
  participants: Participant[]; // 2-8 名
  buttonSeat: Seat;
  sb: number;
  bb: number;
  deck?: Card[]; // テスト用に注入可能
}

// 8 席を BTN+1 から時計回りに並べ、participant の seat に限定し、BTN を末尾に追加。
// 注意: ループは i < 8。i=8 だと (buttonSeat+8)%8=buttonSeat となり BTN が二重登録される。
export function clockwiseSeats(participants: ReadonlySet<Seat>, buttonSeat: Seat): Seat[] {
  const result: Seat[] = [];
  for (let i = 1; i < 8; i++) {
    const candidate = ((buttonSeat + i) % 8) as Seat;
    if (participants.has(candidate)) result.push(candidate);
  }
  if (participants.has(buttonSeat)) result.push(buttonSeat);
  return result;
}

export function nextOccupiedSeat(participants: ReadonlySet<Seat>, from: Seat): Seat {
  for (let i = 1; i <= 8; i++) {
    const candidate = ((from + i) % 8) as Seat;
    if (participants.has(candidate)) return candidate;
  }
  throw new Error('nextOccupiedSeat: no other seat occupied');
}

export function startHand(opts: StartHandOpts): HandState {
  const { participants, buttonSeat, sb, bb } = opts;
  if (participants.length < 2) throw new Error('startHand: 2+ participants required');
  if (participants.length > 8) throw new Error('startHand: max 8 participants');

  const seatSet = new Set(participants.map((p) => p.seat));
  if (!seatSet.has(buttonSeat)) throw new Error('startHand: buttonSeat not in participants');

  const deck = opts.deck ? [...opts.deck] : shuffleDeck();
  const orderedSeats = clockwiseSeats(seatSet, buttonSeat);

  // 各座に hole card 2 枚配る（BTN+1 から順に）
  const players = new Map<Seat, HandPlayer>();
  let idx = 0;
  for (const seat of orderedSeats) {
    const card1 = deck[idx++];
    const card2 = deck[idx++];
    if (!card1 || !card2) throw new Error('startHand: deck exhausted');
    const participant = participants.find((p) => p.seat === seat);
    if (!participant) throw new Error(`startHand: participant ${seat} missing`);
    players.set(seat, {
      seat,
      startStack: participant.stack,
      stack: participant.stack,
      holeCards: [card1, card2],
      status: 'active',
      contribution: 0,
      currentBet: 0,
      hasActedSinceLastRaise: false,
    });
  }

  const remainingDeck = deck.slice(idx);
  const isHU = participants.length === 2;
  const sbSeat = isHU ? buttonSeat : nextOccupiedSeat(seatSet, buttonSeat);
  const bbSeat = nextOccupiedSeat(seatSet, sbSeat);

  // ブラインドを掛ける（スタック不足ならスタック分のみ）
  postBlind(players, sbSeat, sb);
  postBlind(players, bbSeat, bb);

  const firstToAct = isHU
    ? buttonSeat // HU は BTN(=SB) がプリフロ先頭
    : nextOccupiedSeat(seatSet, bbSeat); // 3+ は UTG

  const sbPlayer = players.get(sbSeat);
  const bbPlayer = players.get(bbSeat);
  const sbBet = sbPlayer?.currentBet ?? 0;
  const bbBet = bbPlayer?.currentBet ?? 0;

  return {
    handId: opts.handId,
    street: 'preflop',
    board: [],
    players,
    buttonSeat,
    sb,
    bb,
    pot: sbBet + bbBet,
    currentBet: Math.max(sbBet, bbBet),
    minRaise: bb,
    lastRaiser: null,
    toAct: firstToAct,
    deck: remainingDeck,
    actions: [],
  };
}

function postBlind(players: Map<Seat, HandPlayer>, seat: Seat, amount: number): void {
  const p = players.get(seat);
  if (!p) throw new Error(`postBlind: seat ${seat} not found`);
  const actual = Math.min(amount, p.stack);
  p.stack -= actual;
  p.currentBet = actual;
  p.contribution = actual;
  if (p.stack === 0) p.status = 'allin';
  // hasActedSinceLastRaise は false のまま（BB option を担保するため）
}

// betting round が終わって（state.toAct === null）かつ showdown でないとき呼ぶ。
// 1 人以下しか残っていない場合は showdown に飛ぶ。全員 all-in の場合も自然に showdown まで遷移する。
export function advanceStreet(state: HandState): HandState {
  if (state.toAct !== null) {
    throw new Error('advanceStreet: betting round not complete');
  }
  if (state.street === 'showdown') {
    throw new Error('advanceStreet: already in showdown');
  }

  const next = structuredClone(state);

  const nonFolded = [...next.players.values()].filter((p) => p.status !== 'folded');
  if (nonFolded.length <= 1) {
    next.street = 'showdown';
    return next;
  }

  const stillActive = nonFolded.filter((p) => p.status === 'active');

  const transitions: Record<typeof next.street, typeof next.street> = {
    preflop: 'flop',
    flop: 'turn',
    turn: 'river',
    river: 'showdown',
    showdown: 'showdown',
  };
  const newStreet = transitions[next.street];

  // ボード配布
  if (newStreet === 'flop') {
    for (let i = 0; i < 3; i++) {
      const card = next.deck.shift();
      if (!card) throw new Error('advanceStreet: deck exhausted at flop');
      next.board.push(card);
    }
  } else if (newStreet === 'turn' || newStreet === 'river') {
    const card = next.deck.shift();
    if (!card) throw new Error('advanceStreet: deck exhausted');
    next.board.push(card);
  }

  // ストリート切替時の per-street リセット
  next.currentBet = 0;
  next.minRaise = next.bb;
  next.lastRaiser = null;
  for (const p of next.players.values()) {
    p.currentBet = 0;
    if (p.status === 'active') p.hasActedSinceLastRaise = false;
  }

  next.street = newStreet;

  if (newStreet === 'showdown' || stillActive.length <= 1) {
    next.toAct = null;
  } else {
    // ポストフロップは BTN+1 から最初の active を探す
    const seatSet = new Set(next.players.keys());
    const start = nextOccupiedSeat(seatSet, next.buttonSeat);
    next.toAct = findFirstActiveFrom(next, start);
  }

  return next;
}

export function isHandOver(state: HandState): boolean {
  if (state.street === 'showdown') return true;
  const nonFolded = [...state.players.values()].filter((p) => p.status !== 'folded');
  return nonFolded.length <= 1;
}

function findFirstActiveFrom(state: HandState, start: Seat): Seat | null {
  const seatSet = new Set(state.players.keys());
  let cur: Seat = start;
  for (let i = 0; i < 8; i++) {
    const p = state.players.get(cur);
    if (p && p.status === 'active') return cur;
    cur = nextOccupiedSeat(seatSet, cur);
    if (cur === start) break;
  }
  return null;
}
