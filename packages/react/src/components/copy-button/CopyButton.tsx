'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useClipboard } from '../../internal/use-clipboard.js';
import { Icon } from '../../icons/Icon.js';
import { Button, type ButtonProps } from '../button/Button.js';

export interface CopyButtonProps extends Omit<
  ButtonProps,
  'value' | 'children' | 'onCopy' | 'asChild'
> {
  /** Text to copy, or a function returning it at click time. */
  value: string | (() => string);
  /** Visible or accessible label. Default "Copy". */
  label?: string;
  /** Label shown and announced after copying. Default "Copied". */
  copiedLabel?: string;
  /** Show the label next to the icon. Default false (icon only, label used as aria-label). */
  showLabel?: boolean;
  /** Called after a copy attempt with its result. */
  onCopy?: (success: boolean) => void;
  /** How long the copied state lasts, in ms. Default 2000. */
  timeout?: number;
}

/** Copies text to the clipboard and confirms it visually and to screen readers. */
export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton(
  {
    value,
    label = 'Copy',
    copiedLabel = 'Copied',
    showLabel = false,
    onCopy,
    timeout = 2000,
    variant = 'ghost',
    size = 'sm',
    className,
    onClick,
    ...props
  },
  ref,
) {
  const { copy, copied, error } = useClipboard(timeout);
  const current = copied ? copiedLabel : label;
  return (
    <>
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cx('st-copy-button', className)}
        data-icon-only={showLabel ? undefined : ''}
        data-copied={copied ? '' : undefined}
        aria-label={showLabel ? undefined : current}
        title={showLabel ? undefined : current}
        leadingIcon={showLabel ? <Icon name={copied ? 'check' : 'copy'} /> : undefined}
        onClick={async (event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          const ok = await copy(typeof value === 'function' ? value() : value);
          onCopy?.(ok);
        }}
        {...props}
      >
        {showLabel ? current : <Icon name={copied ? 'check' : 'copy'} />}
      </Button>
      <span className="st-sr-only" role="status" aria-live="polite">
        {copied ? copiedLabel : error ? 'Copy failed' : ''}
      </span>
    </>
  );
});
