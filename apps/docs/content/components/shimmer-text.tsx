import * as React from 'react';
import { Button, Icon, ShimmerText } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'shimmer-text',
  name: 'ShimmerText',
  category: 'ai',
  summary:
    'Text with a slow light sweep for labels of work in progress, such as Searching the web.',
  description:
    'Use ShimmerText for a short label that names what the assistant is doing right now. The sweep says the work is still going on without a spinner. Turn it off when the step is done. For the answer itself use StreamingText.',
  imports: ['ShimmerText'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'An in-progress label' },
    {
      name: 'Steps',
      title: 'Steps of a task',
      description: 'Only the current step is active. Finished steps are plain text.',
    },
    {
      name: 'Toggle',
      title: 'Active and done',
      description: 'Set active to false when the work ends.',
    },
  ],
  props: [
    {
      component: 'ShimmerText',
      name: 'children',
      type: 'React.ReactNode',
      description: 'The label, for example "Searching the web".',
    },
    {
      component: 'ShimmerText',
      name: 'active',
      type: 'boolean',
      default: 'true',
      description: 'Runs the light sweep. Turn it off when the work is done.',
    },
    {
      component: 'ShimmerText',
      name: 'as',
      type: 'React.ElementType',
      default: "'span'",
      description: 'The element to render.',
    },
  ],
  accessibility: [
    'It is plain text to assistive technology. The sweep carries no meaning of its own.',
    'With reduced motion, in the high contrast theme and in forced colours there is no sweep and the text is shown in a solid colour.',
    'It does not announce anything. Put it inside a status, such as ThinkingIndicator, when the label should be read out.',
    'The sweep follows the reading direction in right to left languages.',
  ],
  guidelines: {
    do: [
      'Keep the label short and say what is happening: Searching the web, Reading 3 files.',
      'Show one active label at a time.',
    ],
    dont: ['Use it on long paragraphs or on text people need to read closely.'],
  },
  related: ['thinking-indicator', 'streaming-text', 'reasoning-disclosure'],
};

export function Basic() {
  return <ShimmerText>Searching the web</ShimmerText>;
}

export function Steps() {
  return (
    <ul style={{ display: 'grid', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
      <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Icon name="check" />
        <ShimmerText active={false}>Read the agreement</ShimmerText>
      </li>
      <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Icon name="check" />
        <ShimmerText active={false}>Found 4 renewal clauses</ShimmerText>
      </li>
      <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Icon name="sparkle" />
        <ShimmerText>Comparing notice periods</ShimmerText>
      </li>
    </ul>
  );
}

export function Toggle() {
  const [active, setActive] = React.useState(true);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <ShimmerText active={active}>{active ? 'Drafting a reply' : 'Reply drafted'}</ShimmerText>
      <Button size="sm" variant="outline" onClick={() => setActive((v) => !v)}>
        {active ? 'Finish' : 'Start again'}
      </Button>
    </div>
  );
}
