'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Slot } from '../../internal/slot.js';
import { useMediaQuery } from '../../internal/use-media-query.js';
import { Icon } from '../../icons/Icon.js';

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  /** Accessible name of the navigation landmark. Default "Breadcrumb". */
  label?: string;
  /** Separator between items. Default a chevron. Always hidden from assistive technology. */
  separator?: React.ReactNode;
  /** Collapse middle items when there are more than this many. Default 5. */
  maxItems?: number;
  /** Items kept before the ellipsis when collapsed. Default 1. */
  itemsBeforeCollapse?: number;
  /** Items kept after the ellipsis when collapsed. Default 2. */
  itemsAfterCollapse?: number;
  /** Below 640px, collapse to first + last items. Default true. */
  collapseOnMobile?: boolean;
  /** Accessible label for the expand button. Default "Show all breadcrumbs". */
  expandLabel?: string;
  size?: 'sm' | 'md';
}

/** Shows the user's location in a hierarchy and lets them move up it. */
export const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  {
    label = 'Breadcrumb',
    separator,
    maxItems = 5,
    itemsBeforeCollapse = 1,
    itemsAfterCollapse = 2,
    collapseOnMobile = true,
    expandLabel = 'Show all breadcrumbs',
    size = 'md',
    className,
    children,
    ...props
  },
  ref,
) {
  const [expanded, setExpanded] = React.useState(false);
  const isSmall = useMediaQuery('(max-width: 639.98px)');
  const listRef = React.useRef<HTMLOListElement>(null);
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const count = items.length;

  let before = itemsBeforeCollapse;
  let after = itemsAfterCollapse;
  let collapsed = !expanded && count > maxItems && before + after < count;
  if (!expanded && collapseOnMobile && isSmall && count > 2) {
    collapsed = true;
    before = 1;
    after = 1;
  }

  const expand = () => {
    setExpanded(true);
    // Move focus to the first revealed item so keyboard users keep their place.
    requestAnimationFrame(() => {
      const target = listRef.current?.querySelectorAll<HTMLElement>(
        '.st-breadcrumbs__item a, .st-breadcrumbs__item [data-breadcrumb-link]',
      )[before];
      target?.focus();
    });
  };

  const sep = (
    <li className="st-breadcrumbs__separator" aria-hidden="true" role="presentation">
      {separator ?? <Icon name="chevron-right" size={14} />}
    </li>
  );

  const visible: React.ReactNode[] = [];
  items.forEach((item, i) => {
    const hidden = collapsed && i >= before && i < count - after;
    if (hidden) {
      if (i === before) {
        visible.push(
          <React.Fragment key="ellipsis">
            {i > 0 && sep}
            <li className="st-breadcrumbs__item">
              <button
                type="button"
                className="st-breadcrumbs__ellipsis"
                aria-label={`${expandLabel} (${count - before - after} hidden)`}
                onClick={expand}
              >
                <Icon name="more-horizontal" size={16} />
              </button>
            </li>
          </React.Fragment>,
        );
      }
      return;
    }
    visible.push(
      <React.Fragment key={item.key ?? i}>
        {i > 0 && sep}
        {item}
      </React.Fragment>,
    );
  });

  return (
    <nav
      ref={ref}
      aria-label={label}
      className={cx('st-breadcrumbs', className)}
      data-size={size}
      {...props}
    >
      <ol ref={listRef} className="st-breadcrumbs__list">
        {visible}
      </ol>
    </nav>
  );
});

export interface BreadcrumbItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Marks the current page; renders plain text with aria-current="page". */
  current?: boolean;
  /** Render your own link element (e.g. Next.js Link) with breadcrumb styles. */
  asChild?: boolean;
  /** Optional icon before the label. */
  icon?: React.ReactNode;
}

/** One level in the breadcrumb trail. Use inside <Breadcrumbs>. */
export const BreadcrumbItem = React.forwardRef<HTMLAnchorElement, BreadcrumbItemProps>(
  function BreadcrumbItem({ current, asChild, icon, href, className, children, ...props }, ref) {
    const content = (
      <>
        {icon && (
          <span className="st-breadcrumbs__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {asChild ? null : children}
      </>
    );
    let node: React.ReactNode;
    if (current) {
      node = (
        <span
          className={cx('st-breadcrumbs__current', className)}
          aria-current="page"
          {...(props as React.HTMLAttributes<HTMLSpanElement>)}
        >
          {icon && (
            <span className="st-breadcrumbs__icon" aria-hidden="true">
              {icon}
            </span>
          )}
          {asChild && React.isValidElement(children)
            ? (children.props as { children?: React.ReactNode }).children
            : children}
        </span>
      );
    } else if (asChild) {
      node = (
        <Slot
          ref={ref as React.Ref<HTMLElement>}
          className={cx('st-breadcrumbs__link', className)}
          data-breadcrumb-link=""
          {...(props as React.HTMLAttributes<HTMLElement>)}
        >
          {children}
        </Slot>
      );
    } else if (href) {
      node = (
        <a ref={ref} href={href} className={cx('st-breadcrumbs__link', className)} {...props}>
          {content}
        </a>
      );
    } else {
      node = (
        <span
          className={cx('st-breadcrumbs__text', className)}
          {...(props as React.HTMLAttributes<HTMLSpanElement>)}
        >
          {content}
        </span>
      );
    }
    return <li className="st-breadcrumbs__item">{node}</li>;
  },
);
