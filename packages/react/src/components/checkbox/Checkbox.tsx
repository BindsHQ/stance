'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useFormFieldControl } from '../form-field/FormField.js';

export interface CheckboxGroupContextValue {
  name?: string | undefined;
  isChecked: (value: string) => boolean;
  toggle: (value: string, checked: boolean) => void;
  disabled: boolean;
  invalid: boolean;
  size: 'sm' | 'md';
}
export const CheckboxGroupContext = React.createContext<CheckboxGroupContextValue | null>(null);

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'checked' | 'defaultChecked' | 'size'
> {
  /** Controlled state. `'indeterminate'` renders the mixed state. */
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Visible label. Without it, provide `aria-label`. */
  label?: React.ReactNode;
  /** Helper text under the label. */
  description?: React.ReactNode;
  /** Default `md`. */
  size?: 'sm' | 'md';
  invalid?: boolean;
}

/** A native checkbox with Stance styling, an optional label and description, and an indeterminate state. */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    label,
    description,
    size,
    invalid,
    className,
    onChange,
    value,
    name,
    disabled,
    style,
    ...rest
  },
  forwardedRef,
) {
  const group = React.useContext(CheckboxGroupContext);
  const inGroup = group !== null && typeof value === 'string';
  const [own, setOwn] = useControllableState<boolean | 'indeterminate'>({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange: onCheckedChange as ((v: boolean | 'indeterminate') => void) | undefined,
  });
  const state = inGroup ? group.isChecked(value) : own;
  const indeterminate = state === 'indeterminate';
  const ref = React.useRef<HTMLInputElement>(null);
  const composed = useComposedRefs(forwardedRef, ref);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const descId = React.useId();
  const labelId = React.useId();
  const fieldProps = useFormFieldControl({
    ...rest,
    disabled: disabled ?? (group?.disabled || undefined),
    ...((invalid ?? group?.invalid) !== undefined && {
      'aria-invalid': invalid ?? (group?.invalid || undefined),
    }),
  });
  const describedBy =
    [fieldProps['aria-describedby'], description != null ? descId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  const isInvalid = String(fieldProps['aria-invalid']) === 'true';
  const resolvedSize = size ?? group?.size ?? 'md';

  const box = (
    <span className="st-checkbox__box">
      <input
        ref={composed}
        type="checkbox"
        className="st-checkbox__input"
        name={name ?? group?.name}
        value={value}
        checked={state === true}
        onChange={(e) => {
          onChange?.(e);
          if (e.defaultPrevented) return;
          if (inGroup) group.toggle(value, e.target.checked);
          else setOwn(e.target.checked);
        }}
        {...fieldProps}
        aria-describedby={describedBy}
        aria-labelledby={label != null && !rest['aria-label'] ? labelId : rest['aria-labelledby']}
      />
      <svg
        className="st-checkbox__mark"
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {indeterminate ? <path d="M4 8h8" /> : <path d="M3.5 8.5l3 3 6-7" />}
      </svg>
    </span>
  );
  const dataAttrs = {
    'data-size': resolvedSize,
    'data-state': indeterminate ? 'indeterminate' : state ? 'checked' : 'unchecked',
    'data-invalid': isInvalid ? '' : undefined,
    'data-disabled': fieldProps.disabled ? '' : undefined,
  };
  if (label == null && description == null) {
    return (
      <span className={cx('st-checkbox', className)} style={style} {...dataAttrs}>
        {box}
      </span>
    );
  }
  return (
    <label className={cx('st-checkbox', className)} style={style} {...dataAttrs}>
      {box}
      <span className="st-checkbox__text">
        {label != null && (
          <span id={labelId} className="st-checkbox__label">
            {label}
          </span>
        )}
        {description != null && (
          <span id={descId} className="st-checkbox__description">
            {description}
          </span>
        )}
      </span>
    </label>
  );
});
