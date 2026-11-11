'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useDialogContext,
  type DialogContentProps,
  type DialogProps,
} from '../dialog/Dialog.js';

export type SheetProps = DialogProps;

/** A bottom sheet for mobile-first flows. Drag the handle down to dismiss. */
export function Sheet(props: SheetProps) {
  return <Dialog {...props} />;
}

export const SheetTrigger = DialogTrigger;
export const SheetHeader = DialogHeader;
export const SheetTitle = DialogTitle;
export const SheetDescription = DialogDescription;
export const SheetBody = DialogBody;
export const SheetFooter = DialogFooter;
export const SheetClose = DialogClose;

export interface SheetContentProps extends Omit<DialogContentProps, 'placement' | 'size' | 'role'> {
  /** Height: `auto` fits content (max 90%), `half` 50%, `full` 100%. Default `auto`. */
  height?: 'auto' | 'half' | 'full';
  /** Show the drag handle. Default true. */
  showHandle?: boolean;
  /** Distance in px (or fraction of height when < 1) dragged down before dismissing. Default 0.3. */
  dismissThreshold?: number;
}

/** The sheet surface, anchored to the bottom edge. */
export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  function SheetContent(
    { height = 'auto', showHandle = true, dismissThreshold = 0.3, className, children, ...props },
    forwardedRef,
  ) {
    const ctx = useDialogContext('SheetContent');
    const ref = React.useRef<HTMLDivElement>(null);
    const composed = useComposedRefs(forwardedRef, ref);
    const drag = React.useRef<{ startY: number; dy: number; t: number } | null>(null);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      drag.current = { startY: e.clientY, dy: 0, t: performance.now() };
      e.currentTarget.setPointerCapture?.(e.pointerId);
      if (ref.current) ref.current.style.transition = 'none';
    };
    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag.current || !ref.current) return;
      const dy = Math.max(0, e.clientY - drag.current.startY);
      drag.current.dy = dy;
      ref.current.style.transform = `translateY(${dy}px)`;
    };
    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      const state = drag.current;
      drag.current = null;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      const el = ref.current;
      if (!state || !el) return;
      const height = el.getBoundingClientRect().height || 1;
      const limit = dismissThreshold < 1 ? height * dismissThreshold : dismissThreshold;
      const velocity = state.dy / Math.max(1, performance.now() - state.t); // px per ms
      el.style.transition = '';
      if (state.dy > limit || (state.dy > 24 && velocity > 0.6)) {
        ctx.setOpen(false);
      } else {
        el.style.transform = '';
      }
    };

    return (
      <DialogContent
        ref={composed}
        placement="bottom"
        className={cx('st-sheet', className)}
        data-height={height}
        {...props}
      >
        {showHandle && (
          <div
            className="st-sheet__handle"
            aria-hidden="true"
            data-sheet-handle=""
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <span />
          </div>
        )}
        {children}
      </DialogContent>
    );
  },
);
