'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';
import { IconButton } from '../icon-button/IconButton.js';

export interface ConversationListItem {
  /** Stable identifier. */
  id: string;
  /** Title of the conversation. */
  title: string;
  /** When it last changed. Used to group by date when `group` is not set. */
  updatedAt: Date | string | number;
  /** Heading to list the conversation under, instead of a date group. */
  group?: string;
  /** Pinned conversations are listed first, under their own heading. */
  pinned?: boolean;
  /** Render the row as a link to this address instead of a button. */
  href?: string;
}

export interface ConversationListLabels {
  /** Accessible name of the navigation region. */
  list: string;
  /** Heading of the pinned group. */
  pinned: string;
  today: string;
  yesterday: string;
  /** Heading for the last 7 days. */
  lastWeek: string;
  /** Heading for the last 30 days. */
  lastMonth: string;
  /** Heading for everything before that. */
  older: string;
  /** Shown when there are no conversations and no `emptyState`. */
  empty: string;
  /** Names the rename button for one conversation. */
  rename: (title: string) => string;
  /** Names the delete button for one conversation. */
  delete: (title: string) => string;
  /** Names the pin button for one conversation. */
  pin: (title: string) => string;
  /** Names the unpin button for one conversation. */
  unpin: (title: string) => string;
  /** Accessible name of the rename field. */
  renameInput: string;
}

const defaultLabels: ConversationListLabels = {
  list: 'Conversations',
  pinned: 'Pinned',
  today: 'Today',
  yesterday: 'Yesterday',
  lastWeek: 'Previous 7 days',
  lastMonth: 'Previous 30 days',
  older: 'Older',
  empty: 'No conversations yet',
  rename: (title) => `Rename ${title}`,
  delete: (title) => `Delete ${title}`,
  pin: (title) => `Pin ${title}`,
  unpin: (title) => `Unpin ${title}`,
  renameInput: 'Conversation title',
};

export interface ConversationListProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
  /** The conversations, newest first. */
  items: ConversationListItem[];
  /** The conversation that is open. It is marked with `aria-current`. */
  selectedId?: string | null;
  /** Called with the id of the conversation that was chosen. */
  onSelect?: (id: string) => void;
  /** Called with the new title after an inline rename. Shows the rename button. */
  onRename?: (id: string, title: string) => void;
  /** Called when delete is pressed. Confirm in the app if needed. Shows the delete button. */
  onDelete?: (id: string) => void;
  /** Called with the new pinned state. Shows the pin button. */
  onPin?: (id: string, pinned: boolean) => void;
  /** Shown in place of the list when there are no conversations. */
  emptyState?: React.ReactNode;
  /** The moment date groups are measured from. Default: now. */
  now?: Date | number;
  /** Translations for headings, buttons and the empty text. */
  labels?: Partial<ConversationListLabels>;
}

const DAY = 86_400_000;

function dateGroup(updatedAt: ConversationListItem['updatedAt'], now: number) {
  const time = new Date(updatedAt).getTime();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const start = midnight.getTime();
  if (Number.isNaN(time) || time >= start) return 'today' as const;
  if (time >= start - DAY) return 'yesterday' as const;
  if (time >= start - 7 * DAY) return 'lastWeek' as const;
  if (time >= start - 30 * DAY) return 'lastMonth' as const;
  return 'older' as const;
}

/**
 * A list of past conversations grouped by date, with selection, rename, delete and pin.
 * It is a navigation region; the open conversation carries `aria-current`.
 */
export const ConversationList = React.forwardRef<HTMLElement, ConversationListProps>(
  function ConversationList(
    {
      items,
      selectedId,
      onSelect,
      onRename,
      onDelete,
      onPin,
      emptyState,
      now,
      labels: labelsProp,
      className,
      ...props
    },
    forwardedRef,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const baseId = React.useId();
    const rootRef = React.useRef<HTMLElement | null>(null);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [draft, setDraft] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);
    // Where focus should land after a rename ends or a conversation is removed.
    const focusAfter = React.useRef<{ id: string; index: number; removal: boolean } | null>(null);

    const nowTime = now === undefined ? Date.now() : new Date(now).getTime();
    const groups: { key: string; label: string; items: ConversationListItem[] }[] = [];
    for (const item of items) {
      const key = item.pinned
        ? 'pinned'
        : item.group !== undefined
          ? `group:${item.group}`
          : dateGroup(item.updatedAt, nowTime);
      const label = item.pinned
        ? labels.pinned
        : item.group !== undefined
          ? item.group
          : labels[dateGroup(item.updatedAt, nowTime)];
      let group = groups.find((g) => g.key === key);
      if (!group) {
        group = { key, label, items: [] };
        if (key === 'pinned') groups.unshift(group);
        else groups.push(group);
      }
      group.items.push(item);
    }
    const order = groups.flatMap((g) => g.items.map((i) => i.id));

    const links = () =>
      Array.from(
        rootRef.current?.querySelectorAll<HTMLElement>('.st-conversation-list__link') ?? [],
      );

    React.useEffect(() => {
      if (editingId !== null) {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }, [editingId]);

    React.useEffect(() => {
      const pending = focusAfter.current;
      if (!pending || editingId !== null) return;
      const present = order.includes(pending.id);
      if (pending.removal) {
        if (present) return;
        focusAfter.current = null;
        const active = document.activeElement;
        // Only rescue focus that was lost with the removed row; never take it from elsewhere.
        if (active && active !== document.body && !rootRef.current?.contains(active)) return;
        const all = links();
        (all[Math.min(pending.index, all.length - 1)] ?? rootRef.current)?.focus();
      } else {
        focusAfter.current = null;
        if (present) links()[order.indexOf(pending.id)]?.focus();
      }
    });

    const startRename = (item: ConversationListItem) => {
      setDraft(item.title);
      setEditingId(item.id);
    };
    const endRename = (item: ConversationListItem, commit: boolean, refocus: boolean) => {
      if (editingId !== item.id) return;
      const next = draft.trim();
      if (refocus) focusAfter.current = { id: item.id, index: 0, removal: false };
      setEditingId(null);
      if (commit && next !== '' && next !== item.title) onRename?.(item.id, next);
    };

    return (
      <nav
        ref={(node) => {
          rootRef.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        aria-label={labels.list}
        tabIndex={-1}
        className={cx('st-conversation-list', className)}
        {...props}
      >
        {items.length === 0 ? (
          <div className="st-conversation-list__empty">
            {emptyState ?? <p className="st-conversation-list__empty-text">{labels.empty}</p>}
          </div>
        ) : (
          groups.map((group, groupIndex) => {
            const headingId = `${baseId}-group-${groupIndex}`;
            return (
              <div key={group.key} className="st-conversation-list__group">
                <div id={headingId} className="st-conversation-list__heading">
                  {group.label}
                </div>
                <ul className="st-conversation-list__items" aria-labelledby={headingId}>
                  {group.items.map((item) => {
                    const selected = item.id === selectedId;
                    const editing = item.id === editingId;
                    const content = (
                      <span className="st-conversation-list__title">{item.title}</span>
                    );
                    const linkProps = {
                      className: 'st-conversation-list__link',
                      'aria-current': selected ? ('page' as const) : undefined,
                      onClick: () => onSelect?.(item.id),
                      onKeyDown: (event: React.KeyboardEvent) => {
                        if (event.key === 'F2' && onRename) {
                          event.preventDefault();
                          startRename(item);
                        }
                      },
                    };
                    return (
                      <li
                        key={item.id}
                        className="st-conversation-list__item"
                        data-selected={selected ? '' : undefined}
                        data-pinned={item.pinned ? '' : undefined}
                        data-editing={editing ? '' : undefined}
                      >
                        {editing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            className="st-conversation-list__input"
                            aria-label={labels.renameInput}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                endRename(item, true, true);
                              } else if (event.key === 'Escape') {
                                event.preventDefault();
                                event.stopPropagation();
                                endRename(item, false, true);
                              }
                            }}
                            onBlur={() => endRename(item, true, false)}
                          />
                        ) : (
                          <>
                            {item.href !== undefined ? (
                              <a href={item.href} {...linkProps}>
                                {content}
                              </a>
                            ) : (
                              <button type="button" {...linkProps}>
                                {content}
                              </button>
                            )}
                            {(onPin || onRename || onDelete) && (
                              <span className="st-conversation-list__actions">
                                {onPin && (
                                  <IconButton
                                    size="xs"
                                    label={(item.pinned ? labels.unpin : labels.pin)(item.title)}
                                    icon={<Icon name="pin" />}
                                    aria-pressed={Boolean(item.pinned)}
                                    data-pressed={item.pinned ? '' : undefined}
                                    onClick={() => onPin(item.id, !item.pinned)}
                                  />
                                )}
                                {onRename && (
                                  <IconButton
                                    size="xs"
                                    label={labels.rename(item.title)}
                                    icon={<Icon name="pencil" />}
                                    onClick={() => startRename(item)}
                                  />
                                )}
                                {onDelete && (
                                  <IconButton
                                    size="xs"
                                    label={labels.delete(item.title)}
                                    icon={<Icon name="trash" />}
                                    onClick={() => {
                                      focusAfter.current = {
                                        id: item.id,
                                        index: order.indexOf(item.id),
                                        removal: true,
                                      };
                                      onDelete(item.id);
                                    }}
                                  />
                                )}
                              </span>
                            )}
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </nav>
    );
  },
);
