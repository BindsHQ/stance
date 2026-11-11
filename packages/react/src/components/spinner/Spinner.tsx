import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Default `md`. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Accessible label announced to screen readers. Default "Loading". Pass `null` when a parent already announces state. */
  label?: string | null;
}

/** An indeterminate loading indicator. */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', label = 'Loading', className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx('st-spinner', className)}
      data-size={size}
      {...(label ? { role: 'status', 'aria-label': label } : { 'aria-hidden': true })}
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );
});
