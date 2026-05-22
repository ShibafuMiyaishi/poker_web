import type { Card as CardType } from '@pokergo/shared';

const SUIT_GLYPH: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };

export function Card({ card, hidden = false }: { card?: CardType | undefined; hidden?: boolean }) {
  if (hidden || !card) {
    return (
      <div className="w-10 h-14 rounded-md bg-slate-800 border border-slate-700 shadow-inner" />
    );
  }
  const rank = card[0];
  const suit = card[1];
  const red = suit === 'h' || suit === 'd';
  return (
    <div className="w-10 h-14 rounded-md bg-slate-100 text-slate-900 border border-slate-300 shadow-sm flex flex-col items-center justify-center font-semibold">
      <span className={red ? 'text-red-600' : 'text-slate-900'}>{rank}</span>
      <span className={`${red ? 'text-red-600' : 'text-slate-900'} text-lg leading-none`}>
        {suit ? (SUIT_GLYPH[suit] ?? '?') : '?'}
      </span>
    </div>
  );
}
