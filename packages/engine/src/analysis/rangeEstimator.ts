import { type ChartScenario, handStrength, loadChart } from '@pokergo/gto-charts';
import type { Position } from '@pokergo/gto-charts';
import type { Card, Seat } from '@pokergo/shared';
import { derivePosition } from '../ai/decide';
import type { ActionEntry, HandState } from '../game/types';
import { classifyBoard } from './boardTexture';
import { allHandKeys, createRange, uniformRange } from './handRange';
import type { HandRange } from './types';

// GTO チャート値から weight (0-1) を抽出。
function weightFromAction(action: string): number {
  if (action === 'fold') return 0;
  if (action === 'raise') return 1;
  if (action === 'call') return 1;
  if (action.startsWith('mixed:')) {
    const p = Number.parseFloat(action.slice('mixed:'.length));
    return Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : 0.3;
  }
  return 0;
}

// プリフロのアクション履歴 + ポジション + 現在のシナリオから、villain の参加レンジを推定する。
// 1) プリフロ参加した: open / vs-raise / vs-3bet のチャートを参照、参加判定 (raise/call/mixed) で weight を付与。
// 2) ポストフロップ続行: bet/raise=value 寄り、check/call=保守的に 0.7×。ボード wet なら draw 系を保持。
// 3) 履歴が不足する場合は uniformRange(0.3) フォールバック。
export function estimateVillainRange(
  state: HandState,
  villainSeat: Seat,
  _deadCards: readonly Card[],
): HandRange {
  const preflopActs = state.actions.filter((a) => a.street === 'preflop' && a.seat === villainSeat);
  if (preflopActs.length === 0) return uniformRange(0.3);

  const position = derivePosition(state, villainSeat);
  const baseRange = preflopRange(state, villainSeat, preflopActs, position);

  // ポストフロップ絞り込み
  let range = baseRange;
  for (const street of ['flop', 'turn', 'river'] as const) {
    const acts = state.actions.filter((a) => a.street === street && a.seat === villainSeat);
    if (acts.length === 0) continue;
    const board = sliceBoard(state.board, street);
    const aggressive = acts.some(
      (a) => a.type === 'bet' || a.type === 'raise' || a.type === 'all_in',
    );
    range = narrowPostflop(range, board, aggressive);
  }
  return range;
}

function preflopRange(
  state: HandState,
  _villainSeat: Seat,
  preflopActs: ActionEntry[],
  position: Position,
): HandRange {
  // 最後の voluntary action を見て scenario を判定する。
  // open: villain より前に raise/bet がなかった → villain が open
  // vs-raise: villain より前に 1 回 raise
  // vs-3bet: 2 回以上
  const lastAct = preflopActs[preflopActs.length - 1];
  if (!lastAct) return uniformRange(0.3);
  const idx = state.actions.indexOf(lastAct);
  const prior = state.actions.slice(0, idx);
  const raiseCount = prior.filter(
    (a) =>
      a.street === 'preflop' && (a.type === 'raise' || a.type === 'bet' || a.type === 'all_in'),
  ).length;
  const scenario: ChartScenario =
    raiseCount === 0 ? 'open' : raiseCount === 1 ? 'vs-raise' : 'vs-3bet';

  const chart = loadChart(position, scenario);
  const range = createRange({});
  for (const k of allHandKeys()) {
    const action = chart[k] ?? 'fold';
    // villain が今回 raise/bet なら、chart の raise/mixed を weight 化
    // villain が call なら、call ライン (and partial mixed)
    // fold なら 0
    if (lastAct.type === 'fold') {
      range[k] = 0;
      continue;
    }
    if (lastAct.type === 'raise' || lastAct.type === 'bet' || lastAct.type === 'all_in') {
      // raise レンジ
      range[k] =
        action === 'raise' ? 1 : action.startsWith('mixed:') ? weightFromAction(action) : 0;
    } else if (lastAct.type === 'call' || lastAct.type === 'check') {
      // call レンジ (raise も chart 上にあれば mixed の余りを取る)
      range[k] =
        action === 'call' ? 1 : action.startsWith('mixed:') ? 1 - weightFromAction(action) : 0;
    }
  }
  return range;
}

function narrowPostflop(range: HandRange, board: readonly Card[], aggressive: boolean): HandRange {
  // 簡略: 各ハンドの weight を一律にスケール。aggressive → value heavy (上位 30% を残す)、
  // passive → 全体に 0.7× の保守的絞り込み。
  // wet board の場合は draw 系も残すため、scale を緩める。
  const tags = classifyBoard(board);
  const isWet = tags.includes('dynamic') || tags.includes('two_tone') || tags.includes('monotone');
  const out: HandRange = {};
  for (const k of allHandKeys()) {
    const w = range[k] ?? 0;
    if (w <= 0) {
      out[k] = 0;
      continue;
    }
    if (aggressive) {
      // value 寄り: ストレングス推定値で 0.5 以上のみ残す (gto-charts/handStrength を共有 DRY)
      const s = handStrength(k);
      out[k] = s >= 0.55 ? w : isWet && s >= 0.45 ? w * 0.5 : 0;
    } else {
      out[k] = w * 0.7;
    }
  }
  return out;
}

function sliceBoard(fullBoard: readonly Card[], street: 'flop' | 'turn' | 'river'): Card[] {
  switch (street) {
    case 'flop':
      return fullBoard.slice(0, 3);
    case 'turn':
      return fullBoard.slice(0, 4);
    case 'river':
      return fullBoard.slice(0, 5);
  }
}
