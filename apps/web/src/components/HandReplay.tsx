import { useMemo, useState } from 'react';
import type { HandDetail } from '../lib/api';
import { STREET_JP, actionJp } from '../lib/pokerI18n';
import { Card } from './Card';

type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
const STREETS: { key: Street; label: string }[] = [
  { key: 'preflop', label: STREET_JP.preflop },
  { key: 'flop', label: STREET_JP.flop },
  { key: 'turn', label: STREET_JP.turn },
  { key: 'river', label: STREET_JP.river },
  { key: 'showdown', label: STREET_JP.showdown },
];

function boardCards(boardStr: string, street: Street): string[] {
  const all = boardStr ? boardStr.split(/\s+/).filter(Boolean) : [];
  switch (street) {
    case 'preflop':
      return [];
    case 'flop':
      return all.slice(0, 3);
    case 'turn':
      return all.slice(0, 4);
    default:
      return all.slice(0, 5);
  }
}

// ハンドリプレイ: ストリート別タイムライン (仕様 F-H-03)。
export function HandReplay({ detail }: { detail: HandDetail }) {
  const [street, setStreet] = useState<Street>('preflop');
  const board = useMemo(() => boardCards(detail.hand.board, street), [detail, street]);
  const actions = useMemo(() => {
    const order: Record<Street, number> = {
      preflop: 0,
      flop: 1,
      turn: 2,
      river: 3,
      showdown: 4,
    };
    return detail.actions.filter((a) => order[(a.street as Street) ?? 'preflop'] <= order[street]);
  }, [detail, street]);

  const playerByseat = useMemo(() => {
    const m = new Map<number, (typeof detail.players)[number]>();
    for (const p of detail.players) m.set(p.seat_no, p);
    return m;
  }, [detail]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 text-xs flex-wrap">
        <span className="font-jp text-ivory-muted text-[10px] tracking-widest mr-1">局</span>
        {STREETS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStreet(s.key)}
            className={`px-2.5 py-1 rounded font-jp text-[11px] tracking-widest transition ${
              street === s.key
                ? 'brass-surface text-ivory'
                : 'bg-ink-deep/70 border border-ink-line text-ivory-dim hover:border-brass/40 hover:text-ivory'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 py-3 bg-ink-deepest/70 rounded border border-brass/15 paper-noise">
        <div className="font-jp text-[10px] text-ivory-muted tracking-widest">
          {STREETS.find((s) => s.key === street)?.label ?? street}
        </div>
        <div className="flex gap-1">
          {board.length === 0 ? (
            <span className="text-[11px] font-jp text-ivory-muted">（ボードなし）</span>
          ) : (
            board.map((c) => <Card key={`r-${street}-${c}`} card={c} size="sm" />)
          )}
        </div>
      </div>

      <div>
        <h4 className="font-jp text-xs text-ivory tracking-widest mb-1">
          アクション
          <span className="font-mono-tabular text-brass ml-2 text-[10px]">({actions.length})</span>
        </h4>
        <ul className="max-h-72 overflow-y-auto text-[11px]">
          {actions.map((a) => {
            const p = playerByseat.get(a.seat_no);
            const me = p && (p as { user_id: string | null }).user_id;
            return (
              <li
                key={a.order_no}
                className={`px-2 py-1 odd:bg-ink-deep/40 flex gap-2 ${a.street === street ? 'border-l-2 border-brass' : 'opacity-60'}`}
              >
                <span className="text-ivory-muted font-jp w-14 shrink-0 text-[10px]">
                  {(STREET_JP as Record<string, string>)[a.street] ?? a.street}
                </span>
                <span className="text-ivory w-20 shrink-0 truncate font-jp">
                  {p
                    ? me
                      ? 'あなた'
                      : ((p as { cpu_name: string | null }).cpu_name ?? `seat ${a.seat_no}`)
                    : `seat ${a.seat_no}`}
                </span>
                <span className="text-ivory-dim font-jp text-[10px]">
                  {actionJp(a.action_type)}
                </span>
                {a.amount > 0 && (
                  <span className="text-brass font-mono-tabular text-[10px]">{a.amount}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
