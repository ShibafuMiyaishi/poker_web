import { ChipStack } from './Chip';

interface Props {
  amount: number;
  currentBet?: number;
}

// 卓中央の Pot 表示: chip stack + 「TOTAL POT」brass ライン + 大型 brass-text 数字。
// 数値はパルス。
export function Pot({ amount, currentBet = 0 }: Props) {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <ChipStack amount={amount} showLabel={false} />
      <div className="flex flex-col items-center gap-0">
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-[9px] font-display italic tracking-ultra uppercase text-brass">
            Total Pot
          </span>
          <span className="font-jp text-[9px] text-ivory-dim tracking-widest">合計</span>
        </div>
        <div className="brass-text text-3xl sm:text-4xl font-display font-bold tabular-nums animate-pot-pulse leading-none">
          {amount.toLocaleString()}
        </div>
        {currentBet > 0 && (
          <div className="text-[10px] text-ivory-dim font-mono-tabular tracking-wide mt-0.5">
            <span className="text-brass">▸</span> to call · {currentBet}
          </div>
        )}
      </div>
    </div>
  );
}
