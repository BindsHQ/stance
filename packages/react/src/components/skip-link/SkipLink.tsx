'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Target id, with or without `#`. Default `main`. */
  target?: string;
}

/**
 * The first focusable element on a page: hidden until focused, it lets keyboard
 * users jump past navigation to the main content (WCAG 2.4.1).
 */
export const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(function SkipLink(
  { target = 'main', className, children = 'Skip to main content', onClick, ...props },
  ref,
) {
  const id = target.replace(/^#/, '');
  return (
    <a
      ref={ref}
      href={`#${id}`}
      className={cx('st-skip-link', className)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        const el = document.getElementById(id);
        if (el) {
          // Move focus, not just scroll, so the next Tab continues from the content.
          if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
          el.focus();
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
});
