'use client';
import * as React from 'react';

/** Site code display. Highlighting stays dependency-free and never injects HTML. */
export function Code({
  code,
  language = 'tsx',
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <div className="site-code" data-language={language}>
      <div className="site-code__bar">
        <span className="site-code__lang">{title ?? language}</span>
        <button
          type="button"
          className="site-code__copy"
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <span className="st-sr-only" aria-live="polite">
          {copied ? 'Copied to clipboard' : ''}
        </span>
      </div>
      <pre className="site-code__pre" tabIndex={0} aria-label={`${title ?? language} code`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
