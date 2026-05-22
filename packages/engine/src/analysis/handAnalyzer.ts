import type { ActionType, Card, Seat, Street } from '@pokergo/shared';
import type { HandState } from '../game/types';
import { type BoardTextureTag, classifyBoard } from './boardTexture';
import { type BestActionDecision, compareEv } from './ev';
import { gtoMatch } from './gtoMatch';
import { computeRequiredEquity } from './potOdds';

export interface ActionAnalysis {
  street: Street;
  action: ActionType;
  amount: number;
  toCallBefore: number;
  potBefore: number;
  equityPct: number; // 0-100
  requiredEquityPct: number | null; // toCallBefore === 0 のときは null
  bestAction: ActionType;
  takenEvBb: number;
  bestEvBb: number;
  deviationBb: number;
  gtoMatch: boolean | null; // postflop は null
  boardTexture: BoardTextureTag[] | null; // preflop は null
}

export interface HandAnalysis {
  handId: string;
  yourSeat: Seat;
  actions: ActionAnalysis[];
}

export type EquityFn = (hero: readonly [Card, Card], board: readonly Card[]) => Promise<number>;

// 完了した HandState から自分の各アクションを分析する。
// equity 計算は injection（Web Worker など）で渡す。
export async function analyzeHand(
  state: HandState,
  yourSeat: Seat,
  equityFn: EquityFn,
): Promise<HandAnalysis> {
  const player = state.players.get(yourSeat);
  if (!player) {
    return { handId: state.handId, yourSeat, actions: [] };
  }

  const actions: ActionAnalysis[] = [];
  for (const entry of state.actions) {
    if (entry.seat !== yourSeat) continue;
    const boardAtPoint = boardAtStreet(state.board, entry.street);
    const equity = await equityFn(player.holeCards, boardAtPoint);
    const requiredEq =
      entry.toCallBefore > 0 ? computeRequiredEquity(entry.toCallBefore, entry.potBefore) : null;
    const ev: BestActionDecision = compareEv(
      entry.type,
      equity,
      entry.toCallBefore,
      entry.potBefore,
      state.bb,
    );

    const isPreflop = entry.street === 'preflop';
    const match = isPreflop ? gtoMatch(state, yourSeat, entry) : null;
    const texture = isPreflop ? null : classifyBoard(boardAtPoint);

    actions.push({
      street: entry.street,
      action: entry.type,
      amount: entry.amount,
      toCallBefore: entry.toCallBefore,
      potBefore: entry.potBefore,
      equityPct: equity * 100,
      requiredEquityPct: requiredEq !== null ? requiredEq * 100 : null,
      bestAction: ev.bestAction,
      takenEvBb: ev.takenEvBb,
      bestEvBb: ev.bestEvBb,
      deviationBb: ev.deviationBb,
      gtoMatch: match,
      boardTexture: texture,
    });
  }

  return { handId: state.handId, yourSeat, actions };
}

function boardAtStreet(fullBoard: readonly Card[], street: Street): Card[] {
  switch (street) {
    case 'preflop':
      return [];
    case 'flop':
      return fullBoard.slice(0, 3);
    case 'turn':
      return fullBoard.slice(0, 4);
    case 'river':
      return fullBoard.slice(0, 5);
    case 'showdown':
      return [...fullBoard];
  }
}
