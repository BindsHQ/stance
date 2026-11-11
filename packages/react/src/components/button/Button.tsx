import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Slot } from '../../internal/slot.js';
import { Spinner } from '../spinner/Spinner.js';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual emphasis. Use one `primary` per view. Default `primary`. */
  variant?: ButtonVariant;
  /** Control height: xs 24, sm 32, md 40, lg 48. Default `md`. */
  size?: ButtonSize;
  /** `pill` gives fully rounded ends (Binds marketing CTAs). Default `default`. */
  shape?: 'default' | 'pill';
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Shows a spinner, sets `aria-busy` and blocks interaction while keeping focusability. */
  loading?: boolean;
  /** Replaces the label while loading. */
  loadingText?: React.ReactNode;
  /** Element rendered before the label, typically an `<Icon>`. */
  leadingIcon?: React.ReactNode;
  /** Element rendered after the label. */
  trailingIcon?: React.ReactNode;
  /** Render the child element (e.g. a router link) with button styles. */
  asChild?: boolean;
}

/** Triggers an action. Renders a native `<button>` (type="button" by default). */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    shape = 'default',
    fullWidth,
    loading = false,
    loadingText,
    leadingIcon,
    trailingIcon,
    asChild,
    disabled,
    className,
    children,
    type,
    onClick,
    ...props
  },
  ref,
) {
  const shared = {
    className: cx('st-button', className),
    'data-variant': variant,
    'data-size': size,
    'data-shape': shape === 'pill' ? 'pill' : undefined,
    'data-full-width': fullWidth ? '' : undefined,
    'data-loading': loading ? '' : undefined,
  };
  if (asChild) {
    return (
      <Slot ref={ref as React.Ref<HTMLElement>} {...shared} {...(props as React.HTMLAttributes<HTMLElement>)}>
        {children}
      </Slot>
    );
  }
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...shared}
      {...props}
    >
      {loading ? (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} label={null} className="st-button__spinner" />
      ) : (
        leadingIcon && <span className="st-button__icon" aria-hidden="true">{leadingIcon}</span>
      )}
      {loading && loadingText ? loadingText : children != null && <span className="st-button__label">{children}</span>}
      {!loading && trailingIcon && <span className="st-button__icon" aria-hidden="true">{trailingIcon}</span>}
    </button>
  );
});
