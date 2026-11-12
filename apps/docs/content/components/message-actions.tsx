import * as React from 'react';
import { Icon, IconButton, Message, MessageActions } from '@bindshq/stance-react';
import type { MessageRating } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'message-actions',
  name: 'MessageActions',
  category: 'ai',
  summary:
    'The row of actions under a message: copy, try again, edit, good response and bad response, plus any of your own.',
  description:
    'Place MessageActions in the actions slot of a Message. Each button appears only when you pass its handler. The component reports what was pressed; storing ratings and regenerating answers stays in your app.',
  imports: ['MessageActions'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'Copy, retry and rate' },
    {
      name: 'Controlled',
      title: 'Controlled rating',
      description: 'Pressing the active rating clears it.',
    },
    {
      name: 'OnHover',
      title: 'Revealed on hover',
      description:
        'The row appears on hover and on keyboard focus. On touch screens it is always visible.',
      layout: 'fill',
    },
    { name: 'Extra', title: 'Extra actions' },
  ],
  props: [
    {
      component: 'MessageActions',
      name: 'onCopy',
      type: '() => void',
      description: 'Called when Copy is pressed, after copyValue reached the clipboard.',
    },
    {
      component: 'MessageActions',
      name: 'copyValue',
      type: 'string | (() => string)',
      description: 'Text the copy button writes to the clipboard.',
    },
    {
      component: 'MessageActions',
      name: 'onRetry',
      type: '() => void',
      description: 'Called when Try again is pressed. Shows the button.',
    },
    {
      component: 'MessageActions',
      name: 'onEdit',
      type: '() => void',
      description: 'Called when Edit is pressed. Shows the button.',
    },
    {
      component: 'MessageActions',
      name: 'onRate',
      type: "(value: 'up' | 'down' | null) => void",
      description: 'Called with the new rating. Pressing the active rating sends null.',
    },
    {
      component: 'MessageActions',
      name: 'rating',
      type: "'up' | 'down' | null",
      description: 'Controlled rating.',
    },
    {
      component: 'MessageActions',
      name: 'defaultRating',
      type: "'up' | 'down' | null",
      default: 'null',
      description: 'Initial rating when uncontrolled.',
    },
    {
      component: 'MessageActions',
      name: 'visibility',
      type: "'always' | 'hover'",
      default: "'always'",
      description: 'hover reveals the row on hover and focus. It stays visible on touch screens.',
    },
    {
      component: 'MessageActions',
      name: 'size',
      type: "'xs' | 'sm'",
      default: "'sm'",
      description: 'Button size.',
    },
    {
      component: 'MessageActions',
      name: 'labels',
      type: 'Partial<MessageActionsLabels>',
      description:
        'Translations: toolbar, copy, copied, copyFailed, retry, edit, rateUp, rateDown.',
    },
    {
      component: 'MessageActions',
      name: 'children',
      type: 'ReactNode',
      description: 'Extra actions, placed after the built in ones.',
    },
  ],
  accessibility: [
    'A toolbar with a label and a single tab stop. Arrow keys move between the buttons.',
    'The rating buttons are toggle buttons that expose their pressed state. A pressed rating is filled as well as tinted.',
    'Copying is confirmed with a polite announcement, and the button name changes to Copied for a moment.',
    'With visibility set to hover the row still appears on keyboard focus and is always shown where there is no hover.',
    'Arrow keys follow the reading direction in right to left layouts.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves into and out of the toolbar.' },
    { keys: ['←', '→'], description: 'Move between the actions.' },
    { keys: ['Home', 'End'], description: 'Jump to the first or last action.' },
    { keys: ['Enter', 'Space'], description: 'Activates the focused action.' },
  ],
  guidelines: {
    do: [
      'Offer copy on every assistant message.',
      'Keep the same order of actions on every message.',
    ],
    dont: ['Hide actions that people need on touch screens behind hover alone.'],
  },
  related: ['message', 'branch-switcher', 'copy-button'],
};

const answer = 'Either side can end the agreement with 60 days written notice.';

export function Basic() {
  return <MessageActions copyValue={answer} onRetry={() => {}} onRate={() => {}} />;
}

export function Controlled() {
  const [rating, setRating] = React.useState<MessageRating>('up');
  return (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
      <MessageActions rating={rating} onRate={setRating} />
      <span style={{ fontSize: 13 }}>Rating: {rating ?? 'none'}</span>
    </div>
  );
}

export function OnHover() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <Message
        author="Assistant"
        actions={
          <MessageActions
            visibility="hover"
            copyValue={answer}
            onRetry={() => {}}
            onRate={() => {}}
          />
        }
      >
        {answer}
      </Message>
    </div>
  );
}

export function Extra() {
  return (
    <MessageActions copyValue={answer} onEdit={() => {}}>
      <IconButton size="sm" label="Report" icon={<Icon name="flag" />} />
    </MessageActions>
  );
}
