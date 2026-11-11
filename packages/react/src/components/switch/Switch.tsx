'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useFormFieldControl } from '../form-field/FormField.js';

export interface SwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'onChange'
> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Visible label. Without it, provide `aria-label` or use inside FormField. */
  label?: React.ReactNode;
  description?: React.ReactNode;
  /** Default `md`. */
  size?: 'sm' | 'md';
  /** Label position relative to the track. Default `end`. */
  labelPosition?: 'start' | 'end';
  /** Submit with forms: renders a hidden input with this name. */
  name?: string;
  /** Value submitted when on. Default "on". */
  value?: string;
  required?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
}

/** An on/off toggle that takes effect immediately, exposed as role="switch". */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    label,
    description,
    size = 'md',
    labelPosition = 'end',
    name,
    value = 'on',
    invalid,
    className,
    style,
    onClick,
    ...rest
  },
  ref,
) {
  const [checked, setChecked] = useControllableState({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });
  const props = useFormFieldControl({
    ...rest,
    ...(invalid !== undefined && { 'aria-invalid': invalid }),
  });
  const { readOnly, required, ...buttonProps } = props;
  const labelId = React.useId();
  const descId = React.useId();
  const describedBy =
    [props['aria-describedby'], description != null ? descId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  const control = (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-required={required || undefined}
      aria-readonly={readOnly || undefined}
      aria-labelledby={label != null && !props['aria-label'] ? labelId : props['aria-labelledby']}
      data-state={checked ? 'checked' : 'unchecked'}
      data-size={size}
      className="st-switch__track"
      onClick={composeHandlers(onClick, () => {
        if (!readOnly) setChecked(!checked);
      })}
      {...buttonProps}
      aria-describedby={describedBy}
    >
      <span className="st-switch__thumb" aria-hidden="true" />
    </button>
  );
  return (
    <span
      className={cx('st-switch', className)}
      style={style}
      data-size={size}
      data-label-position={labelPosition}
      data-disabled={props.disabled ? '' : undefined}
      data-invalid={String(props['aria-invalid']) === 'true' ? '' : undefined}
    >
      {control}
      {(label != null || description != null) && (
        <span className="st-switch__text">
          {label != null && (
            // Clicking the label toggles, like a native label.
            <span
              id={labelId}
              className="st-switch__label"
              onClick={() => !props.disabled && !readOnly && setChecked(!checked)}
            >
              {label}
            </span>
          )}
          {description != null && (
            <span id={descId} className="st-switch__description">
              {description}
            </span>
          )}
        </span>
      )}
      {name && (
        <input
          type="hidden"
          name={name}
          value={checked ? value : ''}
          disabled={props.disabled || !checked}
        />
      )}
    </span>
  );
});
