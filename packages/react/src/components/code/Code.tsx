import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  /** Default `md` (relative to surrounding text). */
  size?: 'sm' | 'md';
  /** `muted` adds a background chip; `plain` only changes the font. Default `muted`. */
  variant?: 'muted' | 'plain';
}

/** Inline code: identifiers, values, file names and short snippets in running text. */
export const Code = React.forwardRef<HTMLElement, CodeProps>(function Code(
  { size = 'md', variant = 'muted', className, ...props },
  ref,
) {
  return (
    <code
      ref={ref}
      className={cx('st-code', className)}
      data-size={size}
      data-variant={variant}
      {...props}
    />
  );
});
