'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { Slot } from '../../internal/slot.js';
import {
  Dialog,
  DialogBody,
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

const CancelRefContext = React.createContext<React.RefObject<HTMLButtonElement | null> | null>(
  null,
);

export type AlertDialogProps = DialogProps;

/**
 * An interruptive dialog that asks for a decision, usually confirming a destructive
 * action. It cannot be dismissed by clicking outside, and focus starts on Cancel.
 */
export function AlertDialog(props: AlertDialogProps) {
  return <Dialog {...props} />;
}

export const AlertDialogTrigger = DialogTrigger;
export const AlertDialogHeader = DialogHeader;
export const AlertDialogTitle = DialogTitle;
export const AlertDialogDescription = DialogDescription;
export const AlertDialogBody = DialogBody;
export const AlertDialogFooter = DialogFooter;

export type AlertDialogContentProps = Omit<
  DialogContentProps,
  'role' | 'placement' | 'dismissOnOutsideClick' | 'showClose'
>;

/** The alert dialog surface: role="alertdialog", no outside-click dismissal, no close icon. */
export const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(
  function AlertDialogContent({ size = 'sm', initialFocus, className, ...props }, ref) {
    const cancelRef = React.useRef<HTMLButtonElement>(null);
    return (
      <CancelRefContext.Provider value={cancelRef}>
        <DialogContent
          ref={ref}
          role="alertdialog"
          size={size}
          showClose={false}
          dismissOnOutsideClick={false}
          initialFocus={initialFocus ?? cancelRef}
          className={cx('st-alert-dialog', className)}
          {...props}
        />
      </CancelRefContext.Provider>
    );
  },
);

export interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render your own Button. Call `event.preventDefault()` in onClick to keep the dialog open. */
  asChild?: boolean;
}

/** Confirms the decision and closes the dialog. */
export const AlertDialogAction = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  function AlertDialogAction({ asChild, onClick, ...props }, ref) {
    const ctx = useDialogContext('AlertDialogAction');
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

/** Cancels and closes. Receives initial focus as the least destructive option. */
export const AlertDialogCancel = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  function AlertDialogCancel({ asChild, onClick, ...props }, ref) {
    const ctx = useDialogContext('AlertDialogCancel');
    const cancelRef = React.useContext(CancelRefContext);
    const composed = useComposedRefs(ref, cancelRef ?? undefined);
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={composed as React.Ref<HTMLButtonElement & HTMLElement>}
        {...(!asChild && { type: 'button' as const })}
        data-alert-dialog-cancel=""
        onClick={composeHandlers(onClick, () => ctx.setOpen(false))}
        {...props}
      />
    );
  },
);
