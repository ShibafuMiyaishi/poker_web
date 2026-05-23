// 編集デザイン的セクションラベル: 「— ハンド履歴 / Hand Log —」
// 日本語 (Shippori Mincho) + 英 (Fraunces Italic)
interface Props {
  jp: string;
  en: string;
  className?: string;
  align?: 'left' | 'center';
}

export function SectionLabel({ jp, en, className = '', align = 'left' }: Props) {
  const justify = align === 'center' ? 'justify-center text-center' : '';
  return (
    <div className={`flex items-baseline gap-3 ${justify} ${className}`}>
      <span className="font-jp text-base sm:text-lg text-ivory tracking-wider">{jp}</span>
      <span className="font-display italic text-[11px] sm:text-xs text-brass tracking-widest uppercase">
        {en}
      </span>
    </div>
  );
}
