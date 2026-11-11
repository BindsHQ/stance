import * as React from 'react';
import { cx } from './cx.js';

/** Hides content visually while keeping it available to assistive technology. */
export const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(function VisuallyHidden({ className, ...props }, ref) {
  return <span ref={ref} className={cx('st-sr-only', className)} {...props} />;
});
