'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import {
  defaultStepStatusLabels,
  StepStatusIcon,
  type AgentStepStatus,
  type StepStatusLabels,
} from '../../internal/step-status.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { Icon } from '../../icons/Icon.js';
import { Button } from '../button/Button.js';
import { CodeBlock } from '../code-block/CodeBlock.js';
import { CopyButton } from '../copy-button/CopyButton.js';

export interface CodeSuggestionLabels {
  /** Accessible name of the whole block when there is no file name. Default "Suggested code". */
  label: string;
  /** Copy button. Default "Copy". */
  copy: string;
  /** Shown after copying. Default "Copied". */
  copied: string;
  /** Apply button. Default "Apply". */
  apply: string;
  /** Apply button once the code is in place. Default "Applied". */
  applied: string;
  /** Announced when the code is applied, given the file name. */
  appliedAnnouncement: (filename: string | undefined) => string;
  /** Run button. Default "Run". */
  run: string;
  /** Run button once there is a result. Default "Run again". */
  rerun: string;
  /** Heading of the result. Default "Result". */
  output: string;
  /** Shown while the code is still arriving. Default "Writing code". */
  streaming: string;
  /** The words for each run status. */
  runStatus: StepStatusLabels;
}

export interface CodeSuggestionProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'onCopy'
> {
  /** The generated code. Rendered as text, never as HTML. */
  code: string;
  /** Language for highlighting, shown beside the file name. */
  language?: string;
  /** The file the code belongs to. */
  filename?: string;
  /** Called after the reader copies the code, with whether it worked. */
  onCopy?: (success: boolean) => void;
  /** Called when the reader applies the code. Shows the apply action. */
  onApply?: () => void;
  /** Called when the reader runs the code. Shows the run action. */
  onRun?: () => void;
  /** The state of the last run. Omit before the first run. */
  runStatus?: AgentStepStatus;
  /** What the run printed or returned. A string renders as monospaced text. */
  runOutput?: React.ReactNode;
  /** Whether the code is already in place. Default false. */
  applied?: boolean;
  /** Wrap long lines instead of scrolling. Default false. */
  wrap?: boolean;
  /** Show line numbers. Default false. */
  showLineNumbers?: boolean;
  /** True while the code is still arriving. Apply and run wait until it ends. Default false. */
  streaming?: boolean;
  /** Max height of the code before it scrolls, as a CSS length. */
  maxHeight?: string;
  /** Translations for the built in strings. Nested groups can be partial too. */
  labels?: Partial<Omit<CodeSuggestionLabels, 'runStatus'>> & {
    runStatus?: Partial<StepStatusLabels>;
  };
}

const defaultLabels: CodeSuggestionLabels = {
  label: 'Suggested code',
  copy: 'Copy',
  copied: 'Copied',
  apply: 'Apply',
  applied: 'Applied',
  appliedAnnouncement: (filename) => (filename ? `Applied to ${filename}` : 'Applied'),
  run: 'Run',
  rerun: 'Run again',
  output: 'Result',
  streaming: 'Writing code',
  runStatus: defaultStepStatusLabels,
};

/**
 * A generated code block with its language and file name, actions to copy, apply and
 * run it, and the result of a run. Builds on CodeBlock.
 */
export const CodeSuggestion = React.forwardRef<HTMLDivElement, CodeSuggestionProps>(
  function CodeSuggestion(
    {
      code,
      language,
      filename,
      onCopy,
      onApply,
      onRun,
      runStatus,
      runOutput,
      applied = false,
      wrap = false,
      showLineNumbers = false,
      streaming = false,
      maxHeight,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: CodeSuggestionLabels = {
      ...defaultLabels,
      ...labelsProp,
      runStatus: { ...defaultLabels.runStatus, ...labelsProp?.runStatus },
    };
    const { announce, region } = useAnnouncer();
    const wasApplied = React.useRef(applied);
    const announcement = labels.appliedAnnouncement(filename);
    const announcementRef = React.useRef(announcement);
    announcementRef.current = announcement;
    React.useEffect(() => {
      if (applied && !wasApplied.current) announce(announcementRef.current);
      wasApplied.current = applied;
    }, [applied, announce]);

    const running = runStatus === 'running';
    const hasResult = runStatus !== undefined && runStatus !== 'pending';
    const name = filename ?? labels.label;

    return (
      <div
        ref={ref}
        role="group"
        aria-label={name}
        aria-busy={streaming || undefined}
        className={cx('st-code-suggestion', className)}
        data-streaming={streaming ? '' : undefined}
        data-applied={applied ? '' : undefined}
        data-run-status={runStatus}
        {...props}
      >
        <div className="st-code-suggestion__header">
          <span className="st-code-suggestion__title">
            {filename && <span className="st-code-suggestion__filename">{filename}</span>}
            {language && <span className="st-code-suggestion__language">{language}</span>}
            {streaming && <span className="st-code-suggestion__streaming">{labels.streaming}</span>}
          </span>
          <span className="st-code-suggestion__actions">
            <CopyButton
              value={code}
              label={labels.copy}
              copiedLabel={labels.copied}
              size="xs"
              showLabel
              {...(onCopy ? { onCopy } : null)}
            />
            {onRun && (
              <Button
                size="xs"
                variant="outline"
                leadingIcon={<Icon name="terminal" size={14} />}
                loading={running}
                disabled={streaming}
                onClick={onRun}
              >
                {hasResult && !running ? labels.rerun : labels.run}
              </Button>
            )}
            {onApply && (
              <Button
                size="xs"
                variant="primary"
                leadingIcon={applied ? <Icon name="check" size={14} /> : undefined}
                disabled={streaming || applied}
                onClick={onApply}
              >
                {applied ? labels.applied : labels.apply}
              </Button>
            )}
          </span>
        </div>
        <CodeBlock
          className="st-code-suggestion__code"
          code={code}
          copyable={false}
          wrap={wrap}
          showLineNumbers={showLineNumbers}
          label={name}
          {...(language ? { language } : null)}
          {...(maxHeight ? { maxHeight } : null)}
        />
        <div className="st-code-suggestion__result" role="status" aria-live="polite">
          {hasResult && runStatus && (
            <>
              <div className="st-code-suggestion__result-header">
                <StepStatusIcon status={runStatus} size={14} />
                <span className="st-code-suggestion__result-title">{labels.output}</span>
                <span className="st-code-suggestion__result-status">
                  {labels.runStatus[runStatus]}
                </span>
              </div>
              {runOutput != null &&
                runOutput !== '' &&
                (typeof runOutput === 'string' ? (
                  <pre className="st-code-suggestion__output">{runOutput}</pre>
                ) : (
                  <div className="st-code-suggestion__output">{runOutput}</div>
                ))}
            </>
          )}
        </div>
        {region}
      </div>
    );
  },
);
