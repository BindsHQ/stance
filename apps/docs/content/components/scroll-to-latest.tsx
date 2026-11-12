import * as React from 'react';
import { Message, ScrollToLatest, Thread } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'scroll-to-latest',
  name: 'ScrollToLatest',
  category: 'ai',
  summary:
    'A floating button that appears when the reader has scrolled away from the newest message and takes them back.',
  description:
    'Place ScrollToLatest in the scrollToLatest slot of a Thread. There it shows and hides on its own and scrolls to the newest message when pressed. Outside a Thread, control it with visible and onClick.',
  imports: ['ScrollToLatest'],
  status: 'beta',
  examples: [
    {
      name: 'InThread',
      title: 'Inside a thread',
      description: 'Scroll up and the button appears. Press it to return.',
      layout: 'fill',
    },
    { name: 'Unread', title: 'Unread count' },
    { name: 'WithLabel', title: 'With a visible label' },
  ],
  props: [
    {
      component: 'ScrollToLatest',
      name: 'visible',
      type: 'boolean',
      description:
        'Show the button. Inside a Thread it defaults to whether the reader has scrolled away; elsewhere it defaults to true.',
    },
    {
      component: 'ScrollToLatest',
      name: 'onClick',
      type: 'MouseEventHandler<HTMLButtonElement>',
      description:
        'Called on press. Inside a Thread the button also scrolls to the newest message, unless the event is prevented.',
    },
    {
      component: 'ScrollToLatest',
      name: 'unreadCount',
      type: 'number',
      default: '0',
      description: 'Number of messages that arrived while the reader was away.',
    },
    {
      component: 'ScrollToLatest',
      name: 'label',
      type: 'string',
      default: "'Scroll to latest'",
      description: 'Accessible name and tooltip.',
    },
    {
      component: 'ScrollToLatest',
      name: 'unreadLabel',
      type: '(count: number) => string',
      description: 'Describes the unread count in the accessible name, for example 3 new messages.',
    },
    {
      component: 'ScrollToLatest',
      name: 'showLabel',
      type: 'boolean',
      default: 'false',
      description: 'Show the label as text beside the arrow.',
    },
  ],
  accessibility: [
    'A real button with an accessible name. The unread count is part of the name, for example Scroll to latest, 3 new messages.',
    'When it is not visible it is removed from the accessibility tree and the tab order.',
    'With reduced motion the thread jumps to the newest message instead of scrolling smoothly.',
    'The target is at least 32px, and 44px on touch screens.',
  ],
  keyboard: [{ keys: ['Enter', 'Space'], description: 'Scrolls to the newest message.' }],
  guidelines: {
    do: ['Show an unread count when messages arrived while the reader was away.'],
    dont: ['Show it while the reader is already at the newest message.'],
  },
  related: ['thread', 'message'],
};

const frame = {
  width: '100%',
  maxWidth: 520,
  height: 260,
  border: '1px solid var(--st-color-border-default)',
  borderRadius: 12,
  overflow: 'hidden',
};

const lines = [
  'Here is the summary you asked for.',
  'The agreement runs for 24 months.',
  'Either side can end it with 60 days notice.',
  'Fees are reviewed once a year.',
  'Disputes go to mediation first.',
  'That covers the main terms.',
];

export function InThread() {
  return (
    <div style={frame}>
      <Thread scrollToLatest={<ScrollToLatest />}>
        {lines.map((line) => (
          <Message key={line} author="Assistant">
            {line}
          </Message>
        ))}
      </Thread>
    </div>
  );
}

export function Unread() {
  const [count, setCount] = React.useState(3);
  return <ScrollToLatest unreadCount={count} onClick={() => setCount(0)} />;
}

export function WithLabel() {
  return <ScrollToLatest showLabel label="Jump to latest" />;
}
