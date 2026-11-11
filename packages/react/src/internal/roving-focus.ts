'use client';
import * as React from 'react';

export type Orientation = 'horizontal' | 'vertical' | 'both';

export interface RovingFocusOptions {
  orientation?: Orientation;
  /** Wrap from last to first. Default true. */
  loop?: boolean;
  /** Selector for items. Default `[data-roving-item]`. */
  itemSelector?: string;
  /** Move focus on Home/End. Default true. */
  homeEnd?: boolean;
  /** Text direction, flips horizontal arrows in RTL. */
  dir?: 'ltr' | 'rtl';
}

const DEFAULT_ITEM = '[data-roving-item]';

export function getRovingItems(container: HTMLElement, selector = DEFAULT_ITEM): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true' && !el.closest('[hidden]'),
  );
}

/**
 * Roving tabindex: one item in the group is tabbable; arrow keys move focus.
 * Implements the WAI-ARIA APG pattern for toolbars, tablists, radio groups, menus and listboxes.
 */
export function useRovingFocus(containerRef: React.RefObject<HTMLElement | null>, options: RovingFocusOptions = {}) {
  const { orientation = 'horizontal', loop = true, itemSelector = DEFAULT_ITEM, homeEnd = true, dir = 'ltr' } = options;

  // Ensure exactly one item is tabbable after every render.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const all = Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
    const enabled = getRovingItems(container, itemSelector);
    const current =
      enabled.find((el) => el === document.activeElement) ??
      enabled.find((el) => el.getAttribute('data-roving-active') === 'true') ??
      enabled.find((el) => el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-checked') === 'true' || el.getAttribute('data-state') === 'active') ??
      enabled[0];
    for (const el of all) el.tabIndex = el === current ? 0 : -1;
  });

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      const container = containerRef.current;
      if (!container) return;
      const items = getRovingItems(container, itemSelector);
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (index === -1) return;
      const prevKeys = orientation === 'vertical' ? ['ArrowUp'] : orientation === 'horizontal' ? [dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'] : ['ArrowUp', dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'];
      const nextKeys = orientation === 'vertical' ? ['ArrowDown'] : orientation === 'horizontal' ? [dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'] : ['ArrowDown', dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'];
      let next = -1;
      if (nextKeys.includes(event.key)) next = index + 1 >= items.length ? (loop ? 0 : index) : index + 1;
      else if (prevKeys.includes(event.key)) next = index - 1 < 0 ? (loop ? items.length - 1 : index) : index - 1;
      else if (homeEnd && event.key === 'Home') next = 0;
      else if (homeEnd && event.key === 'End') next = items.length - 1;
      if (next === -1) return;
      event.preventDefault();
      const target = items[next]!;
      for (const el of items) el.tabIndex = el === target ? 0 : -1;
      target.focus();
    },
    [containerRef, itemSelector, orientation, loop, homeEnd, dir],
  );

  return { onKeyDown };
}
