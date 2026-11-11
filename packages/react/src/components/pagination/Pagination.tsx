'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';

export type PaginationRangeItem = number | 'start-ellipsis' | 'end-ellipsis';

/**
 * Computes the visible pages: boundary pages at each end, siblings around the
 * current page, and ellipses for the gaps. Output length is stable as the page changes.
 */
export function getPaginationRange(
  page: number,
  pageCount: number,
  siblingCount = 1,
  boundaryCount = 1,
): PaginationRangeItem[] {
  if (pageCount <= 0) return [];
  const range = (from: number, to: number) =>
    Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
  const totalSlots = boundaryCount * 2 + siblingCount * 2 + 3;
  if (pageCount <= totalSlots) return range(1, pageCount);
  const current = Math.min(Math.max(page, 1), pageCount);
  const startPages = range(1, Math.min(boundaryCount, pageCount));
  const endPages = range(Math.max(pageCount - boundaryCount + 1, boundaryCount + 1), pageCount);
  const siblingsStart = Math.max(
    Math.min(current - siblingCount, pageCount - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(current + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0]! - 2 : pageCount - 1,
  );
  return [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2
      ? (['start-ellipsis'] as const)
      : boundaryCount + 1 < pageCount - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < pageCount - boundaryCount - 1
      ? (['end-ellipsis'] as const)
      : pageCount - boundaryCount > boundaryCount
        ? [pageCount - boundaryCount]
        : []),
    ...endPages,
  ];
}

export interface PaginationLabels {
  nav: string;
  previous: string;
  next: string;
  page: (page: number) => string;
  /** Compact summary, e.g. "Page 3 of 12". */
  summary: (page: number, pageCount: number) => string;
  ellipsis: string;
}

const defaultLabels: PaginationLabels = {
  nav: 'Pagination',
  previous: 'Previous page',
  next: 'Next page',
  page: (p) => `Page ${p}`,
  summary: (p, c) => `Page ${p} of ${c}`,
  ellipsis: 'More pages',
};

export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Current page, 1-based. */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  onPageChange?: (page: number) => void;
  /** Pages shown either side of the current page. Default 1. */
  siblingCount?: number;
  /** Pages always shown at each end. Default 1. */
  boundaryCount?: number;
  /** `full` shows page numbers; `compact` shows "Page x of y" with arrows. Default `full`. */
  variant?: 'full' | 'compact';
  size?: 'sm' | 'md';
  /** Build an href for each page so items render as links (good for SEO and new-tab). */
  getHref?: (page: number) => string;
  /** Show text on previous/next buttons. Default false (icons with labels). */
  showPrevNextLabels?: boolean;
  /** Translatable strings. */
  labels?: Partial<PaginationLabels>;
  disabled?: boolean;
}

/** Moves between pages of a long list or table. */
export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    page,
    pageCount,
    onPageChange,
    siblingCount = 1,
    boundaryCount = 1,
    variant = 'full',
    size = 'md',
    getHref,
    showPrevNextLabels = false,
    labels: labelsProp,
    disabled = false,
    className,
    ...props
  },
  ref,
) {
  const labels = { ...defaultLabels, ...labelsProp };
  const count = Math.max(1, pageCount);
  const current = Math.min(Math.max(1, page), count);

  const go = (target: number) => (event: React.MouseEvent) => {
    if (target < 1 || target > count || target === current || disabled) {
      event.preventDefault();
      return;
    }
    if (onPageChange) {
      if (!getHref) event.preventDefault();
      onPageChange(target);
    }
  };

  const Item = ({
    target,
    isDisabled,
    current: isCurrent,
    label,
    kind,
    children,
  }: {
    target: number;
    isDisabled?: boolean;
    current?: boolean;
    label: string;
    kind: 'page' | 'prev' | 'next';
    children: React.ReactNode;
  }) => {
    const common = {
      className: 'st-pagination__item',
      'data-kind': kind,
      'aria-label': label,
      'aria-current': isCurrent ? ('page' as const) : undefined,
      'data-current': isCurrent ? '' : undefined,
      onClick: go(target),
    };
    if (getHref && !isDisabled) {
      return (
        <a href={getHref(target)} {...common}>
          {children}
        </a>
      );
    }
    return (
      <button type="button" disabled={isDisabled} {...common}>
        {children}
      </button>
    );
  };

  const prev = (
    <li>
      <Item
        target={current - 1}
        isDisabled={disabled || current <= 1}
        label={labels.previous}
        kind="prev"
      >
        <Icon name="chevron-left" size={16} />
        {showPrevNextLabels && (
          <span className="st-pagination__text">{labels.previous.replace(/ page$/i, '')}</span>
        )}
      </Item>
    </li>
  );
  const next = (
    <li>
      <Item
        target={current + 1}
        isDisabled={disabled || current >= count}
        label={labels.next}
        kind="next"
      >
        {showPrevNextLabels && (
          <span className="st-pagination__text">{labels.next.replace(/ page$/i, '')}</span>
        )}
        <Icon name="chevron-right" size={16} />
      </Item>
    </li>
  );

  return (
    <nav
      ref={ref}
      aria-label={labels.nav}
      className={cx('st-pagination', className)}
      data-size={size}
      data-variant={variant}
      {...props}
    >
      <ul className="st-pagination__list">
        {prev}
        {variant === 'compact' ? (
          <li className="st-pagination__summary" aria-live="polite">
            {labels.summary(current, count)}
          </li>
        ) : (
          getPaginationRange(current, count, siblingCount, boundaryCount).map((item) =>
            typeof item === 'number' ? (
              <li key={item}>
                <Item
                  target={item}
                  current={item === current}
                  isDisabled={disabled}
                  label={labels.page(item)}
                  kind="page"
                >
                  {item}
                </Item>
              </li>
            ) : (
              <li key={item} className="st-pagination__ellipsis" aria-hidden="true">
                …
              </li>
            ),
          )
        )}
        {next}
      </ul>
    </nav>
  );
});
