import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Icon or small illustration. Decorative; hidden from assistive technology. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Primary action, usually a Button. */
  action?: React.ReactNode;
  /** Secondary action, usually a ghost Button or Link. */
  secondaryAction?: React.ReactNode;
  /** Default `md`. */
  size?: 'sm' | 'md' | 'lg';
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Draw a dashed border around the area (for drop zones and empty panels). */
  bordered?: boolean;
}

/** Explains why an area is empty and what to do next. */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  {
    icon,
    title,
    description,
    action,
    secondaryAction,
    size = 'md',
    headingLevel = 3,
    bordered,
    className,
    children,
    ...props
  },
  ref,
) {
  const Heading = `h${headingLevel}` as 'h3';
  return (
    <div
      ref={ref}
      className={cx('st-empty-state', className)}
      data-size={size}
      data-bordered={bordered ? '' : undefined}
      {...props}
    >
      {icon != null && (
        <div className="st-empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <Heading className="st-empty-state__title">{title}</Heading>
      {description != null && <p className="st-empty-state__description">{description}</p>}
      {children}
      {(action != null || secondaryAction != null) && (
        <div className="st-empty-state__actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
});
