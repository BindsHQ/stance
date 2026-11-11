'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useFormFieldControl } from '../form-field/FormField.js';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Control height: sm 32, md 40, lg 48. Default `md`. */
  size?: InputSize;
  /** Marks the input invalid (also set automatically inside an erroring FormField). */
  invalid?: boolean;
  /** Content inside the field before the text, e.g. an icon or "https://". */
  prefix?: React.ReactNode;
  /** Content inside the field after the text, e.g. a unit or a button. */
  suffix?: React.ReactNode;
  /** Class name for the outer wrapper (the visible box). */
  wrapperClassName?: string;
}

/** A single-line text input. Works standalone or inside FormField. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', invalid, prefix, suffix, className, wrapperClassName, type = 'text', ...rest },
  ref,
) {
  const props = useFormFieldControl({ ...rest, ...(invalid !== undefined && { 'aria-invalid': invalid }) });
  const isInvalid = props['aria-invalid'] === true || String(props['aria-invalid']) === 'true';
  return (
    <div
      className={cx('st-input', wrapperClassName)}
      data-size={size}
      data-invalid={isInvalid ? '' : undefined}
      data-disabled={props.disabled ? '' : undefined}
      data-readonly={props.readOnly ? '' : undefined}
    >
      {prefix != null && <span className="st-input__affix" data-position="prefix">{prefix}</span>}
      <input ref={ref} type={type} className={cx('st-input__control', className)} {...props} />
      {suffix != null && <span className="st-input__affix" data-position="suffix">{suffix}</span>}
    </div>
  );
});
