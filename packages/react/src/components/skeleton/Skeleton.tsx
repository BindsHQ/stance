import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Shape. Default `text`. */
  variant?: 'text' | 'circle' | 'rect';
  /** CSS width (number = px). Text defaults to 100%. */
  width?: number | string;
  /** CSS height (number = px). */
  height?: number | string;
  /** Number of text lines; the last line is shorter. Default 1. */
  lines?: number;
  /** Disable the shimmer animation. */
  static?: boolean;
}

const unit = (v: number | string | undefined) => (typeof v === 'number' ? `${v}px` : v);

/**
 * A placeholder shown while content loads. Skeletons are hidden from assistive
 * technology; mark the loading container with `aria-busy="true"` and provide a
 * visually hidden "Loading…" status so screen-reader users know what is happening.
 */
export const Skeleton = React.forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  { variant = 'text', width, height, lines = 1, static: isStatic, className, style, ...props },
  ref,
) {
  const base = {
    className: cx('st-skeleton', className),
    'data-variant': variant,
    'data-static': isStatic ? '' : undefined,
    'aria-hidden': true as const,
  };
  if (variant === 'text' && lines > 1) {
    return (
      <span
        ref={ref}
        className={cx('st-skeleton-lines', className)}
        aria-hidden="true"
        style={{ width: unit(width), ...style }}
        {...props}
      >
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            {...base}
            className="st-skeleton"
            style={{ width: i === lines - 1 ? '62%' : '100%', height: unit(height) }}
          />
        ))}
      </span>
    );
  }
  const size = variant === 'circle' ? (width ?? height ?? 40) : undefined;
  return (
    <span
      ref={ref}
      {...base}
      style={{
        width: unit(size ?? width),
        height: unit(variant === 'circle' ? size : height),
        ...style,
      }}
      {...props}
    />
  );
});
