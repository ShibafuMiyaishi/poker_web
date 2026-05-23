// ポーカー用語の日本語表記。複数コンポーネントで重複していたものをここに集約する (DRY)。

import type { ActionType, Street } from '@pokergo/shared';

export const ACTION_JP: Record<ActionType, string> = {
  fold: 'フォールド',
  check: 'チェック',
  call: 'コール',
  bet: 'ベット',
  raise: 'レイズ',
  all_in: 'オールイン',
};

export const STREET_JP: Record<Street, string> = {
  preflop: 'プリフロ',
  flop: 'フロップ',
  turn: 'ターン',
  river: 'リバー',
  showdown: 'SD',
};

export function actionJp(a: string): string {
  return (ACTION_JP as Record<string, string>)[a] ?? a;
}

export function streetJp(s: string): string {
  return (STREET_JP as Record<string, string>)[s] ?? s;
}
