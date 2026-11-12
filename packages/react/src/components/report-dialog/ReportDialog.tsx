'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Button } from '../button/Button.js';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogSize,
} from '../dialog/Dialog.js';
import { Radio, RadioGroup } from '../radio-group/RadioGroup.js';
import { Textarea } from '../textarea/Textarea.js';

export interface ReportCategory {
  /** Stable id reported in `onSubmit`. */
  id: string;
  /** The name of the category. */
  label: string;
  /** A short explanation shown under the label. */
  description?: string;
}

export interface ReportSubmission {
  /** Id of the chosen category. */
  category: string;
  /** The details, trimmed. Empty when none were written. */
  details: string;
}

export interface ReportDialogLabels {
  /** The dialog title. */
  title: string;
  /** Supporting text under the title. */
  description: string;
  /** Legend of the category choices. */
  category: string;
  /** Label of the details field. */
  details: string;
  /** Placeholder of the details field. */
  detailsPlaceholder: string;
  /** The submit button. */
  submit: string;
  /** The submit button while the report is being sent. */
  submitting: string;
  /** The cancel button. */
  cancel: string;
  /** Accessible name of the close button. */
  close: string;
}

export interface ReportDialogProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onSubmit' | 'children' | 'role'
> {
  /** Controlled open state. */
  open?: boolean;
  /** Open on first render when uncontrolled. Default false. */
  defaultOpen?: boolean;
  /** Called when the dialog opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The reasons a response can be reported for. */
  categories: ReportCategory[];
  /**
   * Called with the category and details. Return a promise to keep the dialog open,
   * with the submit button busy, until the report is sent.
   */
  onSubmit?: (report: ReportSubmission) => void | Promise<void>;
  /** A button that opens the dialog. Focus returns to it on close. */
  trigger?: React.ReactElement;
  /** Shows the submit button as busy and blocks a second submit. */
  submitting?: boolean;
  /** Close the dialog after a successful submit. Default true. */
  closeOnSubmit?: boolean;
  /** Require details before the report can be sent. Default false. */
  detailsRequired?: boolean;
  /** Dialog width. Default `md`. */
  size?: DialogSize;
  /** Translations for the built in strings. */
  labels?: Partial<ReportDialogLabels>;
}

const defaultLabels: ReportDialogLabels = {
  title: 'Report this response',
  description: 'Tell us what is wrong with this response. Reports are reviewed by our team.',
  category: 'What is the problem?',
  details: 'Details (optional)',
  detailsPlaceholder: 'Describe what happened',
  submit: 'Send report',
  submitting: 'Sending',
  cancel: 'Cancel',
  close: 'Close',
};

/**
 * A dialog to report a response with a category and details. It is built on Dialog, so
 * focus is trapped while open, Escape closes it and focus returns to the trigger.
 */
export const ReportDialog = React.forwardRef<HTMLDivElement, ReportDialogProps>(
  function ReportDialog(
    {
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      categories,
      onSubmit,
      trigger,
      submitting = false,
      closeOnSubmit = true,
      detailsRequired = false,
      size = 'md',
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const [open, setOpen] = useControllableState({
      value: openProp,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });
    const [category, setCategory] = React.useState<string | null>(null);
    const [details, setDetails] = React.useState('');
    const [pending, setPending] = React.useState(false);
    const detailsId = `${React.useId()}-details`;
    const mounted = React.useRef(true);
    React.useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);

    // Every opening starts from an empty form.
    React.useEffect(() => {
      if (open) return;
      setCategory(null);
      setDetails('');
      setPending(false);
    }, [open]);

    const busy = submitting || pending;
    const ready = category !== null && (!detailsRequired || details.trim() !== '');

    const submit = async (event: React.FormEvent) => {
      event.preventDefault();
      if (!ready || busy || category === null) return;
      const result = onSubmit?.({ category, details: details.trim() });
      if (result && typeof (result as Promise<void>).then === 'function') {
        setPending(true);
        try {
          await result;
        } catch {
          // The app reports the failure; the form stays open so nothing typed is lost.
          if (mounted.current) setPending(false);
          return;
        }
        if (!mounted.current) return;
        setPending(false);
      }
      if (closeOnSubmit) setOpen(false);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent
          ref={ref}
          size={size}
          closeLabel={labels.close}
          className={cx('st-report-dialog', className)}
          {...props}
        >
          <form className="st-report-dialog__form" onSubmit={submit} noValidate>
            <DialogHeader>
              <DialogTitle>{labels.title}</DialogTitle>
              {labels.description && <DialogDescription>{labels.description}</DialogDescription>}
            </DialogHeader>
            <DialogBody className="st-report-dialog__body">
              <RadioGroup
                label={labels.category}
                value={category}
                onValueChange={setCategory}
                required
                disabled={busy}
              >
                {categories.map((item) => (
                  <Radio
                    key={item.id}
                    value={item.id}
                    label={item.label}
                    {...(item.description && { description: item.description })}
                  />
                ))}
              </RadioGroup>
              <div className="st-report-dialog__details">
                <label htmlFor={detailsId} className="st-report-dialog__label">
                  {labels.details}
                </label>
                <Textarea
                  id={detailsId}
                  rows={3}
                  placeholder={labels.detailsPlaceholder}
                  value={details}
                  required={detailsRequired}
                  disabled={busy}
                  onChange={(event) => setDetails(event.target.value)}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {labels.cancel}
              </Button>
              <Button
                type="submit"
                disabled={!ready}
                loading={busy}
                loadingText={labels.submitting}
              >
                {labels.submit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
);
