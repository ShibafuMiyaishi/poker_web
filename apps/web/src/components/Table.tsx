import { derivePosition, evaluateHand } from '@pokergo/engine';
import type { Card as CardType, Seat } from '@pokergo/shared';
import { useEffect, useMemo, useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { getStoredUser } from '../lib/auth';
import { useTableStore } from '../stores/tableStore';
import { ActionLog } from './ActionLog';
import { ActionPanel } from './ActionPanel';
import { AnalysisPanel } from './AnalysisPanel';
import { Board } from './Board';
import { HandStrengthBadge } from './HandStrengthBadge';
import { SeatView } from './Seat';
import { VineFrame } from './primitives/VineCorner';

// 楕円卓レイアウト: 自席 = 視覚位置 0 (下中央)、時計回り。
// デスクトップ: aspect-[16/9] で広い felt に席が周回。
// モバイル: aspect-[4/5] portrait + 席をさらに外側に + compact 化。
//
// VISUAL_POSITIONS_DESKTOP: brass rim wrapper の絶対子として配置 → felt の overflow:hidden に巻き込まれず縁で食われない。
const VISUAL_POSITIONS_DESKTOP: {
  top: string;
  left: string;
  position: 'top' | 'side' | 'bottom';
}[] = [
  { top: '93%', left: '50%', position: 'bottom' },
  { top: '77%', left: '14%', position: 'bottom' },
  { top: '42%', left: '2%', position: 'side' },
  { top: '8%', left: '14%', position: 'top' },
  { top: '-4%', left: '50%', position: 'top' },
  { top: '8%', left: '86%', position: 'top' },
  { top: '42%', left: '98%', position: 'side' },
  { top: '77%', left: '86%', position: 'bottom' },
];

// モバイル向け: 席を表示領域内に確実に収める (上下端が viewport で見切れない)。
// R3 のフィードバックを受けて -8% / -4% / 97% / 104% の外側位置を内側に寄せた。
const VISUAL_POSITIONS_MOBILE: typeof VISUAL_POSITIONS_DESKTOP = [
  { top: '90%', left: '50%', position: 'bottom' }, // 0: あなた
  { top: '76%', left: '12%', position: 'bottom' }, // 1
  { top: '50%', left: '4%', position: 'side' }, // 2
  { top: '14%', left: '12%', position: 'top' }, // 3
  { top: '6%', left: '50%', position: 'top' }, // 4: top-center, 上端から十分内側
  { top: '14%', left: '88%', position: 'top' }, // 5
  { top: '50%', left: '96%', position: 'side' }, // 6
  { top: '76%', left: '88%', position: 'bottom' }, // 7
];

function buildVisualOrder(yourSeat: Seat, seatCount = 8): Seat[] {
  const order: Seat[] = [];
  for (let i = 0; i < seatCount; i++) {
    order.push(((yourSeat + i) % seatCount) as Seat);
  }
  return order;
}

export function Table() {
  const isMobile = useIsMobile();
  const state = useTableStore((s) => s.state);
  const yourSeat = useTableStore((s) => s.yourSeat);
  const cpuNames = useTableStore((s) => s.cpuNames);
  const showdownRevealed = useTableStore((s) => s.showdownRevealed);
  const winners = useTableStore((s) => s.winners);
  const handsPlayed = useTableStore((s) => s.handsPlayed);
  const actionDeadline = useTableStore((s) => s.actionDeadline);
  const actionTotal = useTableStore((s) => s.actionTotalMs);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (actionDeadline === null) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [actionDeadline]);
  const remainingMs = actionDeadline !== null ? Math.max(0, actionDeadline - now) : 0;

  // Hooks は早期 return より前にすべて呼ぶ (React の Rules of Hooks)
  // 自分のポジション (UTG/BTN 等) — state が null の場合は null を返す
  const yourPosition = useMemo(
    () => (state ? derivePosition(state, yourSeat) : null),
    [state, yourSeat],
  );

  // showdown 時の勝利役を作る 5 枚を集合化 (brass glow 用)
  const winningCardSet = useMemo<ReadonlySet<string> | undefined>(() => {
    if (!state || !winners || !showdownRevealed) return undefined;
    const cards = new Set<string>();
    for (const w of winners) {
      const p = state.players.get(w.seat);
      if (!p) continue;
      const all: CardType[] = [...p.holeCards, ...state.board];
      if (all.length < 5) continue;
      try {
        const r = evaluateHand(all);
        for (const c of r.cards) cards.add(c);
      } catch {
        /* ignore */
      }
    }
    return cards;
  }, [winners, showdownRevealed, state]);

  // すべての hooks の後に早期 return
  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="text-2xl font-display brass-text font-bold tracking-widest animate-pulse">
          Pokergo
        </div>
        <div className="text-sm font-jp tracking-widest text-ivory-muted">準備中</div>
      </div>
    );
  }

  const youWon = winners?.some((w) => w.seat === yourSeat) ?? false;
  const yourPlayer = state.players.get(yourSeat);
  const visualOrder = buildVisualOrder(yourSeat);
  const user = getStoredUser();
  const yourLabel = user?.handle ?? 'あなた';

  const positions = isMobile ? VISUAL_POSITIONS_MOBILE : VISUAL_POSITIONS_DESKTOP;
  // モバイルは縦長 portrait、デスクトップは横長
  const aspect = isMobile ? 'aspect-[4/5]' : 'aspect-[16/9]';
  // モバイルは felt 縁を緩く、デスクトップは強く丸める
  const tableRadius = isMobile ? 'rounded-[36%]' : 'rounded-[40%]';
  const innerRadius = isMobile ? 'rounded-[34%]' : 'rounded-[38%]';
  const ornamentSize = isMobile ? 24 : 40;
  const ornamentInset = isMobile ? 16 : 28;

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-5 w-full">
      {/* 卓情報バー: ハンド番号 / 参加数 / ブラインド / 自分の位置 */}
      <div className="flex items-stretch border border-brass/30 rounded-md bg-ink-deepest/70 backdrop-blur-sm overflow-hidden shadow-card text-[11px] sm:text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-brass-deep/40 to-brass-deep/10 border-r border-brass/30">
          <span className="font-display italic text-[10px] text-brass tracking-widest uppercase">
            Hand
          </span>
          <span className="brass-text font-display font-bold tabular-nums text-sm">
            #{handsPlayed + 1}
          </span>
        </div>
        <div className="px-3 sm:px-4 py-1.5 flex items-baseline gap-1.5 border-r border-brass/15">
          <span className="text-ivory font-mono-tabular tabular-nums font-semibold">
            {state.players.size}
          </span>
          <span className="font-jp text-ivory-muted text-[10px]">人</span>
        </div>
        <div className="px-3 sm:px-4 py-1.5 flex items-baseline gap-1.5 border-r border-brass/15">
          <span className="font-jp text-ivory-muted text-[10px] tracking-widest">SB/BB</span>
          <span className="text-ivory font-mono-tabular tabular-nums">
            {state.sb}/{state.bb}
          </span>
        </div>
        {yourPlayer && (
          <div className="px-3 sm:px-4 py-1.5 flex items-baseline gap-1.5">
            <span className="font-jp text-ivory-muted text-[10px] tracking-widest">位置</span>
            <span className="text-brass-light font-mono-tabular tabular-nums font-bold">
              {yourPosition}
            </span>
          </div>
        )}
      </div>

      {/* 楕円卓 */}
      <div className={`relative w-full max-w-4xl ${aspect}`}>
        <div
          className={`absolute inset-0 ${tableRadius} p-[6px] sm:p-[8px] brass-rim shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]`}
        >
          <div className={`relative w-full h-full ${innerRadius} felt-surface overflow-hidden`}>
            <VineFrame size={ornamentSize} inset={ornamentInset} />
          </div>
        </div>

        {/* Board (中央) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <Board state={state} compact={isMobile} />
        </div>

        {/* 席 (brass-rim 外側、clip 影響なし) */}
        {positions.map((pos, idx) => {
          const seat = visualOrder[idx];
          if (seat === undefined) return null;
          const player = state.players.get(seat);
          const isYou = seat === yourSeat;
          const isToAct = state.toAct === seat;
          const isButton = state.buttonSeat === seat;
          const label = isYou ? yourLabel : (cpuNames.get(seat) ?? `Seat ${seat}`);
          // ポーカーポジション (UTG/BTN 等)。player が居ない席は計算スキップ。
          let pokerPosition: string | undefined;
          if (player) {
            try {
              pokerPosition = derivePosition(state, seat);
            } catch {
              /* ignore */
            }
          }
          return (
            <div
              key={seat}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
              style={{ top: pos.top, left: pos.left }}
            >
              <SeatView
                seat={seat}
                player={player}
                isYou={isYou}
                isButton={isButton}
                isToAct={isToAct}
                showdownRevealed={showdownRevealed}
                label={label}
                remainingMs={isToAct ? remainingMs : 0}
                totalMs={isToAct ? actionTotal : 0}
                position={pos.position}
                pokerPosition={pokerPosition}
                winningCards={winningCardSet}
                compact={isMobile}
              />
            </div>
          );
        })}
      </div>

      {/* アクションログ (live feed): 最新 3 アクション */}
      <ActionLog state={state} yourSeat={yourSeat} cpuNames={cpuNames} yourLabel={yourLabel} />

      {/* あなたの役 (浮世絵スタンプ): フォールド中は非表示 */}
      {yourPlayer && (
        <HandStrengthBadge
          holeCards={
            yourPlayer.holeCards[0] && yourPlayer.holeCards[1]
              ? [yourPlayer.holeCards[0], yourPlayer.holeCards[1]]
              : null
          }
          board={state.board}
          folded={yourPlayer.status === 'folded'}
        />
      )}

      {/* 勝者ペナント — winner-halo アニメ付き */}
      {winners && showdownRevealed && (
        <output className="flex flex-col items-center gap-2 animate-stamp" aria-live="polite">
          <div
            className={`px-5 py-2 rounded-md border-2 font-display tracking-widest ${
              youWon
                ? 'bg-gradient-to-b from-jade/30 to-jade/10 border-jade/60 text-jade-glow animate-winner'
                : 'bg-gradient-to-b from-ink-deep to-ink border-brass/30 text-ivory-dim'
            }`}
          >
            <span className="text-base sm:text-lg font-bold">
              {youWon ? '✦ あなたの勝利 ✦' : 'ハンド終了'}
            </span>
          </div>
          <div className="text-[11px] font-mono-tabular text-ivory-dim flex gap-2 flex-wrap justify-center max-w-md">
            {winners.map((w, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: 単純列挙
                key={i}
                className={`px-2 py-0.5 rounded border ${
                  w.seat === yourSeat
                    ? 'bg-jade/10 text-jade-glow border-jade/40'
                    : 'bg-ink-deep/70 text-ivory-dim border-ink-line/60'
                }`}
              >
                seat {w.seat} <span className="brass-text">+{w.amount}</span>
              </span>
            ))}
          </div>
        </output>
      )}

      <ActionPanel />
      <AnalysisPanel />
    </div>
  );
}
