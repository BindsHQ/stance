import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `attached` joins buttons into one segmented control; `spaced` keeps a gap. Default `attached`. */
  variant?: 'attached' | 'spaced';
  orientation?: 'horizontal' | 'vertical';
  /** Accessible name for the group, e.g. "Text alignment". */
  label?: string;
  /** Stretch to fill the container; buttons share the width. */
  fullWidth?: boolean;
}

/** Groups related buttons. Renders role="group" so assistive tech announces the relationship. */
export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { variant = 'attached', orientation = 'horizontal', label, fullWidth, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cx('st-button-group', className)}
      data-variant={variant}
      data-orientation={orientation}
      data-full-width={fullWidth ? '' : undefined}
      {...props}
    />
  );
});
