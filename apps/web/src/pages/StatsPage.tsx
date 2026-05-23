import { useEffect, useState } from 'react';
import { CumulativeGraph } from '../components/CumulativeGraph';
import { StatCard } from '../components/StatCard';
import { SectionLabel } from '../components/primitives/SectionLabel';
import { type GraphPoint, type Period, type StatsSummary, getGraph, getStats } from '../lib/api';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'all', label: '全期間' },
  { key: 'month', label: '30 日' },
  { key: 'week', label: '7 日' },
];

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}
function fmtAf(v: number): string {
  if (!Number.isFinite(v)) return '∞';
  return v.toFixed(2);
}

export function StatsPage() {
  const [period, setPeriod] = useState<Period>('all');
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [points, setPoints] = useState<GraphPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getStats(period), getGraph(period)])
      .then(([s, g]) => {
        setStats(s);
        setPoints(g.points);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3 border-b border-brass/20 pb-3">
        <SectionLabel jp="統計" en="Performance Dossier" size="lg" />
        <fieldset className="flex items-center gap-1 border-0 p-0 m-0" aria-label="期間切替">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md transition font-jp text-xs tracking-widest ${
                period === p.key
                  ? 'brass-surface text-ivory'
                  : 'border border-ink-line bg-ink-deep/60 text-ivory-dim hover:border-brass/40 hover:text-ivory'
              }`}
              aria-pressed={period === p.key}
            >
              {p.label}
            </button>
          ))}
        </fieldset>
      </header>

      {loading && <div className="text-sm text-ivory-dim font-jp tracking-widest">読み込み中…</div>}
      {error && (
        <div className="text-sm text-crimson-glow font-jp">
          エラー: {error}（wrangler dev が起動中か確認）
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatCard
              label="ハンド数"
              value={stats.handsPlayed.toLocaleString()}
              hint={`net ${stats.totalNetChips > 0 ? '+' : ''}${stats.totalNetChips} chips`}
            />
            <StatCard
              label="bb/100"
              value={`${stats.bbPer100 >= 0 ? '+' : ''}${stats.bbPer100.toFixed(2)}`}
              tone={stats.bbPer100 >= 0 ? 'positive' : 'negative'}
              hint="実損益"
            />
            <StatCard
              label="EV bb/100"
              value={`${stats.evBbPer100 >= 0 ? '+' : ''}${stats.evBbPer100.toFixed(2)}`}
              tone={stats.evBbPer100 >= 0 ? 'positive' : 'negative'}
              hint={`累積 dev ${stats.totalDeviationBb >= 0 ? '+' : ''}${stats.totalDeviationBb.toFixed(1)}bb`}
            />
            <StatCard label="VPIP" value={fmtPct(stats.vpip)} hint="自発参加率" />
            <StatCard label="PFR" value={fmtPct(stats.pfr)} hint="プリフロップレイズ" />
            <StatCard label="3-bet" value={fmtPct(stats.threeBetPct)} hint="3-bet 機会比" />
            <StatCard
              label="AF"
              value={fmtAf(stats.af)}
              hint={`(b+r)/c = ${stats.detail.postflopAggressive}/${stats.detail.postflopCalls}`}
            />
            <StatCard label="WTSD" value={fmtPct(stats.wtsd)} hint="ショウダウン到達" />
            <StatCard label="W$SD" value={fmtPct(stats.wDollarSd)} hint="ショウダウン勝率" />
          </div>

          <section className="space-y-2">
            <SectionLabel jp="累積収支" />
            <p className="text-[11px] text-ivory-muted font-jp max-w-2xl leading-relaxed">
              緑線は実損益、黄点線は EV ライン (最善 EV と採用 EV の差の累計)。線が乖離するほど、
              「最善プレイから離れた」分が視覚化される。
            </p>
            <CumulativeGraph points={points} />
          </section>
        </>
      )}
    </div>
  );
}
