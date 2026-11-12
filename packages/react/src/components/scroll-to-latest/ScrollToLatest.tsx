'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { usePrefersReducedMotion } from '../../internal/use-reduced-motion.js';
import { Icon } from '../../icons/Icon.js';
import { ThreadContext } from '../thread/Thread.js';

export interface ScrollToLatestProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /**
   * Show the button. Inside a Thread it defaults to whether the reader has scrolled
   * away from the newest message; elsewhere it defaults to true.
   */
  visible?: boolean;
  /** Called on press. Inside a Thread the button also scrolls to the newest message. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Number of messages that arrived while the reader was away. Shown as a count. */
  unreadCount?: number;
  /** Accessible name and tooltip. Default "Scroll to latest". */
  label?: string;
  /** Describes the unread count in the accessible name. Default "3 new messages". */
  unreadLabel?: (count: number) => string;
  /** Show the label as text beside the arrow. Default false. */
  showLabel?: boolean;
}

const defaultUnreadLabel = (count: number) =>
  count === 1 ? '1 new message' : `${count} new messages`;

/**
 * A floating button that appears when the reader has scrolled away from the newest
 * message. Place it in the `scrollToLatest` slot of a Thread and it wires itself up.
 */
export const ScrollToLatest = React.forwardRef<HTMLButtonElement, ScrollToLatestProps>(
  function ScrollToLatest(
    {
      visible: visibleProp,
      onClick,
      unreadCount = 0,
      label = 'Scroll to latest',
      unreadLabel = defaultUnreadLabel,
      showLabel = false,
      className,
      type,
      ...props
    },
    ref,
  ) {
    const thread = React.useContext(ThreadContext);
    const reducedMotion = usePrefersReducedMotion();
    const visible = visibleProp ?? (thread ? !thread.atBottom : true);
    const hasUnread = unreadCount > 0;
    const name = hasUnread ? `${label}, ${unreadLabel(unreadCount)}` : label;
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        className={cx('st-scroll-to-latest', className)}
        hidden={!visible}
        data-unread={hasUnread ? '' : undefined}
        aria-label={name}
        title={showLabel ? undefined : label}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          thread?.scrollToLatest(reducedMotion ? 'auto' : 'smooth');
        }}
        {...props}
      >
        <Icon name="arrow-down" size={16} />
        {showLabel && <span className="st-scroll-to-latest__label">{label}</span>}
        {hasUnread && (
          <span className="st-scroll-to-latest__count" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  },
);
