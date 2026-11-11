import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { IntrinsicTag } from '../../internal/space.js';

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: IntrinsicTag;
  /** Max width: sm 640, md 880, lg 1240, xl 1440, full. Default `lg`. */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Remove the responsive side gutters. */
  flush?: boolean;
}

/** Centres content with a max width and responsive gutters. */
export const Container = React.forwardRef<HTMLElement, ContainerProps>(function Container(
  { as = 'div', size = 'lg', flush, className, ...props },
  ref,
) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={cx('st-container', className)}
      data-size={size}
      data-flush={flush ? '' : undefined}
      {...props}
    />
  );
});
