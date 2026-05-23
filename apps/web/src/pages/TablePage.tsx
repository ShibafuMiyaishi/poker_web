import { useEffect } from 'react';
import { Table } from '../components/Table';
import { SectionLabel } from '../components/primitives/SectionLabel';
import { handDriver } from '../lib/handDriver';

export function TablePage() {
  useEffect(() => {
    handDriver.startNewHand();
  }, []);
  return (
    <div className="space-y-4">
      <SectionLabel jp="独卓" en="Solo Table" align="center" />
      <Table />
    </div>
  );
}
