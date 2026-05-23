import { type LegalAction, type PlayerAction, legalActions } from '@pokergo/engine';
import { useEffect, useMemo, useState } from 'react';
import { handDriver } from '../lib/handDriver';
import { serverDriver } from '../lib/serverDriver';
import { useTableStore } from '../stores/tableStore';

// 大型カラーボタン + ベットスライダー + 1/3 / 1/2 / 2/3 / pot / all-in クイック。
// 仕様 §11.2.2 のアクション UI を視認性重視に書き換え。
export function ActionPanel() {
  const state = useTableStore((s) => s.state);
  const yourSeat = useTableStore((s) => s.yourSeat);
  const mode = useTableStore((s) => s.mode);
  const status = useTableStore((s) => s.status);
  const winners = useTableStore((s) => s.winners);

  const isYourTurn = !!state && state.toAct === yourSeat;
  const player = state?.players.get(yourSeat);

  const legal = useMemo(
    () => (state && isYourTurn ? legalActions(state, yourSeat) : []),
    [state, yourSeat, isYourTurn],
  );
  const has = (t: LegalAction['type']): LegalAction | undefined => legal.find((a) => a.type === t);

  const raise = has('raise');
  const bet = has('bet');
  const minRaiseTotal = raise?.minAmount ?? bet?.minAmount ?? state?.bb ?? 10;
  const maxRaiseTotal = raise?.maxAmount ?? bet?.maxAmount ?? 0;

  // betValue は手番開始ごとに「2/3 pot か minRaise」初期化
  const [betValue, setBetValue] = useState<number>(minRaiseTotal);

  const handId = state?.handId;
  const toActSeat = state?.toAct;
  // biome-ignore lint/correctness/useExhaustiveDependencies: 手番切替時のみ初期化したい
  useEffect(() => {
    if (!isYourTurn || !state || !player) return;
    const defaultBet = Math.max(
      minRaiseTotal,
      Math.min(maxRaiseTotal, player.currentBet + Math.floor(state.pot * (2 / 3))),
    );
    setBetValue(defaultBet);
  }, [isYourTurn, handId, toActSeat]);

  const submit = (action: PlayerAction) => {
    if (mode === 'server') serverDriver.submitAction(action);
    else void handDriver.submitHumanAction(action);
  };

  // 手番でない場合: 状況メッセージ + 「次のハンドへ」ボタン (ファストフォールド)
  if (!isYourTurn || !state || !player) {
    return (
      <div className="mt-3 flex flex-col items-center gap-2">
        <div className="text-xs sm:text-sm text-slate-400 text-center">
          {status === 'between_hands' && winners ? '⏱ 次のハンドへ…' : '相手の手番'}
        </div>
        {status === 'between_hands' && mode === 'local' && (
          <button
            type="button"
            onClick={() => handDriver.skipToNextHand()}
            className="min-h-[44px] px-5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-md"
          >
            次のハンドへ ▶
          </button>
        )}
      </div>
    );
  }

  const toCall = state.currentBet - player.currentBet;
  const canBetOrRaise = !!(raise || bet);
  const isRaise = !!raise;

  // クイックベット候補
  const quickFractions: { label: string; frac: number }[] = [
    { label: '1/3', frac: 1 / 3 },
    { label: '1/2', frac: 0.5 },
    { label: '2/3', frac: 2 / 3 },
    { label: 'POT', frac: 1 },
  ];

  const setQuickBet = (frac: number) => {
    const target = Math.max(
      minRaiseTotal,
      Math.min(maxRaiseTotal, player.currentBet + Math.floor(state.pot * frac)),
    );
    setBetValue(target);
  };

  return (
    <div className="mt-2 sm:mt-3 flex flex-col items-stretch gap-2 max-w-2xl mx-auto w-full px-2 sm:px-0">
      {/* メインアクション行 */}
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap sm:justify-center gap-2">
        {has('fold') && (
          <button
            type="button"
            onClick={() => submit({ seat: yourSeat, type: 'fold' })}
            className="h-12 sm:h-14 rounded-lg bg-rose-700 hover:bg-rose-600 active:bg-rose-800 font-bold text-white shadow-md transition flex flex-col items-center justify-center"
          >
            <span className="text-sm">FOLD</span>
            <span className="text-[10px] opacity-80">降りる</span>
          </button>
        )}
        {has('check') && (
          <button
            type="button"
            onClick={() => submit({ seat: yourSeat, type: 'check' })}
            className="h-12 sm:h-14 rounded-lg bg-slate-600 hover:bg-slate-500 active:bg-slate-700 font-bold text-white shadow-md transition flex flex-col items-center justify-center"
          >
            <span className="text-sm">CHECK</span>
            <span className="text-[10px] opacity-80">チェック</span>
          </button>
        )}
        {has('call') && (
          <button
            type="button"
            onClick={() => submit({ seat: yourSeat, type: 'call' })}
            className="h-12 sm:h-14 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 font-bold text-white shadow-md transition flex flex-col items-center justify-center"
          >
            <span className="text-sm">CALL</span>
            <span className="text-[10px] opacity-80 tabular-nums">{toCall}</span>
          </button>
        )}
        {canBetOrRaise && (
          <button
            type="button"
            disabled={betValue < minRaiseTotal || betValue > maxRaiseTotal}
            onClick={() =>
              submit(
                isRaise
                  ? { seat: yourSeat, type: 'raise', amount: betValue }
                  : { seat: yourSeat, type: 'bet', amount: betValue },
              )
            }
            className="h-12 sm:h-14 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 font-bold text-white shadow-md transition flex flex-col items-center justify-center col-span-2 sm:col-span-1"
          >
            <span className="text-sm">{isRaise ? 'RAISE' : 'BET'}</span>
            <span className="text-[10px] opacity-90 tabular-nums">to {betValue}</span>
          </button>
        )}
        {has('all_in') && !canBetOrRaise && (
          <button
            type="button"
            onClick={() => submit({ seat: yourSeat, type: 'all_in' })}
            className="h-12 sm:h-14 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 font-bold text-slate-900 shadow-md transition flex flex-col items-center justify-center"
          >
            <span className="text-sm">ALL-IN</span>
            <span className="text-[10px] opacity-80 tabular-nums">{player.stack}</span>
          </button>
        )}
      </div>

      {/* ベットスライダー + クイックボタン */}
      {canBetOrRaise && minRaiseTotal < maxRaiseTotal && (
        <div className="flex flex-col gap-2 px-2 py-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <input
            type="range"
            min={minRaiseTotal}
            max={maxRaiseTotal}
            step={Math.max(1, Math.floor((maxRaiseTotal - minRaiseTotal) / 100))}
            value={betValue}
            onChange={(e) => setBetValue(Number.parseInt(e.target.value, 10))}
            className="w-full h-6 accent-emerald-500 cursor-pointer"
            aria-label="ベット額スライダー"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
            <span>min {minRaiseTotal}</span>
            <span className="text-base font-bold text-emerald-300">{betValue}</span>
            <span>max {maxRaiseTotal}</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {quickFractions.map(({ label, frac }) => (
              <button
                key={label}
                type="button"
                onClick={() => setQuickBet(frac)}
                className="h-9 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setBetValue(maxRaiseTotal)}
              className="h-9 rounded bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white"
            >
              ALL-IN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
