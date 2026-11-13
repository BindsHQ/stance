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
import { useAnnouncer } from '../../internal/use-announcer.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { CodeBlock } from '../code-block/CodeBlock.js';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../collapsible/Collapsible.js';

export interface ToolCallCardLabels {
  /** The words for each status. */
  status: StepStatusLabels;
  /** Builds the accessible name. Default "Search the web, complete". */
  name: (title: string, status: string) => string;
  /** Heading of the input section. Default "Input". */
  input: string;
  /** Heading of the output section. Default "Output". */
  output: string;
  /** Heading of the error section. Default "Error". */
  error: string;
  /** Formats the duration, given seconds. Default "1.2 s". */
  duration: (seconds: number) => string;
}

/** Translations for ToolCallCard. Status words can be overridden one by one. */
export type ToolCallCardLabelOverrides = Partial<Omit<ToolCallCardLabels, 'status'>> & {
  status?: Partial<StepStatusLabels>;
};

export interface ToolCallCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title' | 'onChange'
> {
  /** The tool identifier, for example `web_search`. Shown in monospace. */
  name: string;
  /** A readable title, for example "Search the web". Defaults to the name. */
  title?: string;
  /** Icon before the title. Defaults to the status icon. */
  icon?: React.ReactNode;
  /** Where the call is. Default `complete`. */
  status?: AgentStepStatus;
  /** What the tool was called with. A string renders as a code block. */
  input?: React.ReactNode;
  /** What came back. A string renders as a code block. */
  output?: React.ReactNode;
  /** What went wrong, shown when the call failed. */
  error?: React.ReactNode;
  /** How long the call took, in seconds. */
  duration?: number;
  /** Controlled open state. */
  open?: boolean;
  /** Open on first render. Default false. */
  defaultOpen?: boolean;
  /** Called when the reader opens or closes the card. */
  onOpenChange?: (open: boolean) => void;
  /** Actions at the end of the header, such as retry. They sit outside the disclosure button. */
  actions?: React.ReactNode;
  /** Language used to highlight a string input. Default `json`. */
  inputLanguage?: string;
  /** Language used to highlight a string output. Default `json`. */
  outputLanguage?: string;
  /** Translations for the built in strings. */
  labels?: ToolCallCardLabelOverrides;
}

/**
 * One tool call by the assistant: what it ran, with what input, and what came back.
 * The header is a disclosure whose name includes the status.
 */
export const ToolCallCard = React.forwardRef<HTMLDivElement, ToolCallCardProps>(
  function ToolCallCard(
    {
      name,
      title,
      icon,
      status = 'complete',
      input,
      output,
      error,
      duration,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      actions,
      inputLanguage = 'json',
      outputLanguage = 'json',
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: ToolCallCardLabels = {
      name: (t, s) => `${t}, ${s.toLowerCase()}`,
      input: 'Input',
      output: 'Output',
      error: 'Error',
      duration: formatStepDuration,
      ...labelsProp,
      status: { ...defaultStepStatusLabels, ...labelsProp?.status },
    };
    const [open, setOpen] = useControllableState({
      value: openProp,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });
    const heading = title ?? name;
    const statusText = labels.status[status];
    const accessibleName = labels.name(heading, statusText);
    const hasContent = input != null || output != null || error != null;

    const { announce, region } = useAnnouncer();
    const previous = React.useRef(status);
    const nameRef = React.useRef(accessibleName);
    React.useEffect(() => {
      nameRef.current = accessibleName;
    });
    React.useEffect(() => {
      if (previous.current === status) return;
      previous.current = status;
      announce(nameRef.current);
    }, [status, announce]);

    const summary = (
      <>
        <span className="st-tool-call-card__icon">
          {icon ?? <StepStatusIcon status={status} />}
        </span>
        <span className="st-tool-call-card__heading">
          <span className="st-tool-call-card__title">{heading}</span>
          {title !== undefined && title !== name && (
            <code className="st-tool-call-card__name">{name}</code>
          )}
        </span>
        <span className="st-tool-call-card__meta">
          <span className="st-tool-call-card__status">{statusText}</span>
          {duration !== undefined && (
            <span className="st-tool-call-card__duration">{labels.duration(duration)}</span>
          )}
        </span>
      </>
    );
    const section = (label: string, content: React.ReactNode, language: string) => (
      <div className="st-tool-call-card__section">
        <div className="st-tool-call-card__section-label">{label}</div>
        {typeof content === 'string' ? (
          <CodeBlock code={content} language={language} label={`${heading}: ${label}`} />
        ) : (
          <div className="st-tool-call-card__section-body">{content}</div>
        )}
      </div>
    );

    return (
      <Collapsible
        ref={ref}
        open={hasContent ? open : false}
        onOpenChange={setOpen}
        className={cx('st-tool-call-card', className)}
        data-status={status}
        {...props}
      >
        <div className="st-tool-call-card__header">
          {hasContent ? (
            /* Named by its visible text (title, tool, status, time), so speech and voice control match what is shown (WCAG 2.5.3). */
            <CollapsibleTrigger className="st-tool-call-card__trigger">
              {summary}
              <Icon name="chevron-down" size={14} className="st-tool-call-card__chevron" />
            </CollapsibleTrigger>
          ) : (
            <div className="st-tool-call-card__trigger" role="group" aria-label={accessibleName}>
              {summary}
            </div>
          )}
          {actions != null && <div className="st-tool-call-card__actions">{actions}</div>}
        </div>
        <CollapsibleContent
          className="st-tool-call-card__content"
          role="group"
          aria-label={heading}
        >
          {input != null && section(labels.input, input, inputLanguage)}
          {output != null && section(labels.output, output, outputLanguage)}
          {error != null && (
            <div className="st-tool-call-card__section" data-error="">
              <div className="st-tool-call-card__section-label">{labels.error}</div>
              <div className="st-tool-call-card__section-body">{error}</div>
            </div>
          )}
        </CollapsibleContent>
        {region}
      </Collapsible>
    );
  },
);
