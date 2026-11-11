'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { createStrictContext } from '../../internal/context.js';
import { cx } from '../../internal/cx.js';
import { fuzzyScore } from '../../internal/fuzzy-score.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';
import { Icon } from '../../icons/Icon.js';

export type CommandFilter = (text: string, search: string) => number;

interface CommandContextValue {
  search: string;
  setSearch: (value: string) => void;
  filter: CommandFilter | null;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  listId: string;
  label: string;
  visibleCount: number;
  listRef: React.RefObject<HTMLDivElement | null>;
  onItemSelect?: ((value: string) => void) | undefined;
}

const [CommandProvider, useCommandContext] =
  createStrictContext<CommandContextValue>('CommandMenu');

const OPTION = '[role="option"]';
const ENABLED_OPTION = '[role="option"]:not([aria-disabled="true"])';

export interface CommandMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Accessible label for the input and list. Default "Commands". */
  label?: string;
  /** Controlled search text. */
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  /** Custom scorer (0 hides an item), or `false` to disable built-in filtering (e.g. server results). */
  filter?: CommandFilter | false;
  /** Called after any item's onSelect. CommandPalette uses it to close. */
  onItemSelect?: (value: string) => void;
}

/**
 * A searchable list of commands: an input that filters a listbox, navigated with arrow keys.
 * Compose with CommandInput, CommandList, CommandGroup, CommandItem and CommandEmpty.
 */
export const CommandMenu = React.forwardRef<HTMLDivElement, CommandMenuProps>(function CommandMenu(
  {
    label = 'Commands',
    search: searchProp,
    defaultSearch = '',
    onSearchChange,
    filter = fuzzyScore,
    onItemSelect,
    className,
    children,
    ...props
  },
  ref,
) {
  const [search, setSearch] = useControllableState({
    value: searchProp,
    defaultValue: defaultSearch,
    onChange: onSearchChange,
  });
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(0);
  const listId = `${React.useId()}-list`;
  const listRef = React.useRef<HTMLDivElement>(null);

  // Keep the active option valid and the visible count accurate after every render.
  useIsomorphicLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const all = list.querySelectorAll(OPTION).length;
    if (all !== visibleCount) setVisibleCount(all);
    const enabled = Array.from(list.querySelectorAll<HTMLElement>(ENABLED_OPTION));
    if (!enabled.some((el) => el.id === activeId)) setActiveId(enabled[0]?.id ?? null);
  });

  // A new search always highlights the best (first) match.
  useIsomorphicLayoutEffect(() => {
    const first = listRef.current?.querySelector<HTMLElement>(ENABLED_OPTION);
    setActiveId(first?.id ?? null);
  }, [search]);

  React.useEffect(() => {
    if (!activeId) return;
    document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeId]);

  const value = React.useMemo<CommandContextValue>(
    () => ({
      search,
      setSearch,
      filter: filter || null,
      activeId,
      setActiveId,
      listId,
      label,
      visibleCount,
      listRef,
      onItemSelect,
    }),
    [search, setSearch, filter, activeId, listId, label, visibleCount, onItemSelect],
  );
  return (
    <CommandProvider value={value}>
      <div ref={ref} className={cx('st-command', className)} {...props}>
        {children}
      </div>
    </CommandProvider>
  );
});

export interface CommandInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange'
> {
  /** Hide the leading search icon. */
  hideIcon?: boolean;
}

/** The search field. Arrow keys move the highlighted command; Enter runs it. */
export const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  function CommandInput(
    { hideIcon, className, onKeyDown, placeholder = 'Type a command or search…', ...props },
    ref,
  ) {
    const ctx = useCommandContext('CommandInput');
    const move = (delta: number | 'first' | 'last') => {
      const items = Array.from(
        ctx.listRef.current?.querySelectorAll<HTMLElement>(ENABLED_OPTION) ?? [],
      );
      if (items.length === 0) return;
      const index = items.findIndex((el) => el.id === ctx.activeId);
      let next: number;
      if (delta === 'first') next = 0;
      else if (delta === 'last') next = items.length - 1;
      else next = index === -1 ? 0 : (index + delta + items.length) % items.length;
      ctx.setActiveId(items[next]!.id);
    };
    return (
      <div className="st-command__input-wrapper">
        {!hideIcon && <Icon name="search" size={16} className="st-command__input-icon" />}
        <input
          ref={ref}
          type="text"
          role="combobox"
          aria-expanded={true}
          aria-controls={ctx.listId}
          aria-activedescendant={ctx.activeId ?? undefined}
          aria-autocomplete="list"
          aria-label={props['aria-label'] ?? ctx.label}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          className={cx('st-command__input', className)}
          value={ctx.search}
          onChange={(e) => ctx.setSearch(e.target.value)}
          onKeyDown={composeHandlers(onKeyDown, (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              move(1);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              move(-1);
            } else if (e.key === 'PageDown' || (e.key === 'End' && e.ctrlKey)) {
              e.preventDefault();
              move('last');
            } else if (e.key === 'PageUp' || (e.key === 'Home' && e.ctrlKey)) {
              e.preventDefault();
              move('first');
            } else if (e.key === 'Enter' && ctx.activeId) {
              e.preventDefault();
              document.getElementById(ctx.activeId)?.click();
            }
          })}
          {...props}
        />
      </div>
    );
  },
);

/** The listbox containing groups and items. */
export const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CommandList({ className, ...props }, forwardedRef) {
    const ctx = useCommandContext('CommandList');
    return (
      <div
        ref={(node) => {
          ctx.listRef.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        role="listbox"
        id={ctx.listId}
        aria-label={ctx.label}
        className={cx('st-command__list', className)}
        data-empty={ctx.visibleCount === 0 ? '' : undefined}
        {...props}
      />
    );
  },
);

export interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visible group heading, also the group's accessible name. */
  heading?: React.ReactNode;
}

/** Groups related items under a heading. Hidden automatically when none of its items match. */
export const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  function CommandGroup({ heading, className, children, ...props }, ref) {
    const headingId = `${React.useId()}-heading`;
    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={heading != null ? headingId : undefined}
        className={cx('st-command__group', className)}
        {...props}
      >
        {heading != null && (
          <div id={headingId} className="st-command__group-heading" aria-hidden="true">
            {heading}
          </div>
        )}
        {children}
      </div>
    );
  },
);

export interface CommandItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Unique value used for filtering and passed to onSelect. */
  value: string;
  /** Extra search terms (synonyms) that match this item. */
  keywords?: string[];
  onSelect?: (value: string) => void;
  disabled?: boolean;
  /** Keyboard shortcut hint shown at the end, e.g. "⌘N". */
  shortcut?: React.ReactNode;
  /** Leading icon. */
  icon?: React.ReactNode;
  /** Always render, regardless of the search. */
  forceMount?: boolean;
}

/** A selectable command. */
export const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(function CommandItem(
  {
    value,
    keywords,
    onSelect,
    disabled = false,
    shortcut,
    icon,
    forceMount,
    className,
    children,
    onClick,
    onPointerMove,
    ...props
  },
  ref,
) {
  const ctx = useCommandContext('CommandItem');
  const id = `${React.useId()}-option`;
  const text = [value, ...(keywords ?? [])].join(' ');
  const visible = forceMount || !ctx.filter || !ctx.search || ctx.filter(text, ctx.search) > 0;
  if (!visible) return null;
  const active = ctx.activeId === id;
  return (
    <div
      ref={ref}
      id={id}
      role="option"
      aria-selected={active}
      aria-disabled={disabled || undefined}
      data-value={value}
      data-active={active ? '' : undefined}
      className={cx('st-command__item', className)}
      onPointerMove={composeHandlers(onPointerMove, () => {
        if (!disabled && !active) ctx.setActiveId(id);
      })}
      onClick={composeHandlers(onClick, () => {
        if (disabled) return;
        onSelect?.(value);
        ctx.onItemSelect?.(value);
      })}
      {...props}
    >
      {icon != null && (
        <span className="st-command__item-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="st-command__item-label">{children ?? value}</span>
      {shortcut != null && <CommandShortcut>{shortcut}</CommandShortcut>}
    </div>
  );
});

/** Keyboard shortcut hint. Hidden from assistive technology (it is a visual hint only). */
export const CommandShortcut = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  function CommandShortcut({ className, ...props }, ref) {
    return (
      <kbd
        ref={ref}
        aria-hidden="true"
        className={cx('st-command__shortcut', className)}
        {...props}
      />
    );
  },
);

/** A visual divider between groups. */
export const CommandSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CommandSeparator({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cx('st-command__separator', className)}
      {...props}
    />
  );
});

/**
 * Shown when nothing matches. Place it after CommandList (outside the listbox).
 * Always mounted as a polite live region so "no results" is announced.
 */
export const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CommandEmpty({ className, children = 'No results found.', ...props }, ref) {
    const ctx = useCommandContext('CommandEmpty');
    const empty = ctx.visibleCount === 0;
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cx('st-command__empty', className)}
        data-visible={empty ? '' : undefined}
        {...props}
      >
        {empty ? children : null}
      </div>
    );
  },
);

export { useCommandContext };
