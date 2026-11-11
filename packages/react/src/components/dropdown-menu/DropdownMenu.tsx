'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { useComposedRefs } from '../../internal/refs.js';
import { Slot } from '../../internal/slot.js';
import {
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRoot,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  useMenuRoot,
  type MenuCheckboxItemProps,
  type MenuContentProps,
  type MenuGroupProps,
  type MenuItemProps,
  type MenuRadioGroupProps,
  type MenuRadioItemProps,
  type MenuRootProps,
  type MenuSelectEvent,
  type MenuSubProps,
} from './menu-core.js';

export type DropdownMenuProps = MenuRootProps;
export type DropdownMenuContentProps = MenuContentProps;
export type DropdownMenuItemProps = MenuItemProps;
export type DropdownMenuCheckboxItemProps = MenuCheckboxItemProps;
export type DropdownMenuRadioGroupProps = MenuRadioGroupProps;
export type DropdownMenuRadioItemProps = MenuRadioItemProps;
export type DropdownMenuGroupProps = MenuGroupProps;
export type DropdownMenuSubProps = MenuSubProps;
export type { MenuSelectEvent };

/** A menu of actions or options opened from a button. Root of the compound component. */
export function DropdownMenu(props: DropdownMenuProps) {
  return <MenuRoot {...props} />;
}

export interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

/** Opens the menu on click, Enter, Space or ArrowDown (ArrowUp focuses the last item). */
export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  function DropdownMenuTrigger({ asChild, onClick, onKeyDown, disabled, ...props }, ref) {
    const root = useMenuRoot('DropdownMenuTrigger');
    const composed = useComposedRefs(ref, root.triggerRef as React.Ref<HTMLButtonElement>);
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={composed as React.Ref<HTMLButtonElement & HTMLElement>}
        {...(!asChild && { type: 'button' as const })}
        id={root.triggerId}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={root.open}
        aria-controls={root.open ? root.contentId : undefined}
        data-state={root.open ? 'open' : 'closed'}
        onClick={composeHandlers(onClick, () => {
          root.focusIntentRef.current = 'first';
          root.setOpen(!root.open);
        })}
        onKeyDown={composeHandlers(onKeyDown, (e: React.KeyboardEvent) => {
          if (disabled) return;
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            root.focusIntentRef.current = e.key === 'ArrowUp' ? 'last' : 'first';
            root.setOpen(true);
          }
        })}
        {...props}
      />
    );
  },
);

/** The menu surface. Positions itself against the trigger. */
export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  function DropdownMenuContent(props, ref) {
    return <MenuContent ref={ref} {...props} />;
  },
);

export const DropdownMenuItem = MenuItem;
export const DropdownMenuCheckboxItem = MenuCheckboxItem;
export const DropdownMenuRadioGroup = MenuRadioGroup;
export const DropdownMenuRadioItem = MenuRadioItem;
export const DropdownMenuLabel = MenuLabel;
export const DropdownMenuSeparator = MenuSeparator;
export const DropdownMenuGroup = MenuGroup;
export const DropdownMenuShortcut = MenuShortcut;
export const DropdownMenuSub = MenuSub;
export const DropdownMenuSubTrigger = MenuSubTrigger;
export const DropdownMenuSubContent = MenuSubContent;
