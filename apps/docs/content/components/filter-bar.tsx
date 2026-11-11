import * as React from 'react';
import { Button, FilterBar, FilterChip, Icon } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'filter-bar',
  name: 'FilterBar',
  category: 'advanced',
  summary: 'A responsive row of search, filters, results count and "Clear all".',
  description:
    'FilterBar assembles the filtering controls above a table or list: an optional search field, any number of FilterChips, a "Clear all" action and a results count that screen readers hear when it changes. It wraps on narrow screens without breaking the page.',
  imports: ['FilterBar', 'FilterChip'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill', minHeight: 300 },
    { name: 'WithActions', title: 'With trailing actions', layout: 'fill' },
    { name: 'SearchOnly', title: 'Search only', layout: 'fill' },
  ],
  props: [
    {
      component: 'FilterBar',
      name: 'children',
      type: 'ReactNode',
      description: 'FilterChips and other filter controls.',
    },
    {
      component: 'FilterBar',
      name: 'search',
      type: '{ value: string; onChange: (v: string) => void; label?: string; placeholder?: string }',
      description: 'Optional search field.',
    },
    {
      component: 'FilterBar',
      name: 'onClearAll',
      type: '() => void',
      description: 'Shows "Clear all" when provided.',
    },
    {
      component: 'FilterBar',
      name: 'canClear',
      type: 'boolean',
      default: 'true',
      description: 'Whether any filter is active.',
    },
    {
      component: 'FilterBar',
      name: 'resultCount',
      type: 'number',
      description: 'Results count, announced politely on change.',
    },
    {
      component: 'FilterBar',
      name: 'formatResultCount',
      type: '(count: number) => string',
      default: '"N results"',
      description: 'Formats the count.',
    },
    {
      component: 'FilterBar',
      name: 'actions',
      type: 'ReactNode',
      description: 'Trailing content such as sort or view controls.',
    },
    {
      component: 'FilterBar',
      name: 'label',
      type: 'string',
      default: "'Filters'",
      description: 'Accessible name of the group.',
    },
  ],
  accessibility: [
    'The bar is a labelled group ("Filters").',
    'The results count is a polite live region (role="status"), so screen readers announce new totals without moving focus.',
    'The search field is a native search input with an accessible label.',
    'Hide "Clear all" with canClear={false} when nothing is active, so it is not a dead control.',
  ],
  keyboard: [
    {
      keys: ['Tab'],
      description: 'Moves through search, each filter, its clear button and Clear all.',
    },
  ],
  guidelines: {
    do: ['Keep the most used filters visible; move rare ones into a "More filters" popover.'],
    dont: ['Announce counts on every keystroke for slow searches; debounce first.'],
  },
  related: ['filter-chip', 'data-table', 'search-input'],
};

const users = [
  { name: 'Amara Okafor', department: 'Sales' },
  { name: 'Lukas Novak', department: 'Engineering' },
  { name: 'Priya Raman', department: 'Legal' },
  { name: 'Hana Sato', department: 'Sales' },
  { name: 'Oliver Grant', department: 'Finance' },
];

export function Basic() {
  const [query, setQuery] = React.useState('');
  const [department, setDepartment] = React.useState<string | null>(null);
  const results = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) &&
      (!department || u.department === department),
  );
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <FilterBar
        search={{
          value: query,
          onChange: setQuery,
          label: 'Search users',
          placeholder: 'Search by name',
        }}
        resultCount={results.length}
        onClearAll={() => {
          setQuery('');
          setDepartment(null);
        }}
        canClear={Boolean(query || department)}
      >
        <FilterChip
          label="Department"
          value={department ?? undefined}
          onClear={() => setDepartment(null)}
        >
          <div role="group" aria-label="Departments" style={{ display: 'grid', gap: 4 }}>
            {['Sales', 'Engineering', 'Legal', 'Finance'].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={department === d ? 'primary' : 'ghost'}
                onClick={() => setDepartment(d)}
              >
                {d}
              </Button>
            ))}
          </div>
        </FilterChip>
      </FilterBar>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {results.map((u) => (
          <li key={u.name}>
            {u.name} · {u.department}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WithActions() {
  const [q, setQ] = React.useState('');
  return (
    <FilterBar
      search={{ value: q, onChange: setQ, label: 'Search templates' }}
      resultCount={24}
      formatResultCount={(n) => `${n} templates`}
      actions={
        <Button size="sm" variant="outline" leadingIcon={<Icon name="arrows-up-down" />}>
          Sort
        </Button>
      }
    >
      <FilterChip label="Owner" />
      <FilterChip label="Updated" value="This month" onClear={() => {}} />
    </FilterBar>
  );
}

export function SearchOnly() {
  const [q, setQ] = React.useState('');
  return (
    <FilterBar
      search={{
        value: q,
        onChange: setQ,
        label: 'Search contracts',
        placeholder: 'Contract or counterparty',
      }}
    />
  );
}
