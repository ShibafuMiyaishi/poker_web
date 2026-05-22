import type { ActionAnalysis } from '@pokergo/engine';
import { useTableStore } from '../stores/tableStore';

function fmtPct(v: number | null): string {
  if (v === null) return '—';
  return `${v.toFixed(1)}%`;
}

function fmtBb(v: number | null): string {
  if (v === null) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}bb`;
}

function rowTint(a: ActionAnalysis): string {
  if (a.deviationBb === null) return 'bg-slate-800/40';
  if (a.deviationBb < 0.05) return 'bg-win/10';
  if (a.deviationBb < 0.3) return 'bg-slate-800/60';
  return 'bg-lose/10';
}

export function AnalysisPanel() {
  const analysis = useTableStore((s) => s.analysis);
  if (!analysis || analysis.actions.length === 0) return null;

  return (
    <div className="mt-4 w-full max-w-3xl p-3 bg-slate-900/80 border border-slate-700 rounded text-xs">
      <h2 className="text-sm font-semibold mb-2">あなたのアクション分析</h2>
      <table className="w-full">
        <thead className="text-slate-400">
          <tr>
            <th className="text-left px-2">street</th>
            <th className="text-left px-2">action</th>
            <th className="text-right px-2">equity</th>
            <th className="text-right px-2">必要勝率</th>
            <th className="text-right px-2">EV 採用</th>
            <th className="text-right px-2">EV 最善</th>
            <th className="text-left px-2">最善</th>
            <th className="text-left px-2">GTO / Board</th>
          </tr>
        </thead>
        <tbody>
          {analysis.actions.map((a, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 表示順固定
            <tr key={i} className={rowTint(a)}>
              <td className="px-2">{a.street}</td>
              <td className="px-2">
                {a.action}
                {a.amount > 0 ? ` ${a.amount}` : ''}
              </td>
              <td className="px-2 text-right">{fmtPct(a.equityPct)}</td>
              <td className="px-2 text-right">{fmtPct(a.requiredEquityPct)}</td>
              <td className="px-2 text-right">{fmtBb(a.takenEvBb)}</td>
              <td className="px-2 text-right">{fmtBb(a.bestEvBb)}</td>
              <td className="px-2">{a.bestAction}</td>
              <td className="px-2">
                {a.gtoMatch !== null
                  ? a.gtoMatch
                    ? '◯ GTO'
                    : '✗ off chart'
                  : (a.boardTexture ?? []).join(' / ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
