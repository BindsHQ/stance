'use client';
import * as React from 'react';
import { cx } from './cx.js';
import { useDismissableLayer } from './layer-stack.js';
import { Portal } from './portal.js';
import type { Align, Side } from './position.js';
import { useComposedRefs } from './refs.js';
import { useFloating } from './use-floating.js';

/** One row of the listbox shared by MentionPicker and SlashCommandMenu. */
export interface PromptListboxItem {
  id: string;
  label: string;
  description?: string | undefined;
  icon?: React.ReactNode;
  group?: string | undefined;
  /** Content at the end of the row, such as a keyboard shortcut. */
  trailing?: React.ReactNode;
}

export interface PromptListboxProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  open: boolean;
  /** Rows to show, already filtered. */
  items: PromptListboxItem[];
  onSelectItem: (id: string) => void;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** The element that keeps focus and that the list is placed against. */
  anchor: React.RefObject<Element | null>;
  /** Accessible name of the listbox. */
  label: string;
  emptyLabel: React.ReactNode;
  loading?: boolean | undefined;
  loadingLabel: React.ReactNode;
  onActiveDescendantChange?: ((id: string | undefined) => void) | undefined;
  side?: Side | undefined;
  align?: Align | undefined;
  /** Render in place instead of in a portal. */
  disablePortal?: boolean | undefined;
}

const optionDomId = (listId: string, index: number) => `${listId}-option-${index}`;

/**
 * A floating listbox driven from another focused element (a text area). Focus never
 * moves into it: the owner points at the active option with aria-activedescendant.
 */
export const PromptListbox = React.forwardRef<HTMLDivElement, PromptListboxProps>(
  function PromptListbox(
    {
      open,
      items,
      onSelectItem,
      onOpenChange,
      anchor,
      label,
      emptyLabel,
      loading = false,
      loadingLabel,
      onActiveDescendantChange,
      side = 'top',
      align = 'start',
      disablePortal,
      id: idProp,
      className,
      style,
      ...props
    },
    forwardedRef,
  ) {
    const generatedId = React.useId();
    const listId = idProp ?? generatedId;
    const popupRef = React.useRef<HTMLDivElement>(null);
    const composed = useComposedRefs(forwardedRef, popupRef);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const showOptions = open && !loading && items.length > 0;

    const floating = useFloating(anchor, popupRef, { open, side, align, sideOffset: 6 });
    useDismissableLayer(popupRef, {
      enabled: open,
      onDismiss: () => onOpenChange?.(false),
      excludeRefs: [anchor as React.RefObject<HTMLElement | null>],
    });

    // A new result set or a reopen starts again from the first option.
    const signature = items.map((item) => item.id).join('\u0000');
    React.useEffect(() => {
      setActiveIndex(0);
    }, [signature, open]);

    const index = Math.min(activeIndex, Math.max(items.length - 1, 0));
    const activeId = showOptions ? optionDomId(listId, index) : undefined;

    const notify = React.useRef(onActiveDescendantChange);
    notify.current = onActiveDescendantChange;
    React.useEffect(() => {
      notify.current?.(activeId);
    }, [activeId]);
    React.useEffect(() => () => notify.current?.(undefined), []);

    React.useEffect(() => {
      if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
    }, [activeId]);

    // Keys are read from the anchor, which keeps focus. A native listener runs before
    // React handlers on the same element, so the owner can check `defaultPrevented`.
    const live = React.useRef({ items, index, showOptions, onSelectItem });
    live.current = { items, index, showOptions, onSelectItem };
    React.useEffect(() => {
      if (!open) return;
      const target: EventTarget = anchor.current ?? document;
      const onKeyDown = (event: Event) => {
        const e = event as KeyboardEvent;
        const state = live.current;
        if (e.isComposing || e.defaultPrevented || !state.showOptions) return;
        const last = state.items.length - 1;
        let next: number | null = null;
        if (e.key === 'ArrowDown') next = state.index >= last ? 0 : state.index + 1;
        else if (e.key === 'ArrowUp') next = state.index <= 0 ? last : state.index - 1;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = last;
        else if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) {
          const item = state.items[state.index];
          if (!item) return;
          e.preventDefault();
          state.onSelectItem(item.id);
          return;
        }
        if (next === null) return;
        e.preventDefault();
        setActiveIndex(next);
      };
      target.addEventListener('keydown', onKeyDown);
      return () => target.removeEventListener('keydown', onKeyDown);
    }, [open, anchor]);

    if (!open) return null;

    const renderOption = (item: PromptListboxItem, i: number) => (
      <li
        key={item.id}
        id={optionDomId(listId, i)}
        role="option"
        aria-selected={i === index}
        data-active={i === index ? '' : undefined}
        className="st-prompt-listbox__option"
        onPointerDown={(event) => event.preventDefault()}
        onPointerMove={() => {
          if (i !== index) setActiveIndex(i);
        }}
        onClick={() => onSelectItem(item.id)}
      >
        {item.icon != null && (
          <span className="st-prompt-listbox__icon" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span className="st-prompt-listbox__text">
          <span className="st-prompt-listbox__label">{item.label}</span>
          {item.description && (
            <span className="st-prompt-listbox__description">{item.description}</span>
          )}
        </span>
        {item.trailing != null && (
          <span className="st-prompt-listbox__trailing">{item.trailing}</span>
        )}
      </li>
    );

    // Keep source order; consecutive rows with the same group share one labelled group.
    const sections: {
      group: string | undefined;
      rows: { item: PromptListboxItem; i: number }[];
    }[] = [];
    items.forEach((item, i) => {
      const current = sections[sections.length - 1];
      if (current && current.group === item.group) current.rows.push({ item, i });
      else sections.push({ group: item.group, rows: [{ item, i }] });
    });

    return (
      <Portal {...(disablePortal !== undefined && { disabled: disablePortal })}>
        <div
          ref={composed}
          className={cx('st-floating st-prompt-listbox', className)}
          data-side={floating.side}
          data-state="open"
          style={{ ...floating.style, ...style }}
          {...props}
        >
          {showOptions ? (
            <ul
              id={listId}
              role="listbox"
              aria-label={label}
              className="st-prompt-listbox__list"
              onPointerDown={(event) => event.preventDefault()}
            >
              {sections.map((section, s) => {
                if (section.group === undefined)
                  return section.rows.map(({ item, i }) => renderOption(item, i));
                const groupId = `${listId}-group-${s}`;
                return (
                  <li key={groupId} role="presentation" className="st-prompt-listbox__group">
                    <div
                      id={groupId}
                      role="presentation"
                      className="st-prompt-listbox__group-label"
                    >
                      {section.group}
                    </div>
                    <ul
                      role="group"
                      aria-labelledby={groupId}
                      className="st-prompt-listbox__group-list"
                    >
                      {section.rows.map(({ item, i }) => renderOption(item, i))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div
              id={listId}
              role="status"
              aria-label={label}
              className="st-prompt-listbox__status"
              data-loading={loading ? '' : undefined}
            >
              {loading ? loadingLabel : emptyLabel}
            </div>
          )}
        </div>
      </Portal>
    );
  },
);

/** Case insensitive match of a query against a few text fields. */
export function matchesPromptQuery(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => field?.toLowerCase().includes(q));
}
