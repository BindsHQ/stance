'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useVirtual, type ScrollAlign } from '../../internal/virtual.js';

export interface VirtualizedListHandle {
  /** Scrolls so the item at `index` is visible. */
  scrollToIndex: (index: number, align?: ScrollAlign) => void;
  /** The scroll container element. */
  element: HTMLDivElement | null;
}

export interface VirtualizedListProps<T> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'role' | 'children' | 'onSelect'
> {
  /** Items to render. Only the visible window is mounted. */
  items: readonly T[];
  /** Renders one item. Return content only; Stance wraps it in the list item element. */
  renderItem: (
    item: T,
    index: number,
    state: { active: boolean; selected: boolean },
  ) => React.ReactNode;
  /** Stable key per item. Defaults to the index. */
  getItemKey?: (item: T, index: number) => React.Key;
  /** Fixed item height in px, or a function of the index. Omit to measure items as they render. */
  itemHeight?: number | ((index: number) => number);
  /** Height estimate for unmeasured items. Default 40. */
  estimatedItemHeight?: number;
  /** Viewport height. Number = px. Default 400. */
  height?: number | string;
  /** Items rendered beyond each edge of the viewport. Default 4. */
  overscan?: number;
  /** `list` (default) for display; `listbox` for a keyboard-selectable list. */
  role?: 'list' | 'listbox';
  /** Text label for the item (used for listbox typeahead-free accessible names when content is rich). */
  getItemLabel?: (item: T, index: number) => string;
  /** Listbox: selected item key (controlled). */
  selectedKey?: React.Key | null;
  defaultSelectedKey?: React.Key | null;
  onSelectionChange?: (key: React.Key | null, item: T | null) => void;
  /** Listbox: whether an item can be selected. */
  isItemDisabled?: (item: T, index: number) => boolean;
  /** Imperative handle with `scrollToIndex`. */
  apiRef?: React.Ref<VirtualizedListHandle>;
  /** Rendered when `items` is empty. */
  emptyState?: React.ReactNode;
}

function VirtualizedListInner<T>(
  {
    items,
    renderItem,
    getItemKey = (_item, index) => index,
    itemHeight,
    estimatedItemHeight = 40,
    height = 400,
    overscan = 4,
    role = 'list',
    getItemLabel,
    selectedKey: selectedProp,
    defaultSelectedKey = null,
    onSelectionChange,
    isItemDisabled,
    apiRef,
    emptyState,
    className,
    style,
    onKeyDown,
    ...props
  }: VirtualizedListProps<T>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const ref = useComposedRefs(forwardedRef, scrollRef);
  const id = React.useId();
  const listbox = role === 'listbox';
  const {
    items: virtualItems,
    totalSize,
    scrollToIndex,
    measureElement,
  } = useVirtual({
    count: items.length,
    scrollRef,
    itemSize: itemHeight,
    estimatedItemSize: estimatedItemHeight,
    overscan,
    initialViewportSize: typeof height === 'number' ? height : 400,
  });
  const [selectedKey, setSelectedKey] = useControllableState<React.Key | null>({
    value: selectedProp,
    defaultValue: defaultSelectedKey,
    onChange: (key) => {
      const index = key == null ? -1 : items.findIndex((it, i) => getItemKey(it, i) === key);
      onSelectionChange?.(key, index >= 0 ? items[index]! : null);
    },
  });
  const selectedIndex =
    selectedKey == null ? -1 : items.findIndex((it, i) => getItemKey(it, i) === selectedKey);
  const [active, setActive] = React.useState(-1);

  React.useImperativeHandle(apiRef, () => ({ scrollToIndex, element: scrollRef.current }), [
    scrollToIndex,
  ]);

  const disabled = (i: number) => (isItemDisabled ? isItemDisabled(items[i]!, i) : false);
  const move = (from: number, delta: number) => {
    let i = from;
    for (let n = 0; n < items.length; n++) {
      i += delta;
      if (i < 0 || i >= items.length) return from;
      if (!disabled(i)) return i;
    }
    return from;
  };
  const edge = (start: boolean) => {
    if (start) return move(-1, 1);
    return move(items.length, -1);
  };
  const focusIndex = (i: number) => {
    if (i < 0) return;
    setActive(i);
    scrollToIndex(i);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !listbox || items.length === 0) return;
    const current = active >= 0 ? active : selectedIndex;
    const page = Math.max(
      1,
      Math.floor(
        (scrollRef.current?.clientHeight || (typeof height === 'number' ? height : 400)) /
          (typeof itemHeight === 'number' ? itemHeight : estimatedItemHeight),
      ) - 1,
    );
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = current < 0 ? edge(true) : move(current, 1);
        break;
      case 'ArrowUp':
        next = current < 0 ? edge(false) : move(current, -1);
        break;
      case 'Home':
        next = edge(true);
        break;
      case 'End':
        next = edge(false);
        break;
      case 'PageDown':
        next = Math.min(items.length - 1, Math.max(0, current) + page);
        if (disabled(next)) next = move(next, -1);
        break;
      case 'PageUp':
        next = Math.max(0, Math.max(0, current) - page);
        if (disabled(next)) next = move(next, 1);
        break;
      case 'Enter':
      case ' ':
        if (current >= 0 && !disabled(current)) {
          event.preventDefault();
          setSelectedKey(getItemKey(items[current]!, current));
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    focusIndex(next);
  };

  const optionId = (i: number) => `${id}-item-${i}`;

  if (items.length === 0 && emptyState) {
    return (
      <div
        ref={ref}
        className={cx('st-virtualized-list', className)}
        data-empty=""
        style={style}
        {...props}
      >
        {emptyState}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role={role}
      tabIndex={0}
      aria-activedescendant={listbox && active >= 0 ? optionId(active) : undefined}
      className={cx('st-virtualized-list', className)}
      data-role={role}
      style={{ height, ...style }}
      onKeyDown={handleKeyDown}
      onFocus={(e) => {
        props.onFocus?.(e);
        if (listbox && active < 0 && items.length > 0)
          setActive(selectedIndex >= 0 ? selectedIndex : edge(true));
      }}
      {...props}
    >
      <div role="none" className="st-virtualized-list__sizer" style={{ height: totalSize }}>
        {virtualItems.map((v) => {
          const item = items[v.index]!;
          const isSelected = v.index === selectedIndex;
          const isActive = v.index === active;
          const isDisabled = disabled(v.index);
          return (
            <div
              key={getItemKey(item, v.index)}
              ref={itemHeight === undefined ? measureElement : undefined}
              id={optionId(v.index)}
              data-index={v.index}
              role={listbox ? 'option' : 'listitem'}
              aria-setsize={items.length}
              aria-posinset={v.index + 1}
              aria-selected={listbox ? isSelected : undefined}
              aria-disabled={listbox && isDisabled ? true : undefined}
              aria-label={getItemLabel ? getItemLabel(item, v.index) : undefined}
              className="st-virtualized-list__item"
              data-active={isActive ? '' : undefined}
              data-selected={isSelected ? '' : undefined}
              data-disabled={isDisabled ? '' : undefined}
              style={{
                transform: `translateY(${v.start}px)`,
                height: itemHeight !== undefined ? v.size : undefined,
              }}
              onClick={
                listbox && !isDisabled
                  ? () => {
                      setActive(v.index);
                      setSelectedKey(getItemKey(item, v.index));
                    }
                  : undefined
              }
            >
              {renderItem(item, v.index, { active: isActive, selected: isSelected })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Renders long lists efficiently by mounting only the visible window.
 * Works as a plain list or as a keyboard-selectable listbox.
 */
export const VirtualizedList = React.forwardRef(VirtualizedListInner) as <T>(
  props: VirtualizedListProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement;
