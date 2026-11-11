import { Icon, TreeView, type TreeItem } from '@bindshq/stance-react';
import { useState } from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

const teams: TreeItem[] = [
  {
    id: 'binds',
    label: 'Binds',
    children: [
      {
        id: 'sales',
        label: 'Sales',
        meta: '48',
        children: [
          { id: 'emea', label: 'EMEA', meta: '21' },
          { id: 'apac', label: 'APAC', meta: '27' },
        ],
      },
      {
        id: 'support',
        label: 'Support',
        meta: '16',
        children: [
          { id: 'tier1', label: 'Tier 1', meta: '10' },
          { id: 'tier2', label: 'Tier 2', meta: '6' },
        ],
      },
      { id: 'legal', label: 'Legal', meta: '4', disabled: true },
      { id: 'marketing', label: 'Marketing', meta: '9' },
    ],
  },
];

export const doc: ComponentDoc = {
  slug: 'tree-view',
  name: 'TreeView',
  category: 'navigation',
  summary: 'Displays and navigates hierarchical data with expandable branches.',
  description:
    'Use TreeView for nested structures people need to browse and pick from: teams in an organisation, folders, categories. It follows the WAI-ARIA tree pattern, including typeahead and expanding all siblings with *. Data is passed as items, and expansion and selection can be controlled.',
  imports: ['TreeView', 'type TreeItem'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    {
      name: 'MultipleSelection',
      title: 'Multiple selection',
      description: 'Space toggles, Ctrl/⌘+A selects everything, Shift+arrows extends.',
      layout: 'start',
    },
    { name: 'CustomIcons', title: 'Custom icons', layout: 'start' },
    { name: 'Controlled', title: 'Controlled expansion', layout: 'start' },
  ],
  props: [
    {
      component: 'TreeView',
      name: 'items',
      type: 'TreeItem[]',
      required: true,
      description: '{ id, label, children?, icon?, disabled?, meta? }.',
    },
    {
      component: 'TreeView',
      name: 'aria-label',
      type: 'string',
      description: 'Name of the tree (or use aria-labelledby).',
    },
    {
      component: 'TreeView',
      name: 'selectionMode',
      type: "'none' | 'single' | 'multiple'",
      default: "'single'",
      description: 'How many items can be selected.',
    },
    {
      component: 'TreeView',
      name: 'selected / defaultSelected',
      type: 'string[]',
      description: 'Selected ids.',
    },
    {
      component: 'TreeView',
      name: 'onSelectedChange',
      type: '(ids: string[]) => void',
      description: 'Called when selection changes.',
    },
    {
      component: 'TreeView',
      name: 'expanded / defaultExpanded',
      type: 'string[]',
      description: 'Expanded ids.',
    },
    {
      component: 'TreeView',
      name: 'onExpandedChange',
      type: '(ids: string[]) => void',
      description: 'Called when branches open or close.',
    },
    {
      component: 'TreeView',
      name: 'onAction',
      type: '(item: TreeItem) => void',
      description: 'Called on Enter or click, e.g. to open an item.',
    },
    {
      component: 'TreeView',
      name: 'renderIcon',
      type: '(item, state) => ReactNode',
      description: 'Icon per item using { expanded, selected, hasChildren, level }.',
    },
    {
      component: 'TreeView',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Row height.',
    },
  ],
  accessibility: [
    'tree, treeitem and group roles with aria-level, aria-setsize, aria-posinset, aria-expanded and aria-selected.',
    'One item is in the Tab order (roving tabindex); disabled items are skipped by arrow keys and announced as disabled.',
    'aria-multiselectable is set in multiple selection mode.',
    'Selection is shown with a tint and weight change plus an outline under forced colours.',
  ],
  keyboard: [
    { keys: ['↑', '↓'], description: 'Previous / next visible item.' },
    { keys: ['→'], description: 'Expands a closed branch, or moves to its first child.' },
    { keys: ['←'], description: 'Collapses an open branch, or moves to the parent.' },
    { keys: ['Home', 'End'], description: 'First / last visible item.' },
    { keys: ['Enter'], description: 'Selects and activates the item.' },
    { keys: ['Space'], description: 'Selects (toggles in multiple mode).' },
    { keys: ['*'], description: 'Expands all siblings of the focused item.' },
    { keys: ['a–z'], description: 'Moves to the next item starting with the typed characters.' },
    { keys: ['Ctrl/⌘ + A'], description: 'Selects all (multiple mode).' },
  ],
  guidelines: {
    do: [
      'Keep labels short and unique among siblings.',
      'Show counts with meta rather than in the label.',
    ],
    dont: [
      'Use a tree for fewer than two levels; use a List.',
      'Nest more than four or five levels deep.',
    ],
  },
  related: ['file-tree', 'accordion', 'list'],
};

export function Basic() {
  return (
    <TreeView
      aria-label="Teams"
      items={teams}
      defaultExpanded={['binds']}
      defaultSelected={['sales']}
      style={{ width: 280 }}
    />
  );
}

export function MultipleSelection() {
  const [selected, setSelected] = useState<string[]>(['emea']);
  return (
    <div style={{ display: 'grid', gap: 12, width: 280 }}>
      <TreeView
        aria-label="Assign to teams"
        items={teams}
        selectionMode="multiple"
        selected={selected}
        onSelectedChange={setSelected}
        defaultExpanded={['binds', 'sales']}
      />
      <p style={{ margin: 0, fontSize: 13 }}>{selected.length} selected</p>
    </div>
  );
}

export function CustomIcons() {
  return (
    <TreeView
      aria-label="Teams"
      items={teams}
      defaultExpanded={['binds']}
      selectionMode="none"
      renderIcon={(item, s) => (
        <Icon name={s.level === 1 ? 'building' : s.hasChildren ? 'users' : 'user'} size={16} />
      )}
      style={{ width: 280 }}
    />
  );
}

export function Controlled() {
  const [expanded, setExpanded] = useState<string[]>(['binds']);
  return (
    <div style={{ display: 'grid', gap: 12, width: 280 }}>
      <TreeView
        aria-label="Teams"
        items={teams}
        expanded={expanded}
        onExpandedChange={setExpanded}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setExpanded(['binds', 'sales', 'support'])}>
          Expand all
        </button>
        <button type="button" onClick={() => setExpanded([])}>
          Collapse all
        </button>
      </div>
    </div>
  );
}
