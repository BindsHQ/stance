import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Skeleton } from '../skeleton/Skeleton.js';

export interface StreamingSkeletonProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** Number of placeholder lines. Default 3. */
  lines?: number;
  /** The shape of the response to come: text, a card or an image. Default `text`. */
  variant?: 'text' | 'card' | 'image';
  /** Read by assistive technology in place of the placeholder. Default "Loading response". */
  label?: string;
  /** Turn the shimmer off. Reduced motion does this on its own. Default false. */
  static?: boolean;
}

/**
 * Placeholder lines for a response that has been requested and has not started.
 * The shapes are decorative; a polite status carries the label.
 */
export const StreamingSkeleton = React.forwardRef<HTMLDivElement, StreamingSkeletonProps>(
  function StreamingSkeleton(
    {
      lines = 3,
      variant = 'text',
      label = 'Loading response',
      static: isStatic = false,
      className,
      ...props
    },
    ref,
  ) {
    const count = Math.max(1, Math.floor(lines));
    return (
      <div
        ref={ref}
        role="status"
        className={cx('st-streaming-skeleton', className)}
        data-variant={variant}
        {...props}
      >
        <span className="st-sr-only">{label}</span>
        {variant === 'image' && (
          <Skeleton variant="rect" static={isStatic} className="st-streaming-skeleton__media" />
        )}
        {variant === 'card' && (
          <span className="st-streaming-skeleton__header" aria-hidden="true">
            <Skeleton variant="circle" width={32} static={isStatic} />
            <Skeleton width="40%" static={isStatic} />
          </span>
        )}
        {variant !== 'image' && <Skeleton lines={count} static={isStatic} />}
      </div>
    );
  },
);
