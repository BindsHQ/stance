import * as React from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Icon,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'dropdown-menu',
  name: 'DropdownMenu',
  category: 'overlays',
  summary:
    'A menu of actions or options opened from a button, with groups, checkable items and submenus.',
  description:
    'Use DropdownMenu for a set of actions that apply to the current context, such as everything you can do with a signature template. For choosing a value in a form, use Select; for site navigation, use NavigationMenu. DropdownMenu implements the WAI-ARIA menu pattern with roving focus, typeahead and submenus, and has no third-party dependencies.',
  imports: [
    'DropdownMenu',
    'DropdownMenuTrigger',
    'DropdownMenuContent',
    'DropdownMenuItem',
    'DropdownMenuCheckboxItem',
    'DropdownMenuRadioGroup',
    'DropdownMenuRadioItem',
    'DropdownMenuLabel',
    'DropdownMenuSeparator',
    'DropdownMenuGroup',
    'DropdownMenuShortcut',
    'DropdownMenuSub',
    'DropdownMenuSubTrigger',
    'DropdownMenuSubContent',
  ],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 300 },
    {
      name: 'WithIconsAndShortcuts',
      title: 'Icons and shortcuts',
      description:
        'Icons sit before the label; shortcuts are hints only and are hidden from assistive technology.',
      minHeight: 300,
    },
    {
      name: 'Checkable',
      title: 'Checkbox and radio items',
      description: 'Checkable items keep the menu open so several settings can be changed at once.',
      minHeight: 320,
    },
    {
      name: 'Submenu',
      title: 'Submenus',
      description: 'Open with ArrowRight or hover; close with ArrowLeft or Escape.',
      minHeight: 300,
    },
    { name: 'Groups', title: 'Labelled groups', minHeight: 320 },
  ],
  props: [
    {
      component: 'DropdownMenu',
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state.',
    },
    {
      component: 'DropdownMenu',
      name: 'defaultOpen',
      type: 'boolean',
      default: 'false',
      description: 'Initial open state when uncontrolled.',
    },
    {
      component: 'DropdownMenu',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the menu opens or closes.',
    },
    {
      component: 'DropdownMenuTrigger',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render your own button (e.g. a Stance Button) as the trigger.',
    },
    {
      component: 'DropdownMenuContent',
      name: 'side',
      type: "'top' | 'right' | 'bottom' | 'left'",
      default: "'bottom'",
      description: 'Preferred side; flips when there is no room.',
    },
    {
      component: 'DropdownMenuContent',
      name: 'align',
      type: "'start' | 'center' | 'end'",
      default: "'start'",
      description: 'Alignment against the trigger.',
    },
    {
      component: 'DropdownMenuContent',
      name: 'sideOffset',
      type: 'number',
      default: '6',
      description: 'Gap between trigger and menu in px.',
    },
    {
      component: 'DropdownMenuContent',
      name: 'loop',
      type: 'boolean',
      default: 'true',
      description: 'Wrap arrow-key focus from last to first item.',
    },
    {
      component: 'DropdownMenuContent',
      name: 'onEscapeKeyDown',
      type: '(event: KeyboardEvent) => void',
      description: 'Call preventDefault to keep the menu open.',
    },
    {
      component: 'DropdownMenuItem',
      name: 'onSelect',
      type: '(event: MenuSelectEvent) => void',
      description: 'Called on click, Enter or Space. preventDefault keeps the menu open.',
    },
    {
      component: 'DropdownMenuItem',
      name: 'icon',
      type: 'ReactNode',
      description: 'Leading icon.',
    },
    {
      component: 'DropdownMenuItem',
      name: 'destructive',
      type: 'boolean',
      default: 'false',
      description: 'Danger styling for irreversible actions.',
    },
    {
      component: 'DropdownMenuItem',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Skipped by keyboard and not selectable.',
    },
    {
      component: 'DropdownMenuItem',
      name: 'closeOnSelect',
      type: 'boolean',
      default: 'true',
      description: 'Close the whole menu after selection.',
    },
    {
      component: 'DropdownMenuItem',
      name: 'textValue',
      type: 'string',
      description: 'Text for typeahead when children are not plain text.',
    },
    {
      component: 'DropdownMenuItem',
      name: 'inset',
      type: 'boolean',
      default: 'false',
      description: 'Indent to align with checkable items.',
    },
    {
      component: 'DropdownMenuCheckboxItem',
      name: 'checked',
      type: "boolean | 'indeterminate'",
      default: 'false',
      description: 'Checked state.',
    },
    {
      component: 'DropdownMenuCheckboxItem',
      name: 'onCheckedChange',
      type: '(checked: boolean) => void',
      description: 'Called when toggled.',
    },
    {
      component: 'DropdownMenuCheckboxItem',
      name: 'closeOnSelect',
      type: 'boolean',
      default: 'false',
      description: 'Checkable items stay open by default.',
    },
    {
      component: 'DropdownMenuRadioGroup',
      name: 'value / defaultValue',
      type: 'string',
      description: 'The selected radio value.',
    },
    {
      component: 'DropdownMenuRadioGroup',
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Called when a radio item is chosen.',
    },
    {
      component: 'DropdownMenuRadioItem',
      name: 'value',
      type: 'string',
      required: true,
      description: 'Value of this option.',
    },
    {
      component: 'DropdownMenuGroup',
      name: 'label',
      type: 'ReactNode',
      description: 'Visible heading that also labels the group.',
    },
    {
      component: 'DropdownMenuLabel',
      name: 'inset',
      type: 'boolean',
      description: 'Non-interactive heading text.',
    },
    {
      component: 'DropdownMenuShortcut',
      name: 'children',
      type: 'ReactNode',
      description: 'Keyboard hint shown at the end of an item (aria-hidden).',
    },
    {
      component: 'DropdownMenuSubTrigger',
      name: 'icon / disabled',
      type: 'ReactNode / boolean',
      description: 'Item that opens a nested DropdownMenuSubContent.',
    },
    {
      component: 'DropdownMenuSubContent',
      name: 'sideOffset / alignOffset',
      type: 'number',
      default: '2 / -5',
      description: 'Offsets of the submenu against its trigger.',
    },
  ],
  accessibility: [
    'The trigger has aria-haspopup="menu", aria-expanded and aria-controls; the menu is labelled by the trigger.',
    'Items use role menuitem, menuitemcheckbox or menuitemradio with aria-checked, so state is announced.',
    'Focus moves into the menu on open and returns to the trigger when it closes by Escape, selection or Tab.',
    'Disabled items expose aria-disabled and are skipped by arrow keys.',
    'Clicks inside a submenu never dismiss the parent; clicks outside dismiss the whole menu.',
    'High contrast mode adds a visible focus ring to the highlighted item; Windows forced colours use the system Highlight.',
  ],
  keyboard: [
    {
      keys: ['Enter', 'Space', 'ArrowDown'],
      description: 'On the trigger: open and focus the first item.',
    },
    { keys: ['ArrowUp'], description: 'On the trigger: open and focus the last item.' },
    { keys: ['ArrowDown', 'ArrowUp'], description: 'Move between items (wraps).' },
    { keys: ['Home', 'End'], description: 'First or last item.' },
    { keys: ['A to Z'], description: 'Typeahead to the next item starting with the typed text.' },
    { keys: ['Enter', 'Space'], description: 'Activate the focused item.' },
    { keys: ['ArrowRight'], description: 'Open a submenu.' },
    { keys: ['ArrowLeft'], description: 'Close a submenu and return to its trigger.' },
    { keys: ['Escape'], description: 'Close the current menu level.' },
    { keys: ['Tab'], description: 'Close the menu.' },
  ],
  guidelines: {
    do: [
      'Group related actions and put destructive ones last, after a separator.',
      'Keep labels short and verb-first: “Duplicate”, “Assign to users”.',
    ],
    dont: [
      'Use a menu for navigation links; use NavigationMenu.',
      'Nest submenus more than one level deep.',
    ],
  },
  related: ['action-menu', 'context-menu', 'menubar', 'split-button', 'select'],
};

export function Basic() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" trailingIcon={<Icon name="chevron-down" />}>
          Template actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit template</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem>Assign to users</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive>Delete template</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function WithIconsAndShortcuts() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Signature</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem icon={<Icon name="pencil" />}>
          Edit <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem icon={<Icon name="copy" />}>
          Copy HTML <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem icon={<Icon name="download" />}>Download as image</DropdownMenuItem>
        <DropdownMenuItem icon={<Icon name="send" />} disabled>
          Deploy (no integration)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<Icon name="trash" />} destructive>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Checkable() {
  const [banner, setBanner] = React.useState(true);
  const [social, setSocial] = React.useState(false);
  const [layout, setLayout] = React.useState('horizontal');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" leadingIcon={<Icon name="sliders" />}>
          Preview options
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Show</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={banner} onCheckedChange={setBanner}>
          Promotional banner
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={social} onCheckedChange={setSocial}>
          Social icons
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Layout</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={layout} onValueChange={setLayout}>
          <DropdownMenuRadioItem value="horizontal">Horizontal</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="stacked">Stacked</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Submenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Share contract</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem icon={<Icon name="link" />}>Copy link</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger icon={<Icon name="users" />}>
            Share with team
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Legal</DropdownMenuItem>
            <DropdownMenuItem>Finance</DropdownMenuItem>
            <DropdownMenuItem>Sales</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem icon={<Icon name="mail" />}>Email a copy</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Groups() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" leadingIcon={<Icon name="user" />}>
          Amara Okafor
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup label="Account">
          <DropdownMenuItem icon={<Icon name="user" />}>Profile</DropdownMenuItem>
          <DropdownMenuItem icon={<Icon name="settings" />}>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup label="Organisation">
          <DropdownMenuItem icon={<Icon name="building" />}>Binds Ltd</DropdownMenuItem>
          <DropdownMenuItem icon={<Icon name="credit-card" />}>Billing</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<Icon name="log-out" />}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
