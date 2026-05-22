import { useEffect } from 'react';
import { Table } from './components/Table';
import { handDriver } from './lib/handDriver';

export default function App() {
  useEffect(() => {
    handDriver.startNewHand();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Pokergo</h1>
        <span className="text-xs text-slate-400">Phase 1 prototype · 単一プレイヤー</span>
      </header>
      <main className="p-4">
        <Table />
      </main>
    </div>
  );
}
