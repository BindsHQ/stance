'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { formatRelativeTime } from '../../internal/relative-time.js';
import { Icon } from '../../icons/Icon.js';

export interface NotificationProps extends Omit<React.HTMLAttributes<HTMLLIElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** When it happened. Dates render as relative time inside a <time> element. */
  time?: Date | string;
  /** Avatar, icon or logo shown at the start. */
  media?: React.ReactNode;
  /** Unread notifications show a dot and are announced as unread. */
  unread?: boolean;
  /** Makes the title a link to the related item. */
  href?: string;
  /** Shows a "Mark as read" action while unread. */
  onMarkRead?: () => void;
  /** Extra actions, e.g. Accept / Decline buttons. */
  actions?: React.ReactNode;
  /** Label for the mark-as-read button. Default "Mark as read". */
  markReadLabel?: string;
}

/** One notification. Place inside NotificationList or NotificationCenter. */
export const Notification = React.forwardRef<HTMLLIElement, NotificationProps>(
  function Notification(
    {
      title,
      description,
      time,
      media,
      unread = false,
      href,
      onMarkRead,
      actions,
      markReadLabel = 'Mark as read',
      className,
      ...props
    },
    ref,
  ) {
    const date = time instanceof Date ? time : undefined;
    return (
      <li
        ref={ref}
        className={cx('st-notification', className)}
        data-unread={unread ? '' : undefined}
        {...props}
      >
        {media != null && <span className="st-notification__media">{media}</span>}
        <div className="st-notification__body">
          <p className="st-notification__title">
            {unread && <span className="st-sr-only">Unread: </span>}
            {href ? (
              <a href={href} className="st-notification__link">
                {title}
              </a>
            ) : (
              title
            )}
          </p>
          {description != null && <div className="st-notification__description">{description}</div>}
          {time != null && (
            <time
              className="st-notification__time"
              dateTime={date ? date.toISOString() : undefined}
            >
              {date ? formatRelativeTime(date) : (time as string)}
            </time>
          )}
          {actions != null && <div className="st-notification__actions">{actions}</div>}
        </div>
        <div className="st-notification__aside">
          {unread && <span className="st-notification__dot" aria-hidden="true" />}
          {unread && onMarkRead && (
            <button
              type="button"
              className="st-notification__mark"
              aria-label={markReadLabel}
              title={markReadLabel}
              onClick={onMarkRead}
            >
              <Icon name="check" size={14} />
            </button>
          )}
        </div>
      </li>
    );
  },
);

export interface NotificationListProps extends React.HTMLAttributes<HTMLUListElement> {
  /** Accessible name. Default "Notifications". */
  label?: string;
}

/** A list of notifications. */
export const NotificationList = React.forwardRef<HTMLUListElement, NotificationListProps>(
  function NotificationList({ label = 'Notifications', className, ...props }, ref) {
    return (
      <ul
        ref={ref}
        aria-label={props['aria-labelledby'] ? undefined : label}
        className={cx('st-notification-list', className)}
        {...props}
      />
    );
  },
);

export interface NotificationCenterProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  /** Heading. Default "Notifications". */
  title?: React.ReactNode;
  /** Number of unread notifications, shown beside the heading. */
  unreadCount?: number;
  /** Shows a "Mark all as read" button when there are unread items. */
  onMarkAllRead?: () => void;
  markAllReadLabel?: string;
  /** Shown when there are no children. */
  emptyState?: React.ReactNode;
  /** Footer, e.g. a "View all" link. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

/** A complete notification panel: header, unread count, list and empty state. Fits in a Popover or Drawer. */
export const NotificationCenter = React.forwardRef<HTMLDivElement, NotificationCenterProps>(
  function NotificationCenter(
    {
      title = 'Notifications',
      unreadCount = 0,
      onMarkAllRead,
      markAllReadLabel = 'Mark all as read',
      emptyState = 'You’re all caught up.',
      footer,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const headingId = `${React.useId()}-heading`;
    const empty = React.Children.count(children) === 0;
    return (
      <div
        ref={ref}
        role="region"
        aria-labelledby={headingId}
        className={cx('st-notification-center', className)}
        {...props}
      >
        <div className="st-notification-center__header">
          <h2 id={headingId} className="st-notification-center__title">
            {title}
            {unreadCount > 0 && (
              <span className="st-notification-center__count">
                {unreadCount}
                <span className="st-sr-only"> unread</span>
              </span>
            )}
          </h2>
          {onMarkAllRead && unreadCount > 0 && (
            <button
              type="button"
              className="st-notification-center__mark-all"
              onClick={onMarkAllRead}
            >
              {markAllReadLabel}
            </button>
          )}
        </div>
        {empty ? (
          <div className="st-notification-center__empty">
            <Icon name="bell" size={20} />
            <p>{emptyState}</p>
          </div>
        ) : (
          <NotificationList aria-labelledby={headingId}>{children}</NotificationList>
        )}
        {footer != null && <div className="st-notification-center__footer">{footer}</div>}
      </div>
    );
  },
);
