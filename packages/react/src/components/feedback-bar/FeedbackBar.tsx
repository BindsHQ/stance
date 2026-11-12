'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { Button } from '../button/Button.js';
import { Chip } from '../chip/Chip.js';
import { IconButton } from '../icon-button/IconButton.js';
import { Textarea } from '../textarea/Textarea.js';

export type FeedbackValue = 'up' | 'down' | null;

export interface FeedbackReason {
  /** Stable id reported in `onSubmit`. */
  id: string;
  /** The words on the chip. */
  label: string;
}

export interface FeedbackSubmission {
  /** The rating the feedback belongs to. */
  value: 'up' | 'down';
  /** Ids of the chosen reasons. */
  reasons: string[];
  /** The comment, trimmed. Empty when none was written. */
  comment: string;
}

export interface FeedbackBarLabels {
  /** Names the group of rating buttons. */
  group: string;
  /** The good response button. */
  up: string;
  /** The bad response button. */
  down: string;
  /** Heading of the reasons after a good rating. */
  reasonsUp: string;
  /** Heading of the reasons after a bad rating. */
  reasonsDown: string;
  /** Label of the comment field. */
  comment: string;
  /** Placeholder of the comment field. */
  commentPlaceholder: string;
  /** The submit button. */
  submit: string;
  /** The button that sends the rating without details. */
  skip: string;
  /** Shown and announced after feedback is sent. */
  thanks: string;
}

export interface FeedbackBarProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onSubmit' | 'defaultValue' | 'onChange'
> {
  /** Controlled rating. `null` means not rated. */
  value?: FeedbackValue;
  /** Initial rating when uncontrolled. Default `null`. */
  defaultValue?: FeedbackValue;
  /** Called when the rating changes. Choosing the pressed rating again clears it. */
  onValueChange?: (value: FeedbackValue) => void;
  /** Reasons offered after a rating. */
  reasons?: FeedbackReason[];
  /** Called once per rating with the reasons and comment. Skipping sends empty details. */
  onSubmit?: (feedback: FeedbackSubmission) => void;
  /** Offer a comment field after a rating. Default true. */
  allowComment?: boolean;
  /** Which ratings ask for details. Default `both`. */
  detailFor?: 'both' | 'up' | 'down';
  /** A short visible question before the buttons, such as "Was this helpful?". */
  prompt?: React.ReactNode;
  /** Button size. Default `sm`. */
  size?: 'xs' | 'sm' | 'md';
  /** Disable rating. */
  disabled?: boolean;
  /** Translations for the built in strings. */
  labels?: Partial<FeedbackBarLabels>;
}

const defaultLabels: FeedbackBarLabels = {
  group: 'Rate this response',
  up: 'Good response',
  down: 'Bad response',
  reasonsUp: 'What did you like?',
  reasonsDown: 'What went wrong?',
  comment: 'Anything else? (optional)',
  commentPlaceholder: 'Add a comment',
  submit: 'Send feedback',
  skip: 'Skip',
  thanks: 'Thanks for your feedback.',
};

/**
 * Thumbs up or down, followed by optional reasons and a comment, then a thank you.
 * The state is exposed as `data-state`: idle, rated, detail or submitted.
 */
export const FeedbackBar = React.forwardRef<HTMLDivElement, FeedbackBarProps>(function FeedbackBar(
  {
    value: valueProp,
    defaultValue = null,
    onValueChange,
    reasons,
    onSubmit,
    allowComment = true,
    detailFor = 'both',
    prompt,
    size = 'sm',
    disabled = false,
    labels: labelsProp,
    className,
    ...props
  },
  ref,
) {
  const labels = { ...defaultLabels, ...labelsProp };
  const [value, setValue] = useControllableState<FeedbackValue>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const [phase, setPhase] = React.useState<'idle' | 'detail' | 'submitted'>('idle');
  const [chosen, setChosen] = React.useState<string[]>([]);
  const [comment, setComment] = React.useState('');
  const { announce, region } = useAnnouncer();
  const upRef = React.useRef<HTMLButtonElement>(null);
  const downRef = React.useRef<HTMLButtonElement>(null);
  const id = React.useId();
  const hasReasons = (reasons?.length ?? 0) > 0;

  // A rating cleared from outside returns the bar to idle.
  React.useEffect(() => {
    if (value === null) setPhase('idle');
  }, [value]);

  const finish = (rating: 'up' | 'down', details: { reasons: string[]; comment: string }) => {
    onSubmit?.({ value: rating, ...details });
    setPhase('submitted');
    announce(labels.thanks);
  };

  const rate = (next: 'up' | 'down') => {
    setChosen([]);
    setComment('');
    if (value === next) {
      setValue(null);
      setPhase('idle');
      return;
    }
    setValue(next);
    const wantsDetail =
      (hasReasons || allowComment) && (detailFor === 'both' || detailFor === next);
    if (wantsDetail) setPhase('detail');
    else finish(next, { reasons: [], comment: '' });
  };

  const send = (withDetails: boolean) => {
    if (!value) return;
    // The form is about to go; keep focus on the rating it belongs to.
    (value === 'up' ? upRef : downRef).current?.focus();
    finish(
      value,
      withDetails ? { reasons: chosen, comment: comment.trim() } : { reasons: [], comment: '' },
    );
  };

  const state =
    value === null
      ? 'idle'
      : phase === 'detail'
        ? 'detail'
        : phase === 'submitted'
          ? 'submitted'
          : 'rated';
  const headingId = `${id}-heading`;
  const commentId = `${id}-comment`;

  return (
    <div
      ref={ref}
      className={cx('st-feedback-bar', className)}
      data-state={state}
      data-disabled={disabled ? '' : undefined}
      {...props}
    >
      <div className="st-feedback-bar__row">
        {prompt != null && <span className="st-feedback-bar__prompt">{prompt}</span>}
        <div role="group" aria-label={labels.group} className="st-feedback-bar__ratings">
          <IconButton
            ref={upRef}
            label={labels.up}
            icon={<Icon name="thumbs-up" />}
            size={size}
            aria-pressed={value === 'up'}
            data-state={value === 'up' ? 'on' : 'off'}
            className="st-feedback-bar__rating"
            disabled={disabled}
            onClick={() => rate('up')}
          />
          <IconButton
            ref={downRef}
            label={labels.down}
            icon={<Icon name="thumbs-down" />}
            size={size}
            aria-pressed={value === 'down'}
            data-state={value === 'down' ? 'on' : 'off'}
            className="st-feedback-bar__rating"
            disabled={disabled}
            onClick={() => rate('down')}
          />
        </div>
        {state === 'submitted' && <span className="st-feedback-bar__thanks">{labels.thanks}</span>}
      </div>
      {state === 'detail' && (
        <form
          className="st-feedback-bar__detail"
          aria-labelledby={headingId}
          onSubmit={(event) => {
            event.preventDefault();
            send(true);
          }}
        >
          <div role="group" aria-labelledby={headingId} className="st-feedback-bar__reasons-group">
            <span id={headingId} className="st-feedback-bar__heading">
              {value === 'up' ? labels.reasonsUp : labels.reasonsDown}
            </span>
            {hasReasons && (
              <div className="st-feedback-bar__reasons">
                {reasons!.map((reason) => (
                  <Chip
                    key={reason.id}
                    size="sm"
                    selected={chosen.includes(reason.id)}
                    onSelectedChange={(selected) =>
                      setChosen((prev) =>
                        selected ? [...prev, reason.id] : prev.filter((r) => r !== reason.id),
                      )
                    }
                  >
                    {reason.label}
                  </Chip>
                ))}
              </div>
            )}
          </div>
          {allowComment && (
            <div className="st-feedback-bar__comment">
              <label htmlFor={commentId} className="st-feedback-bar__comment-label">
                {labels.comment}
              </label>
              <Textarea
                id={commentId}
                rows={2}
                autoResize
                maxRows={6}
                placeholder={labels.commentPlaceholder}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </div>
          )}
          <div className="st-feedback-bar__actions">
            <Button type="submit" size="sm">
              {labels.submit}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => send(false)}>
              {labels.skip}
            </Button>
          </div>
        </form>
      )}
      {region}
    </div>
  );
});
