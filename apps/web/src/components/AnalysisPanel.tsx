import type { ActionAnalysis, Verdict } from '@pokergo/engine';
import { useState } from 'react';
import { useTableStore } from '../stores/tableStore';

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—';
  return `${v.toFixed(1)}%`;
}

function fmtBb(v: number | null | undefined): string {
  if (v == null) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}`;
}

function rowTint(a: ActionAnalysis): string {
  // verdict 優先
  if (a.verdict === 'mistake') return 'bg-crimson/15';
  if (a.verdict === 'questionable') return 'bg-bone-deep/10';
  if (a.verdict === 'good') return 'bg-jade/10';
  if (a.verdict === 'optimal') return 'bg-jade/15';
  // フォールバック (deviation ベース)
  if (a.deviationBb === null) return '';
  if (a.deviationBb < 0.05) return 'bg-jade/10';
  if (a.deviationBb < 0.3) return '';
  return 'bg-crimson/12';
}

const STREET_JP: Record<string, string> = {
  preflop: 'プリフロ',
  flop: 'フロップ',
  turn: 'ターン',
  river: 'リバー',
  showdown: 'SD',
};

const ACTION_JP: Record<string, string> = {
  fold: 'フォールド',
  check: 'チェック',
  call: 'コール',
  bet: 'ベット',
  raise: 'レイズ',
  all_in: 'オールイン',
};

const VERDICT_BADGE: Record<Verdict, { label: string; cls: string }> = {
  optimal: {
    label: '◎ 最善',
    cls: 'bg-jade/25 text-jade-glow border border-jade/50',
  },
  good: {
    label: '○ 良手',
    cls: 'bg-brass/15 text-brass-light border border-brass/40',
  },
  questionable: {
    label: '△ 疑問',
    cls: 'bg-bone-deep/20 text-bone-deep border border-bone-deep/40',
  },
  mistake: {
    label: '✗ ミス',
    cls: 'bg-vermilion/20 text-vermilion-light border border-vermilion/45',
  },
};

function VerdictBadge({ v }: { v?: Verdict | undefined }) {
  if (!v) return <span className="text-ivory-muted">—</span>;
  const b = VERDICT_BADGE[v];
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-jp tracking-wider ${b.cls}`}
    >
      {b.label}
    </span>
  );
}

export function AnalysisPanel() {
  const analysis = useTableStore((s) => s.analysis);
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!analysis || analysis.actions.length === 0) return null;

  return (
    <div className="relative mt-4 w-full max-w-3xl rounded-md border border-brass/25 bg-gradient-to-b from-ink-deep/95 to-ink/95 shadow-card overflow-hidden">
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
      <div className="px-4 py-3 border-b border-brass/15">
        <h3 className="font-jp text-base text-ivory tracking-widest">アクション分析</h3>
        <p className="text-[10px] text-ivory-muted font-jp mt-0.5">
          各アクションの期待値 (EV)、推定レンジ、判定。行をタップで詳細を展開。
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-ivory-muted">
            <tr className="border-b border-ink-line/60">
              <th className="text-left px-2 py-2 font-jp font-medium tracking-widest text-[10px]">
                局
              </th>
              <th className="text-left px-2 py-2 font-jp font-medium tracking-widest text-[10px]">
                行動
              </th>
              <th className="text-right px-2 py-2 font-jp font-medium tracking-widest text-[10px]">
                eq
              </th>
              <th className="text-right px-2 py-2 font-jp font-medium tracking-widest text-[10px]">
                需勝率
              </th>
              <th className="text-right px-2 py-2 font-jp font-medium tracking-widest text-[10px]">
                EV採
              </th>
              <th className="text-right px-2 py-2 font-jp font-medium tracking-widest text-[10px]">
                EV最
              </th>
              <th className="text-left px-2 py-2 font-jp font-medium tracking-widest text-[10px]">
                最善
              </th>
              <th className="text-left px-2 py-2 font-jp font-medium tracking-widest text-[10px]">
                GTO/盤面
              </th>
              <th className="text-left px-2 py-2 font-jp font-medium tracking-widest text-[10px]">
                判定
              </th>
            </tr>
          </thead>
          <tbody>
            {analysis.actions.map((a) => (
              <RowGroup
                key={a.orderNo}
                a={a}
                expanded={expanded === a.orderNo}
                onToggle={() => setExpanded(expanded === a.orderNo ? null : a.orderNo)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowGroup({
  a,
  expanded,
  onToggle,
}: { a: ActionAnalysis; expanded: boolean; onToggle: () => void }) {
  const hasDetail = (a.reasoning?.length ?? 0) > 0 || a.handCategory != null;
  return (
    <>
      <tr
        className={`${rowTint(a)} border-b border-ink-line/30 ${hasDetail ? 'cursor-pointer hover:brightness-110' : ''}`}
        onClick={hasDetail ? onToggle : undefined}
        onKeyDown={(e) => {
          if (hasDetail && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <td className="px-2 py-1.5 font-jp text-ivory-dim">{STREET_JP[a.street] ?? a.street}</td>
        <td className="px-2 py-1.5 font-jp text-ivory">
          {ACTION_JP[a.action] ?? a.action}
          {a.amount > 0 && (
            <span className="font-mono-tabular ml-1 text-ivory-dim">{a.amount}</span>
          )}
        </td>
        <td className="px-2 py-1.5 text-right font-mono-tabular">{fmtPct(a.equityPct)}</td>
        <td className="px-2 py-1.5 text-right font-mono-tabular text-ivory-dim">
          {fmtPct(a.requiredEquityPct)}
        </td>
        <td className="px-2 py-1.5 text-right font-mono-tabular">{fmtBb(a.takenEvBb)}</td>
        <td className="px-2 py-1.5 text-right font-mono-tabular brass-text font-bold">
          {fmtBb(a.bestEvBb)}
        </td>
        <td className="px-2 py-1.5 font-jp text-brass">
          {ACTION_JP[a.bestAction] ?? a.bestAction}
        </td>
        <td className="px-2 py-1.5 text-[10px] text-ivory-muted">
          {a.gtoMatch !== null
            ? a.gtoMatch
              ? '◯ GTO 内'
              : '✗ chart 外'
            : (a.boardTexture ?? []).join(' / ')}
        </td>
        <td className="px-2 py-1.5">
          <VerdictBadge v={a.verdict} />
        </td>
      </tr>
      {expanded && hasDetail && (
        <tr className="bg-ink-deepest/40 border-b border-brass/15">
          <td colSpan={9} className="px-4 py-3">
            <div className="flex flex-col gap-2 text-[11px] font-jp text-ivory-dim">
              {/* メタ情報 */}
              <div className="flex flex-wrap gap-3 text-[10px]">
                {a.handCategory && (
                  <span>
                    <span className="text-ivory-muted">役/ドロー:</span>{' '}
                    <span className="brass-text font-bold">{handCategoryJp(a.handCategory)}</span>
                  </span>
                )}
                {a.equityVsRangePct != null && (
                  <span>
                    <span className="text-ivory-muted">レンジ vs eq:</span>{' '}
                    <span className="font-mono-tabular">{a.equityVsRangePct.toFixed(1)}%</span>
                  </span>
                )}
                {a.outsBreakdown && a.outsBreakdown.clean > 0 && (
                  <span>
                    <span className="text-ivory-muted">アウツ:</span>{' '}
                    <span className="font-mono-tabular brass-text">{a.outsBreakdown.clean}</span>
                  </span>
                )}
                {a.foldEquity != null && (
                  <span>
                    <span className="text-ivory-muted">FE:</span>{' '}
                    <span className="font-mono-tabular">{(a.foldEquity * 100).toFixed(0)}%</span>
                  </span>
                )}
                {a.evBetBb != null && (
                  <span>
                    <span className="text-ivory-muted">EV(bet):</span>{' '}
                    <span className="font-mono-tabular">{fmtBb(a.evBetBb)}</span>
                  </span>
                )}
                {a.impliedOddsBonusBb != null && a.impliedOddsBonusBb > 0 && (
                  <span>
                    <span className="text-ivory-muted">IO+:</span>{' '}
                    <span className="font-mono-tabular jade-text">
                      {fmtBb(a.impliedOddsBonusBb)}
                    </span>
                  </span>
                )}
              </div>
              {/* reasoning */}
              {a.reasoning && a.reasoning.length > 0 && (
                <ul className="list-disc pl-5 space-y-0.5">
                  {a.reasoning.map((r, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: reasoning は順序固定
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function handCategoryJp(c: string): string {
  const m: Record<string, string> = {
    air: 'エア',
    'weak-pair': '弱ペア',
    pair: 'ペア',
    'top-pair': 'トップペア',
    overpair: 'オーバーペア',
    'two-pair': 'ツーペア',
    set: 'セット',
    straight: 'ストレート',
    flush: 'フラッシュ',
    'full-house-plus': 'フルハウス+',
    gs: 'ガットショット',
    oesd: 'OESD',
    fd: 'フラッシュドロー',
    'combo-draw': 'コンボドロー',
  };
  return m[c] ?? c;
}
