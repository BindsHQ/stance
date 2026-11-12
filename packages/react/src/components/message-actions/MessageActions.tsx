'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useRovingFocus } from '../../internal/roving-focus.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { copyToClipboard } from '../../internal/use-clipboard.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { IconButton } from '../icon-button/IconButton.js';

export type MessageRating = 'up' | 'down' | null;

export interface MessageActionsLabels {
  /** Accessible name of the toolbar. */
  toolbar: string;
  copy: string;
  /** Shown on the copy button and announced after a successful copy. */
  copied: string;
  /** Announced when copying fails. */
  copyFailed: string;
  retry: string;
  edit: string;
  /** The thumbs up toggle. */
  rateUp: string;
  /** The thumbs down toggle. */
  rateDown: string;
}

const defaultLabels: MessageActionsLabels = {
  toolbar: 'Message actions',
  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'Copy failed',
  retry: 'Try again',
  edit: 'Edit',
  rateUp: 'Good response',
  rateDown: 'Bad response',
};

export interface MessageActionsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onCopy'> {
  /** Called when Copy is pressed, after `copyValue` (if any) reached the clipboard. Shows the copy button. */
  onCopy?: () => void;
  /** Text the copy button writes to the clipboard, or a function returning it. Shows the copy button. */
  copyValue?: string | (() => string);
  /** Called when Try again is pressed. Shows the retry button. */
  onRetry?: () => void;
  /** Called when Edit is pressed. Shows the edit button. */
  onEdit?: () => void;
  /** Called with the new rating. Pressing the active rating clears it with `null`. Shows the rating buttons. */
  onRate?: (value: MessageRating) => void;
  /** Controlled rating. Pass `null` for no rating. */
  rating?: MessageRating;
  /** Initial rating when uncontrolled. Default `null`. */
  defaultRating?: MessageRating;
  /** `hover` reveals the row on hover and on keyboard focus. It stays visible on touch screens. Default `always`. */
  visibility?: 'always' | 'hover';
  /** Button size. Default `sm`. */
  size?: 'xs' | 'sm';
  /** Translations for the toolbar, buttons and announcements. */
  labels?: Partial<MessageActionsLabels>;
  /** Extra actions, placed after the built in ones. Buttons join the arrow key order. */
  children?: React.ReactNode;
}

/**
 * The row of actions under a message: copy, retry, edit, good response, bad response.
 * A toolbar with one tab stop; arrow keys move between the buttons.
 */
export const MessageActions = React.forwardRef<HTMLDivElement, MessageActionsProps>(
  function MessageActions(
    {
      onCopy,
      copyValue,
      onRetry,
      onEdit,
      onRate,
      rating: ratingProp,
      defaultRating = null,
      visibility = 'always',
      size = 'sm',
      labels: labelsProp,
      children,
      className,
      onKeyDown,
      ...props
    },
    forwardedRef,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const ref = React.useRef<HTMLDivElement>(null);
    const composed = useComposedRefs(forwardedRef, ref);
    const roving = useRovingFocus(ref, {
      itemSelector: 'button, a[href], [data-toolbar-item]',
    });
    const { announce, region } = useAnnouncer();
    const [rating, setRating] = useControllableState<MessageRating>({
      value: ratingProp,
      defaultValue: defaultRating,
      onChange: onRate,
    });
    const [copied, setCopied] = React.useState(false);
    const timer = React.useRef<number | undefined>(undefined);
    React.useEffect(() => () => window.clearTimeout(timer.current), []);

    const copy = async () => {
      let ok = true;
      if (copyValue !== undefined) {
        ok = await copyToClipboard(typeof copyValue === 'function' ? copyValue() : copyValue);
      }
      if (!ok) {
        announce(labels.copyFailed);
        return;
      }
      onCopy?.();
      setCopied(true);
      announce(labels.copied);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    };

    const showCopy = onCopy !== undefined || copyValue !== undefined;
    const showRating = onRate !== undefined || ratingProp !== undefined;

    return (
      <div
        ref={composed}
        role="toolbar"
        aria-label={labels.toolbar}
        className={cx('st-message-actions', className)}
        data-visibility={visibility}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented) roving.onKeyDown(event);
        }}
        {...props}
      >
        {showCopy && (
          <IconButton
            size={size}
            label={copied ? labels.copied : labels.copy}
            icon={<Icon name={copied ? 'check' : 'copy'} />}
            data-copied={copied ? '' : undefined}
            onClick={copy}
          />
        )}
        {onRetry && (
          <IconButton
            size={size}
            label={labels.retry}
            icon={<Icon name="refresh" />}
            onClick={() => onRetry()}
          />
        )}
        {onEdit && (
          <IconButton
            size={size}
            label={labels.edit}
            icon={<Icon name="pencil" />}
            onClick={() => onEdit()}
          />
        )}
        {showRating && (
          <>
            <IconButton
              size={size}
              label={labels.rateUp}
              icon={<Icon name="thumbs-up" />}
              aria-pressed={rating === 'up'}
              data-pressed={rating === 'up' ? '' : undefined}
              onClick={() => setRating(rating === 'up' ? null : 'up')}
            />
            <IconButton
              size={size}
              label={labels.rateDown}
              icon={<Icon name="thumbs-down" />}
              aria-pressed={rating === 'down'}
              data-pressed={rating === 'down' ? '' : undefined}
              onClick={() => setRating(rating === 'down' ? null : 'down')}
            />
          </>
        )}
        {children}
        {region}
      </div>
    );
  },
);
