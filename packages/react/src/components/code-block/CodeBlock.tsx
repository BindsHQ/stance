'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { CopyButton } from '../copy-button/CopyButton.js';
import { tokenize, toLines } from './highlight.js';

export interface CodeBlockProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
> {
  /** The source code. Rendered as text, never as HTML. */
  code: string;
  /** Language for light highlighting: ts, tsx, js, jsx, css, bash, json. Unknown languages render plain. */
  language?: string;
  /** Optional title, e.g. a file name. */
  title?: React.ReactNode;
  /** Show line numbers. Default false. */
  showLineNumbers?: boolean;
  /** Show a copy button. Default true. */
  copyable?: boolean;
  /** 1-based line numbers to emphasise. */
  highlightLines?: number[];
  /** Wrap long lines instead of scrolling. Default false. */
  wrap?: boolean;
  /** Max height before the block scrolls (CSS length). */
  maxHeight?: string;
  /** Accessible label for the scrollable region. Defaults to the title or "Code sample". */
  label?: string;
}

/** A multi-line code sample with optional title, line numbers, highlighting and a copy button. */
export const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  {
    code,
    language,
    title,
    showLineNumbers = false,
    copyable = true,
    highlightLines,
    wrap = false,
    maxHeight,
    label,
    className,
    ...props
  },
  ref,
) {
  const trimmed = code.replace(/\n+$/, '');
  const lines = React.useMemo(() => toLines(tokenize(trimmed, language)), [trimmed, language]);
  const highlighted = new Set(highlightLines);
  const regionLabel = label ?? (typeof title === 'string' ? title : 'Code sample');
  return (
    <div
      ref={ref}
      className={cx('st-code-block', className)}
      data-wrap={wrap ? '' : undefined}
      {...props}
    >
      {(title || language || copyable) && (
        <div className="st-code-block__header">
          <span className="st-code-block__title">{title}</span>
          <span className="st-code-block__meta">
            {language && <span className="st-code-block__language">{language}</span>}
            {copyable && <CopyButton value={trimmed} label="Copy code" size="xs" />}
          </span>
        </div>
      )}
      <pre
        className="st-code-block__pre"
        tabIndex={0}
        role="region"
        aria-label={regionLabel}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <code className="st-code-block__code" data-language={language}>
          {lines.map((line, i) => (
            <span
              key={i}
              className="st-code-block__line"
              data-highlighted={highlighted.has(i + 1) ? '' : undefined}
            >
              {showLineNumbers && (
                <span className="st-code-block__line-number" aria-hidden="true">
                  {i + 1}
                </span>
              )}
              <span className="st-code-block__line-content">
                {line.length === 0
                  ? '\n'
                  : line.map((t, j) => (
                      <span key={j} data-token={t.type === 'plain' ? undefined : t.type}>
                        {t.value}
                      </span>
                    ))}
              </span>
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
});
