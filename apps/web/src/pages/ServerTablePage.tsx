import { useEffect } from 'react';
import { SitPanel } from '../components/SitPanel';
import { Table } from '../components/Table';
import { SectionLabel } from '../components/primitives/SectionLabel';
import { serverDriver } from '../lib/serverDriver';
import { useTableStore } from '../stores/tableStore';

function statusLabel(s: string): { jp: string; tone: 'good' | 'warn' | 'bad' } {
  switch (s) {
    case 'connecting':
      return { jp: '接続中', tone: 'warn' };
    case 'connected':
      return { jp: '接続済', tone: 'good' };
    case 'disconnected':
      return { jp: '切断 / 再接続中', tone: 'bad' };
    case 'error':
      return { jp: 'エラー / 再接続中', tone: 'bad' };
    default:
      return { jp: '待機', tone: 'warn' };
  }
}

export function ServerTablePage() {
  const connection = useTableStore((s) => s.connection);
  const { jp, tone } = statusLabel(connection);

  useEffect(() => {
    void serverDriver.connect();
    return () => {
      serverDriver.disconnect();
    };
  }, []);

  const dot =
    tone === 'good'
      ? 'bg-jade-glow shadow-[0_0_10px_rgba(110,231,183,0.6)] animate-pulse'
      : tone === 'warn'
        ? 'bg-brass animate-pulse'
        : 'bg-crimson-glow';

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap border-b border-brass/20 pb-3">
        <SectionLabel jp="相席卓" en="Online Table" size="lg" />
        <div
          // biome-ignore lint/a11y/useSemanticElements: <output> はフォーム出力用、状態通知には role="status" の div
          role="status"
          className="flex items-center gap-2 text-[11px]"
          aria-live="polite"
          aria-label="接続状態"
        >
          <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden="true" />
          <span className="font-jp-sans tracking-widest">{jp}</span>
        </div>
      </header>
      <section className="relative rounded-md border border-brass/20 bg-ink-deep/60 p-3 sm:p-4">
        <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-brass/35 to-transparent" />
        <h3 className="font-jp text-sm text-brass-light tracking-widest mb-1">公開卓（ベータ）</h3>
        <p className="text-[11px] text-ivory-dim font-jp-sans leading-relaxed">
          サーバ上の単一卓に接続します。空席に着席すると、他のプレイヤー / CPU
          とリアルタイムにハンドが回ります。仕様 MVP では 1 卓固定 (8-Max NLH 5/10)。
          <br />
          <span className="text-jade-glow">▸ 卓ローカルプレイ</span>
          は左メニュー「卓」から、即座に CPU 7 体と遊べます。
        </p>
      </section>
      <SitPanel />
      <Table />
    </div>
  );
}
