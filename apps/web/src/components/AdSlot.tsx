import { useEffect, useRef } from 'react';

// Google AdSense 用スロット。VITE_ADSENSE_CLIENT_ID が未設定なら何も描画しない（dev）。
// 仕様 §13.1: ロビー / 履歴 / 統計 のみ。プレイ画面（卓画面）には絶対設置しないこと。
interface Props {
  slotId: string;
  format?: 'auto' | 'fluid';
  className?: string;
}

const CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ slotId, format = 'auto', className }: Props) {
  const ref = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    if (!document.querySelector(`script[data-pokergo-adsense="${CLIENT_ID}"]`)) {
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT_ID}`;
      s.crossOrigin = 'anonymous';
      s.dataset.pokergoAdsense = CLIENT_ID;
      document.head.appendChild(s);
    }
    // 重複 push 防止: 既に初期化済み (data-adsbygoogle-status が付与) なら skip。
    // StrictMode の double-effect / ビュー切替で同じ <ins> が再マウントされた場合に
    // 「TagError: All ins elements ... were filled」を防ぐ。
    const insEl = ref.current;
    if (insEl?.getAttribute('data-adsbygoogle-status')) return;
    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch {
      /* AdSense 未ロード時はサイレント */
    }
  }, []);

  if (!CLIENT_ID) {
    // 開発時のプレースホルダ
    return (
      <div
        className={`text-[10px] text-slate-600 bg-slate-900/40 border border-dashed border-slate-800 rounded p-2 text-center ${className ?? ''}`}
      >
        AdSense (slot {slotId}) — 本番では広告表示
      </div>
    );
  }

  return (
    <ins
      ref={ref}
      className={`adsbygoogle block ${className ?? ''}`}
      style={{ display: 'block' }}
      data-ad-client={CLIENT_ID}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
