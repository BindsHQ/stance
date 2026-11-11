'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { toneIcons, type StatusTone } from '../alert/Alert.js';

export type BannerTone = StatusTone | 'brand';

export interface BannerProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** `brand` is the inverse ivory/indigo announcement bar. Default `brand`. */
  tone?: BannerTone;
  /** Optional leading icon; `false` hides the tone icon. Brand banners have none by default. */
  icon?: React.ReactNode | false;
  /** A link or button after the message. */
  action?: React.ReactNode;
  /** Show a dismiss button. */
  dismissible?: boolean;
  /** Controlled visibility. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name for the region. Default "Announcement". */
  label?: string;
  dismissLabel?: string;
}

/** A full-width, page-level message such as maintenance notices or plan limits. */
export const Banner = React.forwardRef<HTMLElement, BannerProps>(function Banner(
  {
    tone = 'brand',
    icon,
    action,
    dismissible = false,
    open: openProp,
    defaultOpen = true,
    onOpenChange,
    label = 'Announcement',
    dismissLabel = 'Dismiss announcement',
    className,
    children,
    ...props
  },
  ref,
) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  if (!open) return null;
  const iconNode =
    icon === false
      ? null
      : (icon ?? (tone === 'brand' ? null : <Icon name={toneIcons[tone]} size={18} />));
  return (
    <section
      ref={ref}
      aria-label={label}
      className={cx('st-banner', className)}
      data-tone={tone}
      {...props}
    >
      <div className="st-banner__inner">
        {iconNode && (
          <span className="st-banner__icon" aria-hidden="true">
            {iconNode}
          </span>
        )}
        <div className="st-banner__message">{children}</div>
        {action != null && <div className="st-banner__action">{action}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          className="st-banner__dismiss"
          aria-label={dismissLabel}
          onClick={() => setOpen(false)}
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </section>
  );
});
