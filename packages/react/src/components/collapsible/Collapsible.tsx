'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { createStrictContext } from '../../internal/context.js';
import { cx } from '../../internal/cx.js';
import { Slot } from '../../internal/slot.js';
import { useControllableState } from '../../internal/use-controllable-state.js';

interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled: boolean;
  contentId: string;
  triggerId: string;
}

const [CollapsibleProvider, useCollapsibleContext] =
  createStrictContext<CollapsibleContextValue>('Collapsible');
export { useCollapsibleContext };

export interface CollapsibleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  asChild?: boolean;
}

/** A disclosure: one trigger that shows and hides one region of content. */
export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
  {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    disabled = false,
    asChild,
    className,
    ...props
  },
  ref,
) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const id = React.useId();
  const value = React.useMemo(
    () => ({ open, setOpen, disabled, contentId: `${id}-content`, triggerId: `${id}-trigger` }),
    [open, setOpen, disabled, id],
  );
  const Comp = asChild ? Slot : 'div';
  return (
    <CollapsibleProvider value={value}>
      <Comp
        ref={ref as React.Ref<HTMLDivElement & HTMLElement>}
        className={cx('st-collapsible', className)}
        data-state={open ? 'open' : 'closed'}
        data-disabled={disabled ? '' : undefined}
        {...props}
      />
    </CollapsibleProvider>
  );
});

export interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

/** Toggles the collapsible. Exposes aria-expanded and aria-controls. */
export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  function CollapsibleTrigger({ asChild, onClick, className, ...props }, ref) {
    const ctx = useCollapsibleContext('CollapsibleTrigger');
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement & HTMLElement>}
        {...(!asChild && { type: 'button' as const })}
        id={ctx.triggerId}
        aria-expanded={ctx.open}
        aria-controls={ctx.contentId}
        disabled={ctx.disabled || undefined}
        data-state={ctx.open ? 'open' : 'closed'}
        className={cx('st-collapsible__trigger', className)}
        onClick={composeHandlers(onClick, () => {
          if (!ctx.disabled) ctx.setOpen(!ctx.open);
        })}
        {...props}
      />
    );
  },
);

export interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Keep the content mounted (hidden) while closed, e.g. to preserve form state. Default false. */
  forceMount?: boolean;
}

/** The region shown when open. */
export const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  function CollapsibleContent({ forceMount = false, className, ...props }, ref) {
    const ctx = useCollapsibleContext('CollapsibleContent');
    if (!ctx.open && !forceMount) return null;
    return (
      <div
        ref={ref}
        id={ctx.contentId}
        hidden={!ctx.open}
        data-state={ctx.open ? 'open' : 'closed'}
        className={cx('st-collapsible__content', className)}
        {...props}
      />
    );
  },
);
