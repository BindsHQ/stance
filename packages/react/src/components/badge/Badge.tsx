import * as React from 'react';
import { cx } from '../../internal/cx.js';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'inverse';
export type BadgeVariant = 'soft' | 'solid' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Meaning conveyed by colour. Always pair colour with text. Default `neutral`. */
  tone?: BadgeTone;
  /** Default `soft`. */
  variant?: BadgeVariant;
  /** Default `md`. */
  size?: 'sm' | 'md';
  /** Show a leading status dot. */
  dot?: boolean;
  /** Numeric count, shown when there are no children. */
  count?: number;
  /** Counts above this show as "max+". Default 99. */
  max?: number;
}

/** A short status or count label. Non-interactive. */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    tone = 'neutral',
    variant = 'soft',
    size = 'md',
    dot,
    count,
    max = 99,
    className,
    children,
    ...props
  },
  ref,
) {
  const content =
    children ?? (count !== undefined ? (count > max ? `${max}+` : String(count)) : null);
  return (
    <span
      ref={ref}
      className={cx('st-badge', className)}
      data-tone={tone}
      data-variant={variant}
      data-size={size}
      data-count={children == null && count !== undefined ? '' : undefined}
      {...props}
    >
      {dot && <span className="st-badge__dot" aria-hidden="true" />}
      {content}
    </span>
  );
});
