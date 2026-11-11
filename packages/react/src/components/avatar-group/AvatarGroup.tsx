import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { AvatarSize } from '../avatar/Avatar.js';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLUListElement> {
  /** Avatars to show. */
  children: React.ReactNode;
  /** Maximum avatars before collapsing into a "+N" counter. */
  max?: number;
  /** Size applied to the overflow counter; match your avatars. Default `md`. */
  size?: AvatarSize;
  /** Accessible text for the overflow counter. Default `n => \`${n} more\``. */
  overflowLabel?: (hidden: number) => string;
  /** Total count when it exceeds the children provided (e.g. paginated members). */
  total?: number;
}

/** A stack of overlapping avatars, announced as a list. */
export const AvatarGroup = React.forwardRef<HTMLUListElement, AvatarGroupProps>(
  function AvatarGroup(
    { children, max, size = 'md', overflowLabel = (n) => `${n} more`, total, className, ...props },
    ref,
  ) {
    const items = React.Children.toArray(children).filter(React.isValidElement);
    const visible = max !== undefined ? items.slice(0, max) : items;
    const hidden = (total ?? items.length) - visible.length;
    return (
      <ul ref={ref} className={cx('st-avatar-group', className)} data-size={size} {...props}>
        {visible.map((child, i) => (
          <li key={child.key ?? i} className="st-avatar-group__item">
            {child}
          </li>
        ))}
        {hidden > 0 && (
          <li className="st-avatar-group__item">
            <span
              className="st-avatar st-avatar-group__overflow"
              data-size={size}
              role="img"
              aria-label={overflowLabel(hidden)}
            >
              <span aria-hidden="true">+{hidden}</span>
            </span>
          </li>
        )}
      </ul>
    );
  },
);
