import * as React from 'react';
import { Avatar, Badge, SearchableList } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'searchable-list',
  name: 'SearchableList',
  category: 'advanced',
  summary: 'A search field paired with a filtered list, with result counts announced as you type.',
  description:
    'Use SearchableList to let people find items in a list of tens to hundreds, such as organisation users or signature templates. In selectable mode, the search field drives a listbox for picking one item, like assigning a template owner. For choosing a value inside a form field, prefer Combobox.',
  imports: ['SearchableList'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Filter a list', layout: 'fill' },
    {
      name: 'Selectable',
      title: 'Pick one item',
      description: 'Arrow keys move through matches while focus stays in the search field.',
      layout: 'fill',
    },
    {
      name: 'Fuzzy',
      title: 'Fuzzy ranking',
      description: 'matchMode="fuzzy" ranks prefix and word matches first and tolerates gaps.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'SearchableList',
      name: 'items',
      type: 'readonly T[]',
      required: true,
      description: 'Items to filter.',
    },
    {
      component: 'SearchableList',
      name: 'getItemLabel',
      type: '(item: T) => string',
      required: true,
      description: 'Text used for matching and as the option name.',
    },
    {
      component: 'SearchableList',
      name: 'listLabel',
      type: 'string',
      required: true,
      description: 'Accessible name of the list.',
    },
    {
      component: 'SearchableList',
      name: 'searchLabel',
      type: 'string',
      default: "'Search'",
      description: 'Accessible name of the search field.',
    },
    {
      component: 'SearchableList',
      name: 'getItemKey',
      type: '(item: T) => Key',
      default: 'label',
      description: 'Stable key; also the selection key.',
    },
    {
      component: 'SearchableList',
      name: 'getItemKeywords',
      type: '(item: T) => string[]',
      description: 'Extra searchable text, such as email or team.',
    },
    {
      component: 'SearchableList',
      name: 'renderItem',
      type: '(item: T, state) => ReactNode',
      description: 'Custom item content. state has active, selected and query.',
    },
    {
      component: 'SearchableList',
      name: 'matchMode',
      type: "'contains' | 'fuzzy'",
      default: "'contains'",
      description: 'Contains keeps original order; fuzzy ranks matches.',
    },
    {
      component: 'SearchableList',
      name: 'filter',
      type: '(item: T, query: string) => boolean',
      description: 'Custom matching; overrides matchMode.',
    },
    {
      component: 'SearchableList',
      name: 'query / defaultQuery / onQueryChange',
      type: 'string / string / (q) => void',
      description: 'Controlled or uncontrolled search text.',
    },
    {
      component: 'SearchableList',
      name: 'selectable',
      type: 'boolean',
      default: 'false',
      description: 'Turns the list into a single-select listbox.',
    },
    {
      component: 'SearchableList',
      name: 'selectedKey / defaultSelectedKey',
      type: 'Key | null',
      description: 'Selected item, controlled or uncontrolled.',
    },
    {
      component: 'SearchableList',
      name: 'onSelectionChange',
      type: '(key, item) => void',
      description: 'Called when an item is selected.',
    },
    {
      component: 'SearchableList',
      name: 'isItemDisabled',
      type: '(item: T) => boolean',
      description: 'Disabled items are skipped and cannot be selected.',
    },
    {
      component: 'SearchableList',
      name: 'emptyState',
      type: 'ReactNode | (query) => ReactNode',
      description: 'Shown when nothing matches.',
    },
    {
      component: 'SearchableList',
      name: 'formatCount',
      type: '(count, total) => string',
      description: 'Text for the results status.',
    },
    {
      component: 'SearchableList',
      name: 'maxHeight',
      type: 'number | string',
      default: '320',
      description: 'Max list height before it scrolls.',
    },
    {
      component: 'SearchableList',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Field and row density.',
    },
  ],
  accessibility: [
    'The result count is a status live region, so screen reader users hear “3 of 48 results” as they type.',
    'In selectable mode the search field is a combobox that controls the listbox; aria-activedescendant tracks the active option while focus stays in the field.',
    'Escape clears the search, as in SearchInput.',
    'Disabled items stay visible and are announced as unavailable.',
  ],
  keyboard: [
    { keys: ['↓', '↑'], description: 'Selectable: move the active option.' },
    { keys: ['Ctrl', 'Home'], description: 'Selectable: first option.' },
    { keys: ['Ctrl', 'End'], description: 'Selectable: last option.' },
    { keys: ['Enter'], description: 'Selectable: select the active option.' },
    { keys: ['Escape'], description: 'Clear the search.' },
  ],
  guidelines: {
    do: [
      'Include secondary text, such as email or team, in getItemKeywords.',
      'Write an empty state that suggests what to try next.',
    ],
    dont: [
      'Use for thousands of items without virtualisation; combine with VirtualizedList.',
      'Use as a form field picker; use Combobox.',
    ],
  },
  related: ['search-input', 'combobox', 'virtualized-list', 'list'],
};

const users = [
  { id: 'u1', name: 'Priya Nair', email: 'priya.nair@binds.si', team: 'Sales' },
  { id: 'u2', name: 'Amara Okafor', email: 'amara.okafor@binds.si', team: 'Legal' },
  { id: 'u3', name: 'Lukas Brenner', email: 'lukas.brenner@binds.si', team: 'Sales' },
  { id: 'u4', name: 'Hana Sato', email: 'hana.sato@binds.si', team: 'Finance' },
  { id: 'u5', name: 'Tomás Ruiz', email: 'tomas.ruiz@binds.si', team: 'Operations' },
  { id: 'u6', name: 'Owen Price', email: 'owen.price@binds.si', team: 'Sales' },
  { id: 'u7', name: 'Zainab Haddad', email: 'zainab.haddad@binds.si', team: 'Legal' },
  { id: 'u8', name: 'Mateja Kovač', email: 'mateja.kovac@binds.si', team: 'Customer Success' },
];

export function Basic() {
  return (
    <div style={{ maxWidth: 420 }}>
      <SearchableList
        items={users}
        getItemLabel={(u) => u.name}
        getItemKey={(u) => u.id}
        getItemKeywords={(u) => [u.email, u.team]}
        searchLabel="Search organisation users"
        placeholder="Search by name, email or team"
        listLabel="Organisation users"
        renderItem={(u) => (
          <>
            <Avatar name={u.name} size="sm" />
            <span style={{ display: 'grid' }}>
              <span>{u.name}</span>
              <small style={{ color: 'var(--st-color-fg-muted)' }}>{u.email}</small>
            </span>
            <span style={{ marginLeft: 'auto' }}>
              <Badge size="sm">{u.team}</Badge>
            </span>
          </>
        )}
      />
    </div>
  );
}

export function Selectable() {
  const [owner, setOwner] = React.useState<React.Key | null>('u2');
  return (
    <div style={{ maxWidth: 380, display: 'grid', gap: 8 }}>
      <SearchableList
        items={users}
        getItemLabel={(u) => u.name}
        getItemKey={(u) => u.id}
        getItemKeywords={(u) => [u.team]}
        selectable
        selectedKey={owner}
        onSelectionChange={setOwner}
        searchLabel="Find a template owner"
        listLabel="People who can own templates"
        maxHeight={220}
      />
      <p style={{ margin: 0 }}>Owner: {users.find((u) => u.id === owner)?.name ?? 'none'}</p>
    </div>
  );
}

export function Fuzzy() {
  const templates = [
    'Standard signature',
    'Sales team signature',
    'Legal disclaimer footer',
    'Holiday out-of-office',
    'Event banner — Q4 summit',
    'Recruiting signature',
  ];
  return (
    <div style={{ maxWidth: 380 }}>
      <SearchableList
        items={templates}
        getItemLabel={(t) => t}
        matchMode="fuzzy"
        defaultQuery="sgn"
        searchLabel="Search templates"
        listLabel="Signature templates"
        emptyState={(q) => <p>No templates match “{q}”. Try a shorter search.</p>}
      />
    </div>
  );
}
