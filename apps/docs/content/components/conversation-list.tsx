import * as React from 'react';
import { Button, ConversationList } from '@bindshq/stance-react';
import type { ConversationListItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'conversation-list',
  name: 'ConversationList',
  category: 'ai',
  summary:
    'A list of past conversations grouped by date, with selection, inline rename, delete and pin.',
  description:
    'Use ConversationList in a sidebar so people can return to earlier conversations. Items are grouped under Pinned, Today, Yesterday and older ranges, or under your own group names. The list reports what people do; your app owns the data.',
  imports: ['ConversationList'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'Grouped by date', layout: 'fill' },
    {
      name: 'Manage',
      title: 'Rename, pin and delete',
      description:
        'Each action appears when its handler is passed. Press F2 on a row to rename it.',
      layout: 'fill',
    },
    { name: 'CustomGroups', title: 'Your own groups', layout: 'fill' },
    { name: 'Empty', title: 'Empty state', layout: 'fill' },
  ],
  props: [
    {
      component: 'ConversationList',
      name: 'items',
      type: '{ id: string; title: string; updatedAt: Date | string | number; group?: string; pinned?: boolean; href?: string }[]',
      required: true,
      description: 'The conversations, newest first. With href a row renders as a link.',
    },
    {
      component: 'ConversationList',
      name: 'selectedId',
      type: 'string | null',
      description: 'The conversation that is open.',
    },
    {
      component: 'ConversationList',
      name: 'onSelect',
      type: '(id: string) => void',
      description: 'Called with the id of the conversation that was chosen.',
    },
    {
      component: 'ConversationList',
      name: 'onRename',
      type: '(id: string, title: string) => void',
      description: 'Called with the new title after an inline rename. Shows the rename button.',
    },
    {
      component: 'ConversationList',
      name: 'onDelete',
      type: '(id: string) => void',
      description: 'Called when delete is pressed. Confirm in your app if needed.',
    },
    {
      component: 'ConversationList',
      name: 'onPin',
      type: '(id: string, pinned: boolean) => void',
      description: 'Called with the new pinned state. Shows the pin button.',
    },
    {
      component: 'ConversationList',
      name: 'emptyState',
      type: 'ReactNode',
      description: 'Shown in place of the list when there are no conversations.',
    },
    {
      component: 'ConversationList',
      name: 'now',
      type: 'Date | number',
      description: 'The moment date groups are measured from. Default: now.',
    },
    {
      component: 'ConversationList',
      name: 'labels',
      type: 'Partial<ConversationListLabels>',
      description:
        'Translations: list, pinned, today, yesterday, lastWeek, lastMonth, older, empty, renameInput, and rename, delete, pin, unpin as functions of the title.',
    },
  ],
  accessibility: [
    'A navigation region with a label. Each date group is a list named by its heading.',
    'The open conversation is marked with aria-current.',
    'Rename, delete and pin buttons name the conversation they act on, for example Delete Contract summary.',
    'Renaming moves focus to the field and returns it to the row afterwards. After a delete, focus moves to the next conversation.',
    'Row actions appear on hover and on keyboard focus, and are always visible on touch screens.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through conversations and their actions.' },
    { keys: ['Enter', 'Space'], description: 'Opens the focused conversation.' },
    { keys: ['F2'], description: 'Renames the focused conversation.' },
    { keys: ['Enter'], description: 'While renaming: saves the title.' },
    { keys: ['Esc'], description: 'While renaming: cancels.' },
  ],
  guidelines: {
    do: [
      'Pass items newest first.',
      'Confirm before deleting when a conversation cannot be restored.',
    ],
    dont: ['Use it for navigation between pages of an app; use Sidebar.'],
  },
  related: ['sidebar', 'thread', 'inline-edit'],
};

const day = 86_400_000;
const start = new Date(2026, 10, 12, 15).getTime();

const initial: ConversationListItem[] = [
  { id: 'a', title: 'Supplier agreement summary', updatedAt: start },
  { id: 'b', title: 'Notice period question', updatedAt: start - day },
  { id: 'c', title: 'Renewal terms compared', updatedAt: start - 3 * day, pinned: true },
  { id: 'd', title: 'Draft reply to legal', updatedAt: start - 12 * day },
  { id: 'e', title: 'Onboarding checklist', updatedAt: start - 60 * day },
];

const grouped: ConversationListItem[] = [
  { id: 'a', title: 'Supplier agreement summary', updatedAt: start, group: 'Contracts' },
  { id: 'b', title: 'Renewal terms compared', updatedAt: start, group: 'Contracts' },
  { id: 'c', title: 'Welcome email draft', updatedAt: start, group: 'People' },
];

const frame = { width: '100%', maxWidth: 300 };

export function Basic() {
  const [selected, setSelected] = React.useState('a');
  return (
    <div style={frame}>
      <ConversationList items={initial} now={start} selectedId={selected} onSelect={setSelected} />
    </div>
  );
}

export function Manage() {
  const [items, setItems] = React.useState(initial);
  const [selected, setSelected] = React.useState('a');
  return (
    <div style={frame}>
      <ConversationList
        items={items}
        now={start}
        selectedId={selected}
        onSelect={setSelected}
        onRename={(id, title) =>
          setItems((list) => list.map((item) => (item.id === id ? { ...item, title } : item)))
        }
        onPin={(id, pinned) =>
          setItems((list) => list.map((item) => (item.id === id ? { ...item, pinned } : item)))
        }
        onDelete={(id) => setItems((list) => list.filter((item) => item.id !== id))}
      />
    </div>
  );
}

export function CustomGroups() {
  const [selected, setSelected] = React.useState('c');
  return (
    <div style={frame}>
      <ConversationList items={grouped} selectedId={selected} onSelect={setSelected} />
    </div>
  );
}

export function Empty() {
  return (
    <div style={frame}>
      <ConversationList
        items={[]}
        emptyState={
          <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
            <span>Your conversations will appear here.</span>
            <Button size="sm" variant="secondary">
              New conversation
            </Button>
          </div>
        }
      />
    </div>
  );
}
