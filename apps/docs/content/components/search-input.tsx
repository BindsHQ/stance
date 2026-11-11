import { SearchInput } from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'search-input',
  name: 'SearchInput',
  category: 'forms',
  summary: 'A search field with a clear button, Escape to clear and an optional shortcut hint.',
  description:
    'Use SearchInput to filter lists and tables or to start a search. It is a native search input (role searchbox) with a leading icon, a clear button once there is text, and a keyboard hint while empty. Pair with SearchableList or FilterBar for complete filtering patterns.',
  imports: ['SearchInput'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'Filtering', title: 'Filtering a list', layout: 'start' },
    { name: 'Loading', title: 'Loading and sizes', layout: 'start' },
  ],
  props: [
    { component: 'SearchInput', name: 'value', type: 'string', description: 'Controlled value.' },
    {
      component: 'SearchInput',
      name: 'defaultValue',
      type: 'string',
      default: "''",
      description: 'Initial value.',
    },
    {
      component: 'SearchInput',
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Called on every change.',
    },
    {
      component: 'SearchInput',
      name: 'onSearch',
      type: '(value: string) => void',
      description: 'Called on Enter.',
    },
    {
      component: 'SearchInput',
      name: 'onClear',
      type: '() => void',
      description: 'Called when cleared by button or Escape.',
    },
    {
      component: 'SearchInput',
      name: 'shortcut',
      type: 'string',
      description: 'Keyboard hint shown while empty, e.g. "⌘K".',
    },
    {
      component: 'SearchInput',
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Replace the search icon with a spinner.',
    },
    {
      component: 'SearchInput',
      name: 'clearLabel',
      type: 'string',
      default: "'Clear search'",
      description: 'Clear button label.',
    },
    {
      component: 'SearchInput',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Control height.',
    },
  ],
  accessibility: [
    'Renders <input type="search">, exposed as a searchbox.',
    'Provide a label with aria-label or FormField; the placeholder is not a label.',
    'Clearing returns focus to the field so typing can continue.',
    'Announce result counts near the results with a live region (for example "12 templates").',
  ],
  keyboard: [
    { keys: ['Escape'], description: 'Clears the value (when not empty).' },
    { keys: ['Enter'], description: 'Calls onSearch.' },
  ],
  related: ['input', 'searchable-list', 'filter-bar', 'command-palette'],
};

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <SearchInput aria-label="Search templates" placeholder="Search templates" shortcut="/" />
    </div>
  );
}

const users = ['Priya Raman', 'Tom Okafor', 'Lena Fischer', 'Marco Bianchi', 'Aiko Tanaka'];

export function Filtering() {
  const [query, setQuery] = React.useState('');
  const results = users.filter((u) => u.toLowerCase().includes(query.toLowerCase()));
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 360 }}>
      <SearchInput
        aria-label="Search organisation users"
        placeholder="Search users"
        value={query}
        onValueChange={setQuery}
      />
      <p role="status" style={{ margin: 0, fontSize: 13 }}>
        {results.length} {results.length === 1 ? 'user' : 'users'}
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
        {results.map((u) => (
          <li key={u}>{u}</li>
        ))}
      </ul>
    </div>
  );
}

export function Loading() {
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 360 }}>
      <SearchInput size="sm" aria-label="Search (small)" defaultValue="NDA" />
      <SearchInput aria-label="Search contracts" defaultValue="Master services" loading />
      <SearchInput
        size="lg"
        aria-label="Search (large)"
        placeholder="Search everything"
        shortcut="⌘K"
      />
    </div>
  );
}
