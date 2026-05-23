import { type LegalAction, type PlayerAction, legalActions } from '@pokergo/engine';
import { useEffect, useMemo, useState } from 'react';
import { handDriver } from '../lib/handDriver';
import { serverDriver } from '../lib/serverDriver';
import { useTableStore } from '../stores/tableStore';

// "Botanical Casino" 風: 真鍮CTA + 朱・翡翠・骨色のアクセント。
// 仕様 §11.2.2 のアクション UI、bet スライダー + 5 つの quick chip。
//
// Button hierarchy:
//   FOLD = 朱 crimson (危険/降車)
//   CHECK = 骨色 bone (中立)
//   CALL = 翡翠 jade (前進)
//   BET/RAISE = brass / 真鍮 (主アクション)
//   ALL-IN = brass-glow / 警告金 (最終手段)
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

  const [betValue, setBetValue] = useState<number>(minRaiseTotal);

  const handId = state?.handId;
  const toActSeat = state?.toAct;
  // biome-ignore lint/correctness/useExhaustiveDependencies: 手番切替時のみ初期化
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

  // 手番でない場合
  if (!isYourTurn || !state || !player) {
    return (
      <div className="mt-3 flex flex-col items-center gap-2">
        <div className="text-[11px] sm:text-xs text-ivory-dim text-center flex items-center gap-2">
          {status === 'between_hands' && winners ? (
            <>
              <span className="font-jp tracking-widest">次のハンドへ</span>
              <span className="font-display italic text-brass">Next hand…</span>
            </>
          ) : (
            <>
              <span className="font-jp tracking-widest">相手の手番</span>
              <span className="font-display italic text-ivory-muted">Awaiting action…</span>
            </>
          )}
        </div>
        {status === 'between_hands' && mode === 'local' && (
          <button
            type="button"
            onClick={() => handDriver.skipToNextHand()}
            className="min-h-[44px] px-6 rounded-md font-display tracking-widest text-sm brass-surface text-ivory hover:brightness-110 transition"
          >
            次のハンドへ ▸
          </button>
        )}
      </div>
    );
  }

  const toCall = state.currentBet - player.currentBet;
  const canBetOrRaise = !!(raise || bet);
  const isRaise = !!raise;

  const quickFractions: { label: string; frac: number }[] = [
    { label: '⅓', frac: 1 / 3 },
    { label: '½', frac: 0.5 },
    { label: '⅔', frac: 2 / 3 },
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
          <ActionButton
            kind="crimson"
            label="FOLD"
            sub="降りる"
            onClick={() => submit({ seat: yourSeat, type: 'fold' })}
          />
        )}
        {has('check') && (
          <ActionButton
            kind="bone"
            label="CHECK"
            sub="チェック"
            onClick={() => submit({ seat: yourSeat, type: 'check' })}
          />
        )}
        {has('call') && (
          <ActionButton
            kind="jade"
            label="CALL"
            sub={toCall.toString()}
            onClick={() => submit({ seat: yourSeat, type: 'call' })}
          />
        )}
        {canBetOrRaise && (
          <ActionButton
            kind="brass"
            label={isRaise ? 'RAISE' : 'BET'}
            sub={`to ${betValue}`}
            wide
            disabled={betValue < minRaiseTotal || betValue > maxRaiseTotal}
            onClick={() =>
              submit(
                isRaise
                  ? { seat: yourSeat, type: 'raise', amount: betValue }
                  : { seat: yourSeat, type: 'bet', amount: betValue },
              )
            }
          />
        )}
        {has('all_in') && !canBetOrRaise && (
          <ActionButton
            kind="brass-glow"
            label="ALL-IN"
            sub={player.stack.toString()}
            onClick={() => submit({ seat: yourSeat, type: 'all_in' })}
          />
        )}
      </div>

      {/* ベットスライダー + クイックチップ */}
      {canBetOrRaise && minRaiseTotal < maxRaiseTotal && (
        <div className="flex flex-col gap-2 px-3 py-2.5 rounded-md border border-brass/25 bg-gradient-to-b from-ink-deep/95 to-ink/95 shadow-card">
          {/* スライダー */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-display italic text-ivory-muted shrink-0 tabular-nums">
              {minRaiseTotal}
            </span>
            <input
              type="range"
              min={minRaiseTotal}
              max={maxRaiseTotal}
              step={Math.max(1, Math.floor((maxRaiseTotal - minRaiseTotal) / 100))}
              value={betValue}
              onChange={(e) => setBetValue(Number.parseInt(e.target.value, 10))}
              className="flex-1 h-6"
              aria-label="ベット額スライダー"
            />
            <span className="text-[10px] font-display italic text-ivory-muted shrink-0 tabular-nums">
              {maxRaiseTotal}
            </span>
          </div>

          {/* 中央の現在値 */}
          <div className="flex justify-center items-baseline gap-2">
            <span className="font-jp text-[10px] text-ivory-dim tracking-wider">ベット額</span>
            <span className="brass-text font-display text-2xl sm:text-3xl font-bold tabular-nums leading-none">
              {betValue.toLocaleString()}
            </span>
          </div>

          {/* クイックチップボタン */}
          <div className="grid grid-cols-5 gap-1.5">
            {quickFractions.map(({ label, frac }) => (
              <button
                key={label}
                type="button"
                onClick={() => setQuickBet(frac)}
                className="h-9 rounded border border-brass/25 bg-ink-deep/80 hover:bg-ink/80 hover:border-brass/50 text-xs font-display font-semibold text-ivory transition"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setBetValue(maxRaiseTotal)}
              className="h-9 rounded brass-surface text-xs font-display font-bold text-ivory tracking-wider hover:brightness-110 transition"
            >
              MAX
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 内部コンポーネント ---

interface ActionButtonProps {
  kind: 'crimson' | 'bone' | 'jade' | 'brass' | 'brass-glow';
  label: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
  wide?: boolean;
}

const KIND_STYLE: Record<ActionButtonProps['kind'], string> = {
  crimson:
    'bg-gradient-to-b from-crimson to-[#7e1c1c] border border-crimson/40 text-ivory hover:brightness-110',
  bone: 'bg-gradient-to-b from-ink-soft to-ink border border-bone/30 text-ivory hover:brightness-125',
  jade: 'bg-gradient-to-b from-jade to-[#2f6a52] border border-jade/40 text-ivory hover:brightness-110',
  brass:
    'bg-gradient-to-b from-brass-light to-brass-deep border border-brass-glow/50 text-ink-deepest font-bold hover:brightness-110 shadow-brass',
  'brass-glow':
    'bg-gradient-to-b from-brass-glow via-brass-light to-brass border-2 border-brass-glow text-ink-deepest font-bold hover:brightness-110 shadow-[0_0_20px_rgba(245,215,122,0.5)]',
};

function ActionButton({ kind, label, sub, onClick, disabled, wide }: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-12 sm:h-14 rounded-md transition flex flex-col items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
        wide ? 'col-span-2 sm:col-span-1' : ''
      } ${KIND_STYLE[kind]}`}
    >
      <span className="font-display text-sm sm:text-base tracking-widest leading-none">
        {label}
      </span>
      <span className="text-[10px] font-mono-tabular opacity-85 tracking-wide mt-0.5">{sub}</span>
    </button>
  );
}
