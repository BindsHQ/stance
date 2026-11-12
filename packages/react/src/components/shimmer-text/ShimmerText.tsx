import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface ShimmerTextProps extends React.HTMLAttributes<HTMLElement> {
  /** The label, for example "Searching the web". */
  children?: React.ReactNode;
  /** Run the light sweep. Turn it off when the work is done. Default true. */
  active?: boolean;
  /** The element to render. Default `span`. */
  as?: React.ElementType;
}

/**
 * Text with a slow light sweep for labels of work in progress. It is plain text to
 * assistive technology, and still text with reduced motion.
 */
export const ShimmerText = React.forwardRef<HTMLElement, ShimmerTextProps>(function ShimmerText(
  { children, active = true, as: Comp = 'span', className, ...props },
  ref,
) {
  return (
    <Comp
      ref={ref}
      className={cx('st-shimmer-text', className)}
      data-active={active ? '' : undefined}
      {...props}
    >
      {children}
    </Comp>
  );
});
