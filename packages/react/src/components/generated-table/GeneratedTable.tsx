'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { copyToClipboard } from '../../internal/use-clipboard.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { Button } from '../button/Button.js';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type SortDirection,
} from '../table/Table.js';

/** A cell value. Plain values keep sorting and CSV export exact. */
export type GeneratedTableValue = string | number | boolean | null | undefined;

/** One row: values keyed by column id. */
export type GeneratedTableRow = Record<string, GeneratedTableValue>;

export interface GeneratedTableColumn {
  /** Key of this column's value in each row. */
  id: string;
  /** The column header. */
  header: string;
  /** Text alignment. Numeric columns default to `end`. */
  align?: 'start' | 'center' | 'end';
  /** Numbers: aligned to the end, set in tabular figures and sorted by value. */
  numeric?: boolean;
}

/** The sorted column and its direction, or null for the order the rows came in. */
export type GeneratedTableSort = { columnId: string; direction: 'ascending' | 'descending' } | null;

export interface GeneratedTableLabels {
  /** Default "Copy as CSV". */
  copy: string;
  /** Shown and announced after copying. Default "Copied". */
  copied: string;
  /** Default "Export". */
  export: string;
  /** Default "Expand". */
  expand: string;
  /** The row count. Default "12 rows". */
  rows: (count: number) => string;
  /** The row count when some rows are folded away. Default "Showing 5 of 12 rows". */
  showing: (shown: number, total: number) => string;
  /** The control that shows every row. Default "Show all 12 rows". */
  showAll: (total: number) => string;
  /** The control that folds the rows again. Default "Show fewer". */
  showFewer: string;
  /** Shown while rows arrive. Default "Adding rows". */
  streaming: string;
  /** Announced once when streaming ends. Default "Table complete, 12 rows". */
  complete: (count: number) => string;
  /** Shown for an empty cell. Default an empty string. */
  empty: string;
}

export interface GeneratedTableProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onCopy' | 'children'
> {
  /** The columns, in order. */
  columns: GeneratedTableColumn[];
  /** The rows. Each one maps column ids to values. */
  rows: GeneratedTableRow[];
  /** What the table shows. Rendered as the table caption. */
  caption: React.ReactNode;
  /** Rows are still arriving. Sorting waits and new rows are not announced. Default false. */
  streaming?: boolean;
  /** Show this many rows, with a control to show the rest. */
  maxRows?: number;
  /** Let readers sort by a column. Default true. */
  sortable?: boolean;
  /** Controlled sort. */
  sort?: GeneratedTableSort;
  /** Sort on first render. */
  defaultSort?: GeneratedTableSort;
  /** Called when the reader sorts. */
  onSortChange?: (sort: GeneratedTableSort) => void;
  /** Called after the table is copied as CSV. Set `copyable` to false to hide the action. */
  onCopy?: (csv: string, success: boolean) => void;
  /** Show the copy as CSV action. Default true. */
  copyable?: boolean;
  /** Shows an export action. Receives the CSV text so the app can save a file. */
  onExport?: (csv: string) => void;
  /** Shows an expand action, for opening the table in a full view. */
  onExpand?: () => void;
  /** Formats a value for display. CSV export uses the raw value. */
  formatValue?: (value: GeneratedTableValue, column: GeneratedTableColumn) => React.ReactNode;
  /** Translations for the built in strings. */
  labels?: Partial<GeneratedTableLabels>;
}

const plural = (count: number) => `${count} ${count === 1 ? 'row' : 'rows'}`;
const defaultLabels: GeneratedTableLabels = {
  copy: 'Copy as CSV',
  copied: 'Copied',
  export: 'Export',
  expand: 'Expand',
  rows: plural,
  showing: (shown, total) => `Showing ${shown} of ${plural(total)}`,
  showAll: (total) => `Show all ${plural(total)}`,
  showFewer: 'Show fewer',
  streaming: 'Adding rows',
  complete: (count) => `Table complete, ${plural(count)}`,
  empty: '',
};

const csvCell = (value: GeneratedTableValue) => {
  if (value === null || value === undefined) return '';
  let text = String(value);
  // A leading =, +, @ or a minus that is not a number would run as a formula in a spreadsheet.
  if (typeof value === 'string' && /^(?:[=+@\t\r]|-(?![\d.,]+%?$))/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Serialises a generated table as CSV text, with a header row. */
export function generatedTableToCsv(
  columns: GeneratedTableColumn[],
  rows: GeneratedTableRow[],
): string {
  const lines = [columns.map((c) => csvCell(c.header)).join(',')];
  for (const row of rows) lines.push(columns.map((c) => csvCell(row[c.id])).join(','));
  return lines.join('\r\n');
}

const toNumber = (value: GeneratedTableValue) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return Number.NaN;
  return Number.parseFloat(value.replace(/[^0-9.eE+-]/g, ''));
};

const isEmpty = (value: GeneratedTableValue) =>
  value === null || value === undefined || value === '';

function compare(a: GeneratedTableValue, b: GeneratedTableValue, numeric: boolean): number {
  if (numeric || (typeof a === 'number' && typeof b === 'number')) {
    const x = toNumber(a);
    const y = toNumber(b);
    if (!Number.isNaN(x) && !Number.isNaN(y)) return x - y;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * A table the assistant produced: a real table with a caption, sortable column headers,
 * copy as CSV and optional export and expand actions. It fills in quietly while streaming.
 */
export const GeneratedTable = React.forwardRef<HTMLDivElement, GeneratedTableProps>(
  function GeneratedTable(
    {
      columns,
      rows,
      caption,
      streaming = false,
      maxRows,
      sortable = true,
      sort: sortProp,
      defaultSort = null,
      onSortChange,
      onCopy,
      copyable = true,
      onExport,
      onExpand,
      formatValue,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const [sort, setSort] = useControllableState<GeneratedTableSort>({
      value: sortProp,
      defaultValue: defaultSort,
      onChange: onSortChange,
    });
    const [showAll, setShowAll] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const copiedTimer = React.useRef<number | undefined>(undefined);
    React.useEffect(() => () => window.clearTimeout(copiedTimer.current), []);
    const { announce, region } = useAnnouncer();

    const canSort = sortable && !streaming;
    const sorted = React.useMemo(() => {
      if (!sort || !canSort) return rows;
      const column = columns.find((c) => c.id === sort.columnId);
      if (!column) return rows;
      const sign = sort.direction === 'ascending' ? 1 : -1;
      return rows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => {
          const x = a.row[column.id];
          const y = b.row[column.id];
          // Empty cells stay last in both directions.
          if (isEmpty(x) || isEmpty(y))
            return isEmpty(x) === isEmpty(y) ? a.index - b.index : isEmpty(x) ? 1 : -1;
          return sign * compare(x, y, column.numeric === true) || a.index - b.index;
        })
        .map((entry) => entry.row);
    }, [rows, columns, sort, canSort]);

    const folded = maxRows !== undefined && maxRows >= 0 && sorted.length > maxRows;
    const shown = folded && !showAll ? sorted.slice(0, maxRows) : sorted;

    // Say once that the table is complete. Rows that arrive are never read one by one.
    const wasStreaming = React.useRef(streaming);
    const completeRef = React.useRef(labels.complete);
    completeRef.current = labels.complete;
    const countRef = React.useRef(rows.length);
    countRef.current = rows.length;
    React.useEffect(() => {
      if (wasStreaming.current && !streaming) announce(completeRef.current(countRef.current));
      wasStreaming.current = streaming;
    }, [streaming, announce]);

    const cycle = (columnId: string) => {
      const current = sort?.columnId === columnId ? sort.direction : null;
      setSort(
        current === null
          ? { columnId, direction: 'ascending' }
          : current === 'ascending'
            ? { columnId, direction: 'descending' }
            : null,
      );
    };
    const directionOf = (columnId: string): SortDirection =>
      sort?.columnId === columnId ? sort.direction : 'none';

    const copy = async () => {
      const csv = generatedTableToCsv(columns, sorted);
      const ok = await copyToClipboard(csv);
      onCopy?.(csv, ok);
      if (!ok) return;
      setCopied(true);
      announce(labels.copied);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
    };

    const count =
      folded && !showAll ? labels.showing(shown.length, sorted.length) : labels.rows(sorted.length);
    const align = (column: GeneratedTableColumn) =>
      column.align ?? (column.numeric ? 'end' : 'start');

    return (
      <div
        ref={ref}
        className={cx('st-generated-table', className)}
        data-streaming={streaming ? '' : undefined}
        {...props}
      >
        <Table density="compact" aria-busy={streaming || undefined}>
          <TableCaption className="st-generated-table__caption">{caption}</TableCaption>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  align={align(column)}
                  {...(canSort && {
                    sortDirection: directionOf(column.id),
                    onSort: () => cycle(column.id),
                  })}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => {
                  const value = row[column.id];
                  const blank = isEmpty(value);
                  return (
                    <TableCell
                      key={column.id}
                      align={align(column)}
                      numeric={column.numeric === true}
                    >
                      {formatValue
                        ? formatValue(value, column)
                        : blank
                          ? labels.empty
                          : String(value)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="st-generated-table__footer">
          <span className="st-generated-table__count">
            {streaming ? (
              <>
                <Icon name="sparkle" size={14} /> {labels.streaming}
              </>
            ) : (
              count
            )}
          </span>
          <div className="st-generated-table__actions">
            {folded && (
              <Button
                size="xs"
                variant="ghost"
                aria-expanded={showAll}
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? labels.showFewer : labels.showAll(sorted.length)}
              </Button>
            )}
            {copyable && (
              <Button
                size="xs"
                variant="ghost"
                disabled={streaming || rows.length === 0}
                leadingIcon={<Icon name={copied ? 'clipboard-check' : 'copy'} size={14} />}
                onClick={copy}
              >
                {copied ? labels.copied : labels.copy}
              </Button>
            )}
            {onExport && (
              <Button
                size="xs"
                variant="ghost"
                disabled={streaming || rows.length === 0}
                leadingIcon={<Icon name="download" size={14} />}
                onClick={() => onExport(generatedTableToCsv(columns, sorted))}
              >
                {labels.export}
              </Button>
            )}
            {onExpand && (
              <Button
                size="xs"
                variant="ghost"
                leadingIcon={<Icon name="maximize" size={14} />}
                onClick={onExpand}
              >
                {labels.expand}
              </Button>
            )}
          </div>
        </div>
        {region}
      </div>
    );
  },
);
