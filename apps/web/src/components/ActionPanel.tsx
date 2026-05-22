import { type LegalAction, type PlayerAction, legalActions } from '@pokergo/engine';
import { useState } from 'react';
import { handDriver } from '../lib/handDriver';
import { useTableStore } from '../stores/tableStore';

export function ActionPanel() {
  const state = useTableStore((s) => s.state);
  const yourSeat = useTableStore((s) => s.yourSeat);
  const [betInput, setBetInput] = useState('');

  if (!state || state.toAct !== yourSeat) {
    return (
      <div className="text-xs text-slate-500 mt-4 text-center">
        {state?.toAct !== null ? '相手の手番…' : '進行中…'}
      </div>
    );
  }

  const legal = legalActions(state, yourSeat);
  const has = (t: LegalAction['type']) => legal.find((a) => a.type === t);

  const submit = (action: PlayerAction) => {
    void handDriver.submitHumanAction(action);
  };

  const raise = has('raise');
  const bet = has('bet');
  const minRaiseTotal = raise?.minAmount ?? bet?.minAmount ?? state.bb;
  const maxRaiseTotal = raise?.maxAmount ?? bet?.maxAmount ?? 0;
  const targetBet = Number.parseInt(betInput, 10);

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <div className="flex gap-2 flex-wrap justify-center">
        {has('fold') && (
          <button
            type="button"
            onClick={() => submit({ seat: yourSeat, type: 'fold' })}
            className="min-w-[88px] min-h-[44px] px-4 rounded bg-lose hover:bg-red-600 font-semibold"
          >
            FOLD
          </button>
        )}
        {has('check') && (
          <button
            type="button"
            onClick={() => submit({ seat: yourSeat, type: 'check' })}
            className="min-w-[88px] min-h-[44px] px-4 rounded bg-slate-700 hover:bg-slate-600 font-semibold"
          >
            CHECK
          </button>
        )}
        {has('call') && (
          <button
            type="button"
            onClick={() => submit({ seat: yourSeat, type: 'call' })}
            className="min-w-[88px] min-h-[44px] px-4 rounded bg-accent hover:bg-blue-500 font-semibold"
          >
            CALL {state.currentBet - (state.players.get(yourSeat)?.currentBet ?? 0)}
          </button>
        )}
        {(raise || bet) && (
          <button
            type="button"
            disabled={
              !Number.isFinite(targetBet) || targetBet < minRaiseTotal || targetBet > maxRaiseTotal
            }
            onClick={() =>
              submit(
                raise
                  ? { seat: yourSeat, type: 'raise', amount: targetBet }
                  : { seat: yourSeat, type: 'bet', amount: targetBet },
              )
            }
            className="min-w-[88px] min-h-[44px] px-4 rounded bg-win hover:bg-green-500 disabled:opacity-40 disabled:hover:bg-win font-semibold"
          >
            {raise ? 'RAISE' : 'BET'} to {targetBet || minRaiseTotal}
          </button>
        )}
        {has('all_in') && (
          <button
            type="button"
            onClick={() => submit({ seat: yourSeat, type: 'all_in' })}
            className="min-w-[88px] min-h-[44px] px-4 rounded bg-yellow-600 hover:bg-yellow-500 font-semibold"
          >
            ALL-IN
          </button>
        )}
      </div>
      {(raise || bet) && (
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400" htmlFor="bet-input">
            ベット額（{minRaiseTotal} 〜 {maxRaiseTotal}）
          </label>
          <input
            id="bet-input"
            type="number"
            min={minRaiseTotal}
            max={maxRaiseTotal}
            value={betInput}
            onChange={(e) => setBetInput(e.target.value)}
            className="px-2 py-1 w-24 rounded bg-slate-800 border border-slate-700 text-slate-100 text-right"
          />
          <div className="flex gap-1">
            {[
              { label: '1/3', frac: 1 / 3 },
              { label: '1/2', frac: 0.5 },
              { label: '2/3', frac: 2 / 3 },
              { label: 'pot', frac: 1 },
            ].map(({ label, frac }) => {
              const player = state.players.get(yourSeat);
              const base = player?.currentBet ?? 0;
              const target = Math.max(
                minRaiseTotal,
                Math.min(maxRaiseTotal, base + Math.floor(state.pot * frac)),
              );
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setBetInput(String(target))}
                  className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
