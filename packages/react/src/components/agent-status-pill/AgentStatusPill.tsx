'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { Icon } from '../../icons/Icon.js';
import type { IconName } from '../../icons/paths.js';

/** What an agent is doing now. */
export type AgentStatus = 'idle' | 'working' | 'waiting' | 'done' | 'error' | 'paused';

/** The words for each agent status. */
export type AgentStatusPillLabels = Record<AgentStatus, string>;

export interface AgentStatusPillProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** What the agent is doing now. */
  status: AgentStatus;
  /** Overrides the words for this status, for example "Researching". */
  label?: string;
  /** Short supporting text after the label, for example "Step 3 of 5". */
  detail?: string;
  /** Makes the pill a button, for example to open the run. */
  onPress?: () => void;
  /** Default `md`. */
  size?: 'sm' | 'md';
  /** Translations for the status words. */
  labels?: Partial<AgentStatusPillLabels>;
}

const defaultLabels: AgentStatusPillLabels = {
  idle: 'Idle',
  working: 'Working',
  waiting: 'Waiting for you',
  done: 'Done',
  error: 'Failed',
  paused: 'Paused',
};

const icons: Partial<Record<AgentStatus, IconName>> = {
  idle: 'circle',
  waiting: 'bell',
  done: 'check-circle',
  error: 'x-circle',
};

/**
 * A compact pill showing what an agent is doing now. It is a status, or a button when
 * `onPress` is given. A change to waiting is announced assertively, once; other
 * changes politely.
 */
export const AgentStatusPill = React.forwardRef<HTMLElement, AgentStatusPillProps>(
  function AgentStatusPill(
    { status, label, detail, onPress, size = 'md', labels: labelsProp, className, ...props },
    ref,
  ) {
    const text = label ?? { ...defaultLabels, ...labelsProp }[status];
    const polite = useAnnouncer('polite');
    const assertive = useAnnouncer('assertive');
    const previous = React.useRef(status);
    const spoken = detail ? `${text}, ${detail}` : text;
    const spokenRef = React.useRef(spoken);
    React.useEffect(() => {
      spokenRef.current = spoken;
    });
    const announcePolite = polite.announce;
    const announceAssertive = assertive.announce;
    React.useEffect(() => {
      if (previous.current === status) return;
      previous.current = status;
      if (status === 'waiting') announceAssertive(spokenRef.current);
      else announcePolite(spokenRef.current);
    }, [status, announcePolite, announceAssertive]);

    const iconSize = size === 'sm' ? 12 : 14;
    const icon = icons[status];
    const content = (
      <>
        <span className="st-agent-status-pill__icon" aria-hidden="true">
          {icon ? (
            <Icon name={icon} size={iconSize} />
          ) : (
            <span className="st-agent-status-pill__glyph" />
          )}
        </span>
        <span className="st-agent-status-pill__label">{text}</span>
        {detail && <span className="st-agent-status-pill__detail">{detail}</span>}
      </>
    );
    const shared = {
      className: cx('st-agent-status-pill', className),
      'data-status': status,
      'data-size': size,
    };
    return (
      <>
        {onPress ? (
          <button
            ref={ref as React.Ref<HTMLButtonElement>}
            type="button"
            {...shared}
            {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
            onClick={(event) => {
              (props.onClick as React.MouseEventHandler<HTMLButtonElement> | undefined)?.(event);
              if (!event.defaultPrevented) onPress();
            }}
          >
            {content}
          </button>
        ) : (
          // The role states what this is; changes are spoken by the regions below, once.
          <span
            ref={ref as React.Ref<HTMLSpanElement>}
            role="status"
            aria-live="off"
            {...shared}
            {...props}
          >
            {content}
          </span>
        )}
        {polite.region}
        {assertive.region}
      </>
    );
  },
);
