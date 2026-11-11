'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { CheckboxGroupContext } from '../checkbox/Checkbox.js';

export interface ChoiceGroupBaseProps extends Omit<
  React.FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'onChange' | 'defaultValue'
> {
  /** Group label, rendered as the fieldset legend. */
  label: React.ReactNode;
  /** Visually hide the legend while keeping it for assistive tech. */
  hideLabel?: boolean;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Default `vertical`. */
  orientation?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md';
}

export interface CheckboxGroupProps extends ChoiceGroupBaseProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Form field name applied to every checkbox. */
  name?: string;
}

/** Shared fieldset chrome for CheckboxGroup and RadioGroup. */
export const ChoiceFieldset = React.forwardRef<
  HTMLFieldSetElement,
  ChoiceGroupBaseProps & { kind: 'checkbox' | 'radio'; children?: React.ReactNode }
>(function ChoiceFieldset(
  {
    kind,
    label,
    hideLabel,
    description,
    error,
    required,
    orientation = 'vertical',
    className,
    children,
    ...props
  },
  ref,
) {
  const id = React.useId();
  const hasError = error != null && error !== false && error !== '';
  const describedBy =
    [description != null ? `${id}-desc` : null, hasError ? `${id}-err` : null]
      .filter(Boolean)
      .join(' ') || undefined;
  const { size: _s, ...rest } = props as typeof props & { size?: string };
  return (
    <fieldset
      ref={ref}
      className={cx('st-choice-group', className)}
      data-kind={kind}
      data-orientation={orientation}
      data-invalid={hasError ? '' : undefined}
      aria-describedby={describedBy}
      aria-invalid={kind === 'radio' && hasError ? true : undefined}
      aria-required={kind === 'radio' && required ? true : undefined}
      {...rest}
    >
      <legend className={cx('st-choice-group__legend', hideLabel && 'st-sr-only')}>
        {label}
        {required && (
          <span className="st-label__required">
            <span aria-hidden="true"> *</span>
            <span className="st-sr-only">, required</span>
          </span>
        )}
      </legend>
      {description != null && (
        <p id={`${id}-desc`} className="st-choice-group__description">
          {description}
        </p>
      )}
      <div className="st-choice-group__items">{children}</div>
      {hasError && (
        <p id={`${id}-err`} className="st-choice-group__error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
});

/** A labelled set of checkboxes sharing one array value. */
export const CheckboxGroup = React.forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(
  function CheckboxGroup(
    {
      value: valueProp,
      defaultValue = [],
      onValueChange,
      name,
      disabled = false,
      size = 'md',
      children,
      ...props
    },
    ref,
  ) {
    const [value, setValue] = useControllableState({
      value: valueProp,
      defaultValue,
      onChange: onValueChange,
    });
    const invalid = props.error != null && props.error !== false && props.error !== '';
    const ctx = React.useMemo(
      () => ({
        name,
        disabled,
        invalid,
        size,
        isChecked: (v: string) => value.includes(v),
        toggle: (v: string, checked: boolean) =>
          setValue(checked ? [...value.filter((x) => x !== v), v] : value.filter((x) => x !== v)),
      }),
      [name, disabled, invalid, size, value, setValue],
    );
    return (
      <CheckboxGroupContext.Provider value={ctx}>
        <ChoiceFieldset ref={ref} kind="checkbox" disabled={disabled} {...props}>
          {children}
        </ChoiceFieldset>
      </CheckboxGroupContext.Provider>
    );
  },
);
