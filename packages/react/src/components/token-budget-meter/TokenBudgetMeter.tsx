'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { Icon } from '../../icons/Icon.js';

export type TokenBudgetState = 'ok' | 'warning' | 'over';

export interface TokenBudgetMeterLabels {
  /** Shown and announced once usage reaches `warnAt`. Default "Close to the limit". */
  warning: string;
  /** Shown and announced once usage passes the limit. Default "Over the limit". */
  over: string;
}

export interface TokenBudgetMeterProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** How much of the budget is used, in tokens or any other unit. */
  used: number;
  /** The size of the budget, in the same unit. */
  limit: number;
  /** Share of the limit, from 0 to 1, at which the warning starts. Default 0.8. */
  warnAt?: number;
  /** Formats the value for display and for assistive technology. Default "1,200 of 8,000 tokens". */
  format?: (used: number, limit: number) => string;
  /** Accessible name of the meter. Default "Context used". */
  label?: string;
  /** A small ring, a bar with the value, or the value as text. Default `ring`. */
  variant?: 'ring' | 'bar' | 'text';
  /** Show the formatted value beside the ring. The bar and text variants always show it. Default false. */
  showValue?: boolean;
  /** Translations for the built in strings. */
  labels?: Partial<TokenBudgetMeterLabels>;
}

const defaultLabels: TokenBudgetMeterLabels = {
  warning: 'Close to the limit',
  over: 'Over the limit',
};

// A fixed locale keeps server and client output identical. Pass `format` to localise.
const numberFormat = new Intl.NumberFormat('en-US');
const defaultFormat = (used: number, limit: number) =>
  `${numberFormat.format(used)} of ${numberFormat.format(limit)} tokens`;

const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A compact meter of how much of the context or message limit is used, with a warning
 * near the limit that is stated in words and announced once.
 */
export const TokenBudgetMeter = React.forwardRef<HTMLDivElement, TokenBudgetMeterProps>(
  function TokenBudgetMeter(
    {
      used,
      limit,
      warnAt = 0.8,
      format = defaultFormat,
      label = 'Context used',
      variant = 'ring',
      showValue = false,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const { announce, region } = useAnnouncer();
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 0;
    const safeUsed = Number.isFinite(used) ? Math.max(used, 0) : 0;
    const ratio = safeLimit > 0 ? safeUsed / safeLimit : 0;
    const fraction = Math.min(ratio, 1);
    const state: TokenBudgetState = ratio > 1 ? 'over' : ratio >= warnAt ? 'warning' : 'ok';
    const text = format(safeUsed, safeLimit);
    const note = state === 'over' ? labels.over : state === 'warning' ? labels.warning : undefined;

    // Announce when usage crosses into the warning or goes over. Dropping back re-arms it.
    const previous = React.useRef(state);
    const message = React.useRef('');
    message.current = note ? `${note}. ${text}` : '';
    React.useEffect(() => {
      const before = previous.current;
      previous.current = state;
      if (before === state || state === 'ok') return;
      if (before === 'over' && state === 'warning') return;
      announce(message.current);
    }, [state, announce]);

    const valueVisible = variant !== 'ring' || showValue;
    return (
      <div
        ref={ref}
        className={cx('st-token-budget-meter', className)}
        data-variant={variant}
        data-state={state}
        {...props}
      >
        <div
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={safeLimit}
          aria-valuenow={Math.min(safeUsed, safeLimit)}
          aria-valuetext={note ? `${text}. ${note}` : text}
          className="st-token-budget-meter__meter"
        >
          {variant === 'ring' && (
            <svg
              className="st-token-budget-meter__ring"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <circle className="st-token-budget-meter__track" cx="12" cy="12" r={RADIUS} />
              <circle
                className="st-token-budget-meter__fill"
                cx="12"
                cy="12"
                r={RADIUS}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
              />
            </svg>
          )}
          {variant === 'bar' && (
            <span className="st-token-budget-meter__bar" aria-hidden="true">
              <span
                className="st-token-budget-meter__bar-fill"
                style={{ inlineSize: `${fraction * 100}%` }}
              />
            </span>
          )}
          {(valueVisible || note) && (
            <span className="st-token-budget-meter__text" aria-hidden="true">
              {valueVisible && <span className="st-token-budget-meter__value">{text}</span>}
              {note && (
                <span className="st-token-budget-meter__note" title={note}>
                  <Icon name="alert-triangle" size={14} />
                  {variant !== 'ring' && (
                    <span className="st-token-budget-meter__note-text">{note}</span>
                  )}
                </span>
              )}
            </span>
          )}
        </div>
        {region}
      </div>
    );
  },
);
