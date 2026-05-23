// 行動評価エンジン v2 で共有される型定義。

export type HandCategory =
  | 'air'
  | 'weak-pair'
  | 'pair'
  | 'top-pair'
  | 'overpair'
  | 'two-pair'
  | 'set' // ポケットペア + ボード合致 (隠れた強さ)
  | 'trips' // ボードペア + 自分の 1 枚 (バレやすい)
  | 'straight'
  | 'flush'
  | 'full-house-plus'
  | 'gs'
  | 'oesd'
  | 'fd'
  | 'combo-draw';

export type Verdict = 'optimal' | 'good' | 'questionable' | 'mistake';

// 169 ハンドに対するコンボウェイト (0-1)。キーは normalizeHand 準拠 ("AKs"/"AKo"/"55")。
export type HandRange = Record<string, number>;

export interface OutsBreakdown {
  clean: number;
  weak: number;
  blockerAdjusted: number;
  rule2equity: number; // %
}
