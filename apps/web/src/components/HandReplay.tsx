import { useMemo, useState } from 'react';
import type { HandDetail } from '../lib/api';
import { Card } from './Card';

type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
const STREETS: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];

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
// 履歴詳細の actions と board からストリート切替で再生する。
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
      <div className="flex items-center gap-1 text-xs">
        <span className="text-slate-400 mr-2">ストリート:</span>
        {STREETS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStreet(s)}
            className={`px-2 py-1 rounded ${street === s ? 'bg-accent' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 py-3 bg-felt/40 rounded border border-slate-800">
        <div className="text-[10px] text-slate-400 tracking-widest uppercase">{street}</div>
        <div className="flex gap-1">
          {board.length === 0 ? (
            <span className="text-[11px] text-slate-500">（ボードなし）</span>
          ) : (
            board.map((c) => <Card key={`r-${street}-${c}`} card={c} size="sm" />)
          )}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-300 mb-1">アクション ({actions.length})</h4>
        <ul className="max-h-72 overflow-y-auto text-[11px]">
          {actions.map((a) => {
            const p = playerByseat.get(a.seat_no);
            return (
              <li
                key={a.order_no}
                className={`px-2 py-1 odd:bg-slate-800/30 flex gap-2 ${a.street === street ? 'border-l-2 border-accent' : 'opacity-70'}`}
              >
                <span className="text-slate-500 w-14 shrink-0">[{a.street}]</span>
                <span className="text-slate-200 w-20 shrink-0 truncate">
                  {p
                    ? p.user_id
                      ? 'あなた'
                      : (p.cpu_name ?? `seat ${a.seat_no}`)
                    : `seat ${a.seat_no}`}
                </span>
                <span className="text-slate-100 font-mono">
                  {a.action_type}
                  {a.amount > 0 ? ` ${a.amount}` : ''}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
