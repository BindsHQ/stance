import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface ListProps extends React.HTMLAttributes<HTMLUListElement | HTMLOListElement> {
  /** Render an ordered list. Default false. */
  ordered?: boolean;
  /** Separator lines between items. Default true. */
  dividers?: boolean;
  /** Item padding. Default `md`. */
  density?: 'sm' | 'md' | 'lg';
  /** Wrap the list in a bordered surface. */
  bordered?: boolean;
}

/** A semantic list of related items. Compose with ListItem. */
export const List = React.forwardRef<HTMLUListElement, ListProps>(function List(
  { ordered = false, dividers = true, density = 'md', bordered, className, ...props },
  ref,
) {
  const Tag = (ordered ? 'ol' : 'ul') as 'ul';
  return (
    <Tag
      ref={ref}
      className={cx('st-list', className)}
      data-dividers={dividers ? '' : undefined}
      data-density={density}
      data-bordered={bordered ? '' : undefined}
      {...props}
    />
  );
});
