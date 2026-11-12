'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { GenerationStatus } from '../../internal/generation-status.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { Icon } from '../../icons/Icon.js';
import { MessageGroupContext, type MessageRole } from '../message-group/MessageGroup.js';

export interface MessageLabels {
  /** Name used when a user message has no `author`. */
  user: string;
  /** Name used when an assistant message has no `author`. */
  assistant: string;
  /** Name used when a system message has no `author`. */
  system: string;
  /** Announced once when a response starts. */
  started: string;
  /** Announced once when a response finishes. */
  complete: string;
  /** Shown under a stopped response, where it is announced once. */
  stopped: string;
  /** Shown under a failed response, where it is announced once. */
  error: string;
}

const defaultLabels: MessageLabels = {
  user: 'You',
  assistant: 'Assistant',
  system: 'System',
  started: 'Responding',
  complete: 'Response complete',
  stopped: 'Response stopped',
  error: 'Response failed',
};

export interface MessageProps extends Omit<React.HTMLAttributes<HTMLElement>, 'role'> {
  /** Who wrote the message. Inside a MessageGroup it defaults to the group role. Default `assistant`. */
  role?: MessageRole;
  /** Generation status. `submitted` and `streaming` mark the message as busy. Default `complete`. */
  status?: GenerationStatus;
  /** Name of the author. Without it a default name is used for assistive technology only. */
  author?: React.ReactNode;
  /** Avatar shown beside the message, typically an `<Avatar decorative />`. */
  avatar?: React.ReactNode;
  /** When the message was sent, already formatted for display. */
  timestamp?: React.ReactNode;
  /** Machine readable time for the `<time>` element, for example an ISO string. */
  dateTime?: string;
  /** The message content. */
  children?: React.ReactNode;
  /** Slot under the content for a MessageActions row. */
  actions?: React.ReactNode;
  /** Slot under the content for sources, attachments or a note. */
  footer?: React.ReactNode;
  /** `bubble` wraps the content in a surface, `plain` lets it sit on the page. Default `bubble`. */
  variant?: 'bubble' | 'plain';
  /** Translations for the default author names and the status text. */
  labels?: Partial<MessageLabels>;
}

const isBusy = (status: GenerationStatus) => status === 'submitted' || status === 'streaming';

/**
 * One turn in a conversation from the user, the assistant or the system. It is an
 * article named by author and time, and it is marked busy while the response streams
 * so assistive technology waits for the finished text.
 */
export const Message = React.forwardRef<HTMLElement, MessageProps>(function Message(
  {
    role: roleProp,
    status = 'complete',
    author: authorProp,
    avatar,
    timestamp,
    dateTime,
    children,
    actions,
    footer,
    variant = 'bubble',
    labels: labelsProp,
    className,
    ...props
  },
  ref,
) {
  const labels = { ...defaultLabels, ...labelsProp };
  const group = React.useContext(MessageGroupContext);
  const role = roleProp ?? group?.role ?? 'assistant';
  const grouped = group !== null;
  const author = authorProp ?? group?.author;
  const headerId = React.useId();
  const { announce, region } = useAnnouncer();

  // Speak each status change once: started and finished here, stopped and failed through
  // the visible status line below. Never the tokens.
  const previous = React.useRef(status);
  React.useEffect(() => {
    const from = previous.current;
    previous.current = status;
    if (from === status || role !== 'assistant') return;
    if (isBusy(status)) {
      if (!isBusy(from)) announce(labels.started);
    } else if (status === 'complete') announce(labels.complete);
    else announce('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, role]);

  // The group already shows the name; a message without one still needs a name to be read.
  const authorHidden = grouped || author == null;
  const showAvatar = avatar != null && !grouped;
  const stateLabel =
    status === 'error' ? labels.error : status === 'stopped' ? labels.stopped : undefined;

  return (
    <article
      ref={ref}
      className={cx('st-message', className)}
      data-role={role}
      data-status={status}
      data-variant={variant}
      data-grouped={grouped ? '' : undefined}
      aria-labelledby={headerId}
      aria-busy={isBusy(status) || undefined}
      {...props}
    >
      {showAvatar && <span className="st-message__avatar">{avatar}</span>}
      <div className="st-message__main">
        <div
          id={headerId}
          className={cx('st-message__header', authorHidden && timestamp == null && 'st-sr-only')}
        >
          <span className={cx('st-message__author', authorHidden && 'st-sr-only')}>
            {author ?? labels[role]}
          </span>
          {/* A real space keeps the name and the time apart in the accessible name. */}
          {timestamp != null && ' '}
          {timestamp != null &&
            (dateTime ? (
              <time className="st-message__timestamp" dateTime={dateTime}>
                {timestamp}
              </time>
            ) : (
              <span className="st-message__timestamp">{timestamp}</span>
            ))}
        </div>
        {children != null && children !== false && (
          <div className="st-message__content">{children}</div>
        )}
        {(role === 'assistant' || stateLabel) && (
          // Always mounted for assistant messages so the text is announced when it appears.
          <p
            className="st-message__state"
            role="status"
            data-state={stateLabel ? status : undefined}
          >
            {stateLabel && (
              <>
                <Icon name={status === 'error' ? 'alert-circle' : 'stop'} size={14} />
                {stateLabel}
              </>
            )}
          </p>
        )}
        {footer != null && <div className="st-message__footer">{footer}</div>}
        {actions != null && <div className="st-message__actions">{actions}</div>}
      </div>
      {region}
    </article>
  );
});
