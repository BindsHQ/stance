import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { spaceVar, type SpaceKey } from '../../internal/space.js';

export interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Fixed size on the space scale. Omit to grow and fill remaining space in a flex row/column. */
  size?: SpaceKey;
  /** Axis of a fixed-size spacer. Default `vertical`. */
  axis?: 'vertical' | 'horizontal';
}

/** Empty space: either a fixed gap from the scale or a flexible filler that pushes siblings apart. */
export const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(function Spacer(
  { size, axis = 'vertical', className, style, ...props },
  ref,
) {
  const s = spaceVar(size);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cx('st-spacer', className)}
      data-flexible={s ? undefined : ''}
      data-axis={axis}
      style={{
        ...(s && (axis === 'vertical' ? { height: s } : { width: s, display: 'inline-block' })),
        ...style,
      }}
      {...props}
    />
  );
});
