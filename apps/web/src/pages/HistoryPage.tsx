import { useEffect, useState } from 'react';
import { HandReplay } from '../components/HandReplay';
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
    navigator.clipboard.writeText(txt).catch(() => {
      /* ignore */
    });
  };

  if (loading) return <div className="text-sm text-slate-400">読み込み中…</div>;
  if (error)
    return (
      <div className="text-sm text-lose">エラー: {error}（wrangler dev が起動しているか確認）</div>
    );

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
      <div className="bg-slate-900/60 rounded p-3 border border-slate-800">
        <h2 className="text-sm font-semibold mb-2">ハンド履歴 ({hands.length})</h2>
        {hands.length === 0 ? (
          <p className="text-xs text-slate-400">まだプレイ履歴がありません</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {hands.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => showDetail(h.id)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 flex justify-between gap-2"
                >
                  <span className="text-slate-400">{formatDate(h.started_at)}</span>
                  <span className="text-slate-200 font-mono">{h.hole_cards}</span>
                  <span className={h.net_chips >= 0 ? 'text-win' : 'text-lose'}>
                    {h.net_chips > 0 ? '+' : ''}
                    {h.net_chips}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-slate-900/60 rounded p-3 border border-slate-800">
        {selected ? (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">
                {formatDate(selected.hand.started_at)} · pot {selected.hand.pot_total}
              </h3>
              <button
                type="button"
                onClick={() => copyText(selected.hand.pokerstars_text)}
                className="text-xs px-2 py-1 rounded bg-accent hover:bg-blue-500 font-semibold"
              >
                PokerStars 形式をコピー
              </button>
            </div>
            <div className="text-slate-400">
              Board: <span className="text-slate-100 font-mono">{selected.hand.board || '—'}</span>
            </div>
            <HandReplay detail={selected} />
            <details>
              <summary className="cursor-pointer text-slate-400">PokerStars テキスト</summary>
              <pre className="mt-1 p-2 bg-slate-950 text-[10px] leading-relaxed max-h-72 overflow-auto whitespace-pre-wrap">
                {selected.hand.pokerstars_text}
              </pre>
            </details>
          </div>
        ) : (
          <p className="text-xs text-slate-400">左から 1 ハンド選んで詳細を表示</p>
        )}
      </div>
    </div>
  );
}
