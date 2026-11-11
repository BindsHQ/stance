import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Default `horizontal`. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Purely visual when true (default) and hidden from assistive technology.
   * Set false when the line separates meaningful groups (exposes role="separator").
   */
  decorative?: boolean;
}

/** A thin rule that separates groups, e.g. inside menus and toolbars. */
export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  { orientation = 'horizontal', decorative = true, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('st-separator', className)}
      data-orientation={orientation}
      {...(decorative
        ? { role: 'none' }
        : {
            role: 'separator',
            'aria-orientation': orientation === 'vertical' ? 'vertical' : undefined,
          })}
      {...props}
    />
  );
});
