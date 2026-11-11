'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';
import { useFormFieldControl } from '../form-field/FormField.js';

export interface NativeSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface NativeSelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'size'
> {
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  /** Options as data; alternatively pass <option>/<optgroup> children. */
  options?: NativeSelectOption[];
  /** Adds a disabled empty first option shown when nothing is selected. */
  placeholder?: string;
  wrapperClassName?: string;
}

/**
 * A styled native <select>. Best for long, simple lists, forms that must work
 * without JavaScript and mobile, where the OS picker is most usable.
 */
export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  function NativeSelect(
    {
      size = 'md',
      invalid,
      options,
      placeholder,
      wrapperClassName,
      className,
      children,
      value,
      defaultValue,
      ...rest
    },
    ref,
  ) {
    const props = useFormFieldControl({
      ...rest,
      ...(invalid !== undefined && { 'aria-invalid': invalid }),
    });
    const isInvalid = String(props['aria-invalid']) === 'true';
    const showPlaceholder = placeholder !== undefined;
    return (
      <div
        className={cx('st-input st-native-select', wrapperClassName)}
        data-size={size}
        data-invalid={isInvalid ? '' : undefined}
        data-disabled={props.disabled ? '' : undefined}
      >
        <select
          ref={ref}
          className={cx('st-native-select__control', className)}
          {...(value !== undefined
            ? { value }
            : {
                defaultValue:
                  defaultValue === undefined && showPlaceholder && !props.multiple
                    ? ''
                    : defaultValue,
              })}
          {...props}
        >
          {showPlaceholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
        <Icon name="chevrons-up-down" size={14} className="st-native-select__icon" />
      </div>
    );
  },
);
