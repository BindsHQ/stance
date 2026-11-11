import * as React from 'react';
import { cx } from '../../internal/cx.js';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = 'display' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm';

const defaultSize: Record<HeadingLevel, HeadingSize> = {
  1: '3xl',
  2: '2xl',
  3: 'xl',
  4: 'lg',
  5: 'md',
  6: 'sm',
};

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level (h1 to h6). Default 2. */
  level?: HeadingLevel;
  /** Visual size, independent of level so hierarchy and appearance can differ. */
  size?: HeadingSize;
  /** Render a different element (e.g. `p` for a visual-only heading). */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'legend';
  weight?: 'medium' | 'semibold' | 'bold';
  align?: 'start' | 'center' | 'end';
  /** Muted colour for secondary headings. */
  tone?: 'default' | 'muted';
  /** Balance line lengths for multi-line headings. Default true. */
  balance?: boolean;
}

/** Section headings with a semantic level and an independent visual size. */
export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, size, as, weight, align, tone, balance = true, className, ...props },
  ref,
) {
  const Tag = (as ?? `h${level}`) as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={cx('st-heading', className)}
      data-size={size ?? defaultSize[level]}
      data-weight={weight}
      data-align={align}
      data-tone={tone === 'muted' ? 'muted' : undefined}
      data-balance={balance ? '' : undefined}
      {...props}
    />
  );
});
