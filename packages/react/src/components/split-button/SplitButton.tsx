'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { Align } from '../../internal/position.js';
import { Icon } from '../../icons/Icon.js';
import { Button, type ButtonProps } from '../button/Button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu.js';

export interface SplitButtonProps extends Omit<
  ButtonProps,
  'variant' | 'asChild' | 'trailingIcon' | 'fullWidth' | 'shape'
> {
  /** Default `primary`. */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Menu items (DropdownMenuItem etc.) for the secondary actions. */
  menu: React.ReactNode;
  /** Accessible label for the menu toggle. Default "More options". */
  menuLabel?: string;
  /** Alignment of the menu against the group. Default `end`. */
  menuAlign?: Align;
  /** Disable only the menu toggle. */
  menuDisabled?: boolean;
  /** Class for the outer group. */
  groupClassName?: string;
}

/**
 * A primary action with an attached menu of related alternatives
 * (e.g. “Deploy” with “Deploy to selected users”, “Schedule deployment”).
 */
export const SplitButton = React.forwardRef<HTMLButtonElement, SplitButtonProps>(
  function SplitButton(
    {
      variant = 'primary',
      size = 'md',
      menu,
      menuLabel = 'More options',
      menuAlign = 'end',
      menuDisabled,
      disabled,
      groupClassName,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <div
        role="group"
        className={cx('st-split-button', groupClassName)}
        data-variant={variant}
        data-size={size}
      >
        <Button
          ref={ref}
          variant={variant}
          size={size}
          disabled={disabled}
          className="st-split-button__main"
          {...props}
        >
          {children}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled || menuDisabled}>
            <Button
              variant={variant}
              size={size}
              aria-label={menuLabel}
              title={menuLabel}
              className="st-split-button__toggle"
              disabled={disabled || menuDisabled}
            >
              <Icon name="chevron-down" size={size === 'lg' ? 18 : 16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={menuAlign}>{menu}</DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
);
