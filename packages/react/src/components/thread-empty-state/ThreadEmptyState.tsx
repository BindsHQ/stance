import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';

export interface ThreadStarter {
  /** Stable identifier. */
  id: string;
  /** The prompt, as shown on the button. */
  label: string;
  /** A second line that explains the prompt. */
  description?: string;
  /** Icon shown before the label. */
  icon?: React.ReactNode;
}

export interface ThreadEmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The greeting, rendered as a heading. */
  title: React.ReactNode;
  /** A sentence under the greeting. */
  description?: React.ReactNode;
  /** Icon above the greeting. Default: the sparkle. Pass `null` for none. */
  icon?: React.ReactNode;
  /** Starter prompts, shown as a list of buttons. */
  starters?: ThreadStarter[];
  /** Called with the starter that was chosen. */
  onStarterSelect?: (starter: ThreadStarter) => void;
  /** Accessible name of the starter list. Default "Suggested prompts". */
  startersLabel?: string;
  /** Heading level of the title. Default 2. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Extra content under the starters. */
  children?: React.ReactNode;
}

/** The opening screen of a new conversation with a greeting and starter prompts. */
export const ThreadEmptyState = React.forwardRef<HTMLDivElement, ThreadEmptyStateProps>(
  function ThreadEmptyState(
    {
      title,
      description,
      icon,
      starters,
      onStarterSelect,
      startersLabel = 'Suggested prompts',
      level = 2,
      children,
      className,
      ...props
    },
    ref,
  ) {
    const Heading = `h${level}` as 'h2';
    const mark = icon === undefined ? <Icon name="sparkle" size={24} /> : icon;
    return (
      <div ref={ref} className={cx('st-thread-empty-state', className)} {...props}>
        {mark != null && mark !== false && (
          <span className="st-thread-empty-state__icon" aria-hidden="true">
            {mark}
          </span>
        )}
        <Heading className="st-thread-empty-state__title">{title}</Heading>
        {description != null && <p className="st-thread-empty-state__description">{description}</p>}
        {starters && starters.length > 0 && (
          <ul className="st-thread-empty-state__starters" aria-label={startersLabel}>
            {starters.map((starter) => (
              <li key={starter.id} className="st-thread-empty-state__starter-item">
                <button
                  type="button"
                  className="st-thread-empty-state__starter"
                  onClick={() => onStarterSelect?.(starter)}
                >
                  {starter.icon != null && (
                    <span className="st-thread-empty-state__starter-icon" aria-hidden="true">
                      {starter.icon}
                    </span>
                  )}
                  <span className="st-thread-empty-state__starter-text">
                    <span className="st-thread-empty-state__starter-label">{starter.label}</span>
                    {starter.description !== undefined && (
                      <span className="st-thread-empty-state__starter-description">
                        {starter.description}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {children}
      </div>
    );
  },
);
