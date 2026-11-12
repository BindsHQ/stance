'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';
import type { IconName } from '../../icons/paths.js';
import { Tooltip } from '../tooltip/Tooltip.js';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

/** The words for each level. */
export type ConfidenceBadgeLabels = Record<ConfidenceLevel, string>;

export interface ConfidenceBadgeProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  'children'
> {
  /** How sure the system is. */
  level: ConfidenceLevel;
  /** Overrides the words for this level, for example "Verified against 3 sources". */
  label?: React.ReactNode;
  /** A short explanation. Shown in a tooltip on hover and focus, and read by screen readers. */
  description?: string;
  /** Show the level icon. Each level has its own shape. Default true. */
  showIcon?: boolean;
  /** Default `md`. */
  size?: 'sm' | 'md';
  /** Translations for the level words. */
  labels?: Partial<ConfidenceBadgeLabels>;
}

const defaultLabels: ConfidenceBadgeLabels = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
  unknown: 'Confidence unknown',
};

// A different shape per level, so the level never depends on colour.
const icons: Record<ConfidenceLevel, IconName> = {
  high: 'check-circle',
  medium: 'circle',
  low: 'alert-triangle',
  unknown: 'help-circle',
};

/**
 * States how sure the system is in words, with an icon whose shape differs per level.
 * It uses the neutral ink scale, never colour alone.
 */
export const ConfidenceBadge = React.forwardRef<HTMLSpanElement, ConfidenceBadgeProps>(
  function ConfidenceBadge(
    {
      level,
      label,
      description,
      showIcon = true,
      size = 'md',
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const text = label ?? { ...defaultLabels, ...labelsProp }[level];
    const badge = (
      <span
        ref={ref}
        className={cx('st-confidence-badge', className)}
        data-level={level}
        data-size={size}
        // Focusable only when there is a description to reveal.
        tabIndex={description ? 0 : undefined}
        {...props}
      >
        {showIcon && (
          <Icon
            name={icons[level]}
            size={size === 'sm' ? 12 : 14}
            className="st-confidence-badge__icon"
          />
        )}
        <span className="st-confidence-badge__label">{text}</span>
      </span>
    );
    if (!description) return badge;
    return <Tooltip content={description}>{badge}</Tooltip>;
  },
);
