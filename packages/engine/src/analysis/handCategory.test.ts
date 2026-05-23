import { describe, expect, it } from 'vitest';
import { classifyHandCategory } from './handCategory';

describe('classifyHandCategory', () => {
  it('プリフロップ: ペアは pair', () => {
    expect(classifyHandCategory(['As', 'Ah'], [])).toBe('pair');
  });
  it('プリフロップ: 非ペアは air', () => {
    expect(classifyHandCategory(['As', 'Kh'], [])).toBe('air');
  });

  it('フロップ: top-pair (A on Axx)', () => {
    expect(classifyHandCategory(['As', 'Kh'], ['Ad', '7c', '2s'])).toBe('top-pair');
  });

  it('フロップ: overpair (KK on lower board)', () => {
    expect(classifyHandCategory(['Ks', 'Kh'], ['9d', '7c', '2s'])).toBe('overpair');
  });

  it('フロップ: ボード合致のポケットペア → set', () => {
    expect(classifyHandCategory(['2s', '2h'], ['Td', '8c', '2c'])).toBe('set');
  });

  it('フロップ: ボードペア + 合致 = trips (KK2 でヒーロー K)', () => {
    expect(classifyHandCategory(['Ks', '5h'], ['Kd', 'Kc', '2s'])).toBe('trips');
  });

  it('フロップ: フラッシュドロー単独', () => {
    expect(classifyHandCategory(['As', 'Ks'], ['7s', '2s', '9h'])).toBe('fd');
  });

  it('フロップ: OESD', () => {
    expect(classifyHandCategory(['9h', '8s'], ['Th', '7c', '2d'])).toBe('oesd');
  });

  it('フロップ: ガットショット (9-8 on T62 → 7 でストレート完成)', () => {
    expect(classifyHandCategory(['9h', '8s'], ['Th', '6c', '2d'])).toBe('gs');
  });

  it('リバー: フラッシュ', () => {
    expect(classifyHandCategory(['As', 'Ks'], ['7s', '2s', '9s', '4h', '2h'])).toBe('flush');
  });

  it('リバー: ストレート', () => {
    expect(classifyHandCategory(['9h', '8s'], ['Th', '7c', '6d', '2c', '2h'])).toBe('straight');
  });

  it('セット: ポケットペアがボードと合致', () => {
    expect(classifyHandCategory(['7s', '7h'], ['7d', '9c', '2s'])).toBe('set');
  });
});
