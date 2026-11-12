import * as React from 'react';
import { Icon, ThreadEmptyState } from '@bindshq/stance-react';
import type { ThreadStarter } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'thread-empty-state',
  name: 'ThreadEmptyState',
  category: 'ai',
  summary:
    'The opening screen of a new conversation, with a greeting and starter prompts that show what the assistant can do.',
  description:
    'Show ThreadEmptyState in place of the messages before a conversation begins. A short greeting sets the tone and a few starter prompts give people somewhere to begin. When a starter is chosen, send it or place it in the composer.',
  imports: ['ThreadEmptyState'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'Greeting and starters', layout: 'fill' },
    { name: 'GreetingOnly', title: 'Greeting only', layout: 'fill' },
    {
      name: 'WithIcons',
      title: 'Starters with icons',
      description: 'onStarterSelect receives the starter that was chosen.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'ThreadEmptyState',
      name: 'title',
      type: 'ReactNode',
      required: true,
      description: 'The greeting, rendered as a heading.',
    },
    {
      component: 'ThreadEmptyState',
      name: 'description',
      type: 'ReactNode',
      description: 'A sentence under the greeting.',
    },
    {
      component: 'ThreadEmptyState',
      name: 'icon',
      type: 'ReactNode',
      description: 'Icon above the greeting. Default: the sparkle. Pass null for none.',
    },
    {
      component: 'ThreadEmptyState',
      name: 'starters',
      type: '{ id: string; label: string; description?: string; icon?: ReactNode }[]',
      description: 'Starter prompts, shown as a list of buttons.',
    },
    {
      component: 'ThreadEmptyState',
      name: 'onStarterSelect',
      type: '(starter: ThreadStarter) => void',
      description: 'Called with the starter that was chosen.',
    },
    {
      component: 'ThreadEmptyState',
      name: 'startersLabel',
      type: 'string',
      default: "'Suggested prompts'",
      description: 'Accessible name of the starter list.',
    },
    {
      component: 'ThreadEmptyState',
      name: 'level',
      type: '1 | 2 | 3 | 4 | 5 | 6',
      default: '2',
      description: 'Heading level of the title.',
    },
    {
      component: 'ThreadEmptyState',
      name: 'children',
      type: 'ReactNode',
      description: 'Extra content under the starters.',
    },
  ],
  accessibility: [
    'The greeting is a real heading; set level to fit the page outline.',
    'Starters are a labelled list of buttons, reachable in order with Tab.',
    'Icons are decorative and hidden from assistive technology.',
    'Starter text wraps and aligns to the start of the line in both reading directions.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves between the starters.' },
    { keys: ['Enter', 'Space'], description: 'Chooses the focused starter.' },
  ],
  guidelines: {
    do: [
      'Offer three or four starters that reflect real tasks.',
      'Write starters as the person would ask them.',
    ],
    dont: [
      'Fill the screen with a long list of prompts.',
      'Promise things the assistant cannot do.',
    ],
  },
  related: ['thread', 'empty-state'],
};

const starters: ThreadStarter[] = [
  { id: 'summary', label: 'Summarise a contract', description: 'Key terms, dates and risks' },
  {
    id: 'compare',
    label: 'Compare two versions',
    description: 'See what changed and why it matters',
  },
  { id: 'reply', label: 'Draft a reply', description: 'A clear answer to a client question' },
];

const iconStarters: ThreadStarter[] = [
  { id: 'find', label: 'Find a clause', icon: <Icon name="search" /> },
  { id: 'dates', label: 'List key dates', icon: <Icon name="calendar" /> },
  { id: 'write', label: 'Write a summary', icon: <Icon name="file-text" /> },
];

export function Basic() {
  return (
    <ThreadEmptyState
      title="How can I help today?"
      description="Ask a question about your documents, or start with one of these."
      starters={starters}
    />
  );
}

export function GreetingOnly() {
  return (
    <ThreadEmptyState
      title="Good morning, Priya"
      description="Type a message below to begin."
      icon={null}
    />
  );
}

export function WithIcons() {
  const [chosen, setChosen] = React.useState('nothing yet');
  return (
    <ThreadEmptyState
      title="What would you like to do?"
      starters={iconStarters}
      onStarterSelect={(starter) => setChosen(starter.label)}
    >
      <p style={{ margin: 0, fontSize: 13 }}>Chosen: {chosen}</p>
    </ThreadEmptyState>
  );
}
