import * as React from 'react';
import { Badge, SortableList } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'sortable-list',
  name: 'SortableList',
  category: 'advanced',
  summary:
    'A list people can reorder by dragging, with the keyboard, or with move buttons, announcing every change.',
  description:
    'Use SortableList when the order of items matters and people set it themselves: approval steps, signature fields, pinned templates. Dragging is one of three ways to reorder; the keyboard and the optional Move up and Move down buttons do the same job without a drag.',
  imports: ['SortableList'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Approval order', layout: 'fill' },
    {
      name: 'MoveButtons',
      title: 'With move buttons',
      description: 'A single-pointer alternative to dragging, recommended on touch screens.',
      layout: 'fill',
    },
    {
      name: 'RichItems',
      title: 'Rich items',
      description: 'renderItem receives the item and its state, so rows can show anything.',
      layout: 'fill',
    },
    { name: 'Disabled', title: 'Disabled', layout: 'fill' },
  ],
  props: [
    {
      component: 'SortableList',
      name: 'items',
      type: 'T[]',
      required: true,
      description: 'The items in their current order.',
    },
    {
      component: 'SortableList',
      name: 'getItemId',
      type: '(item: T) => string',
      required: true,
      description: 'A stable, unique id for each item.',
    },
    {
      component: 'SortableList',
      name: 'getItemLabel',
      type: '(item: T) => string',
      description: 'Plain-text name used for handle labels and announcements. Defaults to the id.',
    },
    {
      component: 'SortableList',
      name: 'renderItem',
      type: '(item: T, state: SortableItemState) => ReactNode',
      required: true,
      description: 'Renders the row content. State has index, dragging and disabled.',
    },
    {
      component: 'SortableList',
      name: 'onReorder',
      type: '(items: T[], move: { from: number; to: number }) => void',
      required: true,
      description: 'Called with the new order when an item is dropped or moved.',
    },
    {
      component: 'SortableList',
      name: 'label',
      type: 'string',
      required: true,
      description: 'Accessible name of the list.',
    },
    {
      component: 'SortableList',
      name: 'showMoveButtons',
      type: 'boolean',
      default: 'false',
      description: 'Show Move up and Move down buttons on each row.',
    },
    {
      component: 'SortableList',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Prevents reordering.',
    },
    {
      component: 'SortableList',
      name: 'labels',
      type: 'Partial<SortableListLabels>',
      description: 'Translations for handle names, instructions and announcements.',
    },
    {
      component: 'SortableList',
      name: 'ref',
      type: 'Ref<SortableListHandle>',
      description: 'moveItem(from, to) reorders programmatically.',
    },
  ],
  accessibility: [
    'Each row has a handle button named after its item, for example “Reorder Legal review”, with the keyboard instructions as its description.',
    'Keyboard reordering follows the accessible drag-and-drop pattern: pick up, move, drop or cancel. Nothing is committed until the item is dropped.',
    'Every step is announced: “Picked up Legal review, position 1 of 4”, “moved to position 3 of 4”, “Dropped”, “Cancelled”.',
    'Move up and Move down buttons give a single-pointer alternative to dragging (WCAG 2.5.7).',
    'Focus stays on the moved item’s handle, so people can keep adjusting.',
    'The list is a real list, so screen readers report the number of items and each position.',
  ],
  keyboard: [
    {
      keys: ['Space', 'Enter'],
      description: 'Picks up the focused item, or drops it in its new position.',
    },
    { keys: ['↑', '↓'], description: 'Moves the picked-up item one position.' },
    { keys: ['Home', 'End'], description: 'Moves the picked-up item to the start or end.' },
    { keys: ['Esc'], description: 'Cancels and returns the item to where it started.' },
    { keys: ['Tab'], description: 'Drops the item where it is and moves focus on.' },
  ],
  guidelines: {
    do: [
      'Turn on showMoveButtons on touch-first screens and for long lists.',
      'Save the new order as soon as it changes, or make the Save action obvious.',
    ],
    dont: [
      'Use it for lists that sort themselves (by date or name); offer sorting instead.',
      'Hide the handle until hover; touch and keyboard users would never find it.',
    ],
  },
  related: ['list', 'data-table', 'stepper'],
};

interface Step {
  id: string;
  name: string;
  role: string;
}

const approvalSteps: Step[] = [
  { id: 'legal', name: 'Legal review', role: 'Amara Okafor' },
  { id: 'finance', name: 'Finance approval', role: 'Hana Sato' },
  { id: 'director', name: 'Director sign-off', role: 'Lukas Brenner' },
  { id: 'counter', name: 'Countersignature', role: 'Client' },
];

export function Basic() {
  const [steps, setSteps] = React.useState(approvalSteps);
  return (
    <div style={{ width: '100%', maxWidth: 440 }}>
      <SortableList
        label="Approval order"
        items={steps}
        getItemId={(s) => s.id}
        getItemLabel={(s) => s.name}
        renderItem={(s) => s.name}
        onReorder={setSteps}
      />
    </div>
  );
}

export function MoveButtons() {
  const [steps, setSteps] = React.useState(approvalSteps);
  return (
    <div style={{ width: '100%', maxWidth: 440 }}>
      <SortableList
        label="Approval order"
        items={steps}
        getItemId={(s) => s.id}
        getItemLabel={(s) => s.name}
        renderItem={(s) => s.name}
        onReorder={setSteps}
        showMoveButtons
      />
    </div>
  );
}

export function RichItems() {
  const [steps, setSteps] = React.useState(approvalSteps);
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <SortableList
        label="Approval order"
        items={steps}
        getItemId={(s) => s.id}
        getItemLabel={(s) => s.name}
        onReorder={setSteps}
        renderItem={(s, state) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ color: 'var(--st-color-fg-muted)', fontSize: 13 }}>{s.role}</div>
            </div>
            <Badge tone={state.index === 0 ? 'info' : 'neutral'}>Step {state.index + 1}</Badge>
          </div>
        )}
      />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ width: '100%', maxWidth: 440 }}>
      <SortableList
        label="Approval order (locked)"
        items={approvalSteps}
        getItemId={(s) => s.id}
        getItemLabel={(s) => s.name}
        renderItem={(s) => s.name}
        onReorder={() => {}}
        disabled
      />
    </div>
  );
}
