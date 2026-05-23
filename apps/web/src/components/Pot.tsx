import { ChipStack } from './Chip';

interface Props {
  amount: number;
  currentBet?: number;
}

// 卓中央のポット表示。金額を大きく + ChipStack ビジュアル + 現ベット表示。
export function Pot({ amount, currentBet = 0 }: Props) {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <ChipStack amount={amount} />
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-widest text-slate-300/80">pot</div>
        <div className="text-2xl font-bold tabular-nums text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
          {amount.toLocaleString()}
        </div>
        {currentBet > 0 && (
          <div className="text-[10px] text-slate-300">to call ベット {currentBet}</div>
        )}
      </div>
    </div>
  );
}
