import { useEffect, useState } from 'react';
import { CumulativeGraph } from '../components/CumulativeGraph';
import { StatCard } from '../components/StatCard';
import { SectionLabel } from '../components/primitives/SectionLabel';
import { type GraphPoint, type Period, type StatsSummary, getGraph, getStats } from '../lib/api';

const PERIODS: { key: Period; jp: string; en: string }[] = [
  { key: 'all', jp: '全期間', en: 'All' },
  { key: 'month', jp: '30日', en: '30d' },
  { key: 'week', jp: '7日', en: '7d' },
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionLabel jp="統計" en="Performance Dossier" />
        <div className="flex items-center gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md transition flex items-baseline gap-1.5 ${
                period === p.key
                  ? 'brass-surface text-ivory'
                  : 'border border-ink-line bg-ink-deep/60 text-ivory-dim hover:border-brass/30'
              }`}
            >
              <span className="font-jp text-xs">{p.jp}</span>
              <span className="font-display italic text-[10px] tracking-widest uppercase opacity-70">
                {p.en}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-sm text-ivory-dim font-display italic">loading dossier…</div>
      )}
      {error && (
        <div className="text-sm text-crimson-glow font-display italic">
          error: {error}（wrangler dev が起動中か確認）
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatCard
              label="ハンド数"
              en="Hands"
              value={stats.handsPlayed.toLocaleString()}
              hint={`net ${stats.totalNetChips > 0 ? '+' : ''}${stats.totalNetChips} chips`}
            />
            <StatCard
              label="bb/100"
              en="Win Rate"
              value={`${stats.bbPer100 >= 0 ? '+' : ''}${stats.bbPer100.toFixed(2)}`}
              tone={stats.bbPer100 >= 0 ? 'positive' : 'negative'}
              hint="実損益 per 100 hands"
            />
            <StatCard
              label="EV bb/100"
              en="EV Rate"
              value={`${stats.evBbPer100 >= 0 ? '+' : ''}${stats.evBbPer100.toFixed(2)}`}
              tone={stats.evBbPer100 >= 0 ? 'positive' : 'negative'}
              hint={`累積dev ${stats.totalDeviationBb >= 0 ? '+' : ''}${stats.totalDeviationBb.toFixed(1)}bb`}
            />
            <StatCard label="VPIP" en="Voluntary" value={fmtPct(stats.vpip)} hint="自発参加率" />
            <StatCard
              label="PFR"
              en="PF Raise"
              value={fmtPct(stats.pfr)}
              hint="プリフロップレイズ"
            />
            <StatCard
              label="3-bet"
              en="3-Bet"
              value={fmtPct(stats.threeBetPct)}
              hint="3-bet 機会比"
            />
            <StatCard
              label="AF"
              en="Aggression"
              value={fmtAf(stats.af)}
              hint={`(b+r)/c = ${stats.detail.postflopAggressive}/${stats.detail.postflopCalls}`}
            />
            <StatCard label="WTSD" en="To Showdown" value={fmtPct(stats.wtsd)} hint="到達率" />
            <StatCard label="W$SD" en="Won at SD" value={fmtPct(stats.wDollarSd)} hint="勝率" />
          </div>

          <section className="space-y-2">
            <SectionLabel jp="累積収支" en="Cumulative P&L" />
            <p className="text-[11px] text-ivory-muted font-display italic max-w-2xl leading-relaxed">
              緑線は実損益、黄点線は <span className="brass-text font-bold">EV ライン</span>
              （最善 EV と採用 EV
              の差の累計）。線が乖離するほど「最善プレイから離れたぶん」が見える。
            </p>
            <CumulativeGraph points={points} />
          </section>
        </>
      )}
    </div>
  );
}
