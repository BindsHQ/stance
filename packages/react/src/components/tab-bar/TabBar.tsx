'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Slot } from '../../internal/slot.js';

export interface TabBarProps extends React.HTMLAttributes<HTMLElement> {
  /** Accessible name of the navigation landmark. Default "Primary". */
  label?: string;
  /** `bottom` fixes the bar to the viewport bottom (mobile), `top` to the top; `static` flows in the page. Default `static`. */
  position?: 'static' | 'top' | 'bottom';
  /** Hide the bar at and above this breakpoint, so it only appears on small screens. */
  hideFrom?: 'md' | 'lg' | 'never';
  /** Show labels under icons (default) or hide them visually. */
  labels?: 'visible' | 'hidden';
}

/**
 * App-level navigation between a handful of top destinations, typically pinned to the
 * bottom of the screen on mobile. Uses links with aria-current, not tabs, because
 * each item changes the page.
 */
export const TabBar = React.forwardRef<HTMLElement, TabBarProps>(function TabBar(
  {
    label = 'Primary',
    position = 'static',
    hideFrom = 'never',
    labels = 'visible',
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <nav
      ref={ref}
      aria-label={label}
      className={cx('st-tab-bar', className)}
      data-position={position}
      data-hide-from={hideFrom === 'never' ? undefined : hideFrom}
      data-labels={labels}
      {...props}
    >
      <ul className="st-tab-bar__list">{children}</ul>
    </nav>
  );
});

export interface TabBarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Icon shown above the label. */
  icon: React.ReactNode;
  /** Marks the current destination (sets aria-current="page"). */
  active?: boolean;
  /** Small count or dot indicator, e.g. unread notifications. Describe it in `badgeLabel`. */
  badge?: React.ReactNode;
  /** Accessible description of the badge, e.g. "3 unread". */
  badgeLabel?: string;
  /** Render your own link (e.g. Next.js Link). The child's children become the label. */
  asChild?: boolean;
}

export const TabBarItem = React.forwardRef<HTMLAnchorElement, TabBarItemProps>(function TabBarItem(
  { icon, active, badge, badgeLabel, asChild, className, children, ...props },
  ref,
) {
  const inner = (label: React.ReactNode) => (
    <>
      <span className="st-tab-bar__icon" aria-hidden="true">
        {icon}
        {badge != null && <span className="st-tab-bar__badge">{badge}</span>}
      </span>
      <span className="st-tab-bar__label">{label}</span>
      {badgeLabel && <span className="st-sr-only">, {badgeLabel}</span>}
    </>
  );
  const shared = {
    className: cx('st-tab-bar__item', className),
    'aria-current': active ? ('page' as const) : undefined,
    'data-active': active ? '' : undefined,
  };
  return (
    <li className="st-tab-bar__cell">
      {asChild && React.isValidElement(children) ? (
        <Slot
          ref={ref as React.Ref<HTMLElement>}
          {...shared}
          {...(props as React.HTMLAttributes<HTMLElement>)}
        >
          {React.cloneElement(
            children,
            undefined,
            inner((children.props as { children?: React.ReactNode }).children),
          )}
        </Slot>
      ) : (
        <a ref={ref} {...shared} {...props}>
          {inner(children)}
        </a>
      )}
    </li>
  );
});
