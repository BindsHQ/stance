'use client';
import * as React from 'react';
import { createStrictContext } from '../../internal/context.js';
import { cx } from '../../internal/cx.js';
import { Portal } from '../../internal/portal.js';
import { useComposedRefs } from '../../internal/refs.js';
import { Slot } from '../../internal/slot.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import {
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRoot,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  useMenuRoot,
  type MenuContentProps,
} from '../dropdown-menu/menu-core.js';

interface ContextMenuState {
  point: { x: number; y: number };
  openAt: (x: number, y: number) => void;
  disabled: boolean;
}

const [ContextMenuStateProvider, useContextMenuState] =
  createStrictContext<ContextMenuState>('ContextMenu');

export interface ContextMenuProps {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disable the custom menu and let the browser menu show. */
  disabled?: boolean;
}

/** A menu opened at the pointer by right-click, long-press, Shift+F10 or the Menu key. */
export function ContextMenu({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
}: ContextMenuProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [point, setPoint] = React.useState({ x: 0, y: 0 });
  const anchorRef = React.useRef<HTMLSpanElement>(null);
  return (
    <MenuRoot open={open} onOpenChange={setOpen} anchorRef={anchorRef}>
      <ContextMenuInner point={point} setPoint={setPoint} anchorRef={anchorRef} disabled={disabled}>
        {children}
      </ContextMenuInner>
    </MenuRoot>
  );
}

function ContextMenuInner({
  children,
  point,
  setPoint,
  anchorRef,
  disabled,
}: {
  children?: React.ReactNode;
  point: { x: number; y: number };
  setPoint: (p: { x: number; y: number }) => void;
  anchorRef: React.RefObject<HTMLSpanElement | null>;
  disabled: boolean;
}) {
  const root = useMenuRoot('ContextMenu');
  const state = React.useMemo<ContextMenuState>(
    () => ({
      point,
      disabled,
      openAt: (x, y) => {
        // Remember where focus was so it can return there after the menu closes.
        (root.triggerRef as React.MutableRefObject<HTMLElement | null>).current =
          document.activeElement as HTMLElement | null;
        setPoint({ x, y });
        root.focusIntentRef.current = 'first';
        root.setOpen(true);
      },
    }),
    [point, disabled, root, setPoint],
  );
  return (
    <ContextMenuStateProvider value={state}>
      {children}
      {root.open && (
        <Portal>
          <span
            ref={anchorRef}
            aria-hidden="true"
            style={{
              position: 'fixed',
              left: point.x,
              top: point.y,
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
          />
        </Portal>
      )}
    </ContextMenuStateProvider>
  );
}

export interface ContextMenuTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  /** Long-press duration on touch, in ms. Default 500. */
  longPressDelay?: number;
}

/** The area that responds to right-click / long-press. Keyboard users press Shift+F10 or the Menu key while focus is inside. */
export const ContextMenuTrigger = React.forwardRef<HTMLDivElement, ContextMenuTriggerProps>(
  function ContextMenuTrigger(
    {
      asChild,
      longPressDelay = 500,
      className,
      onContextMenu,
      onKeyDown,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      ...props
    },
    forwardedRef,
  ) {
    const state = useContextMenuState('ContextMenuTrigger');
    const ref = React.useRef<HTMLDivElement>(null);
    const composed = useComposedRefs(forwardedRef, ref);
    const timer = React.useRef<number | undefined>(undefined);
    const start = React.useRef<{ x: number; y: number } | null>(null);
    const clear = () => {
      window.clearTimeout(timer.current);
      start.current = null;
    };
    React.useEffect(() => clear, []);
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={composed as React.Ref<HTMLDivElement & HTMLElement>}
        className={cx('st-context-menu__trigger', className)}
        data-disabled={state.disabled ? '' : undefined}
        onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
          onContextMenu?.(e);
          if (e.defaultPrevented || state.disabled) return;
          e.preventDefault();
          clear();
          state.openAt(e.clientX, e.clientY);
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(e);
          if (e.defaultPrevented || state.disabled) return;
          if ((e.key === 'F10' && e.shiftKey) || e.key === 'ContextMenu') {
            e.preventDefault();
            const target = (e.target as HTMLElement).getBoundingClientRect();
            state.openAt(
              target.left + Math.min(16, target.width / 2),
              target.top + target.height / 2,
            );
          }
        }}
        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
          onPointerDown?.(e);
          if (state.disabled || e.pointerType === 'mouse') return;
          start.current = { x: e.clientX, y: e.clientY };
          const { clientX, clientY } = e;
          timer.current = window.setTimeout(() => state.openAt(clientX, clientY), longPressDelay);
        }}
        onPointerMove={(e: React.PointerEvent<HTMLDivElement>) => {
          onPointerMove?.(e);
          if (
            start.current &&
            Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8
          )
            clear();
        }}
        onPointerUp={(e: React.PointerEvent<HTMLDivElement>) => {
          onPointerUp?.(e);
          clear();
        }}
        onPointerCancel={(e: React.PointerEvent<HTMLDivElement>) => {
          onPointerCancel?.(e);
          clear();
        }}
        {...props}
      />
    );
  },
);

export interface ContextMenuContentProps extends Omit<
  MenuContentProps,
  'side' | 'align' | 'sideOffset'
> {
  /** Accessible name for the menu, e.g. "Template actions". */
  'aria-label'?: string;
}

export const ContextMenuContent = React.forwardRef<HTMLDivElement, ContextMenuContentProps>(
  function ContextMenuContent({ 'aria-label': ariaLabel = 'Context menu', ...props }, ref) {
    return (
      <MenuContent
        ref={ref}
        side="bottom"
        align="start"
        sideOffset={2}
        labelledByTrigger={false}
        aria-label={ariaLabel}
        {...props}
      />
    );
  },
);

export const ContextMenuItem = MenuItem;
export const ContextMenuCheckboxItem = MenuCheckboxItem;
export const ContextMenuRadioGroup = MenuRadioGroup;
export const ContextMenuRadioItem = MenuRadioItem;
export const ContextMenuLabel = MenuLabel;
export const ContextMenuSeparator = MenuSeparator;
export const ContextMenuGroup = MenuGroup;
export const ContextMenuShortcut = MenuShortcut;
export const ContextMenuSub = MenuSub;
export const ContextMenuSubTrigger = MenuSubTrigger;
export const ContextMenuSubContent = MenuSubContent;
