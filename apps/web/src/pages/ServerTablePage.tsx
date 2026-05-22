import { useEffect } from 'react';
import { SitPanel } from '../components/SitPanel';
import { Table } from '../components/Table';
import { serverDriver } from '../lib/serverDriver';
import { useTableStore } from '../stores/tableStore';

function statusLabel(s: string): string {
  switch (s) {
    case 'connecting':
      return '接続中…';
    case 'connected':
      return '接続済';
    case 'disconnected':
      return '切断 (再接続中)';
    case 'error':
      return 'エラー (再接続中)';
    default:
      return '待機中';
  }
}

export function ServerTablePage() {
  const connection = useTableStore((s) => s.connection);

  useEffect(() => {
    void serverDriver.connect();
    return () => {
      serverDriver.disconnect();
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
        <span>
          サーバモード:{' '}
          <span
            className={
              connection === 'connected'
                ? 'text-win font-semibold'
                : connection === 'connecting'
                  ? 'text-yellow-400'
                  : 'text-lose'
            }
          >
            {statusLabel(connection)}
          </span>
        </span>
        <span className="text-slate-500">
          TableDO 上で全プレイヤー(あなた + CPU + 友達) がリアルタイムでプレイ
        </span>
      </div>
      <SitPanel />
      <Table />
    </div>
  );
}
