'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Scroll direction. Default `vertical`. */
  orientation?: 'vertical' | 'horizontal' | 'both';
  /** Max height before scrolling (vertical/both). Number = px. */
  maxHeight?: number | string;
  /** Fixed height. Number = px. */
  height?: number | string;
  /** Max width before scrolling (horizontal/both). Number = px. */
  maxWidth?: number | string;
  /** Show fade hints at scrollable edges. Default true. */
  fade?: boolean;
  /**
   * Accessible label. When content overflows, the area becomes a focusable,
   * labelled region so keyboard users can scroll it (WCAG 2.1.1).
   */
  label?: string;
  /** Scrollbar thickness. Default `thin`. */
  scrollbar?: 'thin' | 'auto';
}

/**
 * A native scroll container with themed, thin scrollbars and edge fades.
 * Uses the browser's real scrolling: no simulated scrollbars.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  {
    orientation = 'vertical',
    maxHeight,
    height,
    maxWidth,
    fade = true,
    label,
    scrollbar = 'thin',
    className,
    style,
    onScroll,
    children,
    ...props
  },
  forwardedRef,
) {
  const ref = React.useRef<HTMLDivElement>(null);
  const composed = useComposedRefs(forwardedRef, ref);
  const [state, setState] = React.useState({
    scrollable: false,
    atStart: true,
    atEnd: true,
    atLeft: true,
    atRight: true,
  });

  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const v = orientation !== 'horizontal';
    const h = orientation !== 'vertical';
    const overflowY = v && el.scrollHeight - el.clientHeight > 1;
    const overflowX = h && el.scrollWidth - el.clientWidth > 1;
    const next = {
      scrollable: overflowY || overflowX,
      atStart: !overflowY || el.scrollTop <= 1,
      atEnd: !overflowY || el.scrollTop + el.clientHeight >= el.scrollHeight - 1,
      atLeft: !overflowX || el.scrollLeft <= 1,
      atRight: !overflowX || el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    };
    setState((prev) =>
      prev.scrollable === next.scrollable &&
      prev.atStart === next.atStart &&
      prev.atEnd === next.atEnd &&
      prev.atLeft === next.atLeft &&
      prev.atRight === next.atRight
        ? prev
        : next,
    );
  }, [orientation]);

  useIsomorphicLayoutEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => ro.disconnect();
  }, [measure]);

  const { 'aria-label': ariaLabelProp, ...restProps } = props;
  const ariaLabel = ariaLabelProp ?? label;
  const focusable = state.scrollable || props.tabIndex !== undefined;
  return (
    <div
      ref={composed}
      className={cx('st-scroll-area', className)}
      data-orientation={orientation}
      data-scrollbar={scrollbar}
      data-fade={fade ? '' : undefined}
      data-scrollable={state.scrollable ? '' : undefined}
      data-at-start={state.atStart ? '' : undefined}
      data-at-end={state.atEnd ? '' : undefined}
      data-at-left={state.atLeft ? '' : undefined}
      data-at-right={state.atRight ? '' : undefined}
      tabIndex={focusable ? (props.tabIndex ?? 0) : undefined}
      role={state.scrollable && ariaLabel ? 'region' : props.role}
      // A label is only valid on a named role; apply it when the area is a region (or has an explicit role).
      aria-label={(state.scrollable && ariaLabel) || props.role ? ariaLabel : undefined}
      style={{ maxHeight, height, maxWidth, ...style }}
      onScroll={(e) => {
        onScroll?.(e);
        measure();
      }}
      {...restProps}
    >
      {children}
    </div>
  );
});
