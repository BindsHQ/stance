'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useRovingFocus } from '../../internal/roving-focus.js';

const ITEM_SELECTOR =
  'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [data-toolbar-item]';

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Layout and arrow-key axis. Default `horizontal`. */
  orientation?: 'horizontal' | 'vertical';
  /** Wrap focus from last to first. Default true. */
  loop?: boolean;
  /** Visual density. Default `md`. */
  size?: 'sm' | 'md';
  /** Draw a border and surface around the toolbar. Default true. */
  bordered?: boolean;
}

/**
 * Groups related controls into a single tab stop. Arrow keys move between
 * controls (WAI-ARIA toolbar pattern). Requires an accessible label.
 */
export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  {
    orientation = 'horizontal',
    loop = true,
    size = 'md',
    bordered = true,
    className,
    onKeyDown,
    ...props
  },
  forwardedRef,
) {
  const ref = React.useRef<HTMLDivElement>(null);
  const composed = useComposedRefs(forwardedRef, ref);
  const roving = useRovingFocus(ref, { orientation, loop, itemSelector: ITEM_SELECTOR });
  return (
    <div
      ref={composed}
      role="toolbar"
      aria-orientation={orientation}
      className={cx('st-toolbar', className)}
      data-orientation={orientation}
      data-size={size}
      data-bordered={bordered ? '' : undefined}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const target = event.target as HTMLElement;
        const isTextField =
          (target instanceof HTMLInputElement &&
            !['checkbox', 'radio', 'button', 'submit', 'reset', 'range'].includes(target.type)) ||
          target instanceof HTMLTextAreaElement;
        // Text fields keep their own caret navigation and Home/End.
        if (isTextField && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        if (target instanceof HTMLSelectElement && ['ArrowUp', 'ArrowDown'].includes(event.key))
          return;
        roving.onKeyDown(event);
      }}
      {...props}
    />
  );
});

export interface ToolbarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label for the group, e.g. "Text formatting". */
  'aria-label'?: string;
}

/** A labelled cluster of related toolbar controls. */
export const ToolbarGroup = React.forwardRef<HTMLDivElement, ToolbarGroupProps>(
  function ToolbarGroup({ className, ...props }, ref) {
    return <div ref={ref} role="group" className={cx('st-toolbar__group', className)} {...props} />;
  },
);

/** A visual and semantic divider between toolbar groups. */
export const ToolbarSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }
>(function ToolbarSeparator({ className, orientation = 'vertical', ...props }, ref) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cx('st-toolbar__separator', className)}
      data-orientation={orientation}
      {...props}
    />
  );
});

/** Pushes following controls to the far end of the toolbar. */
export function ToolbarSpacer() {
  return <div className="st-toolbar__spacer" aria-hidden="true" />;
}
