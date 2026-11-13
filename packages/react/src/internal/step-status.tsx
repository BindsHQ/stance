import * as React from 'react';
import { Icon } from '../icons/Icon.js';
import type { IconName } from '../icons/paths.js';
import { cx } from './cx.js';

/**
 * The shared step status of the agent components contract (`StepStatus` in the spec).
 * `waiting` means the step needs a person before it can continue.
 */
export type AgentStepStatus = 'pending' | 'running' | 'complete' | 'error' | 'skipped' | 'waiting';

/** How much is at stake when an agent acts. */
export type RiskLevel = 'low' | 'medium' | 'high';

/** The words for each step status. */
export type StepStatusLabels = Record<AgentStepStatus, string>;

export const defaultStepStatusLabels: StepStatusLabels = {
  pending: 'Pending',
  running: 'Running',
  complete: 'Complete',
  error: 'Failed',
  skipped: 'Skipped',
  waiting: 'Waiting for you',
};

/** The words for each risk level. */
export type RiskLabels = Record<RiskLevel, string>;

export const defaultRiskLabels: RiskLabels = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
};

const icons: Record<Exclude<AgentStepStatus, 'running'>, IconName> = {
  pending: 'circle',
  complete: 'check-circle',
  error: 'x-circle',
  skipped: 'minus',
  waiting: 'clock',
};

export interface StepStatusIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: AgentStepStatus;
  /** Pixel size. Default 16. */
  size?: number;
}

/**
 * A decorative icon whose shape differs per step status. Always pair it with the status
 * in words: it is hidden from assistive technology.
 */
export function StepStatusIcon({
  status,
  size = 16,
  className,
  style,
  ...props
}: StepStatusIconProps) {
  return (
    <span
      className={cx('st-step-status', className)}
      data-status={status}
      aria-hidden="true"
      style={{ inlineSize: size, blockSize: size, ...style }}
      {...props}
    >
      {status === 'running' ? (
        <span className="st-step-status__ring" />
      ) : (
        <Icon name={icons[status]} size={size} />
      )}
    </span>
  );
}

/** Formats a duration in seconds as short text: 0.4 s, 12 s, 2 min 5 s. */
export function formatStepDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  if (seconds < 10) return `${Math.round(seconds * 10) / 10} s`;
  const total = Math.round(seconds);
  if (total < 60) return `${total} s`;
  const rest = total % 60;
  return rest ? `${Math.floor(total / 60)} min ${rest} s` : `${Math.floor(total / 60)} min`;
}
