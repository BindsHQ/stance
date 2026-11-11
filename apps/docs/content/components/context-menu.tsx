import * as React from 'react';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  Icon,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const area: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 'min(100%, 360px)',
  height: 160,
  border: '1px dashed var(--st-color-border-strong)',
  borderRadius: 'var(--st-radius-lg)',
  color: 'var(--st-color-fg-muted)',
  fontSize: 'var(--st-font-size-sm)',
  textAlign: 'center',
  padding: 16,
};

export const doc: ComponentDoc = {
  slug: 'context-menu',
  name: 'ContextMenu',
  category: 'overlays',
  summary:
    'A menu that opens at the pointer on right-click, long-press, Shift+F10 or the Menu key.',
  description:
    'Use ContextMenu for shortcuts to actions on a specific object, such as a block in the signature editor or a row in a document list. Every action in a context menu must also be reachable another way (a toolbar or ActionMenu), because context menus are hard to discover. It shares its item parts and keyboard model with DropdownMenu.',
  imports: [
    'ContextMenu',
    'ContextMenuTrigger',
    'ContextMenuContent',
    'ContextMenuItem',
    'ContextMenuCheckboxItem',
    'ContextMenuSeparator',
    'ContextMenuShortcut',
    'ContextMenuSub',
    'ContextMenuSubTrigger',
    'ContextMenuSubContent',
  ],
  status: 'stable',
  examples: [
    {
      name: 'Basic',
      title: 'Basic',
      description: 'Right-click the area, long-press on touch, or focus it and press Shift+F10.',
      minHeight: 300,
    },
    { name: 'WithSubmenu', title: 'Icons, shortcuts and submenus', minHeight: 320 },
    { name: 'Toggles', title: 'Checkable items', minHeight: 260 },
  ],
  props: [
    {
      component: 'ContextMenu',
      name: 'open / defaultOpen',
      type: 'boolean',
      description: 'Controlled or initial open state.',
    },
    {
      component: 'ContextMenu',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the menu opens or closes.',
    },
    {
      component: 'ContextMenu',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Let the native browser menu show instead.',
    },
    {
      component: 'ContextMenuTrigger',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Use your own element as the target area.',
    },
    {
      component: 'ContextMenuTrigger',
      name: 'longPressDelay',
      type: 'number',
      default: '500',
      description: 'Touch long-press duration in ms. Moving more than 8px cancels.',
    },
    {
      component: 'ContextMenuTrigger',
      name: 'tabIndex',
      type: 'number',
      description: 'Make the area focusable so keyboard users can open it with Shift+F10.',
    },
    {
      component: 'ContextMenuContent',
      name: 'aria-label',
      type: 'string',
      default: "'Context menu'",
      description: 'Accessible name of the menu, e.g. “Block actions”.',
    },
    {
      component: 'ContextMenuContent',
      name: 'loop / onEscapeKeyDown',
      type: 'boolean / function',
      description: 'As DropdownMenuContent.',
    },
    {
      component: 'ContextMenuItem',
      name: 'onSelect, icon, destructive, disabled, closeOnSelect',
      type: 'None',
      description: 'Identical to DropdownMenuItem.',
    },
    {
      component: 'ContextMenuCheckboxItem / RadioItem / Sub…',
      name: 'None',
      type: 'None',
      description: 'Identical to their DropdownMenu counterparts.',
    },
  ],
  accessibility: [
    'Opens from the keyboard with Shift+F10 or the ContextMenu key while focus is inside the trigger area.',
    'The menu is positioned at the pointer (or the focused element for keyboard) and receives focus on open.',
    'Focus returns to the element that had it before the menu opened.',
    'Long-press support makes the menu usable on touch screens; the browser callout is suppressed.',
    'Provide every action elsewhere too. Context menus are not discoverable.',
  ],
  keyboard: [
    {
      keys: ['Shift+F10', 'ContextMenu'],
      description: 'Open the menu from a focused element in the area.',
    },
    { keys: ['ArrowDown', 'ArrowUp', 'Home', 'End'], description: 'Move between items.' },
    { keys: ['Enter', 'Space'], description: 'Activate the focused item.' },
    { keys: ['ArrowRight', 'ArrowLeft'], description: 'Open or close a submenu.' },
    { keys: ['Escape'], description: 'Close and restore focus.' },
  ],
  guidelines: {
    do: [
      'Mirror the actions in a visible toolbar or ActionMenu.',
      'Keep the most frequent action first.',
    ],
    dont: [
      'Hide critical or unique functionality only in a context menu.',
      'Override the browser menu on text the user may want to copy.',
    ],
  },
  related: ['dropdown-menu', 'action-menu'],
};

export function Basic() {
  return (
    <ContextMenu>
      <ContextMenuTrigger tabIndex={0} aria-label="Signature block: logo" style={area}>
        Right-click the logo block
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="Block actions">
        <ContextMenuItem>Replace image</ContextMenuItem>
        <ContextMenuItem>Edit link</ContextMenuItem>
        <ContextMenuItem>Duplicate block</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem destructive>Remove block</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function WithSubmenu() {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        tabIndex={0}
        aria-label="Contract: Master services agreement"
        style={area}
      >
        Master services agreement.pdf
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="Document actions">
        <ContextMenuItem icon={<Icon name="eye" />}>
          Open <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem icon={<Icon name="pencil" />}>
          Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger icon={<Icon name="folder" />}>Move to</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Contracts / 2026</ContextMenuItem>
            <ContextMenuItem>Contracts / Archive</ContextMenuItem>
            <ContextMenuItem>Shared with Legal</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem icon={<Icon name="download" />}>Download</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem icon={<Icon name="trash" />} destructive>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function Toggles() {
  const [grid, setGrid] = React.useState(true);
  const [guides, setGuides] = React.useState(false);
  return (
    <ContextMenu>
      <ContextMenuTrigger tabIndex={0} aria-label="Editor canvas" style={area}>
        Editor canvas, right-click for view options
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="View options">
        <ContextMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
          Show grid
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked={guides} onCheckedChange={setGuides}>
          Show safe-area guides
        </ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
