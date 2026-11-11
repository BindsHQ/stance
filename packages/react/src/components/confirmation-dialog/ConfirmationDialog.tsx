'use client';
import * as React from 'react';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Button } from '../button/Button.js';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../alert-dialog/AlertDialog.js';

export type ConfirmationTone = 'default' | 'danger';

export interface ConfirmOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Default "Confirm" ("Delete" reads better for destructive actions — pass it explicitly). */
  confirmLabel?: React.ReactNode;
  /** Default "Cancel". */
  cancelLabel?: React.ReactNode;
  /** `danger` styles the confirm button as destructive. Default `default`. */
  tone?: ConfirmationTone;
}

export interface ConfirmationDialogProps extends ConfirmOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Called on confirm. Return a Promise to show a loading state; the dialog closes when it
   * resolves and stays open (showing the error message) when it rejects.
   */
  onConfirm?: () => void | Promise<unknown>;
  /** Called when the user cancels or presses Escape. */
  onCancel?: () => void;
  /** Optional trigger element, rendered with asChild. */
  trigger?: React.ReactElement;
  /** Extra content between the description and the buttons. */
  children?: React.ReactNode;
  /** Text shown while onConfirm is pending. */
  loadingText?: React.ReactNode;
}

/** A ready-made confirmation dialog built on AlertDialog, with async confirm handling. */
export function ConfirmationDialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
  trigger,
  children,
  loadingText,
}: ConfirmationDialogProps) {
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  React.useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const setOpen = (next: boolean) => {
    if (!next && pending) return; // Do not close mid-request.
    if (!next) onCancel?.();
    setOpenState(next);
  };

  const confirm = async () => {
    setError(null);
    let result: unknown;
    try {
      result = onConfirm?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      return;
    }
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      setPending(true);
      try {
        await result;
        if (mounted.current) {
          setPending(false);
          setOpenState(false);
        }
      } catch (e) {
        if (mounted.current) {
          setPending(false);
          setError(
            e instanceof Error && e.message ? e.message : 'Something went wrong. Please try again.',
          );
        }
      }
    } else {
      setOpenState(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent onEscapeKeyDown={(e) => pending && e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description != null && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {(children != null || error) && (
          <AlertDialogBody>
            {children}
            {error && (
              <p role="alert" className="st-confirmation-dialog__error">
                {error}
              </p>
            )}
          </AlertDialogBody>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={pending}>
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={pending}
            loadingText={loadingText}
            onClick={confirm}
            data-confirm=""
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = React.createContext<ConfirmFn | null>(null);

/**
 * Provides an imperative `confirm()` anywhere below it:
 * `if (await confirm({ title: 'Delete template?', tone: 'danger' })) …`
 */
export function ConfirmProvider({ children }: { children?: React.ReactNode }) {
  const [request, setRequest] = React.useState<
    (ConfirmOptions & { resolve: (v: boolean) => void }) | null
  >(null);
  const [open, setOpen] = React.useState(false);
  const requestRef = React.useRef(request);
  requestRef.current = request;

  const confirm = React.useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      requestRef.current?.resolve(false); // supersede any pending request
      setRequest({ ...options, resolve });
      setOpen(true);
    });
  }, []);

  const settle = (value: boolean) => {
    requestRef.current?.resolve(value);
    requestRef.current = null;
    setOpen(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <ConfirmationDialog
          open={open}
          onOpenChange={(next) => {
            if (!next) settle(false);
          }}
          title={request.title}
          description={request.description}
          confirmLabel={request.confirmLabel}
          cancelLabel={request.cancelLabel}
          tone={request.tone}
          onConfirm={() => settle(true)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

/** Returns `confirm(options): Promise<boolean>`. Requires <ConfirmProvider>. */
export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>.');
  return ctx;
}
