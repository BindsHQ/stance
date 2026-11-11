import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { IntrinsicTag } from '../../internal/space.js';

export interface CaptionProps extends React.HTMLAttributes<HTMLElement> {
  /** Element to render. Default `p`; use `figcaption` inside a figure. */
  as?: IntrinsicTag;
  /** Default `muted`. */
  tone?: 'muted' | 'subtle' | 'default' | 'danger';
  align?: 'start' | 'center' | 'end';
}

/** Small supporting text: figure captions, timestamps, footnotes and helper copy. */
export const Caption = React.forwardRef<HTMLElement, CaptionProps>(function Caption(
  { as = 'p', tone = 'muted', align, className, ...props },
  ref,
) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={cx('st-caption', className)}
      data-tone={tone}
      data-align={align}
      {...props}
    />
  );
});
