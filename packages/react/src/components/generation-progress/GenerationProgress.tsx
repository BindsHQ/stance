'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { Icon } from '../../icons/Icon.js';
import { Button } from '../button/Button.js';
import { Progress } from '../progress/Progress.js';

export interface GenerationProgressLabels {
  /** The cancel button. Default "Cancel". */
  cancel: string;
  /** Formats the value (0 to 1) for display and assistive technology. Default "40%". */
  value: (value: number) => string;
}

export interface GenerationProgressProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** Progress from 0 to 1. Leave it out while the amount of work is unknown. */
  value?: number | null;
  /** What is being made. Default "Generating". */
  label?: React.ReactNode;
  /** The current step, for example "Rendering pages". Announced politely when it changes. */
  stage?: string;
  /** Shows a cancel button and is called when it is pressed. */
  onCancel?: () => void;
  /** Translations for the cancel button and the value text. */
  labels?: Partial<GenerationProgressLabels>;
}

/**
 * Progress for longer generations such as images or documents. Determinate when
 * `value` is given, indeterminate otherwise, with an optional stage and cancel.
 */
export const GenerationProgress = React.forwardRef<HTMLDivElement, GenerationProgressProps>(
  function GenerationProgress(
    {
      value = null,
      label = 'Generating',
      stage,
      onCancel,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: GenerationProgressLabels = {
      cancel: 'Cancel',
      value: (v) => `${Math.round(v * 100)}%`,
      ...labelsProp,
    };
    const id = React.useId();
    const labelId = `${id}-label`;
    const indeterminate = value === null || Number.isNaN(value);
    const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), 1);
    const text = indeterminate ? undefined : labels.value(clamped);
    const valueText = [text, stage].filter(Boolean).join(', ') || undefined;

    // Stage changes are spoken once each. The first stage is part of the initial content.
    const { announce, region } = useAnnouncer();
    const previousStage = React.useRef(stage);
    React.useEffect(() => {
      if (previousStage.current === stage) return;
      previousStage.current = stage;
      if (stage) announce(stage);
    }, [stage, announce]);

    return (
      <div
        ref={ref}
        className={cx('st-generation-progress', className)}
        data-state={indeterminate ? 'indeterminate' : clamped >= 1 ? 'complete' : 'loading'}
        {...props}
      >
        <div className="st-generation-progress__header">
          <Icon name="sparkle" size={16} className="st-generation-progress__icon" />
          <span id={labelId} className="st-generation-progress__label">
            {label}
          </span>
          {text && (
            <span className="st-generation-progress__value" aria-hidden="true">
              {text}
            </span>
          )}
          {onCancel && (
            <Button
              variant="ghost"
              size="xs"
              className="st-generation-progress__cancel"
              onClick={onCancel}
            >
              {labels.cancel}
            </Button>
          )}
        </div>
        <Progress
          size="sm"
          value={indeterminate ? null : clamped * 100}
          aria-labelledby={labelId}
          aria-valuetext={valueText}
        />
        {stage && <span className="st-generation-progress__stage">{stage}</span>}
        {region}
      </div>
    );
  },
);
