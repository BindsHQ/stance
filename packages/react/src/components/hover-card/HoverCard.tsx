'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { createStrictContext } from '../../internal/context.js';
import { cx } from '../../internal/cx.js';
import { useHoverIntent } from '../../internal/hover-intent.js';
import { useDismissableLayer } from '../../internal/layer-stack.js';
import { Portal } from '../../internal/portal.js';
import { useComposedRefs } from '../../internal/refs.js';
import { Slot } from '../../internal/slot.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useFloating, type FloatingPositioningProps } from '../../internal/use-floating.js';

interface HoverCardContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  scheduleOpen: (delay?: number) => void;
  scheduleClose: (delay?: number) => void;
  cancel: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentId: string;
}

const [HoverCardProvider, useHoverCardContext] =
  createStrictContext<HoverCardContextValue>('HoverCard');

export interface HoverCardProps {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Delay before opening on hover, in ms. Default 600. */
  openDelay?: number;
  /** Delay before closing after the pointer leaves, in ms. Default 300. */
  closeDelay?: number;
}

/**
 * A rich preview shown when hovering or focusing a link, e.g. a person or document.
 * Supplementary only: everything in it must also be reachable by following the link.
 */
export function HoverCard({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  openDelay = 600,
  closeDelay = 300,
}: HoverCardProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const intent = useHoverIntent({ setOpen, openDelay, closeDelay });
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentId = `${React.useId()}-hover-card`;
  const value = React.useMemo(
    () => ({ open, setOpen, ...intent, triggerRef, contentId }),
    [open, setOpen, intent, contentId],
  );
  return <HoverCardProvider value={value}>{children}</HoverCardProvider>;
}

export interface HoverCardTriggerProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Render your own element (e.g. a router Link). */
  asChild?: boolean;
}

/** The element that reveals the card, normally a link. */
export const HoverCardTrigger = React.forwardRef<HTMLAnchorElement, HoverCardTriggerProps>(
  function HoverCardTrigger(
    { asChild, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props },
    ref,
  ) {
    const ctx = useHoverCardContext('HoverCardTrigger');
    const Comp = asChild ? Slot : 'a';
    return (
      <Comp
        ref={
          useComposedRefs(ref, ctx.triggerRef as React.Ref<HTMLAnchorElement>) as React.Ref<
            HTMLAnchorElement & HTMLElement
          >
        }
        data-state={ctx.open ? 'open' : 'closed'}
        onPointerEnter={composeHandlers(
          onPointerEnter,
          (e: React.PointerEvent<HTMLAnchorElement>) => {
            if (e.pointerType !== 'touch') ctx.scheduleOpen();
          },
        )}
        onPointerLeave={composeHandlers(
          onPointerLeave,
          (e: React.PointerEvent<HTMLAnchorElement>) => {
            if (e.pointerType !== 'touch') ctx.scheduleClose();
          },
        )}
        onFocus={composeHandlers(onFocus, () => ctx.scheduleOpen())}
        onBlur={composeHandlers(onBlur, () => ctx.scheduleClose())}
        {...props}
      />
    );
  },
);

export interface HoverCardContentProps
  extends React.HTMLAttributes<HTMLDivElement>, FloatingPositioningProps {}

/** The floating card. Not focus-trapped; closes on Escape or when the pointer leaves. */
export const HoverCardContent = React.forwardRef<HTMLDivElement, HoverCardContentProps>(
  function HoverCardContent(
    {
      side = 'bottom',
      align = 'center',
      sideOffset = 8,
      alignOffset,
      collisionPadding,
      avoidCollisions,
      className,
      style,
      onPointerEnter,
      onPointerLeave,
      ...props
    },
    forwardedRef,
  ) {
    const ctx = useHoverCardContext('HoverCardContent');
    const ref = React.useRef<HTMLDivElement>(null);
    const composed = useComposedRefs(forwardedRef, ref);
    const floating = useFloating(ctx.triggerRef, ref, {
      open: ctx.open,
      side,
      align,
      sideOffset,
      ...(alignOffset !== undefined && { alignOffset }),
      ...(collisionPadding !== undefined && { collisionPadding }),
      ...(avoidCollisions !== undefined && { avoidCollisions }),
    });
    useDismissableLayer(ref, {
      enabled: ctx.open,
      onDismiss: () => {
        ctx.cancel();
        ctx.setOpen(false);
      },
      excludeRefs: [ctx.triggerRef],
    });
    if (!ctx.open) return null;
    return (
      <Portal>
        <div
          ref={composed}
          id={ctx.contentId}
          data-state="open"
          data-side={floating.side}
          className={cx('st-floating st-hover-card', className)}
          style={{ ...floating.style, ...style }}
          onPointerEnter={composeHandlers(onPointerEnter, () => ctx.cancel())}
          onPointerLeave={composeHandlers(onPointerLeave, () => ctx.scheduleClose())}
          {...props}
        />
      </Portal>
    );
  },
);

export { useHoverCardContext };
