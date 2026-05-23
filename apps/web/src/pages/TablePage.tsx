import { useEffect, useRef } from 'react';
import { Table } from '../components/Table';
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
  // 卓画面は卓そのものが主役。見出しは redundant。
  return <Table />;
}
