import * as React from 'react';
import { Button, Message, ScrollToLatest, Thread } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'thread',
  name: 'Thread',
  category: 'ai',
  summary:
    'The scrolling container for a conversation. It follows the latest message while the reader is at the bottom and lets go when they scroll up.',
  description:
    'Use Thread around the messages of a conversation. It keeps the newest content in view only while the reader is already there, so a streaming answer never pulls someone away from what they are reading. Give it a fixed or flexible height; it fills its parent.',
  imports: ['Thread', 'ScrollToLatest', 'useThread'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'A conversation', layout: 'fill' },
    {
      name: 'Following',
      title: 'Following new messages',
      description:
        'Add messages while at the bottom and the thread follows. Scroll up and it stays where you are; the button brings you back.',
      layout: 'fill',
    },
    {
      name: 'LoadOlder',
      title: 'Loading older messages',
      description:
        'onReachTop fires once each time the reader arrives at the top. Older messages are added above without moving the reading position.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'Thread',
      name: 'children',
      type: 'ReactNode',
      description: 'The messages, oldest first.',
    },
    {
      component: 'Thread',
      name: 'stickToBottom',
      type: 'boolean',
      default: 'true',
      description:
        'Follow new content while the reader is at the bottom. Scrolling up releases the thread.',
    },
    {
      component: 'Thread',
      name: 'onReachTop',
      type: '() => void',
      description: 'Called once each time the reader reaches the top, to load older messages.',
    },
    {
      component: 'Thread',
      name: 'label',
      type: 'string',
      default: "'Conversation'",
      description: 'Accessible name of the log region.',
    },
    {
      component: 'Thread',
      name: 'scrollToLatest',
      type: 'ReactNode',
      description: 'Slot for a ScrollToLatest button. It floats over the bottom edge.',
    },
    {
      component: 'Thread',
      name: 'onAtBottomChange',
      type: '(atBottom: boolean) => void',
      description: 'Called when the reader arrives at or leaves the newest message.',
    },
    {
      component: 'Thread',
      name: 'bottomThreshold',
      type: 'number',
      default: '24',
      description: 'Distance from the bottom, in px, that still counts as being at the bottom.',
    },
    {
      component: 'Thread',
      name: 'viewportRef',
      type: 'Ref<HTMLDivElement>',
      description: 'Ref to the scrolling viewport element.',
    },
    {
      component: 'useThread',
      name: 'atBottom',
      type: 'boolean',
      description: 'True while the reader is at the newest message.',
    },
    {
      component: 'useThread',
      name: 'scrollToLatest',
      type: '(behavior?: ScrollBehavior) => void',
      description: 'Scrolls to the newest message and resumes following.',
    },
  ],
  accessibility: [
    'The viewport is a log region with a label. New complete messages are announced politely.',
    'A streaming Message is marked busy, so partial text is not read token by token.',
    'The viewport can be focused, so the conversation scrolls with the keyboard.',
    'Thread never moves focus. Typing in the composer is not interrupted by new content.',
    'The scroll to latest slot sits outside the log, so the button appearing is not announced as a message.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves focus to the conversation viewport.' },
    { keys: ['↑', '↓', 'Page Up', 'Page Down'], description: 'Scroll the conversation.' },
    { keys: ['Home', 'End'], description: 'Jump to the oldest or the newest message.' },
  ],
  guidelines: {
    do: [
      'Give the thread a height, for example by placing it in a flex column above the composer.',
      'Pair it with ScrollToLatest so readers can return to the newest message.',
    ],
    dont: [
      'Scroll the thread yourself while a response streams; the thread already follows.',
      'Put the composer inside the thread. Keep it below, outside the log.',
    ],
  },
  related: ['message', 'scroll-to-latest', 'thread-empty-state'],
};

const frame = {
  width: '100%',
  maxWidth: 560,
  height: 320,
  border: '1px solid var(--st-color-border-default)',
  borderRadius: 12,
  overflow: 'hidden',
};

const replies = [
  'The notice period is 60 days.',
  'Renewal is automatic unless either side gives notice.',
  'Liability is capped at the fees paid in the last 12 months.',
  'Payment is due within 30 days of each invoice.',
];

export function Basic() {
  return (
    <div style={frame}>
      <Thread label="Contract questions">
        <Message role="user" author="Priya" timestamp="10:41">
          What is the notice period in this agreement?
        </Message>
        <Message author="Assistant" timestamp="10:41">
          Either party can end the agreement with 60 days written notice.
        </Message>
        <Message role="user" author="Priya" timestamp="10:42">
          And does it renew on its own?
        </Message>
        <Message author="Assistant" timestamp="10:42">
          Yes. It renews for 12 months at a time unless notice is given before the term ends.
        </Message>
      </Thread>
    </div>
  );
}

export function Following() {
  const [count, setCount] = React.useState(4);
  const [unread, setUnread] = React.useState(0);
  const [atBottom, setAtBottom] = React.useState(true);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 560 }}>
      <div style={frame}>
        <Thread
          onAtBottomChange={(next) => {
            setAtBottom(next);
            if (next) setUnread(0);
          }}
          scrollToLatest={<ScrollToLatest unreadCount={unread} />}
        >
          {Array.from({ length: count }, (_, i) => (
            <Message key={i} author="Assistant">
              {replies[i % replies.length]}
            </Message>
          ))}
        </Thread>
      </div>
      <Button
        variant="secondary"
        onClick={() => {
          setCount((value) => value + 1);
          if (!atBottom) setUnread((value) => value + 1);
        }}
      >
        Add a message
      </Button>
    </div>
  );
}

export function LoadOlder() {
  const [older, setOlder] = React.useState(0);
  return (
    <div style={frame}>
      <Thread onReachTop={() => setOlder((value) => Math.min(value + 3, 9))}>
        {Array.from({ length: older }, (_, i) => (
          <Message key={`older-${older - i}`} author="Assistant" variant="plain">
            Earlier answer {older - i}
          </Message>
        ))}
        {replies.map((reply) => (
          <Message key={reply} author="Assistant">
            {reply}
          </Message>
        ))}
        <Message role="user" author="Priya">
          Scroll to the top to load earlier answers.
        </Message>
      </Thread>
    </div>
  );
}
