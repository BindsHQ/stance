import * as React from 'react';
import { ContextChips, Icon } from '@bindshq/stance-react';
import type { ContextItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'context-chips',
  name: 'ContextChips',
  category: 'ai',
  summary:
    'Chips that show what the assistant can see for a message, such as files, pages or selections, each one removable.',
  description:
    'Use ContextChips above the composer so people always know what will be sent with their message, and can take things out. This is a matter of trust as much as layout: nothing should be shared with the assistant that is not shown here.',
  imports: ['ContextChips'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Removable context',
      layout: 'fill',
    },
    {
      name: 'WithAdd',
      title: 'Add context',
      layout: 'fill',
    },
    {
      name: 'Collapsed',
      title: 'Many items',
      description:
        'max keeps the row short. The rest sit behind a button that says how many more there are.',
      layout: 'fill',
    },
    {
      name: 'ReadOnly',
      title: 'Read only',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'ContextChips',
      name: 'items',
      type: 'ContextItem[]',
      required: true,
      description: 'What the assistant can see: { id, label, icon?, kind? }.',
    },
    {
      component: 'ContextChips',
      name: 'onRemove',
      type: '(id: string) => void',
      description: 'Called with the id of the item to remove. Without it the chips are read only.',
    },
    {
      component: 'ContextChips',
      name: 'onAdd',
      type: '() => void',
      description: 'Called when the add button is pressed. Without it there is no add button.',
    },
    {
      component: 'ContextChips',
      name: 'max',
      type: 'number',
      description: 'Show at most this many chips, with the rest behind a “+N more” button.',
    },
    {
      component: 'ContextChips',
      name: 'labels',
      type: 'Partial<ContextChipsLabels>',
      description: 'Translations: list, remove(label), add, more(count) and less.',
    },
  ],
  accessibility: [
    'A list with an accessible name, so screen readers announce what the assistant can see and how many items there are.',
    'Each remove button is named after its item, for example “Remove pricing.md”.',
    'The “+N more” button exposes aria-expanded and keeps focus when it reveals or hides items.',
    'After an item is removed, focus moves to the next remove button, or to the add button when none are left.',
    'Chips are 28 pixels tall with 24 pixel remove buttons, and 44 pixels on touch screens.',
  ],
  keyboard: [
    {
      keys: ['Tab'],
      description: 'Moves between remove buttons, the more button and the add button.',
    },
    {
      keys: ['Enter', 'Space'],
      description: 'Removes the item, reveals hidden items or adds context.',
    },
  ],
  guidelines: {
    do: [
      'Show everything that will be sent with the message, including context added automatically.',
      'Use names people recognise: the file name, the page title.',
    ],
    dont: [
      'Include context that is not shown as a chip.',
      'Use chips for uploads in progress; use AttachmentTray.',
    ],
  },
  related: ['attachment-tray', 'prompt-composer', 'mention-picker', 'chip', 'tag'],
};

const context: ContextItem[] = [
  { id: 'pricing', label: 'pricing.md', kind: 'file', icon: <Icon name="file-text" size={14} /> },
  { id: 'forecast', label: 'Q3 forecast', kind: 'page', icon: <Icon name="globe" size={14} /> },
  {
    id: 'selection',
    label: 'Selection, 12 lines',
    kind: 'selection',
    icon: <Icon name="type" size={14} />,
  },
  { id: 'roadmap', label: 'roadmap.pdf', kind: 'file', icon: <Icon name="file" size={14} /> },
  { id: 'notes', label: 'Call notes', kind: 'page', icon: <Icon name="globe" size={14} /> },
];

export function Basic() {
  const [items, setItems] = React.useState(context.slice(0, 3));
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <ContextChips
        items={items}
        onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
      />
      {items.length === 0 && (
        <button type="button" onClick={() => setItems(context.slice(0, 3))}>
          Restore context
        </button>
      )}
    </div>
  );
}

export function WithAdd() {
  const [count, setCount] = React.useState(1);
  return (
    <ContextChips
      items={context.slice(0, count)}
      onRemove={() => setCount((value) => Math.max(0, value - 1))}
      onAdd={() => setCount((value) => Math.min(context.length, value + 1))}
    />
  );
}

export function Collapsed() {
  return <ContextChips items={context} max={2} onRemove={() => {}} />;
}

export function ReadOnly() {
  return (
    <ContextChips items={context.slice(0, 2)} labels={{ list: 'Context used for this answer' }} />
  );
}
