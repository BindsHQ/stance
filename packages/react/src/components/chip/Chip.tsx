'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /** Controlled selected state. */
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Leading icon (replaced by a check mark while selected). */
  icon?: React.ReactNode;
  /** Default `md`. */
  size?: 'sm' | 'md';
}

/** A selectable toggle chip for quick filters and choices. Exposes aria-pressed. */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  {
    selected: selectedProp,
    defaultSelected = false,
    onSelectedChange,
    icon,
    size = 'md',
    className,
    children,
    onClick,
    ...props
  },
  ref,
) {
  const [selected, setSelected] = useControllableState({
    value: selectedProp,
    defaultValue: defaultSelected,
    onChange: onSelectedChange,
  });
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cx('st-chip', className)}
      data-size={size}
      data-state={selected ? 'on' : 'off'}
      onClick={composeHandlers(onClick, () => setSelected(!selected))}
      {...props}
    >
      {selected ? (
        <Icon name="check" size={14} strokeWidth={2.25} className="st-chip__icon" />
      ) : (
        icon != null && (
          <span className="st-chip__icon" aria-hidden="true">
            {icon}
          </span>
        )
      )}
      <span>{children}</span>
    </button>
  );
});
