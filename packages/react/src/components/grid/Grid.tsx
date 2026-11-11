import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { spaceVar, type IntrinsicTag, type SpaceKey } from '../../internal/space.js';

export interface GridProps extends React.HTMLAttributes<HTMLElement> {
  as?: IntrinsicTag;
  /**
   * Fixed number of equal columns. On narrow screens (< 640px) grids with more
   * than two columns collapse to one, and from 640 to 1023px to two.
   */
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  /** Fluid alternative to `columns`: as many columns as fit, each at least this wide (CSS length). */
  minChildWidth?: string;
  /** Gap between cells (space scale). Default 4. */
  gap?: SpaceKey;
  /** Separate row gap; defaults to `gap`. */
  rowGap?: SpaceKey;
  align?: 'start' | 'center' | 'end' | 'stretch';
}

/** A two-dimensional layout: fixed columns that collapse responsively, or fluid auto-fit tracks. */
export const Grid = React.forwardRef<HTMLElement, GridProps>(function Grid(
  { as = 'div', columns, minChildWidth, gap = 4, rowGap, align, className, style, ...props },
  ref,
) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={cx('st-grid', className)}
      data-columns={minChildWidth ? undefined : columns}
      data-fluid={minChildWidth ? '' : undefined}
      data-align={align}
      style={{
        ['--st-grid-gap' as string]: spaceVar(gap),
        ['--st-grid-row-gap' as string]: spaceVar(rowGap ?? gap),
        ['--st-grid-min' as string]: minChildWidth,
        ['--st-grid-columns' as string]: columns && !minChildWidth ? String(columns) : undefined,
        ...style,
      }}
      {...props}
    />
  );
});
