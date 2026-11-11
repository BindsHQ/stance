import {
  Button,
  CommandGroup,
  CommandItem,
  CommandPalette,
  Icon,
  toast,
} from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'command-palette',
  name: 'CommandPalette',
  category: 'advanced',
  summary: 'A global ⌘K / Ctrl+K command menu in a dialog for fast navigation and actions.',
  description:
    'CommandPalette puts a CommandMenu in a modal dialog that opens from anywhere with a keyboard shortcut. Use it to give power users one place to jump between pages and run common actions. Mount one per app. The examples on this page use hotkey={false} (except the last) so they do not clash with the docs search on ⌘K.',
  imports: ['CommandPalette', 'CommandGroup', 'CommandItem'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 140 },
    { name: 'WithActions', title: 'Navigation and actions', minHeight: 140 },
    {
      name: 'GlobalHotkey',
      title: 'Custom hotkey',
      description: 'Press ⌘⇧P / Ctrl+Shift+P on this page.',
      minHeight: 140,
    },
  ],
  props: [
    {
      component: 'CommandPalette',
      name: 'hotkey',
      type: 'string | false',
      default: "'mod+k'",
      description: 'Global toggle shortcut; mod is ⌘ on Apple platforms and Ctrl elsewhere.',
    },
    {
      component: 'CommandPalette',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / boolean / (open: boolean) => void',
      description: 'Controlled or uncontrolled state.',
    },
    {
      component: 'CommandPalette',
      name: 'trigger',
      type: 'ReactElement',
      description: 'Optional button that opens the palette.',
    },
    {
      component: 'CommandPalette',
      name: 'label',
      type: 'string',
      default: "'Command palette'",
      description: 'Dialog title (visually hidden) and input label.',
    },
    {
      component: 'CommandPalette',
      name: 'placeholder',
      type: 'string',
      description: 'Input placeholder.',
    },
    {
      component: 'CommandPalette',
      name: 'emptyMessage',
      type: 'ReactNode',
      default: "'No results found.'",
      description: 'Shown when nothing matches.',
    },
    {
      component: 'CommandPalette',
      name: 'closeOnSelect',
      type: 'boolean',
      default: 'true',
      description: 'Close after an item runs.',
    },
    {
      component: 'CommandPalette',
      name: 'filter',
      type: 'CommandFilter | false',
      description: 'Custom scorer or disable filtering.',
    },
    {
      component: 'CommandPalette',
      name: 'showFooter',
      type: 'boolean',
      default: 'true',
      description: 'Keyboard hints footer (hidden on phones).',
    },
    {
      component: 'CommandPalette',
      name: 'children',
      type: 'ReactNode',
      description: 'CommandGroup and CommandItem elements.',
    },
  ],
  accessibility: [
    'A modal dialog with a visually hidden title; focus starts in the search combobox and returns to where it was on close.',
    'All CommandMenu keyboard behaviour applies inside.',
    'The shortcut is discoverable through the trigger button and the footer hint; never make the hotkey the only way in.',
  ],
  keyboard: [
    { keys: ['⌘', 'K'], description: 'Toggle the palette (Ctrl+K on Windows and Linux).' },
    { keys: ['↓', '↑'], description: 'Move through results.' },
    { keys: ['Enter'], description: 'Run the highlighted command and close.' },
    { keys: ['Esc'], description: 'Close.' },
  ],
  guidelines: {
    do: [
      'Show the shortcut on a visible trigger, e.g. “Search ⌘K”.',
      'Group results by type: pages, actions, people.',
    ],
    dont: ['Register several palettes on one page with the same hotkey.'],
  },
  related: ['command-menu', 'dialog'],
};

export function Basic() {
  return (
    <CommandPalette
      hotkey={false}
      trigger={
        <Button variant="outline" leadingIcon={<Icon name="search" />}>
          Search…
        </Button>
      }
    >
      <CommandGroup heading="Pages">
        <CommandItem value="Dashboard" icon={<Icon name="home" />} />
        <CommandItem value="My templates" icon={<Icon name="file-text" />} />
        <CommandItem value="Org users" icon={<Icon name="users" />} />
        <CommandItem value="Integrations" icon={<Icon name="link" />} />
      </CommandGroup>
    </CommandPalette>
  );
}

export function WithActions() {
  return (
    <CommandPalette
      hotkey={false}
      placeholder="Jump to a page or run an action…"
      trigger={<Button leadingIcon={<Icon name="command" />}>Open palette</Button>}
    >
      <CommandGroup heading="Actions">
        <CommandItem
          value="New template"
          keywords={['create']}
          icon={<Icon name="plus" />}
          onSelect={() => toast('Creating a new template…')}
        />
        <CommandItem
          value="Deploy signatures"
          keywords={['publish', 'push']}
          icon={<Icon name="send" />}
          onSelect={() => toast.success('Deployment started')}
        />
        <CommandItem
          value="Toggle theme"
          keywords={['dark', 'light']}
          icon={<Icon name="contrast" />}
        />
      </CommandGroup>
      <CommandGroup heading="Settings">
        <CommandItem value="Billing" icon={<Icon name="credit-card" />} />
        <CommandItem value="Security" icon={<Icon name="shield" />} />
      </CommandGroup>
    </CommandPalette>
  );
}

export function GlobalHotkey() {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open (or press ⌘⇧P / Ctrl+Shift+P)
      </Button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        hotkey="mod+shift+p"
        label="Workspace switcher"
      >
        <CommandGroup heading="Workspaces">
          <CommandItem value="Binds Ltd" icon={<Icon name="building" />} />
          <CommandItem value="eSignify Demo" icon={<Icon name="building" />} />
        </CommandGroup>
      </CommandPalette>
    </div>
  );
}
