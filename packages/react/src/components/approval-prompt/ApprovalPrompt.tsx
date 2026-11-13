'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { defaultRiskLabels, type RiskLabels, type RiskLevel } from '../../internal/step-status.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { Icon } from '../../icons/Icon.js';
import type { IconName } from '../../icons/paths.js';
import { Badge, type BadgeTone } from '../badge/Badge.js';
import { Button } from '../button/Button.js';

/** Why the request was denied: the deny button, the Escape key, or the countdown ran out. */
export type ApprovalPromptDenyReason = 'deny' | 'escape' | 'timeout';

export interface ApprovalPromptLabels {
  /** The allow button. Default "Allow". */
  allow: string;
  /** The allow always button. Default "Always allow". */
  allowAlways: string;
  /** The deny button. Default "Deny". */
  deny: string;
  /** The words for each risk level. */
  risk: RiskLabels;
  /** The countdown text, given the seconds left. Default "Denies automatically in 12 seconds". */
  countdown: (seconds: number) => string;
  /** The button that stops the countdown. Default "Keep waiting". */
  keepWaiting: string;
  /** Hidden hint on the allow buttons when the risk is high. */
  highRiskHint: string;
}

/** Translations for ApprovalPrompt. Risk words can be overridden one by one. */
export type ApprovalPromptLabelOverrides = Partial<Omit<ApprovalPromptLabels, 'risk'>> & {
  risk?: Partial<RiskLabels>;
};

export interface ApprovalPromptProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title' | 'children'
> {
  /** What the agent wants to do, for example "Send the email to 240 customers". */
  title: React.ReactNode;
  /** The effect of allowing it, in plain words. */
  description?: React.ReactNode;
  /** How much is at stake. Default `low`. */
  risk?: RiskLevel;
  /** The exact action, for example the command or the diff. */
  details?: React.ReactNode;
  /** Called when the person allows the action once. */
  onAllow?: () => void;
  /** Called when the person allows this kind of action from now on. Shows the button. */
  onAllowAlways?: () => void;
  /** Called when the person denies, presses Escape, or the countdown runs out. */
  onDeny?: (reason: ApprovalPromptDenyReason) => void;
  /** The decision is being applied. Disables the buttons and stops the countdown. */
  busy?: boolean;
  /** Seconds until the request is denied automatically. It never allows automatically. */
  countdown?: number;
  /** Move focus to the deny button when the prompt appears. Default false. */
  autoFocus?: boolean;
  /** Translations for the built in strings. */
  labels?: ApprovalPromptLabelOverrides;
}

const riskIcon: Record<RiskLevel, IconName> = {
  low: 'shield',
  medium: 'alert-circle',
  high: 'alert-triangle',
};
const riskTone: Record<RiskLevel, BadgeTone> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

/**
 * Asks for permission before an agent acts. Deny is the safe default: it comes first,
 * Escape denies, and an optional countdown only ever denies. For high risk, Enter
 * never allows; the person has to press Space or click.
 */
export const ApprovalPrompt = React.forwardRef<HTMLDivElement, ApprovalPromptProps>(
  function ApprovalPrompt(
    {
      title,
      description,
      risk = 'low',
      details,
      onAllow,
      onAllowAlways,
      onDeny,
      busy = false,
      countdown,
      autoFocus = false,
      labels: labelsProp,
      className,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const labels: ApprovalPromptLabels = {
      allow: 'Allow',
      allowAlways: 'Always allow',
      deny: 'Deny',
      countdown: (s) => `Denies automatically in ${s} ${s === 1 ? 'second' : 'seconds'}`,
      keepWaiting: 'Keep waiting',
      highRiskHint: 'High risk. Press Space or click to allow. Enter does not allow.',
      ...labelsProp,
      risk: { ...defaultRiskLabels, ...labelsProp?.risk },
    };
    const id = React.useId();
    const titleId = `${id}-title`;
    const descriptionId = `${id}-description`;
    const countdownId = `${id}-countdown`;
    const hintId = `${id}-hint`;
    const rootRef = React.useRef<HTMLDivElement>(null);
    const composedRef = useComposedRefs(ref, rootRef);
    const denyRef = React.useRef<HTMLButtonElement>(null);
    const onDenyRef = React.useRef(onDeny);
    onDenyRef.current = onDeny;
    const { announce, region } = useAnnouncer();

    // Seconds left, or null when there is no countdown or the person stopped it.
    const [remaining, setRemaining] = React.useState<number | null>(
      countdown !== undefined ? Math.max(0, Math.ceil(countdown)) : null,
    );
    const fired = React.useRef(false);
    React.useEffect(() => {
      fired.current = false;
      setRemaining(countdown !== undefined ? Math.max(0, Math.ceil(countdown)) : null);
    }, [countdown]);
    const ticking = remaining !== null && remaining > 0 && !busy;
    React.useEffect(() => {
      if (!ticking) return;
      const timer = window.setInterval(() => {
        setRemaining((value) => (value === null ? null : Math.max(0, value - 1)));
      }, 1000);
      return () => window.clearInterval(timer);
    }, [ticking]);
    const countdownLabel = labels.countdown;
    React.useEffect(() => {
      if (remaining === null || busy) return;
      if (remaining === 0 && !fired.current) {
        fired.current = true;
        onDenyRef.current?.('timeout');
      } else if (remaining === 10 && countdown !== undefined && countdown > 10) {
        announce(countdownLabel(10));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remaining, busy]);

    React.useEffect(() => {
      if (autoFocus) denyRef.current?.focus();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const high = risk === 'high';
    // For high risk Enter never allows. Space and a click still do.
    const blockEnter = high
      ? (event: React.KeyboardEvent) => {
          if (event.key === 'Enter') event.preventDefault();
        }
      : undefined;
    const describedBy =
      [description != null ? descriptionId : null, remaining !== null ? countdownId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    return (
      <div
        ref={composedRef}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        aria-busy={busy || undefined}
        className={cx('st-approval-prompt', className)}
        data-risk={risk}
        data-busy={busy ? '' : undefined}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== 'Escape' || busy) return;
          event.preventDefault();
          event.stopPropagation();
          onDeny?.('escape');
        }}
        {...props}
      >
        <div className="st-approval-prompt__header">
          <div id={titleId} className="st-approval-prompt__title">
            {title}
          </div>
          <Badge tone={riskTone[risk]} size="sm" className="st-approval-prompt__risk">
            <Icon name={riskIcon[risk]} size={12} />
            {labels.risk[risk]}
          </Badge>
        </div>
        {description != null && (
          <div id={descriptionId} className="st-approval-prompt__description">
            {description}
          </div>
        )}
        {details != null && <div className="st-approval-prompt__details">{details}</div>}
        {remaining !== null && (
          <div className="st-approval-prompt__countdown">
            <Icon name="clock" size={14} />
            <span id={countdownId}>{labels.countdown(remaining)}</span>
            {remaining > 0 && (
              <Button size="xs" variant="link" disabled={busy} onClick={() => setRemaining(null)}>
                {labels.keepWaiting}
              </Button>
            )}
          </div>
        )}
        <div className="st-approval-prompt__actions">
          <Button
            ref={denyRef}
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onDeny?.('deny')}
          >
            {labels.deny}
          </Button>
          {onAllowAlways && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              aria-describedby={high ? hintId : undefined}
              onKeyDown={blockEnter}
              onClick={onAllowAlways}
            >
              {labels.allowAlways}
            </Button>
          )}
          <Button
            size="sm"
            variant={high ? 'danger' : 'primary'}
            loading={busy}
            aria-describedby={high ? hintId : undefined}
            onKeyDown={blockEnter}
            onClick={onAllow}
          >
            {labels.allow}
          </Button>
        </div>
        {high && (
          <span id={hintId} hidden>
            {labels.highRiskHint}
          </span>
        )}
        {region}
      </div>
    );
  },
);
