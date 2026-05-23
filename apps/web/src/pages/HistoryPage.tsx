import { useEffect, useState } from 'react';
import { HandReplay } from '../components/HandReplay';
import { toast } from '../components/Toaster';
import { SectionLabel } from '../components/primitives/SectionLabel';
import { type HandDetail, type HandListItem, getHand, listHands } from '../lib/api';

function formatDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function HistoryPage() {
  const [hands, setHands] = useState<HandListItem[]>([]);
  const [selected, setSelected] = useState<HandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listHands(50, 0)
      .then((r) => setHands(r.hands))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const showDetail = (id: string) => {
    setSelected(null);
    getHand(id)
      .then(setSelected)
      .catch((e) => setError(e.message));
  };

  const copyText = (txt: string) => {
    navigator.clipboard
      .writeText(txt)
      .then(() => toast('PokerStars 形式をコピーしました', 'success'))
      .catch(() => toast('クリップボードコピーに失敗', 'error'));
  };

  if (loading) {
    return <div className="text-sm text-ivory-dim font-jp tracking-widest">読み込み中…</div>;
  }
  if (error) {
    return (
      <div className="text-sm text-crimson-glow font-jp">{error}（wrangler dev 起動中？）</div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="border-b border-brass/20 pb-3">
        <SectionLabel jp="ハンド記録" en="Hand Log" size="lg" />
      </header>
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        {/* List */}
        <div className="relative rounded-md border border-brass/20 bg-gradient-to-b from-ink-deep/95 to-ink/95 p-3 shadow-card">
          <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-brass/30 to-transparent" />
          <div className="flex items-baseline gap-2 mb-2 mt-1">
            <span className="font-jp text-sm text-ivory tracking-widest">ハンド一覧</span>
            <span className="font-mono-tabular text-[10px] text-brass tabular-nums">
              ({hands.length})
            </span>
          </div>
          {hands.length === 0 ? (
            <p className="text-xs text-ivory-muted font-jp mt-4 leading-relaxed">
              まだプレイ履歴がありません。卓に戻ってハンドを進めてください。
            </p>
          ) : (
            <ul className="space-y-0.5">
              {hands.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => showDetail(h.id)}
                    className={`w-full text-left px-2 py-1.5 rounded transition flex justify-between items-center gap-2 ${
                      selected?.hand.id === h.id
                        ? 'bg-brass/10 border-l-2 border-brass'
                        : 'hover:bg-ink-soft/60 border-l-2 border-transparent'
                    }`}
                  >
                    <span className="text-[10px] text-ivory-muted font-mono-tabular shrink-0">
                      {formatDate(h.started_at)}
                    </span>
                    <span className="font-display text-xs text-ivory">{h.hole_cards}</span>
                    <span
                      className={`text-xs font-mono-tabular font-semibold shrink-0 tabular-nums ${
                        h.net_chips >= 0 ? 'text-jade-glow' : 'text-crimson-glow'
                      }`}
                    >
                      {h.net_chips > 0 ? '+' : ''}
                      {h.net_chips}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail */}
        <div className="relative rounded-md border border-brass/20 bg-gradient-to-b from-ink-deep/95 to-ink/95 p-4 shadow-card">
          <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-brass/30 to-transparent" />
          {selected ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-baseline gap-3">
                  <h3 className="font-jp text-base text-ivory tracking-wider">
                    {formatDate(selected.hand.started_at)}
                  </h3>
                  <span className="font-jp text-ivory-dim">
                    ポット{' '}
                    <span className="brass-text font-display font-bold font-mono-tabular text-base">
                      {selected.hand.pot_total}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(selected.hand.pokerstars_text)}
                  className="text-[10px] px-3 py-1.5 rounded-md brass-surface font-jp tracking-widest hover:brightness-110"
                >
                  PokerStars 形式コピー
                </button>
              </div>
              <div className="text-ivory-muted">
                <span className="font-jp tracking-widest">場</span>{' '}
                <span className="font-mono-tabular text-ivory">{selected.hand.board || '—'}</span>
              </div>
              <HandReplay detail={selected} />
              <details className="group">
                <summary className="cursor-pointer text-ivory-muted hover:text-brass font-jp tracking-widest text-[11px] select-none">
                  PokerStars テキスト ▾
                </summary>
                <pre className="mt-2 p-3 bg-ink-deepest/90 border border-brass/20 rounded text-[10px] leading-relaxed max-h-72 overflow-auto whitespace-pre-wrap font-mono-tabular">
                  {selected.hand.pokerstars_text}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-xs text-ivory-muted font-jp">左から 1 ハンド選んで詳細を表示</p>
          )}
        </div>
      </div>
    </div>
  );
}
