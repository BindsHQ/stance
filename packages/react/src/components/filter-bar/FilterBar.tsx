'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';
import { Input } from '../input/Input.js';

export interface FilterBarSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible label. Default "Search". */
  label?: string;
  placeholder?: string;
}

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** FilterChips and other filter controls. */
  children?: React.ReactNode;
  /** Optional search field shown first. */
  search?: FilterBarSearchProps;
  /** Shows a "Clear all" button when provided and `canClear` is true. */
  onClearAll?: () => void;
  /** Whether any filter is active. Default true when onClearAll is given. */
  canClear?: boolean;
  /** Number of matching results, announced politely when it changes. */
  resultCount?: number;
  /** Formats the result count. Default `n => \`${n} results\``. */
  formatResultCount?: (count: number) => string;
  /** Trailing content such as a sort menu or view switcher. */
  actions?: React.ReactNode;
  /** Accessible name for the group of filters. Default "Filters". */
  label?: string;
}

/** A responsive row of search, filters, results count and "Clear all". */
export const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(function FilterBar(
  {
    children,
    search,
    onClearAll,
    canClear,
    resultCount,
    formatResultCount = (n) => `${n} ${n === 1 ? 'result' : 'results'}`,
    actions,
    label = 'Filters',
    className,
    ...props
  },
  ref,
) {
  const showClear = onClearAll && (canClear ?? true);
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cx('st-filter-bar', className)}
      {...props}
    >
      <div className="st-filter-bar__filters">
        {search && (
          <div className="st-filter-bar__search">
            <Input
              type="search"
              size="sm"
              aria-label={search.label ?? 'Search'}
              placeholder={search.placeholder}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              prefix={<Icon name="search" size={14} />}
            />
          </div>
        )}
        {children}
        {showClear && (
          <button type="button" className="st-filter-bar__clear" onClick={onClearAll}>
            Clear all
          </button>
        )}
      </div>
      <div className="st-filter-bar__end">
        {resultCount !== undefined && (
          <p className="st-filter-bar__count" role="status" aria-live="polite">
            {formatResultCount(resultCount)}
          </p>
        )}
        {actions}
      </div>
    </div>
  );
});
