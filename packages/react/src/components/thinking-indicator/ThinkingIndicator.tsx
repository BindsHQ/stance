import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';
import { ShimmerText } from '../shimmer-text/ShimmerText.js';

export interface ThinkingIndicatorProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** What the assistant is doing. Default "Thinking". */
  label?: React.ReactNode;
  /** The motion: three dots, a breathing sparkle, or a light sweep over the label. Default `dots`. */
  variant?: 'dots' | 'pulse' | 'shimmer';
  /** Seconds since the work began. Shown after the label and not read out on every change. */
  elapsed?: number;
  /** Default `md`. */
  size?: 'sm' | 'md';
  /** Hide the label visually. It stays available to assistive technology. Default false. */
  hideLabel?: boolean;
  /** Formats `elapsed` for display. Default "8s", then "1m 05s". */
  formatElapsed?: (seconds: number) => string;
}

const defaultFormatElapsed = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  if (total < 60) return `${total}s`;
  return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, '0')}s`;
};

/**
 * Shows that the assistant is working before any text arrives. A polite status:
 * the label is announced once, the elapsed time is not.
 */
export const ThinkingIndicator = React.forwardRef<HTMLDivElement, ThinkingIndicatorProps>(
  function ThinkingIndicator(
    {
      label = 'Thinking',
      variant = 'dots',
      elapsed,
      size = 'md',
      hideLabel = false,
      formatElapsed = defaultFormatElapsed,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        role="status"
        className={cx('st-thinking-indicator', className)}
        data-variant={variant}
        data-size={size}
        {...props}
      >
        <span className="st-thinking-indicator__mark" aria-hidden="true">
          {variant === 'dots' ? (
            <>
              <span className="st-thinking-indicator__dot" />
              <span className="st-thinking-indicator__dot" />
              <span className="st-thinking-indicator__dot" />
            </>
          ) : (
            <Icon name="sparkle" size={size === 'sm' ? 14 : 16} />
          )}
        </span>
        {variant === 'shimmer' && !hideLabel ? (
          <ShimmerText className="st-thinking-indicator__label">{label}</ShimmerText>
        ) : (
          <span className={hideLabel ? 'st-sr-only' : 'st-thinking-indicator__label'}>{label}</span>
        )}
        {elapsed !== undefined && (
          // Hidden from assistive technology so a ticking clock is never read out.
          <span className="st-thinking-indicator__elapsed" aria-hidden="true">
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>
    );
  },
);
