import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Slot } from '../../internal/slot.js';
import { Spinner } from '../spinner/Spinner.js';
import type { ButtonVariant } from '../button/Button.js';

export interface IconButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /** Accessible name, used as aria-label and tooltip title. Required. */
  label: string;
  /** The icon, typically `<Icon name="…" />`. */
  icon: React.ReactNode;
  /** Default `ghost`. */
  variant?: Exclude<ButtonVariant, 'link'>;
  /** xs 24, sm 32, md 40, lg 48. Default `md`. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Default `default` (rounded square). */
  shape?: 'default' | 'circle';
  loading?: boolean;
  /** Hide the native title tooltip (e.g. when wrapped in a Tooltip). */
  hideTitle?: boolean;
  asChild?: boolean;
  children?: React.ReactElement;
}

/** A square button containing only an icon. Always has an accessible label. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    icon,
    variant = 'ghost',
    size = 'md',
    shape = 'default',
    loading = false,
    hideTitle,
    asChild,
    className,
    type,
    onClick,
    children,
    ...props
  },
  ref,
) {
  const shared = {
    className: cx('st-button st-icon-button', className),
    'data-variant': variant,
    'data-size': size,
    'data-shape': shape === 'circle' ? 'circle' : undefined,
    'data-loading': loading ? '' : undefined,
    'aria-label': label,
    title: hideTitle ? undefined : label,
  };
  const content = loading ? (
    <Spinner size="sm" label={null} />
  ) : (
    <span className="st-icon-button__icon" aria-hidden="true">
      {icon}
    </span>
  );
  if (asChild && React.isValidElement(children)) {
    return (
      <Slot
        ref={ref as React.Ref<HTMLElement>}
        {...shared}
        {...(props as React.HTMLAttributes<HTMLElement>)}
      >
        {React.cloneElement(children, undefined, content)}
      </Slot>
    );
  }
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (loading) return e.preventDefault();
        onClick?.(e);
      }}
      {...shared}
      {...props}
    >
      {content}
    </button>
  );
});
