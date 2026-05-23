import type { ReactNode } from 'react';

// 高級感のあるパネル基底。背景に paper-noise、エッジに brass ライン。
interface Props {
  children: ReactNode;
  className?: string;
  tone?: 'dark' | 'paper' | 'felt';
  glow?: boolean;
}

const TONE_BG: Record<NonNullable<Props['tone']>, string> = {
  dark: 'bg-gradient-to-b from-ink-deep/90 to-ink/95',
  paper: 'bg-paper-cream text-ink-deepest',
  felt: 'felt-surface',
};

export function Surface({ children, className = '', tone = 'dark', glow = false }: Props) {
  return (
    <div
      className={`relative rounded-lg border border-brass/25 ${TONE_BG[tone]} ${
        glow ? 'shadow-brass' : 'shadow-card'
      } ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
