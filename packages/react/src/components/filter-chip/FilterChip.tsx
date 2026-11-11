'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  type PopoverContentProps,
} from '../popover/Popover.js';

export interface FilterChipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Filter name, e.g. "Status". */
  label: string;
  /** Summary of the current selection, e.g. "Signed, Pending". Empty means inactive. */
  value?: React.ReactNode;
  /** The editor shown in the popover (checkbox list, date range…). */
  children?: React.ReactNode;
  /** Called by the clear button. When omitted, no clear button is shown. */
  onClear?: () => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Props for the popover surface. */
  contentProps?: Omit<PopoverContentProps, 'children'>;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

/** A filter control showing its name and current value; opens a popover to edit it. */
export const FilterChip = React.forwardRef<HTMLDivElement, FilterChipProps>(function FilterChip(
  {
    label,
    value,
    children,
    onClear,
    open,
    defaultOpen,
    onOpenChange,
    contentProps,
    disabled,
    size = 'md',
    className,
    ...props
  },
  ref,
) {
  const active = value != null && value !== '' && value !== false;
  return (
    <div
      ref={ref}
      className={cx('st-filter-chip', className)}
      data-active={active ? '' : undefined}
      data-size={size}
      {...props}
    >
      <Popover
        {...(open !== undefined && { open })}
        {...(defaultOpen !== undefined && { defaultOpen })}
        {...(onOpenChange !== undefined && { onOpenChange })}
      >
        <PopoverTrigger className="st-filter-chip__trigger" disabled={disabled}>
          {!active && <Icon name="plus" size={14} strokeWidth={2} />}
          <span className="st-filter-chip__label">{label}</span>
          {active && (
            <>
              <span className="st-filter-chip__sep" aria-hidden="true" />
              <span className="st-sr-only">: </span>
              <span className="st-filter-chip__value">{value}</span>
            </>
          )}
          <Icon name="chevron-down" size={14} className="st-filter-chip__chevron" />
        </PopoverTrigger>
        <PopoverContent align="start" aria-label={`${label} filter`} {...contentProps}>
          {children}
        </PopoverContent>
      </Popover>
      {active && onClear && (
        <button
          type="button"
          className="st-filter-chip__clear"
          aria-label={`Clear ${label} filter`}
          disabled={disabled}
          onClick={onClear}
        >
          <Icon name="x" size={12} strokeWidth={2.25} />
        </button>
      )}
    </div>
  );
});
