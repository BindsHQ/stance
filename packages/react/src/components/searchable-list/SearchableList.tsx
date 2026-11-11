'use client';
import * as React from 'react';
import { useIsOverflowing } from '../../internal/use-is-overflowing.js';
import { cx } from '../../internal/cx.js';
import { fuzzyScore } from '../../internal/fuzzy-score.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { SearchInput } from '../search-input/SearchInput.js';

export interface SearchableListItemState {
  active: boolean;
  selected: boolean;
  query: string;
}

export interface SearchableListProps<T> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'onSelect'
> {
  items: readonly T[];
  /** Text used for matching and as the accessible name of options. */
  getItemLabel: (item: T) => string;
  /** Stable key per item. Defaults to the label. */
  getItemKey?: (item: T) => React.Key;
  /** Extra text to match against (e.g. email, department). */
  getItemKeywords?: (item: T) => string[];
  /** Custom item content. Defaults to the label. */
  renderItem?: (item: T, state: SearchableListItemState) => React.ReactNode;
  /** Custom filter. Overrides `matchMode`. */
  filter?: (item: T, query: string) => boolean;
  /** `contains` (default) keeps order; `fuzzy` ranks by match quality. */
  matchMode?: 'contains' | 'fuzzy';
  /** Accessible label for the search field. Default "Search". */
  searchLabel?: string;
  /** Accessible label for the list. */
  listLabel: string;
  placeholder?: string;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Turns the list into a single-select listbox driven from the search field. */
  selectable?: boolean;
  selectedKey?: React.Key | null;
  defaultSelectedKey?: React.Key | null;
  onSelectionChange?: (key: React.Key | null, item: T | null) => void;
  isItemDisabled?: (item: T) => boolean;
  /** Shown when nothing matches. Receives the query. */
  emptyState?: React.ReactNode | ((query: string) => React.ReactNode);
  /** Results summary for the live region. Default "N results". */
  formatCount?: (count: number, total: number) => string;
  /** Max height of the list before it scrolls. Number = px. Default 320. */
  maxHeight?: number | string;
  size?: 'sm' | 'md';
}

function SearchableListInner<T>(
  {
    items,
    getItemLabel,
    getItemKey = (item) => getItemLabel(item),
    getItemKeywords,
    renderItem,
    filter,
    matchMode = 'contains',
    searchLabel = 'Search',
    listLabel,
    placeholder,
    query: queryProp,
    defaultQuery = '',
    onQueryChange,
    selectable = false,
    selectedKey: selectedProp,
    defaultSelectedKey = null,
    onSelectionChange,
    isItemDisabled,
    emptyState,
    formatCount = (count, total) =>
      count === total
        ? `${total} ${total === 1 ? 'result' : 'results'}`
        : `${count} of ${total} ${total === 1 ? 'result' : 'results'}`,
    maxHeight = 320,
    size = 'md',
    className,
    ...props
  }: SearchableListProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const id = React.useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useControllableState({
    value: queryProp,
    defaultValue: defaultQuery,
    onChange: onQueryChange,
  });
  const [selectedKey, setSelectedKey] = useControllableState<React.Key | null>({
    value: selectedProp,
    defaultValue: defaultSelectedKey,
    onChange: (key) => onSelectionChange?.(key, items.find((i) => getItemKey(i) === key) ?? null),
  });
  const [active, setActive] = React.useState(-1);
  const listRef = React.useRef<HTMLUListElement>(null);
  const listOverflowing = useIsOverflowing(listRef);

  const results = React.useMemo(() => {
    const q = query.trim();
    if (!q) return items.slice();
    const text = (item: T) => [getItemLabel(item), ...(getItemKeywords?.(item) ?? [])].join(' ');
    if (filter) return items.filter((i) => filter(i, q));
    if (matchMode === 'fuzzy') {
      return items
        .map((item) => [item, fuzzyScore(text(item), q)] as const)
        .filter(([, s]) => s > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([item]) => item);
    }
    const lower = q.toLowerCase();
    return items.filter((i) => text(i).toLowerCase().includes(lower));
  }, [items, query, filter, matchMode, getItemLabel, getItemKeywords]);

  React.useEffect(() => setActive(-1), [query]);

  const optionId = (i: number) => `${id}-opt-${i}`;
  const disabled = (i: number) => (isItemDisabled ? isItemDisabled(results[i]!) : false);
  const step = (from: number, delta: number) => {
    let i = from;
    for (let n = 0; n < results.length; n++) {
      i += delta;
      if (i < 0 || i >= results.length) return from;
      if (!disabled(i)) return i;
    }
    return from;
  };
  const moveTo = (i: number) => {
    setActive(i);
    const el = document.getElementById(optionId(i));
    el?.scrollIntoView({ block: 'nearest' });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!selectable || results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveTo(active < 0 ? step(-1, 1) : step(active, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveTo(active < 0 ? step(results.length, -1) : step(active, -1));
    } else if (event.key === 'Home' && event.ctrlKey) {
      event.preventDefault();
      moveTo(step(-1, 1));
    } else if (event.key === 'End' && event.ctrlKey) {
      event.preventDefault();
      moveTo(step(results.length, -1));
    } else if (event.key === 'Enter' && active >= 0 && !disabled(active)) {
      event.preventDefault();
      setSelectedKey(getItemKey(results[active]!));
    }
  };

  const empty = results.length === 0;
  const status =
    empty && query ? `No results for “${query}”` : formatCount(results.length, items.length);

  return (
    <div
      ref={ref}
      className={cx('st-searchable-list', className)}
      data-size={size}
      data-selectable={selectable ? '' : undefined}
      {...props}
    >
      <SearchInput
        aria-label={searchLabel}
        placeholder={placeholder}
        size={size}
        value={query}
        onValueChange={setQuery}
        onKeyDown={onKeyDown}
        aria-controls={listId}
        {...(selectable && {
          role: 'combobox',
          'aria-expanded': true,
          'aria-autocomplete': 'list' as const,
          'aria-activedescendant': active >= 0 ? optionId(active) : undefined,
        })}
      />
      <p className="st-searchable-list__status" role="status">
        {status}
      </p>
      {empty ? (
        <div className="st-searchable-list__empty">
          {typeof emptyState === 'function'
            ? emptyState(query)
            : (emptyState ?? (
                <p>{query ? `Nothing matches “${query}”.` : 'Nothing to show yet.'}</p>
              ))}
        </div>
      ) : (
        <ul
          ref={listRef}
          id={listId}
          role={selectable ? 'listbox' : undefined}
          aria-label={listLabel}
          className="st-searchable-list__list"
          style={{ maxHeight }}
          tabIndex={listOverflowing ? 0 : selectable ? -1 : undefined}
        >
          {results.map((item, i) => {
            const key = getItemKey(item);
            const isSelected = selectable && key === selectedKey;
            const isActive = i === active;
            const isDisabled = disabled(i);
            return (
              <li
                key={key}
                id={optionId(i)}
                role={selectable ? 'option' : undefined}
                aria-selected={selectable ? isSelected : undefined}
                aria-disabled={selectable && isDisabled ? true : undefined}
                className="st-searchable-list__item"
                data-active={isActive ? '' : undefined}
                data-selected={isSelected ? '' : undefined}
                data-disabled={isDisabled ? '' : undefined}
                onMouseDown={selectable ? (e) => e.preventDefault() : undefined}
                onClick={
                  selectable && !isDisabled
                    ? () => {
                        setActive(i);
                        setSelectedKey(key);
                      }
                    : undefined
                }
              >
                {renderItem
                  ? renderItem(item, { active: isActive, selected: isSelected, query })
                  : getItemLabel(item)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * A search field paired with a filtered list. Announces result counts and, when
 * `selectable`, works as a combobox-driven listbox for picking one item.
 */
export const SearchableList = React.forwardRef(SearchableListInner) as <T>(
  props: SearchableListProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement;
