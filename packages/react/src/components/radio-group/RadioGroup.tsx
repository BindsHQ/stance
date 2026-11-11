'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { ChoiceFieldset, type ChoiceGroupBaseProps } from '../checkbox-group/CheckboxGroup.js';

interface RadioGroupContextValue {
  name: string;
  value: string | null;
  setValue: (value: string) => void;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  size: 'sm' | 'md';
  variant: 'default' | 'card';
}
const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends ChoiceGroupBaseProps {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  /** Form field name. Generated if omitted. */
  name?: string;
  /** `card` renders each option as a selectable card. Default `default`. */
  variant?: 'default' | 'card';
}

/** A labelled set of mutually exclusive options. Native radios give arrow-key navigation for free. */
export const RadioGroup = React.forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  function RadioGroup(
    {
      value: valueProp,
      defaultValue = null,
      onValueChange,
      name,
      disabled = false,
      required = false,
      size = 'md',
      variant = 'default',
      className,
      children,
      ...props
    },
    ref,
  ) {
    const [value, setValue] = useControllableState<string | null>({
      value: valueProp,
      defaultValue,
      onChange: onValueChange as ((v: string | null) => void) | undefined,
    });
    const generated = React.useId();
    const invalid = props.error != null && props.error !== false && props.error !== '';
    const ctx = React.useMemo<RadioGroupContextValue>(
      () => ({
        name: name ?? generated,
        value,
        setValue,
        disabled,
        required,
        invalid,
        size,
        variant,
      }),
      [name, generated, value, setValue, disabled, required, invalid, size, variant],
    );
    return (
      <RadioGroupContext.Provider value={ctx}>
        <ChoiceFieldset
          ref={ref}
          kind="radio"
          role="radiogroup"
          disabled={disabled}
          required={required}
          className={cx(variant === 'card' && 'st-radio-group--card', className)}
          data-variant={variant}
          {...props}
        >
          {children}
        </ChoiceFieldset>
      </RadioGroupContext.Provider>
    );
  },
);

export interface RadioProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'value'
> {
  /** The option's value. */
  value: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: 'sm' | 'md';
}

/** One option in a RadioGroup. */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    value,
    label,
    description,
    size,
    disabled,
    className,
    style,
    onChange,
    checked: checkedProp,
    name,
    ...props
  },
  ref,
) {
  const group = React.useContext(RadioGroupContext);
  const descId = React.useId();
  const labelId = React.useId();
  const isDisabled = disabled ?? group?.disabled;
  const checked = group ? group.value === value : checkedProp;
  const variant = group?.variant ?? 'default';
  return (
    <label
      className={cx('st-radio', className)}
      style={style}
      data-size={size ?? group?.size ?? 'md'}
      data-variant={variant}
      data-state={checked ? 'checked' : 'unchecked'}
      data-disabled={isDisabled ? '' : undefined}
      data-invalid={group?.invalid ? '' : undefined}
    >
      <span className="st-radio__box">
        <input
          ref={ref}
          type="radio"
          className="st-radio__input"
          name={name ?? group?.name}
          value={value}
          checked={group ? checked : checkedProp}
          disabled={isDisabled}
          required={group?.required || undefined}
          aria-describedby={description != null ? descId : undefined}
          aria-labelledby={
            label != null && !props['aria-label'] ? labelId : props['aria-labelledby']
          }
          onChange={(e) => {
            onChange?.(e);
            if (!e.defaultPrevented && e.target.checked) group?.setValue(value);
          }}
          {...props}
        />
        <span className="st-radio__dot" aria-hidden="true" />
      </span>
      {(label != null || description != null) && (
        <span className="st-radio__text">
          {label != null && (
            <span id={labelId} className="st-radio__label">
              {label}
            </span>
          )}
          {description != null && (
            <span id={descId} className="st-radio__description">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
});
