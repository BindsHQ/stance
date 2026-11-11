import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { IntrinsicTag } from '../../internal/space.js';

export type TextSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TextTone =
  'default' | 'muted' | 'subtle' | 'danger' | 'success' | 'warning' | 'inverse' | 'inherit';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /** Element to render. Default `p`. Use `span` inline. */
  as?: IntrinsicTag;
  /** Default `md` (16px). */
  size?: TextSize;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  /** Semantic colour. Default `default`. */
  tone?: TextTone;
  align?: 'start' | 'center' | 'end';
  /** Truncate to one line with an ellipsis, or clamp to N lines. */
  truncate?: boolean | number;
  /** Uppercase eyebrow styling with wide tracking. */
  eyebrow?: boolean;
  /** Tabular, monospaced digits for figures that align in columns. */
  tabular?: boolean;
  /** Line height. Default `normal`. */
  leading?: 'tight' | 'snug' | 'normal' | 'relaxed';
}

/** Body copy with a size, weight and semantic tone from the Stance type scale. */
export const Text = React.forwardRef<HTMLElement, TextProps>(function Text(
  {
    as = 'p',
    size,
    weight,
    tone,
    align,
    truncate,
    eyebrow,
    tabular,
    leading,
    className,
    style,
    ...props
  },
  ref,
) {
  const Tag = as as React.ElementType;
  const clamp = typeof truncate === 'number' ? truncate : undefined;
  return (
    <Tag
      ref={ref}
      className={cx('st-text', className)}
      data-size={size}
      data-weight={weight}
      data-tone={tone}
      data-align={align}
      data-truncate={truncate === true ? '' : undefined}
      data-clamp={clamp ? '' : undefined}
      data-eyebrow={eyebrow ? '' : undefined}
      data-tabular={tabular ? '' : undefined}
      data-leading={leading}
      style={clamp ? { ['--st-text-clamp' as string]: clamp, ...style } : style}
      {...props}
    />
  );
});
