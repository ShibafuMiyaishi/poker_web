import type { Card, Street } from '@pokergo/shared';
import { classifyBoard } from './boardTexture';
import { allHandKeys, combosForHand } from './handRange';
import { computeRequiredEquity } from './potOdds';
import type { HandRange } from './types';

// villain の推定フォールド率 (0-1)。
// 計算: 理論値 (Bluff:Value 比率) と レンジベース (pot odds が合わないコンボ割合) の加重平均。
export function estimateFoldEquity(
  betAmount: number,
  potBefore: number,
  villainRange: HandRange,
  board: readonly Card[],
  street: Street,
  deadCards: readonly Card[],
): number {
  if (betAmount <= 0) return 0;
  // 理論値: street ごとのフォールド頻度目安
  const theoretical = streetFoldTheoretical(street, betAmount, potBefore);

  // レンジベース: villain は pot odds を満たさない弱いコンボをフォールドすると仮定
  const requiredEq = computeRequiredEquity(betAmount, potBefore);
  const rangeFold = foldFractionFromRange(villainRange, board, requiredEq, deadCards);

  // 加重平均 (理論 0.4 / レンジ 0.6)
  const blend = theoretical * 0.4 + rangeFold * 0.6;
  return Math.max(0.1, Math.min(0.85, blend));
}

function streetFoldTheoretical(street: Street, bet: number, pot: number): number {
  const ratio = bet / (pot + bet); // 0.5 で half pot 相当
  // Bluff:Value 比率の逆算
  // Flop (B:V = 2:1) → defenders ≈ 1 - α, α = pot/(pot+bet) = 1 - ratio. fold = ratio
  // Turn (1:1): fold = ratio * 0.7
  // River (1:2): fold = ratio * 0.5
  if (street === 'flop') return ratio;
  if (street === 'turn') return ratio * 0.75;
  if (street === 'river') return ratio * 0.55;
  return ratio * 0.5; // preflop / showdown は基本適用外
}

// villain レンジから、推定エクイティ (heuristic) が requiredEquity を下回るコンボの割合
function foldFractionFromRange(
  range: HandRange,
  board: readonly Card[],
  requiredEq: number,
  deadCards: readonly Card[],
): number {
  const dead = new Set<string>(deadCards);
  let totalWeighted = 0;
  let foldWeighted = 0;
  const boardWet = classifyBoard(board).some(
    (t) => t === 'dynamic' || t === 'monotone' || t === 'two_tone',
  );
  const wetBoost = boardWet ? -0.05 : 0; // wet ボードでは drawful なのでフォールドしにくい

  for (const k of allHandKeys()) {
    const w = range[k] ?? 0;
    if (w <= 0) continue;
    const combos = combosForHand(k);
    for (const combo of combos) {
      if (dead.has(combo[0]) || dead.has(combo[1])) continue;
      // 簡易エクイティ推定: ハンドストレングス (vs ランダムの 0-1) を board と勘案
      const eq = quickEquity(k, board) + wetBoost;
      totalWeighted += w;
      if (eq < requiredEq) foldWeighted += w;
    }
  }
  return totalWeighted > 0 ? foldWeighted / totalWeighted : 0;
}

// ハンドストレングスをポストフロップ board と勘案する簡易計算 (vs random opponent の概算)
function quickEquity(k: string, board: readonly Card[]): number {
  // gto-charts の handStrength と同じ
  const base = strengthHeuristic(k);
  // board がある場合、ペア / セット可能性を概算で加算
  if (board.length >= 3) {
    const ch1 = k[0];
    if (ch1 && board.some((c) => c[0] === ch1)) return Math.min(0.85, base + 0.15);
  }
  return base;
}

function strengthHeuristic(k: string): number {
  if (k.length === 2) {
    const r = rankVal(k[0] ?? '');
    return 0.5 + (r - 2) * 0.029;
  }
  const v1 = rankVal(k[0] ?? '');
  const v2 = rankVal(k[1] ?? '');
  const suited = k[2] === 's';
  let s = 0.3 + (v1 + v2) / 100;
  if (suited) s += 0.04;
  const gap = v1 - v2 - 1;
  if (gap === 0) s += 0.03;
  else if (gap === 1) s += 0.02;
  else if (gap === 2) s += 0.01;
  if (v1 === 14 && suited) s += 0.03;
  return Math.min(0.85, s);
}

function rankVal(ch: string): number {
  if (ch === 'A') return 14;
  if (ch === 'K') return 13;
  if (ch === 'Q') return 12;
  if (ch === 'J') return 11;
  if (ch === 'T') return 10;
  const n = Number.parseInt(ch, 10);
  return Number.isFinite(n) ? n : 0;
}
