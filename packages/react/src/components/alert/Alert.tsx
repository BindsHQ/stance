import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';
import type { IconName } from '../../icons/paths.js';

export type StatusTone = 'info' | 'success' | 'warning' | 'danger';

export const toneIcons: Record<StatusTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  danger: 'alert-circle',
};

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Meaning of the message. Default `info`. */
  tone?: StatusTone;
  /** Short heading. */
  title?: React.ReactNode;
  /** Replace the tone icon, or pass `false` to hide it. */
  icon?: React.ReactNode | false;
  /** Buttons or links rendered under the message. */
  actions?: React.ReactNode;
  /** Shows a dismiss button that calls this handler. */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. Default "Dismiss". */
  dismissLabel?: string;
}

/**
 * An inline message about the state of a page or form section.
 * Warnings and errors use role="alert" (announced immediately); others use role="status".
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    tone = 'info',
    title,
    icon,
    actions,
    onDismiss,
    dismissLabel = 'Dismiss',
    className,
    children,
    role,
    ...props
  },
  ref,
) {
  const urgent = tone === 'danger' || tone === 'warning';
  return (
    <div
      ref={ref}
      role={role ?? (urgent ? 'alert' : 'status')}
      className={cx('st-alert', className)}
      data-tone={tone}
      {...props}
    >
      {icon !== false && (
        <span className="st-alert__icon" aria-hidden="true">
          {icon ?? <Icon name={toneIcons[tone]} size={18} />}
        </span>
      )}
      <div className="st-alert__content">
        {title != null && <p className="st-alert__title">{title}</p>}
        {children != null && <div className="st-alert__description">{children}</div>}
        {actions != null && <div className="st-alert__actions">{actions}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="st-alert__dismiss"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
});
