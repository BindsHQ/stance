import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Appends a required indicator (announced as "required"). */
  required?: boolean;
  /** Text shown for optional fields, e.g. "Optional". */
  optionalText?: React.ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

/** A form label. Prefer `FormField`, which renders and wires one for you. */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required, optionalText, disabled, size = 'md', className, children, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cx('st-label', className)}
      data-size={size}
      data-disabled={disabled ? '' : undefined}
      {...props}
    >
      {children}
      {required && (
        <span className="st-label__required">
          <span aria-hidden="true">*</span>
          <span className="st-sr-only"> (required)</span>
        </span>
      )}
      {!required && optionalText && <span className="st-label__optional">{optionalText}</span>}
    </label>
  );
});
