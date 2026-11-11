import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { spaceVar, type IntrinsicTag, type SpaceKey } from '../../internal/space.js';

export type BoxBackground =
  'canvas' | 'subtle' | 'muted' | 'emphasis' | 'surface' | 'surface-raised' | 'inverse';
export type BoxRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  /** Element to render. Default `div`. */
  as?: IntrinsicTag;
  /** Padding on all sides (space scale). */
  padding?: SpaceKey;
  /** Horizontal padding; overrides `padding` on the x axis. */
  paddingX?: SpaceKey;
  /** Vertical padding; overrides `padding` on the y axis. */
  paddingY?: SpaceKey;
  /** Semantic background surface. Also sets a matching foreground. */
  background?: BoxBackground;
  /** Border strength. `true` is `default`. */
  border?: boolean | 'subtle' | 'default' | 'strong';
  radius?: BoxRadius;
  shadow?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/** The lowest-level layout primitive: a styled element bound to Stance tokens. */
export const Box = React.forwardRef<HTMLElement, BoxProps>(function Box(
  {
    as = 'div',
    padding,
    paddingX,
    paddingY,
    background,
    border,
    radius,
    shadow,
    className,
    style,
    ...props
  },
  ref,
) {
  const Tag = as as React.ElementType;
  const px = spaceVar(paddingX ?? padding);
  const py = spaceVar(paddingY ?? padding);
  return (
    <Tag
      ref={ref}
      className={cx('st-box', className)}
      data-background={background}
      data-border={border === true ? 'default' : border || undefined}
      data-radius={radius}
      data-shadow={shadow}
      style={{
        ...(px && { paddingLeft: px, paddingRight: px }),
        ...(py && { paddingTop: py, paddingBottom: py }),
        ...style,
      }}
      {...props}
    />
  );
});
