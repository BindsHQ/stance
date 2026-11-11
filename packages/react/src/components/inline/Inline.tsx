import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { spaceVar, type IntrinsicTag, type SpaceKey } from '../../internal/space.js';
import type { StackAlign, StackJustify } from '../stack/Stack.js';

export interface InlineProps extends React.HTMLAttributes<HTMLElement> {
  as?: IntrinsicTag;
  /** Gap between children (space scale). Default 2 (8px). */
  gap?: SpaceKey;
  /** Cross-axis alignment. Default `center`. */
  align?: StackAlign;
  justify?: StackJustify;
  /** Wrap onto new lines when space runs out. Default true. */
  wrap?: boolean;
}

/** Lays children out horizontally and wraps them: tags, buttons, metadata rows. */
export const Inline = React.forwardRef<HTMLElement, InlineProps>(function Inline(
  { as = 'div', gap = 2, align = 'center', justify, wrap = true, className, style, ...props },
  ref,
) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={cx('st-inline', className)}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap ? '' : undefined}
      style={{ ['--st-stack-gap' as string]: spaceVar(gap), ...style }}
      {...props}
    />
  );
});
