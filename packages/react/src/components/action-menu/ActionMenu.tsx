'use client';
import * as React from 'react';
import type { Align, Side } from '../../internal/position.js';
import { Icon } from '../../icons/Icon.js';
import { IconButton } from '../icon-button/IconButton.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu.js';

export type ActionMenuItem =
  | {
      type?: 'item';
      /** Stable key; defaults to the label. */
      id?: string;
      label: string;
      onSelect?: () => void;
      icon?: React.ReactNode;
      shortcut?: string;
      destructive?: boolean;
      disabled?: boolean;
      /** Nested actions shown as a submenu. */
      items?: ActionMenuItem[];
    }
  | { type: 'separator'; id?: string }
  | { type: 'group'; id?: string; label: string; items: ActionMenuItem[] };

export interface ActionMenuProps {
  /** The actions, in display order. */
  items: ActionMenuItem[];
  /** Accessible label of the default trigger. Default "More actions". */
  label?: string;
  /** Replace the default "⋯" icon button. Must be a single focusable element (rendered via asChild). */
  trigger?: React.ReactElement;
  /** Icon for the default trigger. Default `more-horizontal`. */
  orientation?: 'horizontal' | 'vertical';
  /** Size of the default trigger. Default `sm`. */
  size?: 'xs' | 'sm' | 'md';
  side?: Side;
  align?: Align;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

function renderItems(items: ActionMenuItem[]): React.ReactNode {
  return items.map((item, i) => {
    if (item.type === 'separator') return <DropdownMenuSeparator key={item.id ?? `sep-${i}`} />;
    if (item.type === 'group') {
      return (
        <DropdownMenuGroup key={item.id ?? item.label} label={item.label}>
          {renderItems(item.items)}
        </DropdownMenuGroup>
      );
    }
    if (item.items?.length) {
      return (
        <DropdownMenuSub key={item.id ?? item.label}>
          <DropdownMenuSubTrigger icon={item.icon} disabled={item.disabled}>
            {item.label}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>{renderItems(item.items)}</DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }
    return (
      <DropdownMenuItem
        key={item.id ?? item.label}
        icon={item.icon}
        destructive={item.destructive}
        disabled={item.disabled}
        onSelect={() => item.onSelect?.()}
      >
        {item.label}
        {item.shortcut && <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>}
      </DropdownMenuItem>
    );
  });
}

/**
 * A compact "more actions" menu driven by an array, ideal for table rows and cards.
 * Built on DropdownMenu, so it shares its keyboard and accessibility behaviour.
 */
export function ActionMenu({
  items,
  label = 'More actions',
  trigger,
  orientation = 'horizontal',
  size = 'sm',
  side = 'bottom',
  align = 'end',
  open,
  defaultOpen,
  onOpenChange,
  disabled,
}: ActionMenuProps) {
  return (
    <DropdownMenu
      {...(open !== undefined && { open })}
      {...(defaultOpen !== undefined && { defaultOpen })}
      {...(onOpenChange && { onOpenChange })}
    >
      <DropdownMenuTrigger asChild disabled={disabled}>
        {trigger ?? (
          <IconButton
            label={label}
            size={size}
            variant="ghost"
            className="st-action-menu__trigger"
            icon={<Icon name={orientation === 'vertical' ? 'more-vertical' : 'more-horizontal'} />}
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align}>
        {renderItems(items)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
