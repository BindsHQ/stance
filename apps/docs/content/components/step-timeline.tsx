import * as React from 'react';
import { Button, StepTimeline, ToolCallCard } from '@bindshq/stance-react';
import type { StepTimelineStep } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'step-timeline',
  name: 'StepTimeline',
  category: 'ai',
  summary:
    'Shows the steps of an agent run in order, marks the one in progress, and lets people open any step for detail.',
  description:
    'Use StepTimeline to show the work behind a longer task. Each step states its status in words, the running step is marked as current, and steps with detail can be opened. Use the compact form inside a message and the full form in a run view.',
  imports: ['StepTimeline'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'A run in progress',
      description: 'Finished steps can be opened. The running step is the current one.',
      layout: 'fill',
    },
    {
      name: 'Compact',
      title: 'Compact',
      description: 'Tighter rows for use inside a message.',
      layout: 'fill',
    },
    {
      name: 'Controlled',
      title: 'Controlled expansion',
      layout: 'fill',
    },
    {
      name: 'Outcomes',
      title: 'Failed, skipped and waiting',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'StepTimeline',
      name: 'steps',
      type: 'StepTimelineStep[]',
      required: true,
      description:
        'The steps in the order they run: id, title, description, status, duration in seconds and content.',
    },
    {
      component: 'StepTimeline',
      name: 'expandedIds',
      type: 'string[]',
      description: 'Controlled ids of the expanded steps.',
    },
    {
      component: 'StepTimeline',
      name: 'defaultExpandedIds',
      type: 'string[]',
      default: '[]',
      description: 'Ids expanded on first render.',
    },
    {
      component: 'StepTimeline',
      name: 'onExpandedChange',
      type: '(ids: string[]) => void',
      description: 'Called with the next ids when a step is expanded or collapsed.',
    },
    {
      component: 'StepTimeline',
      name: 'compact',
      type: 'boolean',
      default: 'false',
      description: 'Tighter rows without descriptions. The status stays available as text.',
    },
    {
      component: 'StepTimeline',
      name: 'labels',
      type: 'StepTimelineLabelOverrides',
      description: 'Translations: list, status words and duration(seconds).',
    },
  ],
  accessibility: [
    'An ordered list with an accessible name.',
    'The running step carries aria-current="step".',
    'Every step states its status in text. In the compact form the text is visually hidden, never removed.',
    'Each status has its own icon shape, so the timeline does not rely on colour.',
    'Steps with content are real buttons with aria-expanded and aria-controls.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves between the steps that can be opened.' },
    { keys: ['Enter', 'Space'], description: 'Opens or closes the focused step.' },
  ],
  guidelines: {
    do: [
      'Name steps by what they achieve, in the words of the person reading.',
      'Keep one step running at a time so the current position is clear.',
    ],
    dont: [
      'Replace the steps with a spinner. Show the work.',
      'Reorder finished steps while the run continues.',
    ],
  },
  related: ['plan-checklist', 'tool-call-card', 'task-queue', 'agent-status-pill', 'timeline'],
};

const steps: StepTimelineStep[] = [
  {
    id: 'read',
    title: 'Read the lease',
    description: '12 pages, signed in 2024.',
    status: 'complete',
    duration: 4,
    content: (
      <ToolCallCard name="read_file" title="Read lease.pdf" duration={4} output="12 pages read." />
    ),
  },
  {
    id: 'find',
    title: 'Find the renewal clauses',
    description: 'Clauses 4.2 and 4.3.',
    status: 'complete',
    duration: 9,
    content: <p style={{ margin: 0 }}>Two clauses mention renewal. Both are on page 6.</p>,
  },
  {
    id: 'compare',
    title: 'Compare with the 2022 version',
    description: 'Looking for changed terms.',
    status: 'running',
  },
  { id: 'summary', title: 'Write the summary', status: 'pending' },
];

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <StepTimeline steps={steps} defaultExpandedIds={['find']} />
    </div>
  );
}

export function Compact() {
  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <StepTimeline steps={steps} compact />
    </div>
  );
}

export function Controlled() {
  const [expanded, setExpanded] = React.useState<string[]>([]);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <StepTimeline steps={steps} expandedIds={expanded} onExpandedChange={setExpanded} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button size="sm" variant="outline" onClick={() => setExpanded(['read', 'find'])}>
          Expand all
        </Button>
        <Button size="sm" variant="outline" onClick={() => setExpanded([])}>
          Collapse all
        </Button>
      </div>
    </div>
  );
}

const outcomes: StepTimelineStep[] = [
  { id: 'draft', title: 'Draft the email', status: 'complete', duration: 6 },
  {
    id: 'attach',
    title: 'Attach the report',
    description: 'The file was not found.',
    status: 'error',
    duration: 2,
  },
  { id: 'translate', title: 'Translate to Swedish', status: 'skipped' },
  {
    id: 'send',
    title: 'Send to 240 customers',
    description: 'Needs your approval.',
    status: 'waiting',
  },
];

export function Outcomes() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <StepTimeline steps={outcomes} />
    </div>
  );
}
