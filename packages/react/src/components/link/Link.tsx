import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Slot } from '../../internal/slot.js';
import { Icon } from '../../icons/Icon.js';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * `inline` is underlined for use in running text; `standalone` is bolder with
   * underline on hover; `subtle` inherits colour. Default `inline`.
   */
  variant?: 'inline' | 'standalone' | 'subtle';
  /**
   * Opens in a new tab with rel="noopener noreferrer", shows an external icon and
   * announces ", opens in a new tab". Defaults to true for absolute http(s) URLs with target="_blank".
   */
  external?: boolean;
  /** Render a router link (e.g. Next.js Link) with Stance link styles. */
  asChild?: boolean;
}

/** Navigates to another page or resource. Use Button for actions. */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { variant = 'inline', external, asChild, className, children, target, rel, ...props },
  ref,
) {
  const isExternal = external ?? target === '_blank';
  const shared = {
    className: cx('st-link', className),
    'data-variant': variant,
    'data-external': isExternal ? '' : undefined,
  };
  if (asChild) {
    return (
      <Slot
        ref={ref as React.Ref<HTMLElement>}
        {...shared}
        {...(props as React.HTMLAttributes<HTMLElement>)}
      >
        {children}
      </Slot>
    );
  }
  return (
    <a
      ref={ref}
      target={isExternal ? '_blank' : target}
      rel={isExternal ? cx(rel, 'noopener noreferrer') : rel}
      {...shared}
      {...props}
    >
      {children}
      {isExternal && (
        <>
          <Icon name="arrow-up-right" size={14} className="st-link__external" />
          <span className="st-sr-only">, opens in a new tab</span>
        </>
      )}
    </a>
  );
});
