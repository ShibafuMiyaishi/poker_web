import { useEffect } from 'react';
import { Table } from '../components/Table';
import { handDriver } from '../lib/handDriver';

export function TablePage() {
  useEffect(() => {
    handDriver.startNewHand();
  }, []);
  return <Table />;
}
