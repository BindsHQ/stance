'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { isRtl, logicalKey } from '../../internal/direction.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useVirtual } from '../../internal/virtual.js';

export interface DataGridColumn<T> {
  id: string;
  /** Header text (also used for accessible names). */
  header: string;
  /** Raw value for display and editing. */
  accessor?: keyof T | ((row: T) => unknown);
  /** Custom display renderer (read-only content). */
  cell?: (row: T, rowIndex: number) => React.ReactNode;
  /** Initial width in px. Default 160. */
  width?: number;
  /** Minimum width in px when resizing. Default 64. */
  minWidth?: number;
  /** Maximum width in px when resizing. Default 640. */
  maxWidth?: number;
  /** Allow editing this column's cells. */
  editable?: boolean;
  align?: 'start' | 'center' | 'end';
}

export interface DataGridProps<T> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  columns: DataGridColumn<T>[];
  data: readonly T[];
  getRowId?: (row: T, index: number) => string;
  /** Accessible name of the grid. */
  'aria-label': string;
  /** Viewport height in px. Default 400. */
  height?: number;
  /** Row height in px. Default 40. */
  rowHeight?: number;
  /** Rows rendered beyond the viewport. Default 6. */
  overscan?: number;
  /** Keep the first column visible while scrolling horizontally. */
  pinFirstColumn?: boolean;
  /** Called when an edit is committed. Update `data` to reflect it. */
  onCellEdit?: (edit: { rowId: string; columnId: string; value: string; row: T }) => void;
  /** Allow column resizing. Default true. */
  resizableColumns?: boolean;
  columnWidths?: Record<string, number>;
  defaultColumnWidths?: Record<string, number>;
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
}

interface Pos {
  row: number; // 0 = header row
  col: number;
}

function rawValue<T>(row: T, col: DataGridColumn<T>): unknown {
  if (typeof col.accessor === 'function') return col.accessor(row);
  if (col.accessor !== undefined) return row[col.accessor];
  return undefined;
}

const isPrintable = (e: React.KeyboardEvent) =>
  e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;

function DataGridInner<T>(
  {
    columns,
    data,
    getRowId = (_row, i) => String(i),
    height = 400,
    rowHeight = 40,
    overscan = 6,
    pinFirstColumn = false,
    onCellEdit,
    resizableColumns = true,
    columnWidths: widthsProp,
    defaultColumnWidths,
    onColumnWidthsChange,
    className,
    style,
    ...props
  }: DataGridProps<T>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const ref = useComposedRefs(forwardedRef, scrollRef);
  const id = React.useId();
  const initialWidths = React.useMemo(
    () =>
      Object.fromEntries(columns.map((c) => [c.id, defaultColumnWidths?.[c.id] ?? c.width ?? 160])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [widths, setWidths] = useControllableState<Record<string, number>>({
    value: widthsProp,
    defaultValue: initialWidths,
    onChange: onColumnWidthsChange,
  });
  const widthOf = (c: DataGridColumn<T>) => widths[c.id] ?? c.width ?? 160;
  const template = columns.map((c) => `${widthOf(c)}px`).join(' ');
  const totalWidth = columns.reduce((sum, c) => sum + widthOf(c), 0);

  const headerHeight = rowHeight;
  const { items, totalSize, scrollToIndex } = useVirtual({
    count: data.length,
    scrollRef,
    itemSize: rowHeight,
    overscan,
    initialViewportSize: height - headerHeight,
  });

  const [active, setActive] = React.useState<Pos>({ row: data.length > 0 ? 1 : 0, col: 0 });
  const [editing, setEditingState] = React.useState<{ pos: Pos; value: string } | null>(null);
  const editingRef = React.useRef<{ pos: Pos; value: string } | null>(null);
  const setEditing = (next: { pos: Pos; value: string } | null) => {
    editingRef.current = next;
    setEditingState(next);
  };
  const [resizingCol, setResizingCol] = React.useState<number | null>(null);
  const pendingFocus = React.useRef<'cell' | 'handle' | null>(null);
  const [announcement, setAnnouncement] = React.useState('');

  // Keep the active position valid when data/columns change.
  React.useEffect(() => {
    setActive((p) => ({
      row: Math.min(p.row, data.length),
      col: Math.min(p.col, Math.max(0, columns.length - 1)),
    }));
  }, [data.length, columns.length]);

  const cellId = (p: Pos) => `${id}-r${p.row}-c${p.col}`;
  const handleId = (col: number) => `${id}-resize-${col}`;

  // Move DOM focus after state changes, scrolling the target row into the window if needed.
  React.useEffect(() => {
    if (!pendingFocus.current) return;
    if (pendingFocus.current === 'handle' && resizingCol !== null) {
      document.getElementById(handleId(resizingCol))?.focus();
      pendingFocus.current = null;
      return;
    }
    const el = document.getElementById(cellId(active));
    if (el) {
      el.focus({ preventScroll: false });
      el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      pendingFocus.current = null;
    } else if (active.row > 0) {
      scrollToIndex(active.row - 1, 'auto');
    }
  });

  const focusCell = (p: Pos) => {
    const next = {
      row: Math.min(Math.max(0, p.row), data.length),
      col: Math.min(Math.max(0, p.col), columns.length - 1),
    };
    pendingFocus.current = 'cell';
    setActive(next);
  };

  const pageRows = Math.max(1, Math.floor((height - headerHeight) / rowHeight) - 1);

  const startEdit = (p: Pos, initial?: string) => {
    const col = columns[p.col];
    if (!col?.editable || p.row === 0) return false;
    const row = data[p.row - 1]!;
    const value = initial ?? String(rawValue(row, col) ?? '');
    setEditing({ pos: p, value });
    return true;
  };

  const commitEdit = (moveDown = false) => {
    const current = editingRef.current;
    if (!current) return;
    const { pos, value } = current;
    const row = data[pos.row - 1];
    const col = columns[pos.col];
    setEditing(null);
    if (row && col) {
      const before = String(rawValue(row, col) ?? '');
      if (before !== value) {
        onCellEdit?.({ rowId: getRowId(row, pos.row - 1), columnId: col.id, value, row });
        setAnnouncement(`${col.header} updated`);
      }
    }
    focusCell(
      moveDown ? { row: pos.row + 1 > data.length ? pos.row : pos.row + 1, col: pos.col } : pos,
    );
  };

  const cancelEdit = () => {
    const current = editingRef.current;
    if (!current) return;
    const pos = current.pos;
    setEditing(null);
    setAnnouncement('Edit cancelled');
    focusCell(pos);
  };

  const resizeBy = (colIndex: number, delta: number, absolute?: number) => {
    const col = columns[colIndex]!;
    const min = col.minWidth ?? 64;
    const max = col.maxWidth ?? 640;
    const next = Math.round(Math.min(max, Math.max(min, absolute ?? widthOf(col) + delta)));
    setWidths({ ...widths, [col.id]: next });
  };

  const onCellKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, p: Pos) => {
    if (editing) return;
    const { key, ctrlKey, metaKey } = event;
    const mod = ctrlKey || metaKey;
    let next: Pos | null;
    // Columns are laid out along the inline axis, so horizontal arrows swap in RTL.
    switch (logicalKey(key, event.currentTarget)) {
      case 'ArrowRight':
        next = { row: p.row, col: p.col + 1 };
        break;
      case 'ArrowLeft':
        next = { row: p.row, col: p.col - 1 };
        break;
      case 'ArrowDown':
        next = { row: p.row + 1, col: p.col };
        break;
      case 'ArrowUp':
        next = { row: p.row - 1, col: p.col };
        break;
      case 'Home':
        next = mod ? { row: 0, col: 0 } : { row: p.row, col: 0 };
        break;
      case 'End':
        next = mod
          ? { row: data.length, col: columns.length - 1 }
          : { row: p.row, col: columns.length - 1 };
        break;
      case 'PageDown':
        next = { row: Math.min(data.length, p.row + pageRows), col: p.col };
        break;
      case 'PageUp':
        next = { row: Math.max(p.row === 0 ? 0 : 1, p.row - pageRows), col: p.col };
        break;
      case 'Enter':
      case 'F2':
        if (p.row === 0) {
          if (resizableColumns) {
            event.preventDefault();
            pendingFocus.current = 'handle';
            setResizingCol(p.col);
          }
          return;
        }
        if (startEdit(p)) event.preventDefault();
        return;
      default:
        if (p.row > 0 && isPrintable(event) && columns[p.col]?.editable) {
          event.preventDefault();
          startEdit(p, key);
        }
        return;
    }
    event.preventDefault();
    focusCell(next);
  };

  const onHandleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, colIndex: number) => {
    const step = event.shiftKey ? 50 : 10;
    const col = columns[colIndex]!;
    switch (logicalKey(event.key, event.currentTarget)) {
      case 'ArrowRight':
        resizeBy(colIndex, step);
        break;
      case 'ArrowLeft':
        resizeBy(colIndex, -step);
        break;
      case 'Home':
        resizeBy(colIndex, 0, col.minWidth ?? 64);
        break;
      case 'End':
        resizeBy(colIndex, 0, col.maxWidth ?? 640);
        break;
      case 'Escape':
      case 'Enter':
      case 'Tab':
        setResizingCol(null);
        focusCell({ row: 0, col: colIndex });
        if (event.key === 'Tab') return;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const drag = React.useRef<{ col: number; startX: number; startW: number; sign: 1 | -1 } | null>(
    null,
  );

  const renderCellContent = (row: T, rowIndex: number, col: DataGridColumn<T>) =>
    col.cell ? col.cell(row, rowIndex) : String(rawValue(row, col) ?? '');

  return (
    <div
      className={cx('st-data-grid', className)}
      data-pinned={pinFirstColumn ? '' : undefined}
      style={style}
    >
      <div
        ref={ref}
        role="grid"
        aria-rowcount={data.length + 1}
        aria-colcount={columns.length}
        className="st-data-grid__scroll"
        style={{
          height,
          ['--_row-h' as string]: `${rowHeight}px`,
          ['--_head-h' as string]: `${headerHeight}px`,
        }}
        {...props}
      >
        <div role="rowgroup" className="st-data-grid__head" style={{ width: totalWidth }}>
          <div
            role="row"
            aria-rowindex={1}
            className="st-data-grid__row"
            style={{ gridTemplateColumns: template }}
          >
            {columns.map((col, c) => {
              const p = { row: 0, col: c };
              const isActive = active.row === 0 && active.col === c;
              return (
                <div
                  key={col.id}
                  id={cellId(p)}
                  role="columnheader"
                  aria-colindex={c + 1}
                  tabIndex={isActive && resizingCol === null ? 0 : -1}
                  className="st-data-grid__cell st-data-grid__header-cell"
                  data-align={col.align}
                  data-pinned={pinFirstColumn && c === 0 ? '' : undefined}
                  onKeyDown={(e) => onCellKeyDown(e, p)}
                  onFocus={() => setActive(p)}
                >
                  <span className="st-data-grid__header-text">{col.header}</span>
                  {resizableColumns && (
                    <div
                      id={handleId(c)}
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${col.header} column`}
                      aria-valuenow={widthOf(col)}
                      aria-valuemin={col.minWidth ?? 64}
                      aria-valuemax={col.maxWidth ?? 640}
                      tabIndex={resizingCol === c ? 0 : -1}
                      className="st-data-grid__resize"
                      data-active={resizingCol === c ? '' : undefined}
                      onKeyDown={(e) => onHandleKeyDown(e, c)}
                      onBlur={() => setResizingCol((r) => (r === c ? null : r))}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        e.preventDefault();
                        e.stopPropagation();
                        drag.current = {
                          col: c,
                          startX: e.clientX,
                          startW: widthOf(col),
                          // The handle sits on the inline end edge, which is the left in RTL.
                          sign: isRtl(e.currentTarget) ? -1 : 1,
                        };
                        e.currentTarget.setPointerCapture?.(e.pointerId);
                      }}
                      onPointerMove={(e) => {
                        const d = drag.current;
                        if (!d) return;
                        resizeBy(d.col, 0, d.startW + d.sign * (e.clientX - d.startX));
                      }}
                      onPointerUp={(e) => {
                        drag.current = null;
                        e.currentTarget.releasePointerCapture?.(e.pointerId);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div
          role="rowgroup"
          className="st-data-grid__body"
          style={{ height: totalSize, width: totalWidth }}
        >
          {items.map((v) => {
            const row = data[v.index]!;
            const r = v.index + 1;
            return (
              <div
                key={getRowId(row, v.index)}
                role="row"
                aria-rowindex={r + 1}
                className="st-data-grid__row"
                data-active-row={active.row === r ? '' : undefined}
                style={{
                  gridTemplateColumns: template,
                  transform: `translateY(${v.start}px)`,
                  height: rowHeight,
                }}
              >
                {columns.map((col, c) => {
                  const p = { row: r, col: c };
                  const isActive = active.row === r && active.col === c;
                  const isEditing = editing?.pos.row === r && editing.pos.col === c;
                  return (
                    <div
                      key={col.id}
                      id={cellId(p)}
                      role="gridcell"
                      aria-colindex={c + 1}
                      aria-readonly={col.editable ? undefined : true}
                      tabIndex={isActive && !isEditing ? 0 : -1}
                      className="st-data-grid__cell"
                      data-align={col.align}
                      data-editable={col.editable ? '' : undefined}
                      data-editing={isEditing ? '' : undefined}
                      data-pinned={pinFirstColumn && c === 0 ? '' : undefined}
                      onKeyDown={(e) => onCellKeyDown(e, p)}
                      onFocus={(e) => {
                        if (e.target === e.currentTarget) setActive(p);
                      }}
                      onDoubleClick={() => startEdit(p)}
                    >
                      {isEditing ? (
                        <input
                          className="st-data-grid__editor"
                          aria-label={`Edit ${col.header}`}
                          value={editing.value}
                          autoFocus
                          onFocus={(e) => {
                            const len = e.currentTarget.value.length;
                            e.currentTarget.setSelectionRange(len, len);
                          }}
                          onChange={(e) => setEditing({ pos: p, value: e.target.value })}
                          onBlur={() => commitEdit(false)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitEdit(false);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              cancelEdit();
                            } else if (e.key === 'Tab') {
                              e.preventDefault();
                              commitEdit(false);
                            }
                          }}
                        />
                      ) : (
                        <span className="st-data-grid__value">
                          {renderCellContent(row, v.index, col)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <p className="st-sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

/**
 * A spreadsheet-style grid for large, editable datasets: 2D keyboard navigation,
 * in-place editing, resizable columns and virtualised rows (WAI-ARIA grid pattern).
 */
export const DataGrid = React.forwardRef(DataGridInner) as <T>(
  props: DataGridProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement;
