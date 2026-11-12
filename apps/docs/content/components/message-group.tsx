import { Avatar, Message, MessageGroup } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'message-group',
  name: 'MessageGroup',
  category: 'ai',
  summary:
    'Consecutive messages from one author under a single avatar and name, so a long exchange stays easy to scan.',
  description:
    'Wrap messages that follow each other from the same author in a MessageGroup. The name and avatar appear once, and each Message inside takes its role and author from the group.',
  imports: ['MessageGroup', 'Message'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'Grouped messages', layout: 'fill' },
    { name: 'Conversation', title: 'Both sides', layout: 'fill' },
    {
      name: 'WithTimestamps',
      title: 'Timestamps per message',
      description: 'Each message keeps its own time.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'MessageGroup',
      name: 'author',
      type: 'ReactNode',
      required: true,
      description: 'Name shown once above the messages. It also names the group.',
    },
    {
      component: 'MessageGroup',
      name: 'role',
      type: "'user' | 'assistant' | 'system'",
      default: "'assistant'",
      description: 'Who wrote the messages. Sets the side and the surface.',
    },
    {
      component: 'MessageGroup',
      name: 'avatar',
      type: 'ReactNode',
      description: 'Avatar shown once beside the messages.',
    },
    {
      component: 'MessageGroup',
      name: 'children',
      type: 'ReactNode',
      description: 'The Message elements of this author, oldest first.',
    },
  ],
  accessibility: [
    'The group is named by its author.',
    'Each message inside is still an article named by the author and its own time, so nothing is lost when reading message by message.',
    'The avatar is decorative; the name carries the identity.',
  ],
  guidelines: {
    do: ['Start a new group when the author changes or after a long pause.'],
    dont: ['Mix authors in one group.'],
  },
  related: ['message', 'thread', 'avatar'],
};

const column = { display: 'grid', gap: 20, width: '100%', maxWidth: 560 };

export function Basic() {
  return (
    <div style={column}>
      <MessageGroup author="Assistant" avatar={<Avatar name="Assistant" size="sm" decorative />}>
        <Message>I found three clauses about termination.</Message>
        <Message>Clause 9 covers notice, clause 10 covers breach.</Message>
        <Message>Clause 11 covers what happens to data afterwards.</Message>
      </MessageGroup>
    </div>
  );
}

export function Conversation() {
  return (
    <div style={column}>
      <MessageGroup
        role="user"
        author="Priya Nair"
        avatar={<Avatar name="Priya Nair" size="sm" decorative />}
      >
        <Message>Can you check the termination terms?</Message>
        <Message>Only the supplier agreement, not the order form.</Message>
      </MessageGroup>
      <MessageGroup author="Assistant" avatar={<Avatar name="Assistant" size="sm" decorative />}>
        <Message>Either side can end the agreement with 60 days notice.</Message>
        <Message>A serious breach allows immediate termination.</Message>
      </MessageGroup>
    </div>
  );
}

export function WithTimestamps() {
  return (
    <div style={column}>
      <MessageGroup author="Assistant">
        <Message timestamp="10:41">The agreement runs for 24 months.</Message>
        <Message timestamp="10:42">It then renews for 12 months at a time.</Message>
      </MessageGroup>
    </div>
  );
}
