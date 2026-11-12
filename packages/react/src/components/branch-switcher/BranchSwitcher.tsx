'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { IconButton } from '../icon-button/IconButton.js';

export interface BranchSwitcherLabels {
  /** Accessible name of the group. */
  group: string;
  previous: string;
  next: string;
  /** The position text. Receives the zero based index and the count. Default "2 of 3". */
  position: (index: number, count: number) => string;
}

const defaultLabels: BranchSwitcherLabels = {
  group: 'Message versions',
  previous: 'Previous version',
  next: 'Next version',
  position: (index, count) => `${index + 1} of ${count}`,
};

export interface BranchSwitcherProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange'
> {
  /** How many versions of the message exist. Nothing renders for fewer than two. */
  count: number;
  /** Controlled, zero based index of the version on screen. */
  index?: number;
  /** Initial index when uncontrolled. Default: the last version. */
  defaultIndex?: number;
  /** Called with the new zero based index. */
  onIndexChange?: (index: number) => void;
  /** Disable both buttons, for example while a response streams. */
  disabled?: boolean;
  /** Button size. Default `xs`. */
  size?: 'xs' | 'sm';
  /** Translations for the buttons and the position text. */
  labels?: Partial<BranchSwitcherLabels>;
}

/** Steps between alternative versions of a message after an edit or retry. */
export const BranchSwitcher = React.forwardRef<HTMLDivElement, BranchSwitcherProps>(
  function BranchSwitcher(
    {
      count,
      index: indexProp,
      defaultIndex,
      onIndexChange,
      disabled = false,
      size = 'xs',
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const [rawIndex, setIndex] = useControllableState({
      value: indexProp,
      defaultValue: defaultIndex ?? Math.max(count - 1, 0),
      onChange: onIndexChange,
    });
    if (count < 2) return null;
    const index = Math.min(Math.max(rawIndex, 0), count - 1);
    const atStart = disabled || index <= 0;
    const atEnd = disabled || index >= count - 1;
    return (
      <div
        ref={ref}
        role="group"
        aria-label={labels.group}
        className={cx('st-branch-switcher', className)}
        data-disabled={disabled ? '' : undefined}
        {...props}
      >
        {/* aria-disabled, not disabled, so focus stays on the button at either end. */}
        <IconButton
          size={size}
          className="st-branch-switcher__button"
          label={labels.previous}
          icon={<Icon name="chevron-left" />}
          aria-disabled={atStart || undefined}
          onClick={() => {
            if (!atStart) setIndex(index - 1);
          }}
        />
        <span className="st-branch-switcher__position" aria-live="polite" aria-atomic="true">
          {labels.position(index, count)}
        </span>
        <IconButton
          size={size}
          className="st-branch-switcher__button"
          label={labels.next}
          icon={<Icon name="chevron-right" />}
          aria-disabled={atEnd || undefined}
          onClick={() => {
            if (!atEnd) setIndex(index + 1);
          }}
        />
      </div>
    );
  },
);
