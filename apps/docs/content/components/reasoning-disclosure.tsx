import * as React from 'react';
import { Button, ReasoningDisclosure } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'reasoning-disclosure',
  name: 'ReasoningDisclosure',
  category: 'ai',
  summary:
    'A collapsible block for the reasoning behind an answer: open while thinking and a short summary when done.',
  description:
    'Use ReasoningDisclosure above an answer to show how the assistant got there. It stays open while the reasoning arrives, then folds to a line such as Thought for 12 seconds so the answer takes the space. People who want the detail can open it again.',
  imports: ['ReasoningDisclosure'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Finished reasoning',
      description: 'Collapsed to a summary. Open it to read the steps.',
      layout: 'fill',
    },
    {
      name: 'Thinking',
      title: 'From thinking to done',
      description: 'Open while thinking. It collapses when the status changes to done.',
      layout: 'fill',
    },
    {
      name: 'Controlled',
      title: 'Controlled',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'ReasoningDisclosure',
      name: 'status',
      type: "'thinking' | 'done'",
      default: "'done'",
      description: 'Whether the assistant is still reasoning.',
    },
    {
      component: 'ReasoningDisclosure',
      name: 'duration',
      type: 'number',
      description: 'How long the reasoning took, in seconds. Used in the summary once done.',
    },
    {
      component: 'ReasoningDisclosure',
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state.',
    },
    {
      component: 'ReasoningDisclosure',
      name: 'defaultOpen',
      type: 'boolean',
      description:
        'Open on first render. By default it is open while thinking and closed when done.',
    },
    {
      component: 'ReasoningDisclosure',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the reader toggles it, and when it collapses as reasoning ends.',
    },
    {
      component: 'ReasoningDisclosure',
      name: 'children',
      type: 'React.ReactNode',
      description: 'The reasoning text.',
    },
    {
      component: 'ReasoningDisclosure',
      name: 'labels',
      type: 'Partial<ReasoningDisclosureLabels>',
      description:
        'Translations: thinking, thought(seconds) and done, the summary used when no duration is known.',
    },
  ],
  accessibility: [
    'The summary is a real button with aria-expanded and aria-controls.',
    'The summary reads in words, for example Thought for 12 seconds.',
    'When reasoning ends the summary is announced politely, once.',
    'It never collapses under a reader who has toggled it while the assistant was thinking.',
    'With reduced motion the summary does not shimmer.',
  ],
  keyboard: [
    { keys: ['Enter', 'Space'], description: 'Opens or closes the reasoning.' },
    { keys: ['Tab'], description: 'Moves to the summary, then into any links in the reasoning.' },
  ],
  guidelines: {
    do: [
      'Place it above the answer it belongs to.',
      'Pass the duration so the summary says how long it took.',
    ],
    dont: [
      'Put the answer itself inside; reasoning is optional reading.',
      'Force it open after the reader has closed it.',
    ],
  },
  related: ['thinking-indicator', 'collapsible', 'message', 'shimmer-text'],
};

const steps = (
  <>
    <p>The agreement has two renewal clauses. Clause 4.2 sets the first term to 30 June 2027.</p>
    <p>Clause 4.3 renews it yearly unless notice is given 90 days before the term ends.</p>
  </>
);

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <ReasoningDisclosure duration={12}>{steps}</ReasoningDisclosure>
    </div>
  );
}

export function Thinking() {
  const [status, setStatus] = React.useState<'thinking' | 'done'>('thinking');
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 480 }}>
      <ReasoningDisclosure status={status} duration={8}>
        {steps}
      </ReasoningDisclosure>
      <div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatus((s) => (s === 'thinking' ? 'done' : 'thinking'))}
        >
          {status === 'thinking' ? 'Finish thinking' : 'Think again'}
        </Button>
      </div>
    </div>
  );
}

export function Controlled() {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 480 }}>
      <ReasoningDisclosure open={open} onOpenChange={setOpen} duration={75}>
        {steps}
      </ReasoningDisclosure>
      <div>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? 'Collapse' : 'Expand'}
        </Button>
      </div>
    </div>
  );
}
