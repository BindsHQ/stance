import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon. */
  icon: React.ReactNode;
  /** Accessible name. Shown as text when `extended`. */
  label: string;
  /** Show the label next to the icon. */
  extended?: boolean;
  /** Viewport corner. Use `static` to place it yourself. Default `bottom-right`. */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'static';
  size?: 'md' | 'lg';
}

/** The single most important action on a screen, floating above content. Use sparingly — at most one per view. */
export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  function FloatingActionButton(
    {
      icon,
      label,
      extended = false,
      position = 'bottom-right',
      size = 'lg',
      className,
      type,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        aria-label={extended ? undefined : label}
        title={extended ? undefined : label}
        className={cx('st-fab', className)}
        data-position={position}
        data-size={size}
        data-extended={extended ? '' : undefined}
        {...props}
      >
        <span className="st-fab__icon" aria-hidden="true">
          {icon}
        </span>
        {extended && <span className="st-fab__label">{label}</span>}
      </button>
    );
  },
);
