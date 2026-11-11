import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width ÷ height, e.g. `16 / 9`. Default `16 / 9`. */
  ratio?: number;
}

/** Holds media to a fixed aspect ratio; the single child fills the box. */
export const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  { ratio = 16 / 9, className, style, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('st-aspect-ratio', className)}
      style={{ aspectRatio: String(ratio), ...style }}
      {...props}
    />
  );
});
