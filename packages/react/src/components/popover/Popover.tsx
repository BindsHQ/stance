'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { createStrictContext } from '../../internal/context.js';
import { cx } from '../../internal/cx.js';
import { useFocusScope } from '../../internal/focus-scope.js';
import { useDismissableLayer } from '../../internal/layer-stack.js';
import { Portal } from '../../internal/portal.js';
import { useComposedRefs } from '../../internal/refs.js';
import { Slot } from '../../internal/slot.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useFloating, type FloatingPositioningProps } from '../../internal/use-floating.js';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerRef: React.RefObject<HTMLElement | null>;
  anchorRef: React.RefObject<HTMLElement | null>;
  hasCustomAnchor: boolean;
  setHasCustomAnchor: (v: boolean) => void;
}

const [PopoverProvider, usePopoverContext] = createStrictContext<PopoverContextValue>('Popover');

export interface PopoverProps {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Non-modal floating content anchored to a trigger: filters, pickers, rich detail. */
export function Popover({ children, open: openProp, defaultOpen = false, onOpenChange }: PopoverProps) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const id = React.useId();
  const triggerRef = React.useRef<HTMLElement>(null);
  const anchorRef = React.useRef<HTMLElement>(null);
  const [hasCustomAnchor, setHasCustomAnchor] = React.useState(false);
  const value = React.useMemo(
    () => ({ open, setOpen, contentId: `${id}-popover`, triggerRef, anchorRef, hasCustomAnchor, setHasCustomAnchor }),
    [open, setOpen, id, hasCustomAnchor],
  );
  return <PopoverProvider value={value}>{children}</PopoverProvider>;
}

export interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(function PopoverTrigger(
  { asChild, onClick, ...props },
  ref,
) {
  const ctx = usePopoverContext('PopoverTrigger');
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={useComposedRefs(ref, ctx.triggerRef as React.Ref<HTMLButtonElement>) as React.Ref<HTMLButtonElement & HTMLElement>}
      {...(!asChild && { type: 'button' as const })}
      aria-haspopup="dialog"
      aria-expanded={ctx.open}
      aria-controls={ctx.open ? ctx.contentId : undefined}
      data-state={ctx.open ? 'open' : 'closed'}
      onClick={composeHandlers(onClick, () => ctx.setOpen(!ctx.open))}
      {...props}
    />
  );
});

/** Optional: position the popover against an element other than the trigger. */
export const PopoverAnchor = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }>(
  function PopoverAnchor({ asChild, ...props }, ref) {
    const ctx = usePopoverContext('PopoverAnchor');
    const { setHasCustomAnchor } = ctx;
    React.useEffect(() => {
      setHasCustomAnchor(true);
      return () => setHasCustomAnchor(false);
    }, [setHasCustomAnchor]);
    const Comp = asChild ? Slot : 'div';
    return <Comp ref={useComposedRefs(ref, ctx.anchorRef as React.Ref<HTMLDivElement>) as React.Ref<HTMLDivElement & HTMLElement>} {...props} />;
  },
);

export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement>, FloatingPositioningProps {
  /** Trap focus inside (use for forms inside popovers). Default false. */
  trapFocus?: boolean;
  /** Move focus into the popover on open. Default true. */
  autoFocus?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
  /** Accessible label when the content has no visible heading. */
  'aria-label'?: string;
}

/** The floating surface. Positions itself with collision handling and dismisses on Escape / outside click. */
export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(function PopoverContent(
  {
    side = 'bottom',
    align = 'center',
    sideOffset = 8,
    alignOffset,
    collisionPadding,
    avoidCollisions,
    trapFocus = false,
    autoFocus = true,
    onEscapeKeyDown,
    onPointerDownOutside,
    className,
    style,
    children,
    ...props
  },
  forwardedRef,
) {
  const ctx = usePopoverContext('PopoverContent');
  const ref = React.useRef<HTMLDivElement>(null);
  const composed = useComposedRefs(forwardedRef, ref);
  const anchor = ctx.hasCustomAnchor ? ctx.anchorRef : ctx.triggerRef;
  const floating = useFloating(anchor, ref, {
    open: ctx.open,
    side,
    align,
    sideOffset,
    ...(alignOffset !== undefined && { alignOffset }),
    ...(collisionPadding !== undefined && { collisionPadding }),
    ...(avoidCollisions !== undefined && { avoidCollisions }),
  });
  useFocusScope(ref, {
    enabled: ctx.open,
    trapped: trapFocus,
    onMountAutoFocus: (e) => {
      if (!autoFocus) e.preventDefault();
    },
  });
  useDismissableLayer(ref, {
    enabled: ctx.open,
    onEscapeKeyDown,
    onPointerDownOutside,
    onDismiss: () => ctx.setOpen(false),
    excludeRefs: [ctx.triggerRef],
  });
  if (!ctx.open) return null;
  return (
    <Portal>
      <div
        ref={composed}
        id={ctx.contentId}
        role="dialog"
        tabIndex={-1}
        data-stance-layer=""
        data-state="open"
        data-side={floating.side}
        className={cx('st-floating st-popover', className)}
        style={{ ...floating.style, ...style }}
        {...props}
      >
        {children}
      </div>
    </Portal>
  );
});

export const PopoverClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  function PopoverClose({ asChild, onClick, ...props }, ref) {
    const ctx = usePopoverContext('PopoverClose');
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement & HTMLElement>}
        {...(!asChild && { type: 'button' as const })}
        onClick={composeHandlers(onClick, () => ctx.setOpen(false))}
        {...props}
      />
    );
  },
);

export { usePopoverContext };
