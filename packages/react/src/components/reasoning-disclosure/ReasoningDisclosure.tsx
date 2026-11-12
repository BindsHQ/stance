'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../collapsible/Collapsible.js';
import { ShimmerText } from '../shimmer-text/ShimmerText.js';

export interface ReasoningDisclosureLabels {
  /** Summary while the assistant is reasoning. Default "Thinking". */
  thinking: string;
  /** Summary once done, given the duration in seconds. Default "Thought for 12 seconds". */
  thought: (seconds: number) => string;
  /** Summary once done when no duration is known. Default "Reasoning". */
  done: string;
}

export interface ReasoningDisclosureProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange'
> {
  /** Whether the assistant is still reasoning. Default `done`. */
  status?: 'thinking' | 'done';
  /** How long the reasoning took, in seconds. Used in the summary once done. */
  duration?: number;
  /** Controlled open state. */
  open?: boolean;
  /** Open on first render. Default: open while thinking, collapsed when done. */
  defaultOpen?: boolean;
  /** Called when the reader toggles it, and when it collapses as reasoning ends. */
  onOpenChange?: (open: boolean) => void;
  /** The reasoning text. */
  children?: React.ReactNode;
  /** Translations for the summary. */
  labels?: Partial<ReasoningDisclosureLabels>;
}

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
const defaultThought = (seconds: number) => {
  const total = Math.max(1, Math.round(seconds));
  if (total < 60) return `Thought for ${plural(total, 'second')}`;
  const rest = total % 60;
  const minutes = plural(Math.floor(total / 60), 'minute');
  return rest ? `Thought for ${minutes} ${plural(rest, 'second')}` : `Thought for ${minutes}`;
};

/**
 * A collapsible block for the assistant's reasoning. It is open while thinking and
 * collapses to a summary when done, unless the reader has already chosen otherwise.
 */
export const ReasoningDisclosure = React.forwardRef<HTMLDivElement, ReasoningDisclosureProps>(
  function ReasoningDisclosure(
    {
      status = 'done',
      duration,
      open: openProp,
      defaultOpen,
      onOpenChange,
      children,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: ReasoningDisclosureLabels = {
      thinking: 'Thinking',
      thought: defaultThought,
      done: 'Reasoning',
      ...labelsProp,
    };
    const thinking = status === 'thinking';
    const [open, setOpen] = useControllableState({
      value: openProp,
      defaultValue: defaultOpen ?? thinking,
      onChange: onOpenChange,
    });
    const summary = thinking
      ? labels.thinking
      : duration !== undefined
        ? labels.thought(duration)
        : labels.done;

    // A reader who toggled it while thinking keeps their choice when reasoning ends.
    const touched = React.useRef(false);
    const previous = React.useRef(status);
    const { announce, region } = useAnnouncer();
    const summaryRef = React.useRef(summary);
    React.useEffect(() => {
      summaryRef.current = summary;
    });
    React.useEffect(() => {
      if (previous.current === status) return;
      const finished = previous.current === 'thinking' && status === 'done';
      previous.current = status;
      if (!finished) {
        touched.current = false;
        return;
      }
      announce(summaryRef.current);
      if (!touched.current) setOpen(false);
    }, [status, announce, setOpen]);

    return (
      <Collapsible
        ref={ref}
        open={open}
        onOpenChange={(next) => {
          touched.current = true;
          setOpen(next);
        }}
        className={cx('st-reasoning-disclosure', className)}
        data-status={status}
        {...props}
      >
        <CollapsibleTrigger className="st-reasoning-disclosure__trigger">
          <Icon name="sparkle" size={14} className="st-reasoning-disclosure__icon" />
          {thinking ? (
            <ShimmerText className="st-reasoning-disclosure__summary">{summary}</ShimmerText>
          ) : (
            <span className="st-reasoning-disclosure__summary">{summary}</span>
          )}
          <Icon name="chevron-down" size={14} className="st-reasoning-disclosure__chevron" />
        </CollapsibleTrigger>
        <CollapsibleContent
          className="st-reasoning-disclosure__content"
          role="group"
          aria-label={summary}
        >
          {children}
        </CollapsibleContent>
        {region}
      </Collapsible>
    );
  },
);
