import { useEffect } from 'react';
import { SitPanel } from '../components/SitPanel';
import { Table } from '../components/Table';
import { SectionLabel } from '../components/primitives/SectionLabel';
import { serverDriver } from '../lib/serverDriver';
import { useTableStore } from '../stores/tableStore';

function statusLabel(s: string): { jp: string; en: string; tone: 'good' | 'warn' | 'bad' } {
  switch (s) {
    case 'connecting':
      return { jp: '接続中', en: 'connecting…', tone: 'warn' };
    case 'connected':
      return { jp: '接続済', en: 'connected', tone: 'good' };
    case 'disconnected':
      return { jp: '切断中', en: 'reconnecting…', tone: 'bad' };
    case 'error':
      return { jp: 'エラー', en: 'reconnecting…', tone: 'bad' };
    default:
      return { jp: '待機', en: 'idle', tone: 'warn' };
  }
}

export function ServerTablePage() {
  const connection = useTableStore((s) => s.connection);
  const { jp, en, tone } = statusLabel(connection);

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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SectionLabel jp="相席卓" en="Online Table" />
        <div className="flex items-center gap-2 text-[11px]">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="font-jp tracking-widest">{jp}</span>
          <span className="font-display italic text-brass">{en}</span>
        </div>
      </div>
      <p className="text-[11px] text-ivory-muted font-display italic">
        TableDO の上で全プレイヤー（あなた・CPU・友人）がリアルタイムに同卓します。
      </p>
      <SitPanel />
      <Table />
    </div>
  );
}
