import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { ProgressTone } from '../progress/Progress.js';

export interface ProgressCircleProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** Current value; `null`/omitted is indeterminate. */
  value?: number | null;
  max?: number;
  /** sm 32, md 48, lg 72, or a pixel size. Default `md`. */
  size?: 'sm' | 'md' | 'lg' | number;
  /** Ring thickness in px. Default scales with size. */
  thickness?: number;
  tone?: ProgressTone;
  /** Show the value in the centre (md and larger). */
  showValue?: boolean;
  /** Custom centre content. */
  children?: React.ReactNode;
  formatValue?: (value: number, max: number) => string;
}

const sizes = { sm: 32, md: 48, lg: 72 };
const defaultFormat = (value: number, max: number) => `${Math.round((value / max) * 100)}%`;

/** A circular progress indicator. Requires an accessible name (aria-label or aria-labelledby). */
export const ProgressCircle = React.forwardRef<HTMLDivElement, ProgressCircleProps>(
  function ProgressCircle(
    {
      value = null,
      max = 100,
      size = 'md',
      thickness,
      tone = 'default',
      showValue,
      children,
      formatValue = defaultFormat,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const px = typeof size === 'number' ? size : sizes[size];
    const stroke = thickness ?? Math.max(3, Math.round(px / 12));
    const r = (px - stroke) / 2;
    const c = 2 * Math.PI * r;
    const indeterminate = value === null || Number.isNaN(value);
    const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), max);
    const text = indeterminate ? undefined : formatValue(clamped, max);
    const offset = indeterminate ? c * 0.72 : c * (1 - clamped / max);
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuetext={text}
        className={cx('st-progress-circle', className)}
        data-tone={tone}
        data-state={indeterminate ? 'indeterminate' : clamped >= max ? 'complete' : 'loading'}
        style={{ width: px, height: px, ...style }}
        {...props}
      >
        <svg
          viewBox={`0 0 ${px} ${px}`}
          width={px}
          height={px}
          aria-hidden="true"
          focusable="false"
        >
          <circle
            className="st-progress-circle__track"
            cx={px / 2}
            cy={px / 2}
            r={r}
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            className="st-progress-circle__indicator"
            cx={px / 2}
            cy={px / 2}
            r={r}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${px / 2} ${px / 2})`}
          />
        </svg>
        {(children != null || (showValue && text)) && (
          <span
            className="st-progress-circle__label"
            aria-hidden="true"
            style={{ fontSize: Math.max(10, px * 0.24) }}
          >
            {children ?? text}
          </span>
        )}
      </div>
    );
  },
);
