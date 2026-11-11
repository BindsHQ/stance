import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface DescriptionListItemData {
  term: React.ReactNode;
  details: React.ReactNode;
  key?: React.Key;
}

export interface DescriptionListProps extends React.HTMLAttributes<HTMLDListElement> {
  /**
   * `horizontal` puts terms beside details; `vertical` stacks them;
   * `grid` lays out term/detail pairs in columns. All stack on phones. Default `horizontal`.
   */
  layout?: 'horizontal' | 'vertical' | 'grid';
  /** Columns for the grid layout. Default 2. */
  columns?: 2 | 3 | 4;
  /** Separator lines between rows. Default true for horizontal. */
  dividers?: boolean;
  /** Shorthand: render pairs from data instead of children. */
  items?: DescriptionListItemData[];
}

/** Key to value pairs such as account details or contract metadata, using native <dl>. */
export const DescriptionList = React.forwardRef<HTMLDListElement, DescriptionListProps>(
  function DescriptionList(
    { layout = 'horizontal', columns = 2, dividers, items, className, children, style, ...props },
    ref,
  ) {
    return (
      <dl
        ref={ref}
        className={cx('st-description-list', className)}
        data-layout={layout}
        data-dividers={(dividers ?? layout === 'horizontal') ? '' : undefined}
        style={
          layout === 'grid' ? ({ '--_cols': columns, ...style } as React.CSSProperties) : style
        }
        {...props}
      >
        {items
          ? items.map((item, i) => (
              <DescriptionListItem key={item.key ?? i} term={item.term}>
                {item.details}
              </DescriptionListItem>
            ))
          : children}
      </dl>
    );
  },
);

export interface DescriptionListItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  term: React.ReactNode;
  children?: React.ReactNode;
}

/** One term/details pair, grouped in a <div> (valid inside <dl>). */
export const DescriptionListItem = React.forwardRef<HTMLDivElement, DescriptionListItemProps>(
  function DescriptionListItem({ term, className, children, ...props }, ref) {
    return (
      <div ref={ref} className={cx('st-description-list__item', className)} {...props}>
        <dt className="st-description-list__term">{term}</dt>
        <dd className="st-description-list__details">{children}</dd>
      </div>
    );
  },
);
