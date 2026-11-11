'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useFormField, useFormFieldControl } from '../form-field/FormField.js';

export interface PinInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Number of cells. Default 6. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called once every cell is filled. */
  onComplete?: (value: string) => void;
  /** Accepted characters. Default `numeric`. */
  type?: 'numeric' | 'alphanumeric';
  /** Hide the characters, as for a PIN. */
  mask?: boolean;
  /** sm 32, md 40, lg 48. Default `md`. */
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  /** Submit with forms: a hidden input with this name carries the joined value. */
  name?: string;
  /** Focus the first cell on mount. */
  autoFocus?: boolean;
  /** Offer SMS and email code autofill on the first cell. Default true. */
  oneTimeCode?: boolean;
  /** Label for each cell. Default "Digit 1 of 6" / "Character 1 of 6". */
  getCellLabel?: (index: number, length: number) => string;
}

const patterns = { numeric: /[^0-9]/g, alphanumeric: /[^a-zA-Z0-9]/g };

/**
 * A one-time code or PIN field split into cells that behaves as a single input:
 * typing advances, Backspace steps back, and pasting fills every cell.
 */
export const PinInput = React.forwardRef<HTMLDivElement, PinInputProps>(function PinInput(
  {
    length = 6,
    value: valueProp,
    defaultValue,
    onChange,
    onComplete,
    type = 'numeric',
    mask = false,
    size = 'md',
    disabled: disabledProp,
    readOnly: readOnlyProp,
    required,
    invalid,
    name,
    autoFocus,
    oneTimeCode = true,
    getCellLabel,
    className,
    id: idProp,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': describedByProp,
    ...props
  },
  ref,
) {
  const formField = useFormField();
  const field = useFormFieldControl({
    id: idProp,
    disabled: disabledProp,
    readOnly: readOnlyProp,
    required,
    'aria-describedby': describedByProp,
    ...(invalid !== undefined && { 'aria-invalid': invalid }),
  });
  const disabled = !!field.disabled;
  const readOnly = !!field.readOnly;
  const isInvalid = String(field['aria-invalid']) === 'true';
  const clean = React.useCallback(
    (raw: string) => raw.replace(patterns[type], '').slice(0, length),
    [type, length],
  );
  const [value, setValue] = useControllableState({
    value: valueProp === undefined ? undefined : clean(valueProp),
    defaultValue: clean(defaultValue ?? ''),
    onChange,
  });
  const cells = React.useRef<(HTMLInputElement | null)[]>([]);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  const focusCell = (index: number) => {
    const el = cells.current[Math.max(0, Math.min(length - 1, index))];
    el?.focus();
    el?.select();
  };
  const update = (next: string, focusIndex?: number) => {
    const cleaned = clean(next);
    setValue(cleaned);
    if (cleaned.length === length && cleaned !== value) onCompleteRef.current?.(cleaned);
    if (focusIndex !== undefined) focusCell(focusIndex);
  };

  const chars = Array.from({ length }, (_, i) => value[i] ?? '');
  const labelFor = (i: number) =>
    getCellLabel?.(i, length) ??
    `${type === 'numeric' ? 'Digit' : 'Character'} ${i + 1} of ${length}`;

  const onCellChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const typed = event.target.value.replace(patterns[type], '');
    if (!typed) {
      update(value.slice(0, index) + value.slice(index + 1));
      return;
    }
    // Autofill and paste can deliver the whole code into one cell.
    if (typed.length > 1) {
      const next = clean(value.slice(0, index) + typed);
      update(next, Math.min(next.length, length - 1));
      return;
    }
    // Cells fill from the left: typing into a later empty cell appends.
    const at = Math.min(index, value.length);
    const next = value.slice(0, at) + typed + value.slice(at + 1);
    update(next, at + 1);
  };

  const onCellKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Backspace':
        event.preventDefault();
        if (readOnly) return;
        if (chars[index]) update(value.slice(0, index) + value.slice(index + 1), index);
        else if (index > 0) update(value.slice(0, index - 1) + value.slice(index), index - 1);
        break;
      case 'Delete':
        event.preventDefault();
        if (!readOnly) update(value.slice(0, index) + value.slice(index + 1), index);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        focusCell(index - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        focusCell(index + 1);
        break;
      case 'Home':
        event.preventDefault();
        focusCell(0);
        break;
      case 'End':
        event.preventDefault();
        focusCell(Math.min(value.length, length - 1));
        break;
    }
  };

  const onPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (readOnly) return;
    const pasted = clean(event.clipboardData.getData('text'));
    if (pasted) update(pasted, Math.min(pasted.length, length - 1));
  };

  return (
    <div
      ref={ref}
      role="group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : formField?.labelId)}
      aria-describedby={field['aria-describedby']}
      className={cx('st-pin-input', className)}
      data-size={size}
      data-invalid={isInvalid ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-complete={value.length === length ? '' : undefined}
      {...props}
    >
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(el) => {
            cells.current[index] = el;
          }}
          id={index === 0 ? field.id : undefined}
          className="st-pin-input__cell"
          type={mask ? 'password' : 'text'}
          inputMode={type === 'numeric' ? 'numeric' : 'text'}
          pattern={type === 'numeric' ? '[0-9]*' : undefined}
          autoComplete={index === 0 && oneTimeCode ? 'one-time-code' : 'off'}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          // The first cell accepts a full code so autofill can deliver it in one go.
          maxLength={index === 0 ? length : 1}
          value={char}
          aria-label={labelFor(index)}
          aria-invalid={isInvalid || undefined}
          aria-required={field.required || undefined}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus && index === 0}
          data-filled={char ? '' : undefined}
          onChange={(e) => onCellChange(index, e)}
          onKeyDown={(e) => onCellKeyDown(index, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
      {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
    </div>
  );
});
