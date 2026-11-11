'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';

export interface SortableItemState {
  index: number;
  /** True while this item is picked up (keyboard) or being dragged (pointer). */
  dragging: boolean;
  disabled: boolean;
}

export interface SortableListLabels {
  /** Handle name. Receives the item label. */
  handle: (item: string) => string;
  moveUp: (item: string) => string;
  moveDown: (item: string) => string;
  instructions: string;
  pickedUp: (item: string, position: number, total: number) => string;
  moved: (item: string, position: number, total: number) => string;
  dropped: (item: string, position: number, total: number) => string;
  cancelled: (item: string) => string;
}

const defaultLabels: SortableListLabels = {
  handle: (item) => `Reorder ${item}`,
  moveUp: (item) => `Move ${item} up`,
  moveDown: (item) => `Move ${item} down`,
  instructions:
    'Press Space or Enter to pick up an item, use the arrow keys to move it, Space or Enter to drop it, and Escape to cancel.',
  pickedUp: (item, position, total) => `Picked up ${item}, position ${position} of ${total}`,
  moved: (item, position, total) => `${item} moved to position ${position} of ${total}`,
  dropped: (item, position, total) => `Dropped ${item} at position ${position} of ${total}`,
  cancelled: (item) => `Cancelled. ${item} returned to its original position`,
};

export interface SortableListHandle {
  /** Moves an item programmatically and calls `onReorder`. */
  moveItem: (from: number, to: number) => void;
}

export interface SortableListProps<T> extends Omit<
  React.HTMLAttributes<HTMLUListElement>,
  'children' | 'onDragStart' | 'onDragEnd'
> {
  items: T[];
  getItemId: (item: T) => string;
  /** Plain-text label for an item, used in handle names and announcements. Defaults to its id. */
  getItemLabel?: (item: T) => string;
  renderItem: (item: T, state: SortableItemState) => React.ReactNode;
  /** Called with the new order when an item is dropped or moved. */
  onReorder: (items: T[], move: { from: number; to: number }) => void;
  /** Accessible name of the list. */
  label: string;
  disabled?: boolean;
  /** Show Move up / Move down buttons, a single-pointer alternative to dragging (WCAG 2.5.7). */
  showMoveButtons?: boolean;
  labels?: Partial<SortableListLabels>;
}

/** Returns a copy of `list` with the item at `from` moved to `to`. */
export function arrayMove<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  if (from === to || from < 0 || from >= next.length) return next;
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item as T);
  return next;
}

interface DragState {
  id: string;
  from: number;
  /** Current position in the working order. */
  index: number;
  mode: 'keyboard' | 'pointer';
  /** Pointer offset in px applied to the dragged item. */
  offset: number;
}

function SortableListInner<T>(
  {
    items,
    getItemId,
    getItemLabel,
    renderItem,
    onReorder,
    label,
    disabled = false,
    showMoveButtons = false,
    labels: labelsProp,
    className,
    ...props
  }: SortableListProps<T>,
  ref: React.ForwardedRef<SortableListHandle>,
) {
  const labels = { ...defaultLabels, ...labelsProp };
  const text = (item: T) => (getItemLabel ? getItemLabel(item) : getItemId(item));
  const [drag, setDrag] = React.useState<DragState | null>(null);
  const [announcement, setAnnouncement] = React.useState('');
  const listRef = React.useRef<HTMLUListElement>(null);
  const instructionsId = React.useId();
  const pointer = React.useRef<{ startY: number; rects: { top: number; height: number }[] } | null>(
    null,
  );
  const refocus = React.useRef<string | null>(null);

  // The order shown while an item is picked up.
  const order = drag
    ? arrayMove(
        items,
        items.findIndex((i) => getItemId(i) === drag.id),
        drag.index,
      )
    : items;

  // Keep focus on the handle of the item that moved.
  React.useEffect(() => {
    if (!refocus.current) return;
    const id = refocus.current;
    const handle = listRef.current?.querySelector<HTMLElement>(
      `[data-sortable-id="${CSS.escape(id)}"] [data-sortable-handle]`,
    );
    if (handle && document.activeElement !== handle) handle.focus();
    if (!drag) refocus.current = null;
  });

  const commit = (from: number, to: number) => {
    if (from === to) return;
    onReorder(arrayMove(items, from, to), { from, to });
  };

  React.useImperativeHandle(ref, () => ({ moveItem: (from, to) => commit(from, to) }));

  const moveBy = (item: T, index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= items.length) return;
    refocus.current = getItemId(item);
    commit(index, to);
    setAnnouncement(labels.moved(text(item), to + 1, items.length));
  };

  const onHandleKeyDown = (event: React.KeyboardEvent, item: T, index: number) => {
    if (disabled) return;
    const id = getItemId(item);
    const total = items.length;
    if (!drag) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        setDrag({ id, from: index, index, mode: 'keyboard', offset: 0 });
        setAnnouncement(labels.pickedUp(text(item), index + 1, total));
      }
      return;
    }
    if (drag.id !== id || drag.mode !== 'keyboard') return;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const next = Math.max(
          0,
          Math.min(total - 1, drag.index + (event.key === 'ArrowDown' ? 1 : -1)),
        );
        if (next !== drag.index) {
          refocus.current = id;
          setDrag({ ...drag, index: next });
          setAnnouncement(labels.moved(text(item), next + 1, total));
        }
        break;
      }
      case 'Home':
      case 'End': {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : total - 1;
        refocus.current = id;
        setDrag({ ...drag, index: next });
        setAnnouncement(labels.moved(text(item), next + 1, total));
        break;
      }
      case ' ':
      case 'Enter':
        event.preventDefault();
        refocus.current = id;
        setDrag(null);
        commit(drag.from, drag.index);
        setAnnouncement(labels.dropped(text(item), drag.index + 1, total));
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        refocus.current = id;
        setDrag(null);
        setAnnouncement(labels.cancelled(text(item)));
        break;
      case 'Tab':
        // Leaving the handle drops the item where it is.
        setDrag(null);
        commit(drag.from, drag.index);
        setAnnouncement(labels.dropped(text(item), drag.index + 1, total));
        break;
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>, item: T, index: number) => {
    if (disabled || drag || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const list = listRef.current;
    if (!list) return;
    const rects = Array.from(list.children).map((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      return { top: r.top, height: r.height };
    });
    pointer.current = { startY: event.clientY, rects };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDrag({ id: getItemId(item), from: index, index, mode: 'pointer', offset: 0 });
  };
  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const p = pointer.current;
    if (!p || !drag || drag.mode !== 'pointer') return;
    const delta = event.clientY - p.startY;
    const origin = p.rects[drag.from];
    if (!origin) return;
    const centre = origin.top + origin.height / 2 + delta;
    // The target slot is the one whose original box contains the dragged item's centre.
    let target = drag.from;
    for (let i = 0; i < p.rects.length; i++) {
      const r = p.rects[i]!;
      if (centre >= r.top && centre < r.top + r.height) target = i;
    }
    if (centre < p.rects[0]!.top) target = 0;
    const last = p.rects[p.rects.length - 1]!;
    if (centre >= last.top + last.height) target = p.rects.length - 1;
    // Visual offset is relative to the slot the item currently occupies.
    const slot = p.rects[target]!;
    setDrag({ ...drag, index: target, offset: origin.top + delta - slot.top });
  };
  const endPointer = (cancelled: boolean) => {
    if (!drag || drag.mode !== 'pointer') return;
    pointer.current = null;
    const item = items[drag.from];
    setDrag(null);
    if (!item) return;
    if (cancelled) {
      setAnnouncement(labels.cancelled(text(item)));
    } else if (drag.index !== drag.from) {
      commit(drag.from, drag.index);
      setAnnouncement(labels.dropped(text(item), drag.index + 1, items.length));
    }
  };

  return (
    <>
      <ul
        ref={listRef}
        aria-label={label}
        aria-describedby={instructionsId}
        className={cx('st-sortable-list', className)}
        data-dragging={drag ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        {...props}
      >
        {order.map((item, index) => {
          const id = getItemId(item);
          const dragging = drag?.id === id;
          const name = text(item);
          return (
            <li
              key={id}
              className="st-sortable-list__item"
              data-sortable-id={id}
              data-dragging={dragging ? drag!.mode : undefined}
              style={
                dragging && drag!.mode === 'pointer'
                  ? { transform: `translateY(${drag!.offset}px)` }
                  : undefined
              }
            >
              <button
                type="button"
                className="st-sortable-list__handle"
                data-sortable-handle=""
                aria-label={labels.handle(name)}
                aria-pressed={dragging && drag!.mode === 'keyboard' ? true : undefined}
                aria-describedby={instructionsId}
                disabled={disabled}
                onKeyDown={(e) => onHandleKeyDown(e, item, index)}
                onPointerDown={(e) => onPointerDown(e, item, index)}
                onPointerMove={onPointerMove}
                onPointerUp={() => endPointer(false)}
                onPointerCancel={() => endPointer(true)}
                onBlur={() => {
                  if (dragging && drag!.mode === 'keyboard' && refocus.current !== id) {
                    setDrag(null);
                    commit(drag!.from, drag!.index);
                  }
                }}
              >
                <Icon name="grip-vertical" size={16} />
              </button>
              <div className="st-sortable-list__content">
                {renderItem(item, { index, dragging: !!dragging, disabled })}
              </div>
              {showMoveButtons && (
                <span className="st-sortable-list__moves">
                  <button
                    type="button"
                    className="st-sortable-list__move"
                    aria-label={labels.moveUp(name)}
                    disabled={disabled || index === 0 || !!drag}
                    onClick={() => moveBy(item, index, -1)}
                  >
                    <Icon name="chevron-up" size={16} />
                  </button>
                  <button
                    type="button"
                    className="st-sortable-list__move"
                    aria-label={labels.moveDown(name)}
                    disabled={disabled || index === order.length - 1 || !!drag}
                    onClick={() => moveBy(item, index, 1)}
                  >
                    <Icon name="chevron-down" size={16} />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <span id={instructionsId} hidden>
        {labels.instructions}
      </span>
      <span className="st-sr-only" role="status" aria-live="assertive">
        {announcement}
      </span>
    </>
  );
}

/**
 * A list people can reorder by dragging a handle, with the keyboard, or with Move up and
 * Move down buttons. Every change is announced to assistive technology.
 */
export const SortableList = React.forwardRef(SortableListInner) as <T>(
  props: SortableListProps<T> & { ref?: React.Ref<SortableListHandle> },
) => React.ReactElement;
