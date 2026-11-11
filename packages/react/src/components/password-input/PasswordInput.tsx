'use client';
import * as React from 'react';
import { Icon } from '../../icons/Icon.js';
import { Input, type InputProps } from '../input/Input.js';

export interface PasswordStrength {
  /** 0 (very weak) to 4 (strong). */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

/** A simple, dependency-free strength heuristic: length and character variety. */
export function estimatePasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: 'Too short' };
  let points = 0;
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/\d/.test(password)) points++;
  if (/[^A-Za-z0-9]/.test(password)) points++;
  if (password.length < 8) points = Math.min(points, 1);
  const score = Math.min(4, Math.max(0, points - 1)) as PasswordStrength['score'];
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
  return { score, label: labels[score] };
}

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'suffix'> {
  /** Show a strength meter; pass a function to use your own scoring. */
  strength?: boolean | ((password: string) => PasswordStrength);
  /** Labels for the visibility toggle. */
  showLabel?: string;
  hideLabel?: string;
  /** Controlled visibility. */
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}

/** Password entry with a show/hide toggle and an optional strength meter. */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      strength,
      showLabel = 'Show password',
      hideLabel = 'Hide password',
      visible: visibleProp,
      onVisibleChange,
      onChange,
      value,
      defaultValue,
      autoComplete = 'current-password',
      ...props
    },
    ref,
  ) {
    const [own, setOwn] = React.useState(false);
    const visible = visibleProp ?? own;
    const setVisible = (v: boolean) => {
      if (visibleProp === undefined) setOwn(v);
      onVisibleChange?.(v);
    };
    const [text, setText] = React.useState(String(value ?? defaultValue ?? ''));
    const current = value !== undefined ? String(value) : text;
    const meterId = React.useId();
    const result = strength
      ? typeof strength === 'function'
        ? strength(current)
        : estimatePasswordStrength(current)
      : null;
    const describedBy =
      [props['aria-describedby'], result ? meterId : undefined].filter(Boolean).join(' ') ||
      undefined;
    return (
      <div className="st-password-input">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          spellCheck={false}
          autoCapitalize="off"
          value={value}
          defaultValue={defaultValue}
          onChange={(e) => {
            setText(e.target.value);
            onChange?.(e);
          }}
          {...props}
          aria-describedby={describedBy}
          suffix={
            <button
              type="button"
              className="st-password-input__toggle"
              aria-label={visible ? hideLabel : showLabel}
              aria-pressed={visible}
              title={visible ? hideLabel : showLabel}
              disabled={props.disabled}
              onClick={() => setVisible(!visible)}
            >
              <Icon name={visible ? 'eye-off' : 'eye'} size={16} />
            </button>
          }
        />
        {result && (
          <div className="st-password-input__strength" data-score={result.score}>
            <span className="st-password-input__bars" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="st-password-input__bar"
                  data-filled={current && i < Math.max(1, result.score) ? '' : undefined}
                />
              ))}
            </span>
            <span id={meterId} className="st-password-input__label" aria-live="polite">
              {current ? `Strength: ${result.label}` : ''}
            </span>
          </div>
        )}
      </div>
    );
  },
);
