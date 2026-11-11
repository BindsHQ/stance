'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useHoverIntent } from '../../internal/hover-intent.js';
import { useDismissableLayer } from '../../internal/layer-stack.js';
import { Portal } from '../../internal/portal.js';
import type { Align, Side } from '../../internal/position.js';
import { Slot } from '../../internal/slot.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useFloating } from '../../internal/use-floating.js';

interface TooltipProviderValue {
  delay: number;
  skipDelay: number;
  lastClosed: React.MutableRefObject<number>;
}

const fallbackLastClosed = { current: 0 };
const TooltipProviderContext = React.createContext<TooltipProviderValue>({
  delay: 500,
  skipDelay: 300,
  lastClosed: fallbackLastClosed,
});

export interface TooltipProviderProps {
  children?: React.ReactNode;
  /** Hover delay before a tooltip opens, in ms. Default 500. */
  delay?: number;
  /** After a tooltip closes, others open instantly within this window, in ms. Default 300. */
  skipDelay?: number;
}

/** Optional: shares delay settings so moving between tooltips feels instant. */
export function TooltipProvider({ children, delay = 500, skipDelay = 300 }: TooltipProviderProps) {
  const lastClosed = React.useRef(0);
  const value = React.useMemo(() => ({ delay, skipDelay, lastClosed }), [delay, skipDelay]);
  return (
    <TooltipProviderContext.Provider value={value}>{children}</TooltipProviderContext.Provider>
  );
}

export interface TooltipProps {
  /** Tooltip text. Keep it short; tooltips cannot contain interactive content. */
  content: React.ReactNode;
  /** A single focusable element (e.g. IconButton). */
  children: React.ReactElement;
  side?: Side;
  align?: Align;
  sideOffset?: number;
  /** Hover delay in ms. Defaults to the provider value (500). */
  delay?: number;
  /** Grace period before closing when the pointer leaves, so the tooltip can be hovered. Default 100. */
  closeDelay?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Never show the tooltip. */
  disabled?: boolean;
  /** Class name for the tooltip bubble. */
  className?: string;
}

/**
 * A short text label shown on hover and keyboard focus. The tooltip is linked to
 * the trigger with aria-describedby, stays open while hovered, and closes on Escape.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  delay: delayProp,
  closeDelay = 100,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  className,
}: TooltipProps) {
  const provider = React.useContext(TooltipProviderContext);
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!next) provider.lastClosed.current = Date.now();
      setOpenState(next);
    },
    [provider.lastClosed, setOpenState],
  );
  const delay = delayProp ?? provider.delay;
  const { scheduleOpen, scheduleClose, cancel } = useHoverIntent({
    setOpen,
    openDelay: delay,
    closeDelay,
  });
  const id = `${React.useId()}-tooltip`;
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const pointerDown = React.useRef(false);
  const isOpen = open && !disabled;
  const floating = useFloating(triggerRef, contentRef, { open: isOpen, side, align, sideOffset });
  useDismissableLayer(contentRef, {
    enabled: isOpen,
    onDismiss: () => {
      cancel();
      setOpen(false);
    },
    excludeRefs: [triggerRef],
  });

  const warm = () => Date.now() - provider.lastClosed.current < provider.skipDelay;
  const childProps = children.props as Record<string, unknown>;
  const describedBy = [
    childProps['aria-describedby'] as string | undefined,
    isOpen ? id : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <Slot
        ref={triggerRef}
        data-state={isOpen ? 'open' : 'closed'}
        onPointerEnter={(e: React.PointerEvent) => {
          if (disabled || e.pointerType === 'touch') return;
          scheduleOpen(warm() ? 0 : delay);
        }}
        onPointerLeave={(e: React.PointerEvent) => {
          if (e.pointerType === 'touch') return;
          scheduleClose();
        }}
        onPointerDown={() => {
          pointerDown.current = true;
          cancel();
          setOpen(false);
        }}
        onFocus={() => {
          if (disabled) return;
          if (pointerDown.current) {
            pointerDown.current = false;
            return;
          }
          scheduleOpen(0);
        }}
        onBlur={() => {
          pointerDown.current = false;
          scheduleClose(0);
        }}
      >
        {/* Clone so our description id merges with any aria-describedby the child already has. */}
        {React.cloneElement(children, { 'aria-describedby': describedBy || undefined } as Record<
          string,
          unknown
        >)}
      </Slot>
      {isOpen && (
        <Portal>
          <div
            ref={contentRef}
            id={id}
            role="tooltip"
            data-side={floating.side}
            data-state="open"
            className={cx('st-tooltip', className)}
            style={floating.style}
            onPointerEnter={cancel}
            onPointerLeave={() => scheduleClose()}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}
