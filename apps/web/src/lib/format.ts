// チップ / bb 単位の表示ヘルパー。bbDisplay が true なら bb 単位、false なら chip 単位。
// bb サイズはハンド状態から取得 (state.bb)。

export function formatChips(amount: number, bb: number, bbDisplay: boolean): string {
  if (bbDisplay && bb > 0) {
    const val = amount / bb;
    // 端数: 1bb 未満は 0.1bb 刻み、それ以上は 0.1bb 単位で表示
    if (Math.abs(val) >= 100) return `${val.toFixed(0)}bb`;
    if (Math.abs(val) >= 10) return `${val.toFixed(1)}bb`;
    return `${val.toFixed(2)}bb`;
  }
  return amount.toLocaleString();
}

export function formatBbOnly(amount: number, bb: number): string {
  if (bb <= 0) return '—';
  const val = amount / bb;
  if (Math.abs(val) >= 100) return `${val.toFixed(0)}bb`;
  if (Math.abs(val) >= 10) return `${val.toFixed(1)}bb`;
  return `${val.toFixed(2)}bb`;
}
