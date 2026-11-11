import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { spaceVar, type IntrinsicTag, type SpaceKey } from '../../internal/space.js';

export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

export interface StackProps extends React.HTMLAttributes<HTMLElement> {
  as?: IntrinsicTag;
  /** Gap between children (space scale). Default 4 (16px). */
  gap?: SpaceKey;
  /** Cross-axis alignment. Default `stretch`. */
  align?: StackAlign;
  /** Main-axis distribution. Default `start`. */
  justify?: StackJustify;
  /** Lay out as a row instead of a column. */
  direction?: 'column' | 'row';
  /** Allow children to wrap (rows only). */
  wrap?: boolean;
  /** Switch to a row from the `md` breakpoint (768px) upwards. */
  rowFrom?: 'sm' | 'md' | 'lg';
}

/** Arranges children in a vertical (or horizontal) flow with consistent spacing. */
export const Stack = React.forwardRef<HTMLElement, StackProps>(function Stack(
  {
    as = 'div',
    gap = 4,
    align,
    justify,
    direction = 'column',
    wrap,
    rowFrom,
    className,
    style,
    ...props
  },
  ref,
) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={cx('st-stack', className)}
      data-direction={direction}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap ? '' : undefined}
      data-row-from={rowFrom}
      style={{ ['--st-stack-gap' as string]: spaceVar(gap), ...style }}
      {...props}
    />
  );
});
