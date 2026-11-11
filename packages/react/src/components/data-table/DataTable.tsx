'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Checkbox } from '../checkbox/Checkbox.js';
import { Pagination } from '../pagination/Pagination.js';
import { Skeleton } from '../skeleton/Skeleton.js';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableDensity,
} from '../table/Table.js';

export type DataTableSortDirection = 'ascending' | 'descending';

export interface DataTableSort {
  columnId: string;
  direction: DataTableSortDirection;
}

export interface DataTableColumn<T> {
  id: string;
  /** Header content. */
  header: React.ReactNode;
  /** Plain-text header used in announcements when `header` is not a string. */
  headerLabel?: string;
  /** Value used for display (if no `cell`) and sorting. A key of the row or a function. */
  accessor?: keyof T | ((row: T) => unknown);
  /** Custom cell renderer. */
  cell?: (row: T, rowIndex: number) => React.ReactNode;
  /** Enable sorting for this column. */
  sortable?: boolean;
  /** Custom comparator (ascending). Defaults to comparing accessor values. */
  sortFn?: (a: T, b: T) => number;
  align?: 'start' | 'center' | 'end';
  /** Column width (CSS length or px number). */
  width?: number | string;
  /** Render the cell as a row header (`<th scope="row">`), typically the name column. */
  rowHeader?: boolean;
}

export interface DataTableProps<T> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  columns: DataTableColumn<T>[];
  data: readonly T[];
  /** Stable id per row. Defaults to the index. */
  getRowId?: (row: T, index: number) => string;
  /** Table caption (names the table). */
  caption: React.ReactNode;
  /** Visually hide the caption. */
  captionHidden?: boolean;
  /** Label for the scroll region. Defaults to the caption when it is a string. */
  scrollLabel?: string;
  density?: TableDensity;
  striped?: boolean;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  sort?: DataTableSort | null;
  defaultSort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  /** Show a checkbox column for row selection. */
  selectable?: boolean;
  selectedRowIds?: string[];
  defaultSelectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  isRowSelectable?: (row: T) => boolean;
  /** Text naming a row in its checkbox label, e.g. the user's name. */
  getRowLabel?: (row: T) => string;
  /** Rows per page. Omit to show all rows. */
  pageSize?: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Show skeleton rows and set aria-busy. */
  loading?: boolean;
  /** Skeleton rows while loading. Default 5. */
  loadingRows?: number;
  /** Shown in place of rows when `data` is empty. */
  emptyState?: React.ReactNode;
  /** Content beside the pagination, e.g. bulk actions. */
  footer?: React.ReactNode;
}

function getValue<T>(row: T, col: DataTableColumn<T>): unknown {
  if (typeof col.accessor === 'function') return col.accessor(row);
  if (col.accessor !== undefined) return row[col.accessor];
  return undefined;
}

const collator =
  typeof Intl !== 'undefined'
    ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    : null;

export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  const sa = String(a);
  const sb = String(b);
  return collator ? collator.compare(sa, sb) : sa < sb ? -1 : sa > sb ? 1 : 0;
}

const labelOf = <T,>(col: DataTableColumn<T>) =>
  col.headerLabel ?? (typeof col.header === 'string' ? col.header : col.id);

function DataTableInner<T>(
  {
    columns,
    data,
    getRowId = (_row, index) => String(index),
    caption,
    captionHidden,
    scrollLabel,
    density,
    striped,
    stickyHeader,
    maxHeight,
    sort: sortProp,
    defaultSort = null,
    onSortChange,
    selectable = false,
    selectedRowIds: selectedProp,
    defaultSelectedRowIds = [],
    onSelectionChange,
    isRowSelectable = () => true,
    getRowLabel,
    pageSize,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    loading = false,
    loadingRows = 5,
    emptyState,
    footer,
    className,
    ...props
  }: DataTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const [sort, setSort] = useControllableState<DataTableSort | null>({
    value: sortProp,
    defaultValue: defaultSort,
    onChange: onSortChange,
  });
  const [selected, setSelected] = useControllableState<string[]>({
    value: selectedProp,
    defaultValue: defaultSelectedRowIds,
    onChange: onSelectionChange,
  });
  const [page, setPage] = useControllableState({
    value: pageProp,
    defaultValue: defaultPage,
    onChange: onPageChange,
  });
  const [announcement, setAnnouncement] = React.useState('');

  const indexed = React.useMemo(
    () => data.map((row, index) => ({ row, id: getRowId(row, index) })),
    [data, getRowId],
  );

  const sorted = React.useMemo(() => {
    if (!sort) return indexed;
    const col = columns.find((c) => c.id === sort.columnId);
    if (!col) return indexed;
    const factor = sort.direction === 'ascending' ? 1 : -1;
    const cmp = col.sortFn ?? ((a: T, b: T) => compareValues(getValue(a, col), getValue(b, col)));
    // Stable sort keeps the original order for equal values.
    return indexed
      .map((item, i) => ({ item, i }))
      .sort((a, b) => cmp(a.item.row, b.item.row) * factor || a.i - b.i)
      .map(({ item }) => item);
  }, [indexed, sort, columns]);

  const pageCount = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const visible = pageSize
    ? sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sorted;

  const selectableVisible = visible.filter((v) => isRowSelectable(v.row));
  const selectedSet = new Set(selected);
  const selectedVisibleCount = selectableVisible.filter((v) => selectedSet.has(v.id)).length;
  const headerChecked: boolean | 'indeterminate' =
    selectableVisible.length > 0 && selectedVisibleCount === selectableVisible.length
      ? true
      : selectedVisibleCount > 0
        ? 'indeterminate'
        : false;

  const cycleSort = (col: DataTableColumn<T>) => {
    let next: DataTableSort | null;
    if (!sort || sort.columnId !== col.id) next = { columnId: col.id, direction: 'ascending' };
    else if (sort.direction === 'ascending') next = { columnId: col.id, direction: 'descending' };
    else next = null;
    setSort(next);
    setAnnouncement(next ? `Sorted by ${labelOf(col)}, ${next.direction}` : 'Sorting removed');
  };

  const toggleRow = (id: string, checked: boolean) => {
    const next = checked
      ? [...selected.filter((x) => x !== id), id]
      : selected.filter((x) => x !== id);
    setSelected(next);
    setAnnouncement(`${next.length} ${next.length === 1 ? 'row' : 'rows'} selected`);
  };
  const toggleAll = (checked: boolean) => {
    const ids = selectableVisible.map((v) => v.id);
    const next = checked
      ? Array.from(new Set([...selected, ...ids]))
      : selected.filter((x) => !ids.includes(x));
    setSelected(next);
    setAnnouncement(`${next.length} ${next.length === 1 ? 'row' : 'rows'} selected`);
  };

  const goToPage = (p: number) => {
    setPage(p);
    setAnnouncement(`Page ${p} of ${pageCount}`);
  };

  const colCount = columns.length + (selectable ? 1 : 0);
  const captionText = typeof caption === 'string' ? caption : undefined;
  const firstRow = sorted.length === 0 ? 0 : pageSize ? (currentPage - 1) * pageSize + 1 : 1;
  const lastRow = pageSize ? Math.min(currentPage * pageSize, sorted.length) : sorted.length;
  const fmt = new Intl.NumberFormat();

  return (
    <div ref={ref} className={cx('st-data-table', className)} {...props}>
      <Table
        density={density}
        striped={striped}
        stickyHeader={stickyHeader}
        maxHeight={maxHeight}
        scrollLabel={scrollLabel ?? captionText}
        aria-busy={loading || undefined}
        aria-rowcount={pageSize ? sorted.length + 1 : undefined}
      >
        <TableCaption visuallyHidden={captionHidden}>{caption}</TableCaption>
        <TableHeader>
          <TableRow aria-rowindex={pageSize ? 1 : undefined}>
            {selectable && (
              <TableHead className="st-data-table__select" style={{ width: '2.75rem' }}>
                <Checkbox
                  aria-label={
                    pageSize && pageCount > 1 ? 'Select all rows on this page' : 'Select all rows'
                  }
                  checked={headerChecked}
                  disabled={loading || selectableVisible.length === 0}
                  onCheckedChange={(c) => toggleAll(c)}
                  size="sm"
                />
              </TableHead>
            )}
            {columns.map((col) => {
              const direction = sort?.columnId === col.id ? sort.direction : 'none';
              return (
                <TableHead
                  key={col.id}
                  align={col.align}
                  style={col.width !== undefined ? { width: col.width } : undefined}
                  {...(col.sortable && { sortDirection: direction, onSort: () => cycleSort(col) })}
                >
                  {col.header}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: loadingRows }, (_, i) => (
              <TableRow key={`loading-${i}`} aria-hidden="true">
                {selectable && (
                  <TableCell>
                    <Skeleton variant="rect" width={16} height={16} />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align}>
                    <Skeleton
                      variant="text"
                      width={`${55 + ((i * 17 + col.id.length * 7) % 40)}%`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : visible.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount} className="st-data-table__empty">
                {emptyState ?? 'No results'}
              </TableCell>
            </TableRow>
          ) : (
            visible.map(({ row, id }, i) => {
              const isSelected = selectedSet.has(id);
              const rowSelectable = isRowSelectable(row);
              const absoluteIndex = (currentPage - 1) * (pageSize ?? 0) + i;
              return (
                <TableRow
                  key={id}
                  selected={selectable && isSelected}
                  aria-rowindex={pageSize ? absoluteIndex + 2 : undefined}
                  data-row-id={id}
                >
                  {selectable && (
                    <TableCell className="st-data-table__select">
                      <Checkbox
                        aria-label={`Select ${getRowLabel ? getRowLabel(row) : `row ${absoluteIndex + 1}`}`}
                        checked={isSelected}
                        disabled={!rowSelectable}
                        onCheckedChange={(c) => toggleRow(id, c)}
                        size="sm"
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => {
                    const content = col.cell
                      ? col.cell(row, absoluteIndex)
                      : (getValue(row, col) as React.ReactNode);
                    if (col.rowHeader) {
                      return (
                        <th
                          key={col.id}
                          scope="row"
                          className="st-table__cell st-data-table__row-header"
                          data-align={col.align}
                        >
                          {content}
                        </th>
                      );
                    }
                    return (
                      <TableCell key={col.id} align={col.align}>
                        {content}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {(pageSize || footer) && !loading && (
        <div className="st-data-table__footer">
          <div className="st-data-table__footer-start">
            {footer}
            {pageSize && sorted.length > 0 && (
              <p className="st-data-table__range">
                {fmt.format(firstRow)}–{fmt.format(lastRow)} of {fmt.format(sorted.length)}
              </p>
            )}
          </div>
          {pageSize && pageCount > 1 && (
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              onPageChange={goToPage}
              size="sm"
            />
          )}
        </div>
      )}
      <p className="st-sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

/**
 * A data table with sorting, row selection, pagination, loading and empty states,
 * built on the semantic Table primitives.
 */
export const DataTable = React.forwardRef(DataTableInner) as <T>(
  props: DataTableProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement;
