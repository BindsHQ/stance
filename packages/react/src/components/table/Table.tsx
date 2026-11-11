'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useIsOverflowing } from '../../internal/use-is-overflowing.js';
import { Icon } from '../../icons/Icon.js';

export type TableDensity = 'compact' | 'default' | 'comfortable';
export type SortDirection = 'ascending' | 'descending' | 'none';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Row height and cell padding. Default `default`. */
  density?: TableDensity;
  /** Zebra-stripe body rows. */
  striped?: boolean;
  /** Keep the header visible while the scroll container scrolls vertically. */
  stickyHeader?: boolean;
  /** Draw vertical lines between columns. */
  bordered?: boolean;
  /**
   * Accessible label for the scroll region. When the table overflows, the wrapper
   * becomes a focusable, labelled region so keyboard users can scroll it.
   * Defaults to the caption text when `aria-label` is not given.
   */
  scrollLabel?: string;
  /** Max height of the scroll container (enables vertical scrolling with sticky headers). */
  maxHeight?: number | string;
  /** Class name for the scroll wrapper. */
  wrapperClassName?: string;
}

/**
 * Semantic table primitives styled with Stance tokens. Wraps the table in a
 * horizontally scrollable region so wide tables never break page layout.
 */
export const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table(
  {
    density = 'default',
    striped,
    stickyHeader,
    bordered,
    scrollLabel,
    maxHeight,
    wrapperClassName,
    className,
    ...props
  },
  ref,
) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const overflowing = useIsOverflowing(wrapperRef);
  const [captionText, setCaptionText] = React.useState<string | undefined>(undefined);
  // Re-read the caption whenever the table's content changes.
  React.useEffect(() => {
    setCaptionText(wrapperRef.current?.querySelector('caption')?.textContent?.trim() || undefined);
  }, [props.children]);
  const label = scrollLabel ?? props['aria-label'] ?? captionText;
  return (
    <div
      ref={wrapperRef}
      className={cx('st-table-wrapper', wrapperClassName)}
      // Only when the table actually scrolls does the wrapper become a focusable, named region
      // so keyboard users can scroll it (WCAG 2.1.1). Its name comes from the caption by default.
      {...(overflowing && { tabIndex: 0, role: 'region', 'aria-label': label ?? 'Table' })}
      style={maxHeight !== undefined ? { maxHeight } : undefined}
      data-sticky-header={stickyHeader ? '' : undefined}
    >
      <table
        ref={ref}
        className={cx('st-table', className)}
        data-density={density}
        data-striped={striped ? '' : undefined}
        data-bordered={bordered ? '' : undefined}
        {...props}
      />
    </div>
  );
});

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement> & { visuallyHidden?: boolean }
>(function TableCaption({ visuallyHidden, className, ...props }, ref) {
  return (
    <caption
      ref={ref}
      className={cx('st-table__caption', visuallyHidden && 'st-sr-only', className)}
      {...props}
    />
  );
});

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cx('st-table__header', className)} {...props} />;
});

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={cx('st-table__body', className)} {...props} />;
});

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableFooter({ className, ...props }, ref) {
  return <tfoot ref={ref} className={cx('st-table__footer', className)} {...props} />;
});

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Highlights the row and sets aria-selected (use inside role="grid" tables or with a selection checkbox). */
  selected?: boolean;
  /**
   * Makes the whole row a click target for its primary link. Put a `<TableRowLink>`
   * in one cell; pointer clicks anywhere on the row activate it, while keyboard
   * and screen-reader users reach the real link. Never use onClick on a row alone.
   */
  interactive?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { selected, interactive, className, ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      className={cx('st-table__row', className)}
      data-selected={selected ? '' : undefined}
      data-interactive={interactive ? '' : undefined}
      {...props}
    />
  );
});

export interface TableHeadProps extends Omit<
  React.ThHTMLAttributes<HTMLTableCellElement>,
  'align'
> {
  /** Current sort state. When set (or `onSort` is given) the header renders a sort button. */
  sortDirection?: SortDirection;
  /** Called when the sort button is activated. */
  onSort?: () => void;
  /** Text alignment. Use `end` for numeric columns. */
  align?: 'start' | 'center' | 'end';
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
  { sortDirection, onSort, align = 'start', scope = 'col', className, children, ...props },
  ref,
) {
  const sortable = onSort !== undefined || sortDirection !== undefined;
  const icon =
    sortDirection === 'ascending'
      ? 'arrow-up'
      : sortDirection === 'descending'
        ? 'arrow-down'
        : 'arrows-up-down';
  return (
    <th
      ref={ref}
      scope={scope}
      aria-sort={sortable ? (sortDirection ?? 'none') : undefined}
      className={cx('st-table__head', className)}
      data-align={align}
      data-sortable={sortable ? '' : undefined}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          className="st-table__sort"
          onClick={onSort}
          data-direction={sortDirection ?? 'none'}
        >
          <span>{children}</span>
          <Icon name={icon} size={14} className="st-table__sort-icon" />
        </button>
      ) : (
        children
      )}
    </th>
  );
});

export interface TableCellProps extends Omit<
  React.TdHTMLAttributes<HTMLTableCellElement>,
  'align'
> {
  align?: 'start' | 'center' | 'end';
  /** Use tabular numerals (for figures). */
  numeric?: boolean;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { align, numeric, className, ...props },
  ref,
) {
  return (
    <td
      ref={ref}
      className={cx('st-table__cell', className)}
      data-align={align ?? (numeric ? 'end' : undefined)}
      data-numeric={numeric ? '' : undefined}
      {...props}
    />
  );
});

/**
 * The primary link of an interactive row. Its hit area is stretched over the row
 * with CSS, so the row is clickable while remaining a real, focusable link.
 */
export const TableRowLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(function TableRowLink({ className, ...props }, ref) {
  return <a ref={ref} className={cx('st-table__row-link', className)} {...props} />;
});
