import type { ActionAnalysis } from '@pokergo/engine';
import { useTableStore } from '../stores/tableStore';

function fmtPct(v: number | null): string {
  if (v === null) return '—';
  return `${v.toFixed(1)}%`;
}

function fmtBb(v: number | null): string {
  if (v === null) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}`;
}

function rowTint(a: ActionAnalysis): string {
  if (a.deviationBb === null) return 'bg-ink-deep/40';
  if (a.deviationBb < 0.05) return 'bg-jade/10';
  if (a.deviationBb < 0.3) return 'bg-ink-soft/60';
  return 'bg-crimson/15';
}

const STREET_JP: Record<string, string> = {
  preflop: 'プリフロ',
  flop: 'フロップ',
  turn: 'ターン',
  river: 'リバー',
  showdown: 'SD',
};

export function AnalysisPanel() {
  const analysis = useTableStore((s) => s.analysis);
  if (!analysis || analysis.actions.length === 0) return null;

  return (
    <div className="relative mt-4 w-full max-w-3xl rounded-md border border-brass/25 bg-gradient-to-b from-ink-deep/95 to-ink/95 shadow-card overflow-hidden">
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
      <div className="px-4 py-3 border-b border-brass/15 flex items-baseline gap-2">
        <span className="font-jp text-sm text-ivory tracking-widest">アクション分析</span>
        <span className="font-display italic text-[10px] text-brass tracking-widest uppercase opacity-80">
          Action Analysis
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-ivory-muted">
            <tr className="border-b border-ink-line/60">
              <th className="text-left px-3 py-2 font-display italic font-normal tracking-widest">
                street
              </th>
              <th className="text-left px-3 py-2 font-display italic font-normal tracking-widest">
                action
              </th>
              <th className="text-right px-3 py-2 font-display italic font-normal tracking-widest">
                eq
              </th>
              <th className="text-right px-3 py-2 font-display italic font-normal tracking-widest">
                需勝率
              </th>
              <th className="text-right px-3 py-2 font-display italic font-normal tracking-widest">
                EV採
              </th>
              <th className="text-right px-3 py-2 font-display italic font-normal tracking-widest">
                EV最
              </th>
              <th className="text-left px-3 py-2 font-display italic font-normal tracking-widest">
                最善
              </th>
              <th className="text-left px-3 py-2 font-display italic font-normal tracking-widest">
                GTO/Board
              </th>
            </tr>
          </thead>
          <tbody>
            {analysis.actions.map((a, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: 表示順固定
              <tr key={i} className={`${rowTint(a)} border-b border-ink-line/30`}>
                <td className="px-3 py-1.5 font-jp text-ivory-dim">
                  {STREET_JP[a.street] ?? a.street}
                </td>
                <td className="px-3 py-1.5 font-display text-ivory">
                  {a.action}
                  {a.amount > 0 ? ` ${a.amount}` : ''}
                </td>
                <td className="px-3 py-1.5 text-right font-mono-tabular">{fmtPct(a.equityPct)}</td>
                <td className="px-3 py-1.5 text-right font-mono-tabular text-ivory-dim">
                  {fmtPct(a.requiredEquityPct)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono-tabular">{fmtBb(a.takenEvBb)}</td>
                <td className="px-3 py-1.5 text-right font-mono-tabular brass-text font-bold">
                  {fmtBb(a.bestEvBb)}
                </td>
                <td className="px-3 py-1.5 font-display italic text-brass">{a.bestAction}</td>
                <td className="px-3 py-1.5 text-[10px] text-ivory-muted">
                  {a.gtoMatch !== null
                    ? a.gtoMatch
                      ? '◯ GTO 内'
                      : '✗ chart 外'
                    : (a.boardTexture ?? []).join(' / ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
