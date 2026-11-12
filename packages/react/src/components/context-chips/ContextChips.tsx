'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { Icon } from '../../icons/Icon.js';

export interface ContextItem {
  /** Stable identifier. */
  id: string;
  /** The name of the file, page or selection. */
  label: string;
  /** Leading visual, for example an Icon. */
  icon?: React.ReactNode;
  /** What sort of context this is, for example "file" or "page". Exposed as `data-kind`. */
  kind?: string;
}

export interface ContextChipsLabels {
  /** Accessible name of the list. Default "Context". */
  list: string;
  /** Names the remove button of one item. Default "Remove {label}". */
  remove: (label: string) => string;
  /** Text of the add button. Default "Add context". */
  add: string;
  /** Text of the button that reveals hidden items. Default "+{count} more". */
  more: (count: number) => string;
  /** Text of the button that hides them again. Default "Show less". */
  less: string;
}

export interface ContextChipsProps extends Omit<
  React.HTMLAttributes<HTMLUListElement>,
  'children'
> {
  /** What the assistant can see for this message. */
  items: ContextItem[];
  /** Called with the id of the item to remove. Without it the chips are read only. */
  onRemove?: (id: string) => void;
  /** Called when the reader asks to add context. Without it there is no add button. */
  onAdd?: () => void;
  /** Show at most this many chips, with the rest behind a "+N more" button. */
  max?: number;
  /** Translations for the built in strings. */
  labels?: Partial<ContextChipsLabels>;
}

const defaultLabels: ContextChipsLabels = {
  list: 'Context',
  remove: (label) => `Remove ${label}`,
  add: 'Add context',
  more: (count) => `+${count} more`,
  less: 'Show less',
};

/**
 * Shows what the assistant can see for this message, such as files, pages or selections.
 * Each chip can be removed, and more context can be added.
 */
export const ContextChips = React.forwardRef<HTMLUListElement, ContextChipsProps>(
  function ContextChips(
    { items, onRemove, onAdd, max, labels: labelsProp, className, ...props },
    forwardedRef,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const listRef = React.useRef<HTMLUListElement>(null);
    const composed = useComposedRefs(forwardedRef, listRef);
    const [expanded, setExpanded] = React.useState(false);
    const limit = typeof max === 'number' && max >= 0 ? Math.floor(max) : undefined;
    const overflow = limit !== undefined && items.length > limit;
    const visible = overflow && !expanded ? items.slice(0, limit) : items;
    const hiddenCount = items.length - visible.length;

    // After a removal, keep keyboard focus in the list.
    const pendingFocus = React.useRef<number | null>(null);
    React.useEffect(() => {
      const index = pendingFocus.current;
      if (index === null) return;
      pendingFocus.current = null;
      const list = listRef.current;
      if (!list || list.contains(document.activeElement)) return;
      const buttons = list.querySelectorAll<HTMLButtonElement>('.st-context-chips__remove');
      const next =
        buttons[Math.min(index, buttons.length - 1)] ??
        list.querySelector<HTMLButtonElement>('.st-context-chips__add') ??
        list;
      next.focus();
    }, [items]);

    // Revealing or hiding items keeps focus on the toggle, which is re-created in a new place.
    const toggleFocus = React.useRef(false);
    React.useEffect(() => {
      if (!toggleFocus.current) return;
      toggleFocus.current = false;
      listRef.current?.querySelector<HTMLButtonElement>('.st-context-chips__toggle')?.focus();
    }, [expanded]);

    if (items.length === 0 && !onAdd) return null;

    return (
      <ul
        ref={composed}
        aria-label={labels.list}
        tabIndex={-1}
        className={cx('st-context-chips', className)}
        {...props}
      >
        {visible.map((item, index) => (
          <li key={item.id} className="st-context-chips__chip" data-kind={item.kind}>
            {item.icon != null && (
              <span className="st-context-chips__icon" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span className="st-context-chips__label" title={item.label}>
              {item.label}
            </span>
            {onRemove && (
              <button
                type="button"
                className="st-context-chips__remove"
                aria-label={labels.remove(item.label)}
                title={labels.remove(item.label)}
                onClick={() => {
                  pendingFocus.current = index;
                  onRemove(item.id);
                }}
              >
                <Icon name="x" size={12} />
              </button>
            )}
          </li>
        ))}
        {overflow && (
          <li className="st-context-chips__action">
            <button
              type="button"
              className="st-context-chips__button st-context-chips__toggle"
              aria-expanded={expanded}
              onClick={() => {
                toggleFocus.current = true;
                setExpanded((current) => !current);
              }}
            >
              {expanded ? labels.less : labels.more(hiddenCount)}
            </button>
          </li>
        )}
        {onAdd && (
          <li className="st-context-chips__action">
            <button
              type="button"
              className="st-context-chips__button st-context-chips__add"
              onClick={onAdd}
            >
              <Icon name="plus" size={14} />
              {labels.add}
            </button>
          </li>
        )}
      </ul>
    );
  },
);
