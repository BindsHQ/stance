'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageGroupContextValue {
  role: MessageRole;
  author: React.ReactNode;
}

/** Lets a Message know it sits inside a MessageGroup, so it can drop its own avatar and name. */
export const MessageGroupContext = React.createContext<MessageGroupContextValue | null>(null);
MessageGroupContext.displayName = 'MessageGroupContext';

export interface MessageGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Who wrote the messages. Sets the side and the surface. Default `assistant`. */
  role?: MessageRole;
  /** Name shown once above the messages. It also names the group for assistive technology. */
  author: React.ReactNode;
  /** Avatar shown once beside the messages, typically an `<Avatar decorative />`. */
  avatar?: React.ReactNode;
  /** The Message elements of this author, oldest first. */
  children?: React.ReactNode;
}

/** Consecutive messages from one author under a single avatar and name. */
export const MessageGroup = React.forwardRef<HTMLDivElement, MessageGroupProps>(
  function MessageGroup(
    { role = 'assistant', author, avatar, children, className, ...props },
    ref,
  ) {
    const authorId = React.useId();
    const context = React.useMemo(() => ({ role, author }), [role, author]);
    return (
      <MessageGroupContext.Provider value={context}>
        <div
          ref={ref}
          role="group"
          aria-labelledby={authorId}
          className={cx('st-message-group', className)}
          data-role={role}
          {...props}
        >
          {avatar != null && <span className="st-message-group__avatar">{avatar}</span>}
          <div className="st-message-group__main">
            <span id={authorId} className="st-message-group__author">
              {author}
            </span>
            <div className="st-message-group__messages">{children}</div>
          </div>
        </div>
      </MessageGroupContext.Provider>
    );
  },
);
