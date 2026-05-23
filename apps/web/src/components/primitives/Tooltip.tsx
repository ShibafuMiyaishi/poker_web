import { type ReactNode, useState } from 'react';

interface Props {
  /** ホバー/フォーカスで表示する説明文 */
  content: string;
  /** 子要素 (用語、アイコン等) */
  children: ReactNode;
}

// 軽量 Tooltip — Radix 等の依存無し。hover / focus-within / keyboard で表示。
// ポーカー用語 (ポットオッズ / OESD / FE 等) の定義を即座に確認できる。
export function Tooltip({ content, children }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <button
        type="button"
        className="underline decoration-dotted decoration-brass/55 underline-offset-2 cursor-help bg-transparent border-0 p-0 text-current font-inherit"
        aria-describedby={visible ? 'tooltip-content' : undefined}
        onClick={(e) => e.preventDefault()}
      >
        {children}
      </button>
      {visible && (
        <span
          id="tooltip-content"
          role="tooltip"
          className="absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2.5 py-1.5 rounded-md bg-ink-abyss/95 border border-brass/45 shadow-card text-[10px] font-jp-sans text-ivory-dim leading-relaxed tracking-wider min-w-[180px] max-w-[260px] text-center pointer-events-none"
        >
          {content}
        </span>
      )}
    </span>
  );
}
