'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { createStrictContext } from '../../internal/context.js';
import { cx } from '../../internal/cx.js';
import { useFocusScope } from '../../internal/focus-scope.js';
import { useDismissableLayer } from '../../internal/layer-stack.js';
import { Portal } from '../../internal/portal.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useScrollLock } from '../../internal/scroll-lock.js';
import { Slot } from '../../internal/slot.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  titleId: string;
  descriptionId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  hasDescription: boolean;
  setHasDescription: (v: boolean) => void;
}

const [DialogProvider, useDialogContext] = createStrictContext<DialogContextValue>('Dialog');
export { useDialogContext };

export interface DialogProps {
  children?: React.ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** A modal window that interrupts the page to focus on a task. Root of the compound component. */
export function Dialog({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: DialogProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const id = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [hasDescription, setHasDescription] = React.useState(false);
  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      contentId: `${id}-content`,
      titleId: `${id}-title`,
      descriptionId: `${id}-description`,
      triggerRef,
      hasDescription,
      setHasDescription,
    }),
    [open, setOpen, id, hasDescription],
  );
  return <DialogProvider value={value}>{children}</DialogProvider>;
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

/** Opens the dialog. Use `asChild` to render your own Button. */
export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  function DialogTrigger({ asChild, onClick, ...props }, ref) {
    const ctx = useDialogContext('DialogTrigger');
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={useComposedRefs(ref, ctx.triggerRef) as React.Ref<HTMLButtonElement & HTMLElement>}
        {...(!asChild && { type: 'button' as const })}
        aria-haspopup="dialog"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.contentId : undefined}
        data-state={ctx.open ? 'open' : 'closed'}
        onClick={composeHandlers(onClick, () => ctx.setOpen(!ctx.open))}
        {...props}
      />
    );
  },
);

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type DialogPlacement = 'center' | 'left' | 'right' | 'top' | 'bottom';

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max width: sm 400, md 520, lg 720, xl 960, full. Default `md`. */
  size?: DialogSize;
  /** Element to focus when opened. Defaults to the first focusable element. */
  initialFocus?: React.RefObject<HTMLElement | null>;
  /** Show the top-right close button. Default true. */
  showClose?: boolean;
  /** Accessible label for the close button. Default "Close". */
  closeLabel?: string;
  /** Close when the backdrop is clicked. Default true. */
  dismissOnOutsideClick?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
  /** Return focus to the trigger on close. Default true. */
  restoreFocus?: boolean;
  /** Internal: used by Drawer/Sheet to anchor the surface to an edge. */
  placement?: DialogPlacement;
  /** Internal: ARIA role, `alertdialog` for AlertDialog. */
  role?: 'dialog' | 'alertdialog';
  /** Render inline instead of portalling (rarely needed). */
  disablePortal?: boolean;
}

/** The dialog surface. Traps focus, locks scroll, closes on Escape and restores focus. */
export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    {
      size = 'md',
      initialFocus,
      showClose = true,
      closeLabel = 'Close',
      dismissOnOutsideClick = true,
      onEscapeKeyDown,
      onPointerDownOutside,
      restoreFocus = true,
      placement = 'center',
      role = 'dialog',
      disablePortal,
      className,
      children,
      ...props
    },
    forwardedRef,
  ) {
    const ctx = useDialogContext('DialogContent');
    const ref = React.useRef<HTMLDivElement>(null);
    const composed = useComposedRefs(forwardedRef, ref);
    useFocusScope(ref, { enabled: ctx.open, initialFocus, restoreFocus });
    useScrollLock(ctx.open);
    useDismissableLayer(ref, {
      enabled: ctx.open,
      onEscapeKeyDown,
      onPointerDownOutside: (event) => {
        onPointerDownOutside?.(event);
        if (!dismissOnOutsideClick) event.preventDefault();
      },
      onDismiss: () => ctx.setOpen(false),
      excludeRefs: [ctx.triggerRef],
    });
    if (!ctx.open) return null;
    return (
      <Portal disabled={disablePortal}>
        <div className="st-scrim st-dialog-scrim" data-placement={placement} aria-hidden="true" />
        <div
          ref={composed}
          id={ctx.contentId}
          role={role}
          aria-modal="true"
          aria-labelledby={ctx.titleId}
          aria-describedby={ctx.hasDescription ? ctx.descriptionId : undefined}
          tabIndex={-1}
          data-stance-layer=""
          data-state="open"
          data-size={size}
          data-placement={placement}
          className={cx('st-dialog', className)}
          {...props}
        >
          {children}
          {showClose && (
            <DialogClose className="st-dialog__close" aria-label={closeLabel}>
              <Icon name="x" size={18} />
            </DialogClose>
          )}
        </div>
      </Portal>
    );
  },
);

export const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DialogHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cx('st-dialog__header', className)} {...props} />;
  },
);

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level. Default 2. */
  level?: 1 | 2 | 3 | 4;
}

/** The dialog's accessible name. Required for every dialog. */
export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  function DialogTitle({ level = 2, className, ...props }, ref) {
    const ctx = useDialogContext('DialogTitle');
    const Tag = `h${level}` as 'h2';
    return (
      <Tag ref={ref} id={ctx.titleId} className={cx('st-dialog__title', className)} {...props} />
    );
  },
);

/** Supporting text, linked via aria-describedby. */
export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function DialogDescription({ className, ...props }, ref) {
  const ctx = useDialogContext('DialogDescription');
  const { setHasDescription } = ctx;
  React.useEffect(() => {
    setHasDescription(true);
    return () => setHasDescription(false);
  }, [setHasDescription]);
  return (
    <p
      ref={ref}
      id={ctx.descriptionId}
      className={cx('st-dialog__description', className)}
      {...props}
    />
  );
});

export const DialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DialogBody({ className, ...props }, ref) {
    return <div ref={ref} className={cx('st-dialog__body', className)} {...props} />;
  },
);

export const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DialogFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cx('st-dialog__footer', className)} {...props} />;
  },
);

export interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

/** Closes the dialog. Use `asChild` to wrap a Button. */
export const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  function DialogClose({ asChild, onClick, ...props }, ref) {
    const ctx = useDialogContext('DialogClose');
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
