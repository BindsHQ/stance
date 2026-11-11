import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';

export type StatTrend = 'up' | 'down' | 'neutral';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** What is measured, e.g. "Active signatures". */
  label: React.ReactNode;
  /** The headline figure, pre-formatted. */
  value: React.ReactNode;
  /** Change since the comparison period, pre-formatted, e.g. "12%". */
  delta?: React.ReactNode;
  /** Direction of change. Default `neutral`. */
  trend?: StatTrend;
  /**
   * Whether the trend is good. Defaults to `up` = positive. Set `invert` for
   * metrics where down is good (e.g. failed deployments).
   */
  invert?: boolean;
  /** Comparison period, e.g. "from last month". Included in the accessible text. */
  comparison?: string;
  /** Optional icon shown beside the label. */
  icon?: React.ReactNode;
  /** Optional chart slot (e.g. a sparkline). Mark decorative charts aria-hidden. */
  chart?: React.ReactNode;
  /** Footer content such as a link to details. */
  footer?: React.ReactNode;
  /** Show placeholders while loading. */
  loading?: boolean;
}

const trendWord: Record<StatTrend, string> = { up: 'up', down: 'down', neutral: 'unchanged' };

/** A single key metric with its change over time. */
export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(function StatCard(
  {
    label,
    value,
    delta,
    trend = 'neutral',
    invert = false,
    comparison,
    icon,
    chart,
    footer,
    loading,
    className,
    ...props
  },
  ref,
) {
  const sentiment =
    trend === 'neutral' ? 'neutral' : (trend === 'up') !== invert ? 'positive' : 'negative';
  return (
    <div
      ref={ref}
      className={cx('st-stat-card', className)}
      aria-busy={loading || undefined}
      {...props}
    >
      <div className="st-stat-card__label">
        {icon != null && (
          <span className="st-stat-card__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </div>
      <div className="st-stat-card__row">
        <div className="st-stat-card__value">
          {loading ? <span className="st-stat-card__placeholder" aria-hidden="true" /> : value}
        </div>
        {chart != null && !loading && <div className="st-stat-card__chart">{chart}</div>}
      </div>
      {delta != null && !loading && (
        <p className="st-stat-card__delta" data-trend={trend} data-sentiment={sentiment}>
          <span className="st-stat-card__delta-badge" aria-hidden="true">
            {trend !== 'neutral' && (
              <Icon
                name={trend === 'up' ? 'arrow-up-right' : 'arrow-down'}
                size={12}
                strokeWidth={2.25}
              />
            )}
            {delta}
          </span>
          {comparison && (
            <span className="st-stat-card__comparison" aria-hidden="true">
              {comparison}
            </span>
          )}
          <span className="st-sr-only">
            {trendWord[trend]}
            {trend !== 'neutral' ? ' ' : ''}
            {trend !== 'neutral' ? delta : ''}
            {comparison ? ` ${comparison}` : ''}
          </span>
        </p>
      )}
      {footer != null && <div className="st-stat-card__footer">{footer}</div>}
    </div>
  );
});
