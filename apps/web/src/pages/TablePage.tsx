import { useEffect, useRef } from 'react';
import { Table } from '../components/Table';
import { SectionLabel } from '../components/primitives/SectionLabel';
import { handDriver } from '../lib/handDriver';

export function TablePage() {
  // StrictMode の double-effect で startNewHand が 2 回呼ばれて
  // カードがコロコロ変わるのを防ぐ。
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    handDriver.startNewHand();
  }, []);
  return (
    <div className="space-y-4">
      <SectionLabel jp="独卓" en="Solo Table" align="center" />
      <Table />
    </div>
  );
}
