import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { CopyButton } from '../copy-button/CopyButton.js';

export interface CopyableCodeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The code to show and copy. */
  value: string;
  /** Text shown before the code that is not copied, e.g. `$`. */
  prompt?: string;
  /** Accessible label for the copy button. Default "Copy to clipboard". */
  copyLabel?: string;
  /** Default `md`. */
  size?: 'sm' | 'md';
}

/** A single line of code with a copy button — install commands, API keys, IDs. */
export const CopyableCode = React.forwardRef<HTMLDivElement, CopyableCodeProps>(
  function CopyableCode(
    { value, prompt, copyLabel = 'Copy to clipboard', size = 'md', className, ...props },
    ref,
  ) {
    return (
      <div ref={ref} className={cx('st-copyable-code', className)} data-size={size} {...props}>
        <code className="st-copyable-code__value">
          {prompt && (
            <span className="st-copyable-code__prompt" aria-hidden="true">
              {prompt}{' '}
            </span>
          )}
          {value}
        </code>
        <CopyButton value={value} label={copyLabel} size={size === 'sm' ? 'xs' : 'sm'} />
      </div>
    );
  },
);
