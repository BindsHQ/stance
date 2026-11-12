import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';
import type { IconName } from '../../icons/paths.js';
import { Button } from '../button/Button.js';

export type InterruptedReason = 'stopped' | 'error' | 'network' | 'limit';

export interface InterruptedStateLabels {
  /** Default title for `stopped`. Default "Response stopped". */
  stopped: string;
  /** Default title for `error`. Default "Something went wrong". */
  error: string;
  /** Default title for `network`. Default "Connection lost". */
  network: string;
  /** Default title for `limit`. Default "Response limit reached". */
  limit: string;
  /** The retry button. Default "Try again". */
  retry: string;
  /** The continue button. Default "Continue". */
  continue: string;
}

export interface InterruptedStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Why the response ended early. Default `stopped`. */
  reason?: InterruptedReason;
  /** Overrides the default title for the reason. */
  title?: React.ReactNode;
  /** A short explanation or next step. */
  description?: React.ReactNode;
  /** Shows a retry button and is called when it is pressed. */
  onRetry?: () => void;
  /** Shows a continue button and is called when it is pressed. */
  onContinue?: () => void;
  /** Translations for the default titles and buttons. */
  labels?: Partial<InterruptedStateLabels>;
}

const icons: Record<InterruptedReason, IconName> = {
  stopped: 'stop',
  error: 'alert-circle',
  network: 'alert-triangle',
  limit: 'info',
};

/**
 * Marks a response that was stopped or failed part way. Failures are an alert,
 * a stop or a limit is a polite status. Offers retry and continue.
 */
export const InterruptedState = React.forwardRef<HTMLDivElement, InterruptedStateProps>(
  function InterruptedState(
    {
      reason = 'stopped',
      title,
      description,
      onRetry,
      onContinue,
      labels: labelsProp,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const labels: InterruptedStateLabels = {
      stopped: 'Response stopped',
      error: 'Something went wrong',
      network: 'Connection lost',
      limit: 'Response limit reached',
      retry: 'Try again',
      continue: 'Continue',
      ...labelsProp,
    };
    const failure = reason === 'error' || reason === 'network';
    return (
      <div
        ref={ref}
        className={cx('st-interrupted-state', className)}
        data-reason={reason}
        {...props}
      >
        {/* Only the message is live, so the buttons are not read out with it. */}
        <div className="st-interrupted-state__message" role={failure ? 'alert' : 'status'}>
          <Icon name={icons[reason]} size={16} className="st-interrupted-state__icon" />
          <div className="st-interrupted-state__text">
            <span className="st-interrupted-state__title">{title ?? labels[reason]}</span>
            {description != null && (
              <span className="st-interrupted-state__description">{description}</span>
            )}
          </div>
        </div>
        {(onRetry || onContinue || children) && (
          <div className="st-interrupted-state__actions">
            {onContinue && (
              <Button variant="outline" size="sm" onClick={onContinue}>
                {labels.continue}
              </Button>
            )}
            {onRetry && (
              <Button
                variant={onContinue ? 'ghost' : 'outline'}
                size="sm"
                leadingIcon={<Icon name="refresh" />}
                onClick={onRetry}
              >
                {labels.retry}
              </Button>
            )}
            {children}
          </div>
        )}
      </div>
    );
  },
);
