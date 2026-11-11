'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Label } from '../label/Label.js';

export interface FormFieldContextValue {
  id: string;
  labelId: string;
  descriptionId: string;
  errorId: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  hasDescription: boolean;
  hasError: boolean;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

/** Read the surrounding FormField, if any. */
export function useFormField(): FormFieldContextValue | null {
  return React.useContext(FormFieldContext);
}

interface ControlProps {
  id?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  readOnly?: boolean | undefined;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  'aria-describedby'?: string | undefined;
}

/**
 * Merges FormField state into a control's props: id, aria-describedby,
 * aria-invalid, required and disabled. Explicit props always win.
 */
export function useFormFieldControl<P extends ControlProps>(props: P): P {
  const field = useFormField();
  if (!field) return props;
  const describedBy = [
    props['aria-describedby'],
    field.hasDescription ? field.descriptionId : undefined,
    field.hasError ? field.errorId : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  return {
    ...props,
    id: props.id ?? field.id,
    disabled: props.disabled ?? (field.disabled || undefined),
    required: props.required ?? (field.required || undefined),
    readOnly: props.readOnly ?? (field.readOnly || undefined),
    'aria-invalid': props['aria-invalid'] ?? (field.invalid || undefined),
    'aria-describedby': describedBy || undefined,
  };
}

export interface FormFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Visible label. */
  label?: React.ReactNode;
  /** Helper text shown under the control. */
  description?: React.ReactNode;
  /** Error message. Presence marks the field invalid. */
  error?: React.ReactNode;
  /** Marks the field required (adds an indicator and `required` to the control). */
  required?: boolean;
  /** Optional marker text instead of the required indicator, e.g. "Optional". */
  optionalText?: React.ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  /** Explicit id for the control; generated otherwise. */
  id?: string;
  /** Label beside the control instead of above. */
  orientation?: 'vertical' | 'horizontal';
  /** Visually hide the label but keep it for assistive technology. */
  hideLabel?: boolean;
  children: React.ReactNode;
}

/**
 * Wires a label, description and error message to a single form control.
 * Any Stance control placed inside picks up ids and ARIA automatically.
 */
export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
  {
    label,
    description,
    error,
    required = false,
    optionalText,
    disabled = false,
    readOnly = false,
    id: idProp,
    orientation = 'vertical',
    hideLabel = false,
    className,
    children,
    ...props
  },
  ref,
) {
  const generated = React.useId();
  const id = idProp ?? `${generated}-control`;
  const hasError = error != null && error !== false && error !== '';
  const ctx: FormFieldContextValue = {
    id,
    labelId: `${id}-label`,
    descriptionId: `${id}-description`,
    errorId: `${id}-error`,
    invalid: hasError,
    required,
    disabled,
    readOnly,
    hasDescription: description != null,
    hasError,
  };
  return (
    <FormFieldContext.Provider value={ctx}>
      <div
        ref={ref}
        className={cx('st-form-field', className)}
        data-orientation={orientation}
        data-invalid={hasError ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        {...props}
      >
        {label != null && (
          <Label
            id={ctx.labelId}
            htmlFor={id}
            required={required}
            optionalText={optionalText}
            disabled={disabled}
            className={cx('st-form-field__label', hideLabel && 'st-sr-only')}
          >
            {label}
          </Label>
        )}
        <div className="st-form-field__control">
          {children}
          {description != null && (
            <p id={ctx.descriptionId} className="st-form-field__description">
              {description}
            </p>
          )}
          {hasError && (
            <p id={ctx.errorId} className="st-form-field__error" role="alert">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                aria-hidden="true"
                focusable="false"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5M12 16h.01" />
              </svg>
              <span>{error}</span>
            </p>
          )}
        </div>
      </div>
    </FormFieldContext.Provider>
  );
});
