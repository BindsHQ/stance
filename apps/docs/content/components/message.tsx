import {
  Avatar,
  Message,
  MessageActions,
  StreamingText,
  ThinkingIndicator,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'message',
  name: 'Message',
  category: 'ai',
  summary:
    'One turn in a conversation from the user, the assistant or the system, with slots for an avatar, actions and a footer.',
  description:
    'Use Message for each turn in a Thread. It lays out the author, time and content, and reflects the generation status you pass in. It does not fetch or stream anything itself: render the text you have, and set status as the response moves along.',
  imports: ['Message'],
  status: 'beta',
  examples: [
    { name: 'Roles', title: 'User, assistant and system', layout: 'fill' },
    {
      name: 'Status',
      title: 'Submitted, streaming, stopped and failed',
      description:
        'The message is busy while submitted or streaming. Stopped and failed responses say so in words.',
      layout: 'fill',
    },
    {
      name: 'Plain',
      title: 'Plain variant with actions',
      description: 'Plain lets long answers sit on the page without a bubble.',
      layout: 'fill',
    },
    { name: 'WithAvatar', title: 'Avatar and footer', layout: 'fill' },
  ],
  props: [
    {
      component: 'Message',
      name: 'role',
      type: "'user' | 'assistant' | 'system'",
      default: "'assistant'",
      description: 'Who wrote the message. Inside a MessageGroup it defaults to the group role.',
    },
    {
      component: 'Message',
      name: 'status',
      type: "'idle' | 'submitted' | 'streaming' | 'complete' | 'stopped' | 'error'",
      default: "'complete'",
      description: 'Generation status. submitted and streaming mark the message as busy.',
    },
    {
      component: 'Message',
      name: 'author',
      type: 'ReactNode',
      description:
        'Name of the author. Without it a default name is used for assistive technology only.',
    },
    {
      component: 'Message',
      name: 'avatar',
      type: 'ReactNode',
      description: 'Avatar shown beside the message.',
    },
    {
      component: 'Message',
      name: 'timestamp',
      type: 'ReactNode',
      description: 'When the message was sent, already formatted for display.',
    },
    {
      component: 'Message',
      name: 'dateTime',
      type: 'string',
      description: 'Machine readable time for the time element, for example an ISO string.',
    },
    {
      component: 'Message',
      name: 'children',
      type: 'ReactNode',
      description: 'The message content.',
    },
    {
      component: 'Message',
      name: 'actions',
      type: 'ReactNode',
      description: 'Slot under the content for a MessageActions row.',
    },
    {
      component: 'Message',
      name: 'footer',
      type: 'ReactNode',
      description: 'Slot under the content for sources, attachments or a note.',
    },
    {
      component: 'Message',
      name: 'variant',
      type: "'bubble' | 'plain'",
      default: "'bubble'",
      description: 'bubble wraps the content in a surface. plain lets it sit on the page.',
    },
    {
      component: 'Message',
      name: 'labels',
      type: 'Partial<MessageLabels>',
      description:
        'Translations: user, assistant, system (default names), started, complete, stopped, error.',
    },
  ],
  accessibility: [
    'Each message is an article named by its author and time.',
    'While submitted or streaming the article is marked busy, so screen readers wait for the finished text.',
    'Status changes are announced politely, once: started, finished, stopped, failed. Tokens are never announced.',
    'Stopped and failed responses show a text label with an icon; the state never depends on colour alone.',
    'User and assistant sides follow the reading direction, so right to left needs no extra props.',
  ],
  guidelines: {
    do: [
      'Pass status as the response progresses so assistive technology hears the changes.',
      'Use plain for long assistant answers with headings, lists or code.',
    ],
    dont: [
      'Hide the author for sighted readers when several people share a conversation.',
      'Put a streaming caret or loader in the status text; use StreamingText and ThinkingIndicator.',
    ],
  },
  related: ['thread', 'message-group', 'message-actions'],
};

const column = { display: 'grid', gap: 16, width: '100%', maxWidth: 560 };

export function Roles() {
  return (
    <div style={column}>
      <Message role="system">Priya started a conversation about the supplier agreement</Message>
      <Message role="user" author="Priya" timestamp="10:41">
        When does the agreement end?
      </Message>
      <Message author="Assistant" timestamp="10:41">
        The first term ends on 30 June 2027. After that it renews for 12 months at a time.
      </Message>
    </div>
  );
}

export function Status() {
  return (
    <div style={column}>
      <Message author="Assistant" status="submitted">
        <ThinkingIndicator />
      </Message>
      <Message author="Assistant" status="streaming">
        <StreamingText text="The first term ends on 30 June 2027. After that" streaming caret />
      </Message>
      <Message author="Assistant" status="stopped">
        The first term ends on 30 June
      </Message>
      <Message author="Assistant" status="error">
        The first term
      </Message>
    </div>
  );
}

export function Plain() {
  return (
    <div style={column}>
      <Message
        author="Assistant"
        timestamp="10:42"
        variant="plain"
        actions={
          <MessageActions
            copyValue="Notice must be given in writing at least 60 days before the term ends."
            onRetry={() => {}}
            onRate={() => {}}
          />
        }
      >
        <p>Notice must be given in writing at least 60 days before the term ends.</p>
        <p>Email counts as writing if it is sent to the address in clause 14.</p>
      </Message>
    </div>
  );
}

export function WithAvatar() {
  return (
    <div style={column}>
      <Message
        role="user"
        author="Priya Nair"
        timestamp="10:44"
        avatar={<Avatar name="Priya Nair" size="sm" decorative />}
      >
        Who signs for the supplier?
      </Message>
      <Message
        author="Assistant"
        timestamp="10:44"
        avatar={<Avatar name="Assistant" size="sm" decorative />}
        footer="Based on 2 documents"
      >
        The managing director signs, with the finance lead as witness.
      </Message>
    </div>
  );
}
