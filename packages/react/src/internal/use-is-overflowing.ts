'use client';
import * as React from 'react';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect.js';

/**
 * Tracks whether an element's content overflows it. Scrollable regions must be keyboard
 * reachable (WCAG 2.1.1); components use this to become focusable only when they actually scroll.
 */
export function useIsOverflowing(ref: React.RefObject<HTMLElement | null>): boolean {
  const [overflowing, setOverflowing] = React.useState(false);
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () =>
      setOverflowing(el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null;
    ro?.observe(el);
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(check) : null;
    mo?.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [ref]);
  return overflowing;
}
