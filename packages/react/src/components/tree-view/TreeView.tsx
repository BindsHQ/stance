'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';

export interface TreeItem {
  id: string;
  label: string;
  children?: TreeItem[];
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Extra content on the right of the row (counts, status). */
  meta?: React.ReactNode;
}

export interface TreeItemState {
  expanded: boolean;
  selected: boolean;
  hasChildren: boolean;
  level: number;
}

export interface TreeViewProps extends Omit<React.HTMLAttributes<HTMLUListElement>, 'onSelect'> {
  items: TreeItem[];
  /** Accessible name of the tree (or use aria-labelledby). */
  'aria-label'?: string;
  /** Default `single`. `none` makes the tree navigation-only. */
  selectionMode?: 'none' | 'single' | 'multiple';
  selected?: string[];
  defaultSelected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Called on Enter or click of an item, e.g. to open a file. */
  onAction?: (item: TreeItem) => void;
  /** Override the icon for an item. */
  renderIcon?: (item: TreeItem, state: TreeItemState) => React.ReactNode;
  size?: 'sm' | 'md';
}

interface FlatNode {
  item: TreeItem;
  level: number;
  parentId: string | null;
  posinset: number;
  setsize: number;
}

function flattenVisible(
  items: TreeItem[],
  expanded: Set<string>,
  level = 1,
  parentId: string | null = null,
  out: FlatNode[] = [],
): FlatNode[] {
  items.forEach((item, i) => {
    out.push({ item, level, parentId, posinset: i + 1, setsize: items.length });
    if (item.children?.length && expanded.has(item.id))
      flattenVisible(item.children, expanded, level + 1, item.id, out);
  });
  return out;
}

function findSiblings(items: TreeItem[], id: string): TreeItem[] | null {
  if (items.some((i) => i.id === id)) return items;
  for (const item of items) {
    if (item.children) {
      const found = findSiblings(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

function collectIds(items: TreeItem[], out: string[] = []): string[] {
  for (const i of items) {
    if (!i.disabled) out.push(i.id);
    if (i.children) collectIds(i.children, out);
  }
  return out;
}

/** Hierarchical navigation and selection (WAI-ARIA tree pattern). */
export const TreeView = React.forwardRef<HTMLUListElement, TreeViewProps>(function TreeView(
  {
    items,
    selectionMode = 'single',
    selected: selectedProp,
    defaultSelected = [],
    onSelectedChange,
    expanded: expandedProp,
    defaultExpanded = [],
    onExpandedChange,
    onAction,
    renderIcon,
    size = 'md',
    className,
    ...props
  },
  ref,
) {
  const [selected, setSelected] = useControllableState({
    value: selectedProp,
    defaultValue: defaultSelected,
    onChange: onSelectedChange,
  });
  const [expanded, setExpanded] = useControllableState({
    value: expandedProp,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  const expandedSet = React.useMemo(() => new Set(expanded), [expanded]);
  const selectedSet = React.useMemo(() => new Set(selected), [selected]);
  const visible = React.useMemo(() => flattenVisible(items, expandedSet), [items, expandedSet]);
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const itemRefs = React.useRef(new Map<string, HTMLLIElement>());
  const typeahead = React.useRef({ buffer: '', timer: 0 as number | undefined });

  // The tab stop: focused item, else first selected visible, else first enabled.
  const tabStopId =
    (focusedId && visible.some((n) => n.item.id === focusedId) ? focusedId : null) ??
    visible.find((n) => selectedSet.has(n.item.id))?.item.id ??
    visible.find((n) => !n.item.disabled)?.item.id ??
    null;

  const focusItem = (id: string | undefined) => {
    if (!id) return;
    setFocusedId(id);
    itemRefs.current.get(id)?.focus();
  };

  const toggleExpanded = (id: string, open?: boolean) => {
    const isOpen = expandedSet.has(id);
    const next = open ?? !isOpen;
    if (next === isOpen) return;
    setExpanded(next ? [...expanded, id] : expanded.filter((e) => e !== id));
  };

  const select = (item: TreeItem, mode: 'replace' | 'toggle' = 'replace') => {
    if (selectionMode === 'none' || item.disabled) return;
    if (selectionMode === 'single') {
      setSelected([item.id]);
      return;
    }
    if (mode === 'toggle') {
      setSelected(
        selectedSet.has(item.id) ? selected.filter((s) => s !== item.id) : [...selected, item.id],
      );
    } else {
      setSelected([item.id]);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLUListElement>, node: FlatNode) => {
    // Ignore events bubbling from nested items' handlers.
    if (
      event.currentTarget !== event.target &&
      !(event.target as HTMLElement).matches('[role=treeitem]')
    )
      return;
    const index = visible.findIndex((n) => n.item.id === node.item.id);
    const enabledFrom = (start: number, step: 1 | -1) => {
      for (let i = start; i >= 0 && i < visible.length; i += step)
        if (!visible[i]!.item.disabled) return visible[i]!;
      return undefined;
    };
    const hasChildren = !!node.item.children?.length;
    const isOpen = expandedSet.has(node.item.id);
    let handled = true;
    switch (event.key) {
      case 'ArrowDown': {
        const next = enabledFrom(index + 1, 1);
        focusItem(next?.item.id);
        if (next && event.shiftKey && selectionMode === 'multiple') select(next.item, 'toggle');
        break;
      }
      case 'ArrowUp': {
        const prev = enabledFrom(index - 1, -1);
        focusItem(prev?.item.id);
        if (prev && event.shiftKey && selectionMode === 'multiple') select(prev.item, 'toggle');
        break;
      }
      case 'ArrowRight':
        if (hasChildren && !isOpen) toggleExpanded(node.item.id, true);
        else if (hasChildren && isOpen) focusItem(node.item.children!.find((c) => !c.disabled)?.id);
        break;
      case 'ArrowLeft':
        if (hasChildren && isOpen) toggleExpanded(node.item.id, false);
        else if (node.parentId) focusItem(node.parentId);
        break;
      case 'Home':
        focusItem(enabledFrom(0, 1)?.item.id);
        break;
      case 'End':
        focusItem(enabledFrom(visible.length - 1, -1)?.item.id);
        break;
      case 'Enter':
        select(node.item, selectionMode === 'multiple' ? 'toggle' : 'replace');
        if (!node.item.disabled) onAction?.(node.item);
        break;
      case ' ':
        select(node.item, selectionMode === 'multiple' ? 'toggle' : 'replace');
        break;
      case '*': {
        const siblings = findSiblings(items, node.item.id) ?? [];
        const toOpen = siblings
          .filter((s) => s.children?.length && !expandedSet.has(s.id))
          .map((s) => s.id);
        if (toOpen.length) setExpanded([...expanded, ...toOpen]);
        break;
      }
      case 'a':
        if ((event.ctrlKey || event.metaKey) && selectionMode === 'multiple') {
          setSelected(collectIds(items));
          break;
        }
        handled = false;
        break;
      default:
        handled = false;
    }
    if (!handled && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const t = typeahead.current;
      window.clearTimeout(t.timer);
      t.buffer += event.key.toLowerCase();
      t.timer = window.setTimeout(() => (t.buffer = ''), 600);
      const ordered = [...visible.slice(index + 1), ...visible.slice(0, index + 1)];
      const search = t.buffer.split('').every((c) => c === t.buffer[0]) ? t.buffer[0]! : t.buffer;
      const match = ordered.find(
        (n) => !n.item.disabled && n.item.label.toLowerCase().startsWith(search),
      );
      if (match) focusItem(match.item.id);
      handled = true;
    }
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const renderItems = (list: TreeItem[], level: number, parentId: string | null): React.ReactNode =>
    list.map((item, i) => {
      const hasChildren = !!item.children?.length;
      const isOpen = hasChildren && expandedSet.has(item.id);
      const isSelected = selectedSet.has(item.id);
      const node: FlatNode = { item, level, parentId, posinset: i + 1, setsize: list.length };
      const state: TreeItemState = { expanded: isOpen, selected: isSelected, hasChildren, level };
      return (
        <li
          key={item.id}
          ref={(el) => {
            if (el) itemRefs.current.set(item.id, el);
            else itemRefs.current.delete(item.id);
          }}
          role="treeitem"
          aria-level={level}
          aria-setsize={list.length}
          aria-posinset={i + 1}
          aria-expanded={hasChildren ? isOpen : undefined}
          aria-selected={selectionMode === 'none' ? undefined : isSelected}
          aria-disabled={item.disabled || undefined}
          tabIndex={item.id === tabStopId ? 0 : -1}
          className="st-tree__item"
          data-selected={isSelected ? '' : undefined}
          data-disabled={item.disabled ? '' : undefined}
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocusedId(item.id);
          }}
          onKeyDown={(e) => onKeyDown(e as unknown as React.KeyboardEvent<HTMLUListElement>, node)}
        >
          <div
            className="st-tree__row"
            style={{ ['--st-tree-level' as string]: level - 1 }}
            onClick={(e) => {
              if (item.disabled) return;
              focusItem(item.id);
              select(
                item,
                selectionMode === 'multiple' && (e.metaKey || e.ctrlKey) ? 'toggle' : 'replace',
              );
              if (hasChildren && !(e.target as HTMLElement).closest('.st-tree__toggle'))
                toggleExpanded(item.id);
              onAction?.(item);
            }}
          >
            <span
              className="st-tree__toggle"
              aria-hidden="true"
              data-visible={hasChildren ? '' : undefined}
              onClick={(e) => {
                if (!hasChildren || item.disabled) return;
                e.stopPropagation();
                focusItem(item.id);
                toggleExpanded(item.id);
              }}
            >
              {hasChildren && <Icon name="chevron-right" size={14} />}
            </span>
            {(renderIcon || item.icon) && (
              <span className="st-tree__icon" aria-hidden="true">
                {renderIcon ? renderIcon(item, state) : item.icon}
              </span>
            )}
            <span className="st-tree__label">{item.label}</span>
            {item.meta != null && <span className="st-tree__meta">{item.meta}</span>}
          </div>
          {hasChildren && isOpen && (
            <ul role="group" className="st-tree__group">
              {renderItems(item.children!, level + 1, item.id)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <ul
      ref={ref}
      role="tree"
      aria-multiselectable={selectionMode === 'multiple' || undefined}
      className={cx('st-tree', className)}
      data-size={size}
      {...props}
    >
      {renderItems(items, 1, null)}
    </ul>
  );
});
