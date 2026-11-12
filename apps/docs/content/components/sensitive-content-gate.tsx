import * as React from 'react';
import { Button, SensitiveContentGate } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'sensitive-content-gate',
  name: 'SensitiveContentGate',
  category: 'ai',
  summary:
    'Hides content behind a short notice until the reader chooses to see it, then moves focus to it.',
  description:
    'Use SensitiveContentGate when a response may be upsetting or private: a graphic description, medical detail, personal data. The reader sees why it is hidden and decides. Until then the content is not in the page at all, so it cannot be read by sight, by screen reader or by search.',
  imports: ['SensitiveContentGate'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'Hidden until chosen', layout: 'fill' },
    {
      name: 'NoHide',
      title: 'Reveal once',
      description: 'With allowHide off the content stays visible after it is shown.',
      layout: 'fill',
    },
    {
      name: 'Controlled',
      title: 'Controlled',
      description:
        'Keep the choice in your own state, for example to remember it per conversation.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'SensitiveContentGate',
      name: 'title',
      type: 'ReactNode',
      default: "'Sensitive content'",
      description: 'The notice heading.',
    },
    {
      component: 'SensitiveContentGate',
      name: 'description',
      type: 'ReactNode',
      description: 'Why the content is hidden, in a sentence.',
    },
    {
      component: 'SensitiveContentGate',
      name: 'revealed',
      type: 'boolean',
      description: 'Controlled revealed state.',
    },
    {
      component: 'SensitiveContentGate',
      name: 'defaultRevealed',
      type: 'boolean',
      default: 'false',
      description: 'Start revealed when uncontrolled.',
    },
    {
      component: 'SensitiveContentGate',
      name: 'onRevealedChange',
      type: '(revealed: boolean) => void',
      description: 'Called when the reader shows or hides the content.',
    },
    {
      component: 'SensitiveContentGate',
      name: 'children',
      type: 'ReactNode',
      description: 'The content behind the gate. Not rendered until revealed.',
    },
    {
      component: 'SensitiveContentGate',
      name: 'allowHide',
      type: 'boolean',
      default: 'true',
      description: 'Offer a button to hide the content again.',
    },
    {
      component: 'SensitiveContentGate',
      name: 'icon',
      type: 'ReactNode',
      default: 'hidden eye icon',
      description: 'The notice icon. Pass null for none.',
    },
    {
      component: 'SensitiveContentGate',
      name: 'labels',
      type: 'Partial<SensitiveContentGateLabels>',
      description:
        'Translations for the show and hide buttons and the name of the revealed region.',
    },
  ],
  accessibility: [
    'Hidden content is not rendered, so it is absent from the accessibility tree, not just blurred.',
    'The notice is a group named by its title and described by its explanation.',
    'On reveal, focus moves to the content, which is a labelled region. Hiding returns focus to the Show content button.',
    'Focus only moves after the reader acts; a change made by the app never moves it.',
    'The reveal animation is a short fade and is removed with reduced motion.',
  ],
  keyboard: [
    {
      keys: ['Enter', 'Space'],
      description: 'On Show content: reveals and moves focus to the content.',
    },
    { keys: ['Enter', 'Space'], description: 'On Hide content: hides it and returns focus.' },
  ],
  guidelines: {
    do: [
      'Say plainly what kind of content is hidden so people can decide.',
      'Gate only the part that needs it, not the whole response.',
    ],
    dont: [
      'Use it to hide content people need to complete a task.',
      'Blur content with CSS instead; it would still be read aloud.',
    ],
  },
  related: ['disclaimer-note', 'report-dialog', 'collapsible'],
};

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 460 }}>
      <SensitiveContentGate description="This response describes an injury in detail.">
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          The report states that the fall caused a fracture of the left wrist and a deep cut above
          the eye, which needed six stitches.
        </p>
      </SensitiveContentGate>
    </div>
  );
}

export function NoHide() {
  return (
    <div style={{ width: '100%', maxWidth: 460 }}>
      <SensitiveContentGate
        title="Personal data"
        description="This response includes a home address."
        allowHide={false}
        labels={{ reveal: 'Show address' }}
      >
        <p style={{ margin: 0 }}>14 Harbour Lane, Flat 3, Bristol BS1 5TT</p>
      </SensitiveContentGate>
    </div>
  );
}

export function Controlled() {
  const [revealed, setRevealed] = React.useState(false);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 460 }}>
      <SensitiveContentGate
        description="This response discusses a medical diagnosis."
        revealed={revealed}
        onRevealedChange={setRevealed}
      >
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          The scan shows early signs of arthritis in both knees. The letter recommends a follow up
          in six months.
        </p>
      </SensitiveContentGate>
      <div>
        <Button variant="ghost" size="sm" onClick={() => setRevealed(false)}>
          Reset
        </Button>
      </div>
    </div>
  );
}
