import { ChipStack } from './Chip';

interface Props {
  amount: number;
  currentBet?: number;
}

// 卓中央のポット表示: 簡潔に「POT · ポット」のあとに大型数字。
// 旧「TOTAL POT 合計」の冗長表記を整理。
export function Pot({ amount, currentBet = 0 }: Props) {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <ChipStack amount={amount} showLabel={false} />
      <div className="flex flex-col items-center">
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-display italic text-[10px] tracking-ultra uppercase text-brass">
            Pot
          </span>
          <span className="font-jp text-[10px] text-ivory-muted tracking-widest">ポット</span>
        </div>
        <div className="brass-text text-3xl sm:text-4xl font-display font-bold tabular-nums animate-pot-pulse leading-none mt-0.5">
          {amount.toLocaleString()}
        </div>
        {currentBet > 0 && (
          <div className="text-[10px] text-ivory-dim font-mono-tabular tracking-wide mt-1 flex items-center gap-1.5">
            <span className="font-jp text-ivory-muted">コール</span>
            <span className="text-brass-light font-bold tabular-nums">{currentBet}</span>
          </div>
        )}
      </div>
    </div>
  );
}
