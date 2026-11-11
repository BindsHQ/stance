import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { IntrinsicTag } from '../../internal/space.js';

export interface RichTextProps extends React.HTMLAttributes<HTMLElement> {
  /** Element to render. Default `div`; use `article` for standalone documents. */
  as?: IntrinsicTag;
  /** Base size of body copy. Default `md`. */
  size?: 'sm' | 'md' | 'lg';
  /** Constrain line length to a readable measure (~70 characters). Default true. */
  measure?: boolean;
}

/**
 * Typographic styling for long-form content you render as children (MDX, CMS
 * output already converted to React, legal pages). It styles descendants only;
 * it never parses or injects HTML.
 */
export const RichText = React.forwardRef<HTMLElement, RichTextProps>(function RichText(
  { as = 'div', size = 'md', measure = true, className, ...props },
  ref,
) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={cx('st-rich-text', className)}
      data-size={size}
      data-measure={measure ? '' : undefined}
      {...props}
    />
  );
});
