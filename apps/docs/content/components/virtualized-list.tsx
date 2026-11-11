import * as React from 'react';
import { Avatar, Button, VirtualizedList, type VirtualizedListHandle } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'virtualized-list',
  name: 'VirtualizedList',
  category: 'advanced',
  summary: 'Renders very long lists efficiently by mounting only the visible window of items.',
  description:
    'Use VirtualizedList for thousands of items, such as audit logs, mailbox lists or recipients. Items can have a fixed height or be measured as they render. It can also act as a keyboard-selectable listbox. For short lists, a plain List is simpler and better for find-in-page.',
  imports: ['VirtualizedList'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Fixed height', layout: 'fill' },
    {
      name: 'Listbox',
      title: 'Selectable listbox',
      description: 'role="listbox" adds arrow-key navigation, selection and aria-activedescendant.',
      layout: 'fill',
    },
    {
      name: 'MeasuredHeights',
      title: 'Measured heights',
      description: 'Omit itemHeight to measure rich items as they render.',
      layout: 'fill',
    },
    { name: 'ScrollToIndex', title: 'Scroll to an item', layout: 'fill' },
  ],
  props: [
    {
      component: 'VirtualizedList',
      name: 'items',
      type: 'readonly T[]',
      required: true,
      description: 'All items. Only the visible window is mounted.',
    },
    {
      component: 'VirtualizedList',
      name: 'renderItem',
      type: '(item: T, index: number, state: { active, selected }) => ReactNode',
      required: true,
      description: 'Item content.',
    },
    {
      component: 'VirtualizedList',
      name: 'getItemKey',
      type: '(item: T, index: number) => Key',
      default: 'index',
      description: 'Stable key per item; also the selection key.',
    },
    {
      component: 'VirtualizedList',
      name: 'itemHeight',
      type: 'number | (index: number) => number',
      description: 'Fixed height. Omit to measure items.',
    },
    {
      component: 'VirtualizedList',
      name: 'estimatedItemHeight',
      type: 'number',
      default: '40',
      description: 'Estimate before measurement.',
    },
    {
      component: 'VirtualizedList',
      name: 'height',
      type: 'number | string',
      default: '400',
      description: 'Viewport height.',
    },
    {
      component: 'VirtualizedList',
      name: 'overscan',
      type: 'number',
      default: '4',
      description: 'Items rendered beyond each edge.',
    },
    {
      component: 'VirtualizedList',
      name: 'role',
      type: "'list' | 'listbox'",
      default: "'list'",
      description: 'Listbox enables keyboard selection.',
    },
    {
      component: 'VirtualizedList',
      name: 'selectedKey / defaultSelectedKey',
      type: 'Key | null',
      description: 'Listbox selection, controlled or uncontrolled.',
    },
    {
      component: 'VirtualizedList',
      name: 'onSelectionChange',
      type: '(key, item) => void',
      description: 'Called when an item is selected.',
    },
    {
      component: 'VirtualizedList',
      name: 'isItemDisabled',
      type: '(item: T, index: number) => boolean',
      description: 'Disabled items are skipped by keyboard navigation.',
    },
    {
      component: 'VirtualizedList',
      name: 'getItemLabel',
      type: '(item: T, index: number) => string',
      description: 'Accessible name for rich items.',
    },
    {
      component: 'VirtualizedList',
      name: 'apiRef',
      type: 'Ref<VirtualizedListHandle>',
      description: 'Imperative handle with scrollToIndex(index, align).',
    },
    {
      component: 'VirtualizedList',
      name: 'emptyState',
      type: 'ReactNode',
      description: 'Shown when there are no items.',
    },
  ],
  accessibility: [
    'Each rendered item reports aria-setsize and aria-posinset, so screen readers announce “12 of 10,000” even though most items are not in the DOM.',
    'The scroll container is focusable, so keyboard users can scroll a plain list with the arrow keys.',
    'In listbox mode, focus stays on the container and aria-activedescendant points at the active option; the active option is scrolled into view.',
    'Find-in-page cannot see unmounted items; pair long lists with SearchableList or a filter.',
  ],
  keyboard: [
    {
      keys: ['↑', '↓'],
      description: 'Listbox: move the active option (disabled options are skipped).',
    },
    { keys: ['Home', 'End'], description: 'Listbox: first or last option.' },
    { keys: ['Page Up', 'Page Down'], description: 'Listbox: move by a visible page.' },
    { keys: ['Enter', 'Space'], description: 'Listbox: select the active option.' },
  ],
  guidelines: {
    do: [
      'Use fixed heights when possible; it is the fastest mode.',
      'Provide a search or filter for long lists.',
    ],
    dont: ['Virtualise lists of a few dozen items.', 'Nest focusable controls in listbox options.'],
  },
  related: ['searchable-list', 'data-grid', 'list'],
};

const events = Array.from({ length: 5000 }, (_, i) => ({
  id: `e${i}`,
  text: `Signature deployed to mailbox ${String(i + 1).padStart(4, '0')}@binds.si`,
}));

export function Basic() {
  return (
    <VirtualizedList
      aria-label="Deployment log"
      items={events}
      itemHeight={40}
      height={280}
      getItemKey={(e) => e.id}
      renderItem={(e) => e.text}
    />
  );
}

const people = [
  'Priya Nair',
  'Amara Okafor',
  'Lukas Brenner',
  'Hana Sato',
  'Tomás Ruiz',
  'Owen Price',
  'Zainab Haddad',
  'Mateja Kovač',
];
const recipients = Array.from({ length: 2000 }, (_, i) => ({
  id: `r${i}`,
  name: `${people[i % 8]} (${i + 1})`,
}));

export function Listbox() {
  const [selected, setSelected] = React.useState<React.Key | null>(null);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <VirtualizedList
        role="listbox"
        aria-label="Choose a recipient"
        items={recipients}
        itemHeight={40}
        height={240}
        getItemKey={(r) => r.id}
        selectedKey={selected}
        onSelectionChange={setSelected}
        renderItem={(r) => r.name}
      />
      <p style={{ margin: 0 }}>
        Selected: {selected ? recipients.find((r) => r.id === selected)?.name : 'none'}
      </p>
    </div>
  );
}

export function MeasuredHeights() {
  const notes = Array.from({ length: 300 }, (_, i) => ({
    id: `n${i}`,
    name: people[i % 8]!,
    note:
      i % 3 === 0
        ? 'Updated the legal disclaimer on the Sales template and requested a review from Legal before Friday’s rollout.'
        : 'Approved the signature.',
  }));
  return (
    <VirtualizedList
      aria-label="Review notes"
      items={notes}
      height={300}
      estimatedItemHeight={64}
      getItemKey={(n) => n.id}
      renderItem={(n) => (
        <div style={{ display: 'flex', gap: 12, padding: '12px 0', alignItems: 'flex-start' }}>
          <Avatar name={n.name} size="sm" />
          <div>
            <strong>{n.name}</strong>
            <p style={{ margin: '2px 0 0' }}>{n.note}</p>
          </div>
        </div>
      )}
    />
  );
}

export function ScrollToIndex() {
  const api = React.useRef<VirtualizedListHandle>(null);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button size="sm" variant="outline" onClick={() => api.current?.scrollToIndex(0, 'start')}>
          First
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => api.current?.scrollToIndex(2499, 'center')}
        >
          Middle
        </Button>
        <Button size="sm" variant="outline" onClick={() => api.current?.scrollToIndex(4999, 'end')}>
          Last
        </Button>
      </div>
      <VirtualizedList
        aria-label="Deployment log"
        items={events}
        itemHeight={40}
        height={240}
        apiRef={api}
        renderItem={(e) => e.text}
      />
    </div>
  );
}
