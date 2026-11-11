import * as React from 'react';
import { cx } from '../../internal/cx.js';

export type ProgressTone = 'default' | 'success' | 'warning' | 'danger';

export interface ProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Current value. `null` or omitted renders an indeterminate bar. */
  value?: number | null;
  /** Default 100. */
  max?: number;
  /** Visible label, also the accessible name. */
  label?: React.ReactNode;
  /** Show the formatted value beside the label. */
  showValue?: boolean;
  /** Formats the value for display and aria-valuetext. Default percentage. */
  formatValue?: (value: number, max: number) => string;
  /** Track height. Default `md`. */
  size?: 'sm' | 'md' | 'lg';
  tone?: ProgressTone;
}

const defaultFormat = (value: number, max: number) => `${Math.round((value / max) * 100)}%`;

/** A linear progress bar for uploads, deployments and multi-step tasks. */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    value = null,
    max = 100,
    label,
    showValue,
    formatValue = defaultFormat,
    size = 'md',
    tone = 'default',
    className,
    id,
    ...props
  },
  ref,
) {
  const generated = React.useId();
  const labelId = `${id ?? generated}-label`;
  const indeterminate = value === null || Number.isNaN(value);
  const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), max);
  const text = indeterminate ? undefined : formatValue(clamped, max);
  return (
    <div className={cx('st-progress', className)} data-size={size} data-tone={tone}>
      {(label != null || (showValue && text)) && (
        <div className="st-progress__header">
          {label != null && (
            <span id={labelId} className="st-progress__label">
              {label}
            </span>
          )}
          {showValue && text && (
            <span className="st-progress__value" aria-hidden="true">
              {text}
            </span>
          )}
        </div>
      )}
      <div
        ref={ref}
        id={id}
        role="progressbar"
        aria-labelledby={label != null ? labelId : undefined}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuetext={text}
        data-state={indeterminate ? 'indeterminate' : clamped >= max ? 'complete' : 'loading'}
        className="st-progress__track"
        {...props}
      >
        <div
          className="st-progress__indicator"
          style={
            indeterminate
              ? undefined
              : { transform: `translateX(-${100 - (clamped / max) * 100}%)` }
          }
        />
      </div>
    </div>
  );
});
