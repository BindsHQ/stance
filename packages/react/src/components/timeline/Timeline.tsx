import * as React from 'react';
import { cx } from '../../internal/cx.js';

export type TimelineTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface TimelineProps extends React.OlHTMLAttributes<HTMLOListElement> {
  /** Alternate items left and right on wide screens. Default false. */
  alternate?: boolean;
  /** Default `md`. */
  density?: 'sm' | 'md';
}

/** A chronological list of events, such as a contract's audit trail. */
export const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>(function Timeline(
  { alternate, density = 'md', className, ...props },
  ref,
) {
  return (
    <ol
      ref={ref}
      className={cx('st-timeline', className)}
      data-alternate={alternate ? '' : undefined}
      data-density={density}
      {...props}
    />
  );
});

export interface TimelineItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, 'title'> {
  /** Human-readable time, e.g. "Today, 09:41". */
  time?: React.ReactNode;
  /** Machine-readable time for the <time> element. */
  dateTime?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Icon inside the marker. Without one, a dot is drawn. */
  icon?: React.ReactNode;
  /** Marker colour. Default `neutral`. */
  tone?: TimelineTone;
  /** Status text read out with the event, e.g. "Failed". Colour alone never carries meaning. */
  statusLabel?: string;
}

export const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  function TimelineItem(
    {
      time,
      dateTime,
      title,
      description,
      icon,
      tone = 'neutral',
      statusLabel,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <li ref={ref} className={cx('st-timeline__item', className)} data-tone={tone} {...props}>
        <span
          className="st-timeline__marker"
          data-icon={icon != null ? '' : undefined}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="st-timeline__body">
          <div className="st-timeline__heading">
            <span className="st-timeline__title">{title}</span>
            {statusLabel && <span className="st-sr-only">, {statusLabel}</span>}
            {time != null && (
              <time className="st-timeline__time" dateTime={dateTime}>
                {time}
              </time>
            )}
          </div>
          {description != null && <p className="st-timeline__description">{description}</p>}
          {children}
        </div>
      </li>
    );
  },
);
