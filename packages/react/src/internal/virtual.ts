'use client';
import * as React from 'react';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect.js';

/** Prefix sums of item sizes. `offsets[i]` is the start of item i; `offsets[count]` is the total size. */
export function buildOffsets(count: number, getSize: (index: number) => number): number[] {
  const offsets = new Array<number>(count + 1);
  offsets[0] = 0;
  for (let i = 0; i < count; i++) offsets[i + 1] = offsets[i]! + Math.max(0, getSize(i));
  return offsets;
}

/** Index of the item containing `position` (binary search over offsets). */
export function findIndexAt(offsets: number[], position: number): number {
  const count = offsets.length - 1;
  if (count <= 0) return 0;
  if (position <= 0) return 0;
  if (position >= offsets[count]!) return count - 1;
  let lo = 0;
  let hi = count - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid]! <= position) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export interface VirtualRange {
  /** First rendered index (inclusive). */
  start: number;
  /** Last rendered index (inclusive), or -1 when empty. */
  end: number;
}

/** Visible range for a viewport, expanded by `overscan` items on each side. */
export function getVirtualRange(
  offsets: number[],
  scrollTop: number,
  viewport: number,
  overscan: number,
): VirtualRange {
  const count = offsets.length - 1;
  if (count <= 0) return { start: 0, end: -1 };
  const first = findIndexAt(offsets, scrollTop);
  const last = findIndexAt(offsets, scrollTop + Math.max(0, viewport) - 0.5);
  return { start: Math.max(0, first - overscan), end: Math.min(count - 1, last + overscan) };
}

export type ScrollAlign = 'start' | 'center' | 'end' | 'auto';

/** Scroll position that brings item `index` into view with the given alignment. */
export function getScrollOffsetForIndex(
  offsets: number[],
  index: number,
  viewport: number,
  currentScroll: number,
  align: ScrollAlign = 'auto',
): number {
  const count = offsets.length - 1;
  if (count <= 0) return 0;
  const i = Math.min(Math.max(0, index), count - 1);
  const start = offsets[i]!;
  const end = offsets[i + 1]!;
  const max = Math.max(0, offsets[count]! - viewport);
  let target: number;
  if (align === 'start') target = start;
  else if (align === 'end') target = end - viewport;
  else if (align === 'center') target = start - (viewport - (end - start)) / 2;
  else if (start < currentScroll) target = start;
  else if (end > currentScroll + viewport) target = end - viewport;
  else target = currentScroll;
  return Math.min(Math.max(0, target), max);
}

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

export interface UseVirtualOptions {
  count: number;
  scrollRef: React.RefObject<HTMLElement | null>;
  /** Fixed size per item, or a function of the index. Omit to measure rendered items. */
  itemSize?: number | ((index: number) => number) | undefined;
  /** Estimate used before an item is measured. Default 40. */
  estimatedItemSize?: number | undefined;
  overscan?: number | undefined;
  /** Viewport size used before layout is known (SSR, jsdom). */
  initialViewportSize?: number | undefined;
  horizontal?: boolean | undefined;
}

/** Windowing hook: computes which items to render for a scroll container. */
export function useVirtual({
  count,
  scrollRef,
  itemSize,
  estimatedItemSize = 40,
  overscan = 4,
  initialViewportSize = 400,
  horizontal = false,
}: UseVirtualOptions) {
  const [scroll, setScroll] = React.useState(0);
  const [viewport, setViewport] = React.useState(initialViewportSize);
  const measured = React.useRef(new Map<number, number>());
  const [version, setVersion] = React.useState(0);

  const offsets = React.useMemo(() => {
    const get =
      typeof itemSize === 'number'
        ? () => itemSize
        : typeof itemSize === 'function'
          ? itemSize
          : (i: number) => measured.current.get(i) ?? estimatedItemSize;
    return buildOffsets(count, get);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, itemSize, estimatedItemSize, version]);

  useIsomorphicLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const read = () => {
      const size = horizontal ? el.clientWidth : el.clientHeight;
      if (size > 0) setViewport(size);
      setScroll(horizontal ? el.scrollLeft : el.scrollTop);
    };
    read();
    el.addEventListener('scroll', read, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', read);
      ro?.disconnect();
    };
  }, [scrollRef, horizontal]);

  const range = getVirtualRange(offsets, scroll, viewport, overscan);
  const items: VirtualItem[] = [];
  for (let i = range.start; i <= range.end; i++)
    items.push({ index: i, start: offsets[i]!, size: offsets[i + 1]! - offsets[i]! });

  const observer = React.useRef<ResizeObserver | null>(null);
  const measureElement = React.useCallback(
    (el: HTMLElement | null) => {
      if (!el || itemSize !== undefined) return;
      const index = Number(el.dataset.index);
      const read = () => {
        const size = horizontal ? el.offsetWidth : el.offsetHeight;
        if (size > 0 && measured.current.get(index) !== size) {
          measured.current.set(index, size);
          setVersion((v) => v + 1);
        }
      };
      read();
      if (typeof ResizeObserver !== 'undefined') {
        observer.current ??= new ResizeObserver((entries) => {
          for (const entry of entries) {
            const target = entry.target as HTMLElement;
            const idx = Number(target.dataset.index);
            const size = horizontal ? target.offsetWidth : target.offsetHeight;
            if (size > 0 && measured.current.get(idx) !== size) {
              measured.current.set(idx, size);
              setVersion((v) => v + 1);
            }
          }
        });
        observer.current.observe(el);
      }
    },
    [itemSize, horizontal],
  );
  React.useEffect(() => () => observer.current?.disconnect(), []);

  const scrollToIndex = React.useCallback(
    (index: number, align: ScrollAlign = 'auto') => {
      const el = scrollRef.current;
      if (!el) return;
      const current = horizontal ? el.scrollLeft : el.scrollTop;
      const size = (horizontal ? el.clientWidth : el.clientHeight) || viewport;
      const target = getScrollOffsetForIndex(offsets, index, size, current, align);
      if (horizontal) el.scrollLeft = target;
      else el.scrollTop = target;
      setScroll(target);
    },
    [scrollRef, horizontal, offsets, viewport],
  );

  return { items, totalSize: offsets[count] ?? 0, range, scrollToIndex, measureElement, viewport };
}
