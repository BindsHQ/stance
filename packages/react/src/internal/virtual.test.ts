import { describe, expect, it } from 'vitest';
import { buildOffsets, findIndexAt, getScrollOffsetForIndex, getVirtualRange } from './virtual';

describe('virtual maths', () => {
  const fixed = buildOffsets(100, () => 20);

  it('builds prefix sums', () => {
    expect(fixed[0]).toBe(0);
    expect(fixed[1]).toBe(20);
    expect(fixed[100]).toBe(2000);
    expect(buildOffsets(3, (i) => [10, 30, 5][i]!)).toEqual([0, 10, 40, 45]);
    expect(buildOffsets(0, () => 10)).toEqual([0]);
  });

  it('finds the item at a position', () => {
    expect(findIndexAt(fixed, 0)).toBe(0);
    expect(findIndexAt(fixed, 19.9)).toBe(0);
    expect(findIndexAt(fixed, 20)).toBe(1);
    expect(findIndexAt(fixed, 1999)).toBe(99);
    expect(findIndexAt(fixed, 5000)).toBe(99);
    expect(findIndexAt(fixed, -10)).toBe(0);
    const variable = buildOffsets(3, (i) => [10, 30, 5][i]!);
    expect(findIndexAt(variable, 39)).toBe(1);
    expect(findIndexAt(variable, 40)).toBe(2);
  });

  it('computes the visible range with overscan', () => {
    expect(getVirtualRange(fixed, 0, 100, 0)).toEqual({ start: 0, end: 4 });
    expect(getVirtualRange(fixed, 0, 100, 2)).toEqual({ start: 0, end: 6 });
    expect(getVirtualRange(fixed, 500, 100, 2)).toEqual({ start: 23, end: 31 });
    expect(getVirtualRange(fixed, 1990, 100, 3)).toEqual({ start: 96, end: 99 });
    expect(getVirtualRange([0], 0, 100, 3)).toEqual({ start: 0, end: -1 });
  });

  it('computes scroll offsets for alignment', () => {
    expect(getScrollOffsetForIndex(fixed, 10, 100, 0, 'start')).toBe(200);
    expect(getScrollOffsetForIndex(fixed, 10, 100, 0, 'end')).toBe(120);
    expect(getScrollOffsetForIndex(fixed, 10, 100, 0, 'center')).toBe(160);
    // auto: already visible → unchanged
    expect(getScrollOffsetForIndex(fixed, 2, 100, 0, 'auto')).toBe(0);
    // auto: below → align end; above → align start
    expect(getScrollOffsetForIndex(fixed, 10, 100, 0, 'auto')).toBe(120);
    expect(getScrollOffsetForIndex(fixed, 1, 100, 300, 'auto')).toBe(20);
    // clamps to bounds
    expect(getScrollOffsetForIndex(fixed, 99, 100, 0, 'start')).toBe(1900);
    expect(getScrollOffsetForIndex(fixed, 500, 100, 0, 'start')).toBe(1900);
  });
});
