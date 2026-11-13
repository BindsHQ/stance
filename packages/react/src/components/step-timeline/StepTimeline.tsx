'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import {
  defaultStepStatusLabels,
  formatStepDuration,
  StepStatusIcon,
  type AgentStepStatus,
  type StepStatusLabels,
} from '../../internal/step-status.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';

/** One step of an agent run. */
export interface StepTimelineStep {
  id: string;
  /** What the step does, in a few words. */
  title: string;
  /** One line of supporting text. */
  description?: React.ReactNode;
  /** Where the step is. */
  status: AgentStepStatus;
  /** How long the step took, in seconds. */
  duration?: number;
  /** Detail shown when the step is expanded, such as tool calls or output. */
  content?: React.ReactNode;
}

export interface StepTimelineLabels {
  /** Accessible name of the list. Default "Steps". */
  list: string;
  /** The words for each status. */
  status: StepStatusLabels;
  /** Formats a duration, given seconds. Default "1.2 s". */
  duration: (seconds: number) => string;
}

/** Translations for StepTimeline. Status words can be overridden one by one. */
export type StepTimelineLabelOverrides = Partial<Omit<StepTimelineLabels, 'status'>> & {
  status?: Partial<StepStatusLabels>;
};

export interface StepTimelineProps extends Omit<
  React.OlHTMLAttributes<HTMLOListElement>,
  'children'
> {
  /** The steps, in the order they run. */
  steps: StepTimelineStep[];
  /** Controlled ids of the expanded steps. */
  expandedIds?: string[];
  /** Ids expanded on first render. Default none. */
  defaultExpandedIds?: string[];
  /** Called with the next ids when a step is expanded or collapsed. */
  onExpandedChange?: (ids: string[]) => void;
  /** Tighter rows without descriptions. The status stays available as text. */
  compact?: boolean;
  /** Translations for the built in strings. */
  labels?: StepTimelineLabelOverrides;
}

const none: string[] = [];

/**
 * The ordered steps of an agent run. The running step is marked as current and any
 * step with content can be expanded.
 */
export const StepTimeline = React.forwardRef<HTMLOListElement, StepTimelineProps>(
  function StepTimeline(
    {
      steps,
      expandedIds: expandedProp,
      defaultExpandedIds = none,
      onExpandedChange,
      compact = false,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: StepTimelineLabels = {
      list: 'Steps',
      duration: formatStepDuration,
      ...labelsProp,
      status: { ...defaultStepStatusLabels, ...labelsProp?.status },
    };
    const [expanded, setExpanded] = useControllableState({
      value: expandedProp,
      defaultValue: defaultExpandedIds,
      onChange: onExpandedChange,
    });
    const baseId = React.useId();
    const toggle = (id: string) =>
      setExpanded(expanded.includes(id) ? expanded.filter((x) => x !== id) : [...expanded, id]);

    return (
      <ol
        ref={ref}
        aria-label={labels.list}
        className={cx('st-step-timeline', className)}
        data-compact={compact ? '' : undefined}
        {...props}
      >
        {steps.map((step, index) => {
          const open = step.content != null && expanded.includes(step.id);
          const contentId = `${baseId}-${index}`;
          const statusText = labels.status[step.status];
          const head = (
            <>
              <span className="st-step-timeline__title">{step.title}</span>
              <span className="st-step-timeline__meta">
                <span className={compact ? 'st-sr-only' : 'st-step-timeline__status'}>
                  {compact ? `, ${statusText}` : statusText}
                </span>
                {step.duration !== undefined && (
                  <span className="st-step-timeline__duration">
                    {labels.duration(step.duration)}
                  </span>
                )}
              </span>
            </>
          );
          return (
            <li
              key={step.id}
              className="st-step-timeline__step"
              data-status={step.status}
              data-state={open ? 'open' : 'closed'}
              aria-current={step.status === 'running' ? 'step' : undefined}
            >
              <span className="st-step-timeline__marker">
                <StepStatusIcon status={step.status} />
              </span>
              <div className="st-step-timeline__body">
                {step.content != null ? (
                  <button
                    type="button"
                    className="st-step-timeline__head"
                    aria-expanded={open}
                    aria-controls={contentId}
                    onClick={() => toggle(step.id)}
                  >
                    {head}
                    <Icon name="chevron-down" size={14} className="st-step-timeline__chevron" />
                  </button>
                ) : (
                  <div className="st-step-timeline__head">{head}</div>
                )}
                {!compact && step.description != null && (
                  <div className="st-step-timeline__description">{step.description}</div>
                )}
                {open && (
                  <div id={contentId} className="st-step-timeline__content">
                    {step.content}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    );
  },
);
