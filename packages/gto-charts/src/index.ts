// GTO チャートのロード用ヘルパ。
// データは ./data/ 配下の JSON。コードはここに置かない（純データのみ）。

export type GtoAction = 'raise' | 'call' | 'fold' | `mixed:${string}`;

export type GtoChart = Record<string, GtoAction>; // hand normalized -> action

export type Position = 'UTG' | 'UTG+1' | 'MP' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type ChartScenario = 'open' | 'vs-raise' | 'vs-3bet';

// 実装は Phase 4（分析エンジン強化）で。
