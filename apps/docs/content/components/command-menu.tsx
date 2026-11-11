import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandMenu,
  CommandSeparator,
  Icon,
} from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'command-menu',
  name: 'CommandMenu',
  category: 'navigation',
  summary: 'A searchable, keyboard-driven list of commands with groups, keywords and shortcuts.',
  description:
    'CommandMenu combines a search field with a filtered list of actions. It is the building block for CommandPalette and can also be embedded inline, for example in an empty state or a sidebar quick-switcher. Filtering uses a built-in fuzzy scorer over each item’s value and keywords; pass your own scorer or disable filtering for server-side search.',
  imports: [
    'CommandMenu',
    'CommandInput',
    'CommandList',
    'CommandGroup',
    'CommandItem',
    'CommandSeparator',
    'CommandEmpty',
    'CommandShortcut',
  ],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'center', minHeight: 380 },
    {
      name: 'WithKeywords',
      title: 'Keywords and disabled items',
      description: 'Typing “create” finds “New template”.',
      minHeight: 300,
    },
    {
      name: 'ServerFiltering',
      title: 'Custom filtering',
      description: 'Disable built-in filtering and render your own results.',
      minHeight: 300,
    },
  ],
  props: [
    {
      component: 'CommandMenu',
      name: 'label',
      type: 'string',
      default: "'Commands'",
      description: 'Accessible name for the input and listbox.',
    },
    {
      component: 'CommandMenu',
      name: 'search / defaultSearch / onSearchChange',
      type: 'string / string / (search: string) => void',
      description: 'Controlled or uncontrolled search text.',
    },
    {
      component: 'CommandMenu',
      name: 'filter',
      type: '((text: string, search: string) => number) | false',
      default: 'fuzzyScore',
      description: 'Return 0 to hide an item; false disables filtering.',
    },
    {
      component: 'CommandMenu',
      name: 'onItemSelect',
      type: '(value: string) => void',
      description: 'Called after any item is selected.',
    },
    {
      component: 'CommandInput',
      name: 'placeholder',
      type: 'string',
      default: "'Type a command or search…'",
      description: 'Input placeholder.',
    },
    {
      component: 'CommandInput',
      name: 'hideIcon',
      type: 'boolean',
      default: 'false',
      description: 'Hide the search icon.',
    },
    {
      component: 'CommandList',
      name: '...props',
      type: 'HTMLAttributes<HTMLDivElement>',
      description: 'The listbox.',
    },
    {
      component: 'CommandGroup',
      name: 'heading',
      type: 'ReactNode',
      description: 'Group heading and accessible name. Empty groups hide automatically.',
    },
    {
      component: 'CommandItem',
      name: 'value',
      type: 'string',
      required: true,
      description: 'Unique value used for filtering and passed to onSelect.',
    },
    {
      component: 'CommandItem',
      name: 'keywords',
      type: 'string[]',
      description: 'Extra search terms.',
    },
    {
      component: 'CommandItem',
      name: 'onSelect',
      type: '(value: string) => void',
      description: 'Runs on click or Enter.',
    },
    {
      component: 'CommandItem',
      name: 'icon / shortcut',
      type: 'ReactNode',
      description: 'Leading icon and trailing shortcut hint.',
    },
    {
      component: 'CommandItem',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Visible but not selectable; skipped by arrow keys.',
    },
    {
      component: 'CommandItem',
      name: 'forceMount',
      type: 'boolean',
      default: 'false',
      description: 'Always render regardless of the search.',
    },
    {
      component: 'CommandEmpty',
      name: 'children',
      type: 'ReactNode',
      default: "'No results found.'",
      description: 'Shown and announced when nothing matches. Place after CommandList.',
    },
  ],
  accessibility: [
    'Follows the WAI-ARIA combobox pattern: the input has role="combobox" with aria-controls and aria-activedescendant pointing at the highlighted option.',
    'Focus stays in the input; arrow keys move the highlight, so typing is never interrupted.',
    'Groups are role="group" named by their heading; separators are hidden from assistive technology.',
    'The empty message lives in a polite status region.',
  ],
  keyboard: [
    {
      keys: ['↓', '↑'],
      description: 'Move the highlight, wrapping at the ends and skipping disabled items.',
    },
    { keys: ['PageUp', 'PageDown'], description: 'Jump to the first or last item.' },
    { keys: ['Enter'], description: 'Run the highlighted command.' },
  ],
  guidelines: {
    do: [
      'Name commands as verbs: “Invite user”, “Open integrations”.',
      'Add keywords for synonyms people actually type.',
    ],
    dont: ['Put more than ~50 items in one group without search hints.'],
  },
  related: ['command-palette', 'combobox', 'searchable-list'],
};

const box: React.CSSProperties = { width: 'min(440px, 100%)' };

export function Basic() {
  const [last, setLast] = React.useState('');
  return (
    <div style={{ ...box, display: 'grid', gap: 8 }}>
      <CommandMenu label="Quick actions" onItemSelect={setLast}>
        <CommandInput />
        <CommandList>
          <CommandGroup heading="Templates">
            <CommandItem value="New template" icon={<Icon name="plus" />} shortcut="⌘N" />
            <CommandItem value="Browse gallery" icon={<Icon name="layout-grid" />} />
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Organisation">
            <CommandItem value="Invite user" icon={<Icon name="users" />} shortcut="⌘I" />
            <CommandItem value="Open integrations" icon={<Icon name="link" />} />
            <CommandItem value="Settings" icon={<Icon name="settings" />} shortcut="⌘," />
          </CommandGroup>
        </CommandList>
        <CommandEmpty />
      </CommandMenu>
      <span aria-live="polite">{last && `Selected: ${last}`}</span>
    </div>
  );
}

export function WithKeywords() {
  return (
    <CommandMenu label="Template actions" style={box}>
      <CommandInput placeholder="Search actions…" />
      <CommandList>
        <CommandItem
          value="New template"
          keywords={['create', 'add']}
          icon={<Icon name="plus" />}
        />
        <CommandItem
          value="Import from Outlook"
          keywords={['upload']}
          icon={<Icon name="upload" />}
          disabled
        />
        <CommandItem
          value="Export as HTML"
          keywords={['download']}
          icon={<Icon name="download" />}
        />
      </CommandList>
      <CommandEmpty>No actions match. Try “create” or “download”.</CommandEmpty>
    </CommandMenu>
  );
}

const people = [
  'Ada Lovelace',
  'Grace Hopper',
  'Katherine Johnson',
  'Alan Turing',
  'Margaret Hamilton',
];

export function ServerFiltering() {
  const [search, setSearch] = React.useState('');
  // Stand-in for a server query: case-insensitive "contains".
  const results = people.filter((p) => p.toLowerCase().includes(search.toLowerCase()));
  return (
    <CommandMenu
      label="Find a person"
      search={search}
      onSearchChange={setSearch}
      filter={false}
      style={box}
    >
      <CommandInput placeholder="Search people…" />
      <CommandList>
        {results.map((p) => (
          <CommandItem key={p} value={p} icon={<Icon name="user" />} />
        ))}
      </CommandList>
      <CommandEmpty>No people found.</CommandEmpty>
    </CommandMenu>
  );
}
