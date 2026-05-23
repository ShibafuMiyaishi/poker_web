// セクションラベル v2: 「日本語 + 英 italic」は ON/OFF 可能。
// 旧 iteration では全箇所が bilingual で tic 化していた → en は H1 など強調箇所のみ。
interface Props {
  jp: string;
  en?: string; // 任意。強調セクションでのみ指定
  className?: string;
  align?: 'left' | 'center';
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_JP = {
  sm: 'text-sm',
  md: 'text-base sm:text-lg',
  lg: 'text-xl sm:text-2xl',
} as const;

const SIZE_EN = {
  sm: 'text-[10px]',
  md: 'text-[11px]',
  lg: 'text-xs sm:text-sm',
} as const;

export function SectionLabel({ jp, en, className = '', align = 'left', size = 'md' }: Props) {
  const justify = align === 'center' ? 'justify-center text-center' : '';
  return (
    <div className={`flex items-baseline gap-3 ${justify} ${className}`}>
      <span className={`font-jp ${SIZE_JP[size]} text-ivory tracking-wider font-semibold`}>
        {jp}
      </span>
      {en && (
        <span
          className={`font-display italic ${SIZE_EN[size]} text-brass tracking-widest uppercase opacity-80`}
        >
          {en}
        </span>
      )}
    </div>
  );
}
