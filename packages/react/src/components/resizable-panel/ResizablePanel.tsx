'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useIsOverflowing } from '../../internal/use-is-overflowing.js';
import { PANEL_MARKER, useSplitPanel, type SplitPart } from '../split-panel/context.js';

export interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Initial size in percent of the group. Panels without one share the remainder. */
  defaultSize?: number;
  /** Minimum size in percent. Default 10. */
  minSize?: number;
  /** Maximum size in percent. Default 100. */
  maxSize?: number;
  /** Allow collapsing to `collapsedSize` with Enter on the handle or by dragging below the minimum. */
  collapsible?: boolean;
  /** Size in percent when collapsed. Default 0. */
  collapsedSize?: number;
  /** @internal injected by SplitPanel */
  __index?: number;
}

/** One resizable region inside a `SplitPanel`. */
export const ResizablePanel = Object.assign(
  React.forwardRef<HTMLDivElement, ResizablePanelProps>(function ResizablePanel(
    {
      defaultSize: _defaultSize,
      minSize: _minSize,
      maxSize: _maxSize,
      collapsible: _collapsible,
      collapsedSize: _collapsedSize,
      __index = 0,
      className,
      style,
      id: _id,
      ...props
    },
    forwardedRef,
  ) {
    const ctx = useSplitPanel('ResizablePanel');
    const innerRef = React.useRef<HTMLDivElement>(null);
    const ref = useComposedRefs(forwardedRef, innerRef);
    const overflowing = useIsOverflowing(innerRef);
    const size = ctx.sizes[__index] ?? 0;
    const c = ctx.constraints[__index];
    const collapsed = Boolean(c?.collapsible && size <= (c?.collapsedSize ?? 0));
    return (
      <div
        ref={ref}
        id={c?.id}
        className={cx('st-resizable-panel', className)}
        data-size={Math.round(size)}
        data-collapsed={collapsed ? '' : undefined}
        tabIndex={overflowing ? 0 : undefined}
        style={{ flex: `${size} 1 0px`, ...style }}
        {...(collapsed && { hidden: size === 0 ? true : undefined })}
        {...props}
      />
    );
  }),
  { [PANEL_MARKER]: 'panel' as SplitPart },
);
