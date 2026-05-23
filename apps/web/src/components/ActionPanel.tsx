import { type LegalAction, type PlayerAction, legalActions } from '@pokergo/engine';
import { useEffect, useMemo, useState } from 'react';
import { handDriver } from '../lib/handDriver';
import { serverDriver } from '../lib/serverDriver';
import { useTableStore } from '../stores/tableStore';

// Pokergo "Botanical Casino" アクションパネル v2:
// - 5 色階層 CTA (FOLD 朱 / CHECK 灰 / CALL 翡翠 / RAISE/BET 真鍮高コントラスト / ALL-IN brass-glow)
// - スライダーは 1 行コンパクト (min — thumb — max)
// - quick chip ボタンは 4 + MAX を別ライン分離
// - RAISE は中央数字を ivory 系の太字で視認性を確保
export function ActionPanel() {
  const state = useTableStore((s) => s.state);
  const yourSeat = useTableStore((s) => s.yourSeat);
  const mode = useTableStore((s) => s.mode);
  const status = useTableStore((s) => s.status);

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

  // キーボードショートカット: F=fold / C=check or call / R=raise (現 betValue) / A=all-in / Space=skip
  // biome-ignore lint/correctness/useExhaustiveDependencies: クロージャ依存は意図的に limited
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // 入力中は無視
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (!isYourTurn || !state || !player) {
        // 手番でない時: Space で次ハンドへ
        if (e.code === 'Space' && status === 'between_hands' && mode === 'local') {
          e.preventDefault();
          handDriver.skipToNextHand();
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'f' && has('fold')) {
        e.preventDefault();
        submit({ seat: yourSeat, type: 'fold' });
      } else if (key === 'c') {
        if (has('check')) {
          e.preventDefault();
          submit({ seat: yourSeat, type: 'check' });
        } else if (has('call')) {
          e.preventDefault();
          submit({ seat: yourSeat, type: 'call' });
        }
      } else if (key === 'r' && (raise || bet)) {
        e.preventDefault();
        if (betValue >= minRaiseTotal && betValue <= maxRaiseTotal) {
          submit(
            raise
              ? { seat: yourSeat, type: 'raise', amount: betValue }
              : { seat: yourSeat, type: 'bet', amount: betValue },
          );
        }
      } else if (key === 'a' && has('all_in')) {
        e.preventDefault();
        submit({ seat: yourSeat, type: 'all_in' });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isYourTurn, status, mode, betValue, minRaiseTotal, maxRaiseTotal]);

  // 手番でない場合: between_hands なら **ボタンのみ** 表示 (テキスト + ボタン 二重表示の解消)
  if (!isYourTurn || !state || !player) {
    const showSkip = status === 'between_hands' && mode === 'local';
    return (
      <div className="mt-3 flex flex-col items-center gap-2 min-h-[48px]">
        {showSkip ? (
          <button
            type="button"
            onClick={() => handDriver.skipToNextHand()}
            className="min-h-[44px] px-6 rounded-md font-display tracking-widest text-sm brass-surface text-ivory hover:brightness-110 transition"
          >
            次のハンドへ ▸
          </button>
        ) : (
          <div className="text-xs sm:text-sm font-jp tracking-widest text-ivory-muted">
            相手の手番
          </div>
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
            kbd="F"
            onClick={() => submit({ seat: yourSeat, type: 'fold' })}
          />
        )}
        {has('check') && (
          <ActionButton
            kind="bone"
            label="CHECK"
            sub="チェック"
            kbd="C"
            onClick={() => submit({ seat: yourSeat, type: 'check' })}
          />
        )}
        {has('call') && (
          <ActionButton
            kind="jade"
            label="CALL"
            sub={`${toCall.toLocaleString()}`}
            kbd="C"
            onClick={() => submit({ seat: yourSeat, type: 'call' })}
          />
        )}
        {canBetOrRaise && (
          <ActionButton
            kind="brass"
            label={isRaise ? 'RAISE' : 'BET'}
            sub={`to ${betValue.toLocaleString()}`}
            kbd="R"
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
            sub={player.stack.toLocaleString()}
            kbd="A"
            onClick={() => submit({ seat: yourSeat, type: 'all_in' })}
          />
        )}
      </div>

      {/* ベットスライダー: コンパクト 1 行 + quick chip + MAX */}
      {canBetOrRaise && minRaiseTotal < maxRaiseTotal && (
        <div className="flex flex-col gap-2 px-3 py-2 rounded-md border border-brass/25 bg-gradient-to-b from-ink-deep/95 to-ink/95 shadow-card">
          {/* 1 行で min - slider - 値 - max */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono-tabular text-ivory-muted shrink-0 tabular-nums w-10 text-right">
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
              aria-label="ベット額"
              aria-valuetext={`${betValue.toLocaleString()} チップ`}
            />
            <div className="flex items-baseline gap-1 shrink-0 min-w-[68px] justify-end">
              <span className="brass-text font-display text-xl font-bold tabular-nums leading-none">
                {betValue.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] font-mono-tabular text-ivory-muted shrink-0 tabular-nums w-10">
              {maxRaiseTotal.toLocaleString()}
            </span>
          </div>

          {/* quick chips + MAX */}
          <div className="grid grid-cols-5 gap-1.5">
            {quickFractions.map(({ label, frac }) => (
              <button
                key={label}
                type="button"
                onClick={() => setQuickBet(frac)}
                className="h-8 rounded border border-brass/25 bg-ink-deep/80 hover:bg-ink/80 hover:border-brass/55 text-xs font-display font-semibold text-ivory transition"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setBetValue(maxRaiseTotal)}
              className="h-8 rounded brass-surface text-xs font-display font-bold text-ivory tracking-wider hover:brightness-110 transition"
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
  kbd?: string; // キーボードショートカットヒント (F/C/R/A)
}

const KIND_STYLE: Record<ActionButtonProps['kind'], string> = {
  crimson:
    'bg-gradient-to-b from-[#c1313c] to-[#8a1c22] border border-crimson/50 text-white hover:brightness-110 shadow-[0_4px_12px_rgba(178,42,42,0.4)]',
  bone: 'bg-gradient-to-b from-ink-soft to-ink border border-bone/35 text-bone hover:bg-ink-soft hover:brightness-115',
  jade: 'bg-gradient-to-b from-[#5fb38a] to-[#2f6a52] border border-jade/55 text-white hover:brightness-110 shadow-[0_4px_12px_rgba(74,157,122,0.35)]',
  brass:
    'bg-gradient-to-b from-brass-light via-brass to-brass-deep border-2 border-brass-glow/70 text-ink-deepest font-bold hover:brightness-110 shadow-[0_4px_14px_rgba(245,215,122,0.45)]',
  'brass-glow':
    'bg-gradient-to-b from-brass-glow via-brass-light to-brass border-2 border-brass-glow text-ink-deepest font-bold hover:brightness-110 shadow-[0_0_24px_rgba(245,215,122,0.6)]',
};

function ActionButton({ kind, label, sub, onClick, disabled, wide, kbd }: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={kbd ? `ショートカット: ${kbd}` : undefined}
      className={`relative h-12 sm:h-14 rounded-md transition flex flex-col items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
        wide ? 'col-span-2 sm:col-span-1 sm:min-w-[140px]' : 'sm:min-w-[100px]'
      } ${KIND_STYLE[kind]}`}
    >
      <span className="font-display text-sm sm:text-base tracking-widest leading-none">
        {label}
      </span>
      <span className="text-[10px] sm:text-[11px] font-mono-tabular opacity-90 tracking-wide mt-0.5 tabular-nums">
        {sub}
      </span>
      {kbd && (
        <span
          className="hidden sm:flex absolute top-1 right-1.5 w-4 h-4 items-center justify-center rounded text-[9px] font-mono-tabular font-bold bg-ink-deepest/55 text-ivory/85 border border-ivory/15"
          aria-hidden="true"
        >
          {kbd}
        </span>
      )}
    </button>
  );
}
