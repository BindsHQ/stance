import * as React from 'react';
import { PlanChecklist } from '@bindshq/stance-react';
import type { PlanChecklistItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'plan-checklist',
  name: 'PlanChecklist',
  category: 'ai',
  summary:
    'A proposed plan as a list of steps that people can rename, reorder or remove before they approve or reject it.',
  description:
    'Use PlanChecklist when an agent should agree its approach before it starts. People read the steps, adjust them and approve. Once the work begins, the same list shows progress step by step.',
  imports: ['PlanChecklist'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Review and approve',
      description: 'A plan that has not started, with approve and reject.',
      layout: 'fill',
    },
    {
      name: 'Editable',
      title: 'Editable',
      description: 'Rename, remove and reorder steps by drag, keyboard or the move buttons.',
      layout: 'fill',
    },
    {
      name: 'InProgress',
      title: 'In progress',
      description: 'Progress is derived from the step statuses.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'PlanChecklist',
      name: 'items',
      type: 'PlanChecklistItem[]',
      required: true,
      description: 'The steps of the plan, in order: id, title, description and status.',
    },
    {
      component: 'PlanChecklist',
      name: 'editable',
      type: 'boolean',
      default: 'false',
      description: 'Let people rename, reorder and remove steps.',
    },
    {
      component: 'PlanChecklist',
      name: 'onItemsChange',
      type: '(items: PlanChecklistItem[]) => void',
      description: 'Called with the next steps after an edit, a move or a removal.',
    },
    {
      component: 'PlanChecklist',
      name: 'onApprove',
      type: '() => void',
      description: 'Called when the plan is approved. Shows the approve button.',
    },
    {
      component: 'PlanChecklist',
      name: 'onReject',
      type: '() => void',
      description: 'Called when the plan is rejected. Shows the reject button.',
    },
    {
      component: 'PlanChecklist',
      name: 'progress',
      type: 'number',
      description: 'Progress from 0 to 100. Derived from the step statuses when omitted.',
    },
    {
      component: 'PlanChecklist',
      name: 'title',
      type: 'React.ReactNode',
      description: 'Overrides the heading. Defaults to labels.title, Plan.',
    },
    {
      component: 'PlanChecklist',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables editing and the approve and reject buttons, for example while saving.',
    },
    {
      component: 'PlanChecklist',
      name: 'labels',
      type: 'PlanChecklistLabelOverrides',
      description:
        'Translations: title, list, progress(done, total), approve, reject, edit, remove, removed, titleField, save, cancel, empty, status words and the sortable strings.',
    },
  ],
  accessibility: [
    'A group named by its heading, holding a list of steps and a progress bar.',
    'The progress bar reads as a sentence, for example 2 of 5 steps done.',
    'Each step states its status in hidden text beside an icon with its own shape.',
    'Reordering works by drag, by keyboard on the handle, and with move up and move down buttons.',
    'Every edit and remove button names its step. Removing a step is announced and focus moves to the next step.',
    'Approve is disabled while a step is being edited and when the plan is empty.',
  ],
  keyboard: [
    { keys: ['Space', 'Enter'], description: 'On a handle: picks the step up, then drops it.' },
    { keys: ['ArrowUp', 'ArrowDown'], description: 'Moves a picked up step.' },
    { keys: ['Enter'], description: 'In the title field: saves the new title.' },
    {
      keys: ['Escape'],
      description: 'Cancels the edit, or returns a picked up step to its place.',
    },
  ],
  guidelines: {
    do: [
      'Show the plan before any step that changes data, spends money or leaves the product.',
      'Keep steps short. One line that says what will happen.',
    ],
    dont: [
      'Start work while the plan is still open for edits.',
      'Use it for steps that have already run. Use StepTimeline for that.',
    ],
  },
  related: ['step-timeline', 'approval-prompt', 'task-queue', 'sortable-list'],
};

const plan: PlanChecklistItem[] = [
  { id: 'read', title: 'Read both versions of the lease', status: 'pending' },
  {
    id: 'compare',
    title: 'Compare the renewal clauses',
    description: 'Clauses 4.2 and 4.3.',
    status: 'pending',
  },
  { id: 'summary', title: 'Write a one page summary', status: 'pending' },
  { id: 'email', title: 'Draft an email to the landlord', status: 'pending' },
];

export function Basic() {
  const [decision, setDecision] = React.useState('Waiting for a decision.');
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <PlanChecklist
        items={plan}
        onApprove={() => setDecision('Plan approved.')}
        onReject={() => setDecision('Plan rejected.')}
      />
      <p style={{ margin: 0, fontSize: 14 }}>{decision}</p>
    </div>
  );
}

export function Editable() {
  const [items, setItems] = React.useState(plan);
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <PlanChecklist
        items={items}
        editable
        onItemsChange={setItems}
        onApprove={() => {}}
        onReject={() => {}}
      />
    </div>
  );
}

const running: PlanChecklistItem[] = [
  { id: 'read', title: 'Read both versions of the lease', status: 'complete' },
  { id: 'compare', title: 'Compare the renewal clauses', status: 'complete' },
  { id: 'summary', title: 'Write a one page summary', status: 'running' },
  { id: 'email', title: 'Draft an email to the landlord', status: 'pending' },
];

export function InProgress() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <PlanChecklist items={running} title="Lease review" />
    </div>
  );
}
