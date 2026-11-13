'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';
import type { IconName } from '../../icons/paths.js';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../collapsible/Collapsible.js';
import { ConfidenceBadge, type ConfidenceLevel } from '../confidence-badge/ConfidenceBadge.js';
import { IconButton } from '../icon-button/IconButton.js';

export type InsightCalloutTone = 'neutral' | 'positive' | 'attention';

export interface InsightCalloutLabels {
  /** The word above the title for each tone. Defaults "Insight", "Good news", "Needs attention". */
  tone: Record<InsightCalloutTone, string>;
  /** The control that opens the evidence. Default "Show evidence". */
  showEvidence: string;
  /** The control that closes the evidence. Default "Hide evidence". */
  hideEvidence: string;
  /** Accessible name of the dismiss button. Default "Dismiss". */
  dismiss: string;
}

export interface InsightCalloutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The finding in one line. */
  title: React.ReactNode;
  /** A sentence or two that explains the finding. */
  children?: React.ReactNode;
  /** What the finding is based on: figures, a small chart or a list of records. */
  evidence?: React.ReactNode;
  /** Show the evidence on first render. Default false. */
  defaultEvidenceOpen?: boolean;
  /** Controlled open state of the evidence. */
  evidenceOpen?: boolean;
  /** Called when the reader opens or closes the evidence. */
  onEvidenceOpenChange?: (open: boolean) => void;
  /** How sure the system is. Shown in words. */
  confidence?: ConfidenceLevel;
  /** One suggested action, usually a Button. */
  action?: React.ReactNode;
  /** Called when the reader dismisses the callout. Shows a dismiss button. */
  onDismiss?: () => void;
  /** The kind of finding. Each tone has its own word and icon. Default `neutral`. */
  tone?: InsightCalloutTone;
  /** Replaces the tone icon. */
  icon?: React.ReactNode;
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Translations for the built in strings. */
  labels?: Partial<Omit<InsightCalloutLabels, 'tone'>> & {
    tone?: Partial<Record<InsightCalloutTone, string>>;
  };
}

const toneIcons: Record<InsightCalloutTone, IconName> = {
  neutral: 'sparkle',
  positive: 'check-circle',
  attention: 'alert-triangle',
};

const defaultToneLabels: Record<InsightCalloutTone, string> = {
  neutral: 'Insight',
  positive: 'Good news',
  attention: 'Needs attention',
};

/**
 * A highlighted finding the system noticed in your data, with the evidence behind it
 * and one suggested action. The tone is stated in words and by icon shape, never by colour alone.
 */
export const InsightCallout = React.forwardRef<HTMLDivElement, InsightCalloutProps>(
  function InsightCallout(
    {
      title,
      children,
      evidence,
      defaultEvidenceOpen = false,
      evidenceOpen,
      onEvidenceOpenChange,
      confidence,
      action,
      onDismiss,
      tone = 'neutral',
      icon,
      headingLevel = 3,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: InsightCalloutLabels = {
      showEvidence: 'Show evidence',
      hideEvidence: 'Hide evidence',
      dismiss: 'Dismiss',
      ...labelsProp,
      tone: { ...defaultToneLabels, ...labelsProp?.tone },
    };
    const titleId = React.useId();
    const Heading = `h${headingLevel}` as 'h3';
    const [open, setOpen] = React.useState(defaultEvidenceOpen);
    const isOpen = evidenceOpen ?? open;

    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={titleId}
        className={cx('st-insight-callout', className)}
        data-tone={tone}
        {...props}
      >
        <span className="st-insight-callout__icon" aria-hidden="true">
          {icon ?? <Icon name={toneIcons[tone]} size={18} />}
        </span>
        <div className="st-insight-callout__main">
          <div className="st-insight-callout__header">
            <Heading id={titleId} className="st-insight-callout__title">
              <span className="st-insight-callout__tone">{labels.tone[tone]}</span>
              <span className="st-sr-only">: </span>
              <span className="st-insight-callout__title-text">{title}</span>
            </Heading>
            {confidence !== undefined && <ConfidenceBadge level={confidence} size="sm" />}
          </div>
          {children != null && <div className="st-insight-callout__body">{children}</div>}
          {evidence != null && (
            <Collapsible
              open={isOpen}
              onOpenChange={(next) => {
                setOpen(next);
                onEvidenceOpenChange?.(next);
              }}
              className="st-insight-callout__evidence"
            >
              <CollapsibleTrigger className="st-insight-callout__evidence-trigger">
                <span>{isOpen ? labels.hideEvidence : labels.showEvidence}</span>
                <Icon name="chevron-down" size={14} className="st-insight-callout__chevron" />
              </CollapsibleTrigger>
              <CollapsibleContent className="st-insight-callout__evidence-content">
                {evidence}
              </CollapsibleContent>
            </Collapsible>
          )}
          {action != null && <div className="st-insight-callout__action">{action}</div>}
        </div>
        {onDismiss && (
          <IconButton
            className="st-insight-callout__dismiss"
            label={labels.dismiss}
            icon={<Icon name="x" />}
            size="xs"
            onClick={onDismiss}
          />
        )}
      </div>
    );
  },
);
