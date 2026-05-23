import type { ActionType, Street } from '@pokergo/shared';
import { evCall, evCheck, evFold } from './ev';
import type { HandCategory, OutsBreakdown } from './types';

export interface AdvancedEvResult {
  evFoldBb: number;
  evCheckBb: number | null;
  evCallBb: number | null;
  evBetBb: number | null;
  evRaiseBb: number | null;
  impliedOddsBonusBb: number;
  bestEvBb: number;
  bestAction: ActionType;
  suggestedBetAmount: number; // チップ単位 (情報提供)
}

export interface ComputeAdvancedEvParams {
  equityVsRange: number; // 0-1
  toCallBefore: number;
  potBefore: number;
  heroStack: number;
  bb: number;
  foldEquity: number; // 0-1
  handCategory: HandCategory;
  street: Street;
  outs: OutsBreakdown | null;
}

// EV(bet B into P) = foldEq * P + (1 - foldEq) * (callEq * (P + 2B) - B)
// bet 単位は chip。bb 換算は最後に行う。
function evBetChips(P: number, B: number, foldEq: number, callEq: number): number {
  return foldEq * P + (1 - foldEq) * (callEq * (P + 2 * B) - B);
}

// 推奨ベットサイズ (chip 単位)
function suggestBet(params: ComputeAdvancedEvParams): number {
  const { potBefore, handCategory, street } = params;
  let fraction = 0.5;
  switch (handCategory) {
    case 'set':
    case 'trips':
    case 'two-pair':
    case 'straight':
    case 'flush':
    case 'full-house-plus':
      fraction = 0.66; // 2/3 pot value
      break;
    case 'top-pair':
    case 'overpair':
      fraction = 0.55;
      break;
    case 'fd':
    case 'oesd':
    case 'combo-draw':
      fraction = 0.5; // semi-bluff
      break;
    case 'gs':
      fraction = 0.4;
      break;
    case 'air':
    case 'weak-pair':
      fraction = 0.5;
      break;
    default:
      fraction = 0.5;
  }
  // ストリート別補正: river では polarize → pot 寄り
  if (street === 'river') fraction = Math.min(1, fraction + 0.15);
  return Math.max(params.bb, Math.round(potBefore * fraction));
}

export function computeAdvancedEv(params: ComputeAdvancedEvParams): AdvancedEvResult {
  const {
    equityVsRange,
    toCallBefore,
    potBefore,
    heroStack,
    bb,
    foldEquity,
    handCategory,
    street,
    outs,
  } = params;
  const evFoldBb = evFold() / bb;
  const evCheckBb = toCallBefore === 0 ? evCheck(equityVsRange, potBefore) / bb : null;
  const evCallBb = toCallBefore > 0 ? evCall(equityVsRange, toCallBefore, potBefore) / bb : null;

  // impliedOddsBonus: draw 系のみ
  const draw = handCategory === 'fd' || handCategory === 'oesd' || handCategory === 'combo-draw';
  let impliedOddsBonusBb = 0;
  if (draw && outs) {
    const streetsRemain = street === 'flop' ? 2 : street === 'turn' ? 1 : 0;
    const raw = outs.clean * 0.02 * streetsRemain * heroStack;
    const cap = potBefore * 0.5;
    impliedOddsBonusBb = Math.min(raw, cap) / bb;
  }

  // bet/raise EV (postflop のみ意味がある)
  let evBetBb: number | null = null;
  let evRaiseBb: number | null = null;
  const suggestedBetAmount = suggestBet(params);
  if (street !== 'preflop' && toCallBefore === 0) {
    // ベット
    const ev = evBetChips(potBefore, suggestedBetAmount, foldEquity, equityVsRange);
    evBetBb = ev / bb;
  } else if (street !== 'preflop' && toCallBefore > 0) {
    // レイズ (raise 後の pot = potBefore + toCallBefore + raiseAmount)
    // 簡略化: raise amount = suggested. opponent が call すると仮定して再評価。
    const raiseAdd = suggestedBetAmount;
    const newPot = potBefore + toCallBefore + raiseAdd;
    const ev = evBetChips(newPot, raiseAdd, foldEquity, equityVsRange) - toCallBefore;
    evRaiseBb = ev / bb;
  }

  // bestAction 決定
  const candidates: { action: ActionType; ev: number | null }[] = [
    { action: 'fold', ev: evFoldBb },
    { action: 'check', ev: evCheckBb },
    { action: 'call', ev: evCallBb !== null ? evCallBb + impliedOddsBonusBb : null },
    { action: 'bet', ev: evBetBb },
    { action: 'raise', ev: evRaiseBb },
  ];
  let bestAction: ActionType = 'fold';
  let bestEv = evFoldBb;
  for (const c of candidates) {
    if (c.ev === null) continue;
    if (c.ev > bestEv) {
      bestEv = c.ev;
      bestAction = c.action;
    }
  }
  // toCallBefore===0 で fold は採らない (check 優先)
  if (toCallBefore === 0 && bestAction === 'fold') {
    bestAction = 'check';
    bestEv = evCheckBb ?? 0;
  }

  return {
    evFoldBb,
    evCheckBb,
    evCallBb,
    evBetBb,
    evRaiseBb,
    impliedOddsBonusBb,
    bestEvBb: bestEv,
    bestAction,
    suggestedBetAmount,
  };
}
