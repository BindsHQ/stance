'use client';
import * as React from 'react';

const managers = {
  npm: 'npm install @bindshq/stance-tokens @bindshq/stance-react',
  pnpm: 'pnpm add @bindshq/stance-tokens @bindshq/stance-react',
  yarn: 'yarn add @bindshq/stance-tokens @bindshq/stance-react',
} as const;
type Manager = keyof typeof managers;

export function InstallSnippet() {
  const [pm, setPm] = React.useState<Manager>('npm');
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="install">
      <div className="install__tabs" role="group" aria-label="Package manager">
        {(Object.keys(managers) as Manager[]).map((m) => (
          <button key={m} type="button" aria-pressed={pm === m} onClick={() => setPm(m)}>
            {m}
          </button>
        ))}
      </div>
      <div className="install__line">
        <code>
          <span aria-hidden="true" className="install__prompt">
            ${' '}
          </span>
          {managers[pm]}
        </code>
        <button
          type="button"
          className="install__copy"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(managers[pm]);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            } catch {
              /* ignore */
            }
          }}
          aria-label={copied ? 'Copied' : 'Copy install command'}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <span className="st-sr-only" aria-live="polite">
          {copied ? 'Copied to clipboard' : ''}
        </span>
      </div>
    </div>
  );
}
